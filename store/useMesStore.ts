// Store trung tâm: lệnh sản xuất, chất lượng, thông báo, truy xuất và hàng đợi đồng bộ offline.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { OVER_RATIO, currentStep, isWoDone, stepElapsedSec, stepRatio } from '../lib/metrics';
import { ScanResult, validateScan } from '../lib/scan';
import { pushChanges } from '../services/api';
import { createSeed, SeedData } from './seed';
import type {
  AppNotification,
  CheckItem,
  Disposition,
  Ncr,
  NcrStatus,
  NotiLevel,
  Photo,
  Role,
  Severity,
  SyncItem,
  TraceEvent,
  WorkOrder,
} from './types';
import { getCurrentUser } from './useAuthStore';

interface ActionResult {
  ok: boolean;
  message: string;
}

export interface NcrInput {
  woId?: string;
  stepNo?: number;
  lotId?: string;
  mpn?: string;
  severity: Severity;
  category: string;
  description: string;
  qtyDefect: number;
  photos: Photo[];
}

interface MesState extends SeedData {
  hydrated: boolean;
  // Kết nối & đồng bộ
  netConnected: boolean;
  forcedOffline: boolean;
  syncing: boolean;
  syncQueue: SyncItem[];
  lastSyncAt?: number;
  // Ảnh đang soạn (chưa gắn vào NCR)
  draftPhotos: Photo[];

  // Công đoạn
  startStep: (woId: string) => ActionResult;
  pauseStep: (woId: string) => ActionResult;
  completeStep: (woId: string) => ActionResult;
  scan: (woId: string, raw: string) => ScanResult;
  addWoPhoto: (woId: string, photo: Photo) => void;
  checkOvertime: () => void;

  // Điều phối
  requestPart: (woId: string, mpn: string, qty: number, reason: string, hold: boolean) => void;
  decideRequest: (id: string, approve: boolean) => void;
  movePriority: (woId: string, dir: 'up' | 'down') => void;
  setHold: (woId: string, reason: string) => void;
  releaseHold: (woId: string) => void;

  // Chất lượng
  createNcr: (input: NcrInput) => string;
  updateNcr: (
    id: string,
    patch: { status: NcrStatus; disposition?: Disposition; rootCause?: string; note?: string },
  ) => void;
  inspectLot: (id: string, checklist: CheckItem[], accept: boolean, note: string) => void;
  savePqc: (woId: string, stepNo: number, type: 'FAI' | 'PQC', items: CheckItem[], note: string) => 'pass' | 'fail';

  // Ảnh nháp
  addDraftPhoto: (photo: Photo) => void;
  removeDraftPhoto: (id: string) => void;
  clearDraftPhotos: () => void;

  // Thông báo
  markRead: (id: string) => void;
  markAllRead: () => void;

  // Đồng bộ
  setNetConnected: (connected: boolean) => void;
  setForcedOffline: (offline: boolean) => void;
  syncNow: () => Promise<void>;

  resetDemo: () => void;
}

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

const userName = () => getCurrentUser()?.name ?? 'Hệ thống';

export const isOnline = (s: Pick<MesState, 'netConnected' | 'forcedOffline'>) => s.netConnected && !s.forcedOffline;

export const useMesStore = create<MesState>()(
  persist(
    (set, get) => {
      // Ghi nhật ký truy xuất + đưa vào hàng đợi đồng bộ
      const record = (ev: Omit<TraceEvent, 'id' | 'at' | 'by'>) => {
        const at = Date.now();
        const event: TraceEvent = { ...ev, id: uid('T'), at, by: userName() };
        const item: SyncItem = { id: uid('S'), type: ev.type, summary: ev.message, createdAt: at };
        set((s) => ({ trace: [event, ...s.trace].slice(0, 500), syncQueue: [item, ...s.syncQueue] }));
        if (isOnline(get())) setTimeout(() => void get().syncNow(), 0);
      };

      const notify = (title: string, body: string, level: NotiLevel, roles: Role[], href?: string) => {
        const n: AppNotification = {
          id: uid('N'),
          title,
          body,
          level,
          roles,
          createdAt: Date.now(),
          readBy: [],
          href,
        };
        set((s) => ({ notifications: [n, ...s.notifications].slice(0, 200) }));
      };

      const patchWo = (woId: string, fn: (wo: WorkOrder) => WorkOrder) =>
        set((s) => ({ workOrders: s.workOrders.map((w) => (w.id === woId ? fn(w) : w)) }));

      const patchStep = (wo: WorkOrder, no: number, patch: Partial<WorkOrder['steps'][number]>): WorkOrder => ({
        ...wo,
        steps: wo.steps.map((s) => (s.no === no ? { ...s, ...patch } : s)),
      });

      const findWo = (woId: string) => get().workOrders.find((w) => w.id === woId);

      return {
        ...createSeed(),
        hydrated: false,
        netConnected: true,
        forcedOffline: false,
        syncing: false,
        syncQueue: [],
        draftPhotos: [],

        startStep: (woId) => {
          const wo = findWo(woId);
          const step = wo && currentStep(wo);
          if (!wo || !step) return { ok: false, message: 'Lệnh sản xuất đã hoàn thành.' };
          if (wo.hold) return { ok: false, message: `Lệnh đang bị giữ: ${wo.hold.reason}.` };
          if (step.status === 'running') return { ok: false, message: 'Công đoạn đang chạy.' };
          const resumed = step.status === 'paused';
          patchWo(woId, (w) =>
            patchStep(w, step.no, { status: 'running', startedAt: Date.now(), operatorId: getCurrentUser()?.id }),
          );
          record({
            type: 'step',
            woId,
            message: `${resumed ? 'Tiếp tục' : 'Bắt đầu'} công đoạn ${step.no}. ${step.name}`,
          });
          return { ok: true, message: 'Đã bắt đầu tính giờ.' };
        },

        pauseStep: (woId) => {
          const wo = findWo(woId);
          const step = wo && currentStep(wo);
          if (!wo || !step || step.status !== 'running') return { ok: false, message: 'Công đoạn chưa chạy.' };
          patchWo(woId, (w) =>
            patchStep(w, step.no, { status: 'paused', elapsedSec: stepElapsedSec(step), startedAt: undefined }),
          );
          record({ type: 'step', woId, message: `Tạm dừng công đoạn ${step.no}. ${step.name}` });
          return { ok: true, message: 'Đã tạm dừng.' };
        },

        completeStep: (woId) => {
          const wo = findWo(woId);
          const step = wo && currentStep(wo);
          if (!wo || !step) return { ok: false, message: 'Lệnh sản xuất đã hoàn thành.' };
          if (wo.hold) return { ok: false, message: `Lệnh đang bị giữ: ${wo.hold.reason}.` };
          if (step.status === 'pending') return { ok: false, message: 'Hãy bấm BẮT ĐẦU trước khi hoàn thành công đoạn.' };
          const missing = wo.bom.filter((b) => b.stepNo === step.no && b.scans.length < b.qtyRequired);
          if (missing.length > 0) {
            return {
              ok: false,
              message: `Chưa đối soát đủ linh kiện: ${missing
                .map((b) => `${b.mpn} (${b.scans.length}/${b.qtyRequired})`)
                .join(', ')}.`,
            };
          }
          const now = Date.now();
          const elapsedSec = stepElapsedSec(step, now);
          const over = elapsedSec > step.standardMin * 60;
          patchWo(woId, (w) => {
            const next = patchStep(w, step.no, { status: 'done', elapsedSec, startedAt: undefined, finishedAt: now });
            return isWoDone(next) ? { ...next, completedAt: now } : next;
          });
          record({
            type: 'step',
            woId,
            message: `Hoàn thành công đoạn ${step.no}. ${step.name} (${Math.round(elapsedSec / 60)}/${step.standardMin} phút${
              over ? ', vượt định mức' : ''
            })`,
          });
          const after = findWo(woId);
          if (after && isWoDone(after)) {
            record({ type: 'wo', woId, message: `Hoàn thành lệnh sản xuất ${woId}` });
            notify('Lệnh sản xuất hoàn thành', `${woId} – ${wo.product} đã xong toàn bộ công đoạn.`, 'success', ['manager'], `/work-order/${woId}`);
            return { ok: true, message: `Đã hoàn thành toàn bộ lệnh ${woId}.` };
          }
          return { ok: true, message: `Đã hoàn thành công đoạn "${step.name}".` };
        },

        scan: (woId, raw) => {
          const wo = findWo(woId);
          if (!wo) {
            return { ok: false, code: 'EMPTY', message: 'Không tìm thấy lệnh sản xuất.', parsed: { raw, mpn: '' } };
          }
          const result = validateScan(raw, wo, get().iqcLots);
          const { parsed } = result;
          if (result.ok && result.bomItemId) {
            patchWo(woId, (w) => ({
              ...w,
              bom: w.bom.map((b) =>
                b.id === result.bomItemId
                  ? {
                      ...b,
                      scans: [
                        ...b.scans,
                        { lot: parsed.lot!, dateCode: parsed.dateCode ?? '', coc: parsed.coc!, at: Date.now(), by: userName() },
                      ],
                    }
                  : b,
              ),
            }));
            record({ type: 'scan-ok', woId, mpn: parsed.mpn, lot: parsed.lot, message: `Đối soát đạt ${parsed.mpn} – lô ${parsed.lot}` });
          } else {
            record({
              type: 'scan-fail',
              woId,
              mpn: parsed.mpn || undefined,
              lot: parsed.lot,
              message: `Đối soát KHÔNG đạt: ${result.message}`,
            });
          }
          return result;
        },

        addWoPhoto: (woId, photo) => {
          patchWo(woId, (w) => ({ ...w, photos: [photo, ...w.photos] }));
          record({ type: 'photo', woId, message: `Lưu ảnh vào hồ sơ sản xuất${photo.marks.length ? ` (${photo.marks.length} vùng đánh dấu)` : ''}` });
        },

        checkOvertime: () => {
          const now = Date.now();
          for (const wo of get().workOrders) {
            const step = currentStep(wo);
            if (step && step.status === 'running' && !step.overtimeNotified && stepRatio(step, now) >= OVER_RATIO) {
              patchWo(wo.id, (w) => patchStep(w, step.no, { overtimeNotified: true }));
              notify(
                'Vượt thời gian định mức',
                `${wo.id}: công đoạn "${step.name}" tại trạm ${step.station} đã vượt định mức ${step.standardMin} phút.`,
                'danger',
                ['manager', 'technician'],
                `/work-order/${wo.id}`,
              );
            }
          }
        },

        requestPart: (woId, mpn, qty, reason, hold) => {
          const id = `PR-${`${get().partRequests.length + 1}`.padStart(4, '0')}`;
          set((s) => ({
            partRequests: [
              { id, woId, mpn, qty, reason, status: 'pending', requestedBy: userName(), createdAt: Date.now() },
              ...s.partRequests,
            ],
          }));
          if (hold) {
            const wo = findWo(woId);
            const step = wo && currentStep(wo);
            if (step?.status === 'running') get().pauseStep(woId);
            patchWo(woId, (w) => (w.hold ? w : { ...w, hold: { type: 'part', reason: 'Chờ linh kiện cấp bù', at: Date.now() } }));
          }
          record({ type: 'request', woId, mpn, message: `Yêu cầu cấp bù ${qty} × ${mpn} (${id})` });
          notify('Yêu cầu cấp bù linh kiện', `${woId} cần thêm ${qty} × ${mpn}. Lý do: ${reason}`, 'warning', ['manager'], `/work-order/${woId}`);
        },

        decideRequest: (id, approve) => {
          const req = get().partRequests.find((r) => r.id === id);
          if (!req || req.status !== 'pending') return;
          set((s) => ({
            partRequests: s.partRequests.map((r) =>
              r.id === id
                ? { ...r, status: approve ? 'approved' : 'rejected', decidedBy: userName(), decidedAt: Date.now() }
                : r,
            ),
          }));
          const stillPending = get().partRequests.some((r) => r.woId === req.woId && r.status === 'pending');
          if (approve && !stillPending) {
            patchWo(req.woId, (w) => (w.hold?.type === 'part' ? { ...w, hold: undefined } : w));
          }
          record({
            type: 'request',
            woId: req.woId,
            mpn: req.mpn,
            message: `${approve ? 'Duyệt' : 'Từ chối'} yêu cầu cấp bù ${id} (${req.qty} × ${req.mpn})`,
          });
          notify(
            approve ? 'Đã duyệt cấp bù linh kiện' : 'Từ chối cấp bù linh kiện',
            `${id}: ${req.qty} × ${req.mpn} cho ${req.woId}.`,
            approve ? 'success' : 'danger',
            ['technician'],
            `/work-order/${req.woId}`,
          );
        },

        movePriority: (woId, dir) => {
          const active = get()
            .workOrders.filter((w) => !isWoDone(w))
            .sort((a, b) => a.priority - b.priority);
          const idx = active.findIndex((w) => w.id === woId);
          const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
          if (idx < 0 || swapIdx < 0 || swapIdx >= active.length) return;
          const a = active[idx];
          const b = active[swapIdx];
          set((s) => ({
            workOrders: s.workOrders.map((w) =>
              w.id === a.id ? { ...w, priority: b.priority } : w.id === b.id ? { ...w, priority: a.priority } : w,
            ),
          }));
          record({ type: 'wo', woId, message: `Điều chỉnh ưu tiên ${woId}: ${dir === 'up' ? 'tăng' : 'giảm'} (vị trí ${swapIdx + 1})` });
          notify('Thay đổi thứ tự ưu tiên', `${woId} được ${dir === 'up' ? 'đẩy lên' : 'lùi xuống'} vị trí ưu tiên ${swapIdx + 1}.`, 'info', ['technician'], `/work-order/${woId}`);
        },

        setHold: (woId, reason) => {
          const wo = findWo(woId);
          if (!wo) return;
          if (currentStep(wo)?.status === 'running') get().pauseStep(woId);
          patchWo(woId, (w) => ({ ...w, hold: { type: 'manual', reason, at: Date.now() } }));
          record({ type: 'wo', woId, message: `Giữ lệnh ${woId}: ${reason}` });
          notify('Lệnh sản xuất bị giữ', `${woId}: ${reason}`, 'warning', ['technician', 'manager'], `/work-order/${woId}`);
        },

        releaseHold: (woId) => {
          const wo = findWo(woId);
          if (!wo?.hold) return;
          patchWo(woId, (w) => ({ ...w, hold: undefined }));
          record({ type: 'wo', woId, message: `Gỡ giữ lệnh ${woId} (${wo.hold.reason})` });
          notify('Lệnh sản xuất được tiếp tục', `${woId} đã được gỡ giữ, có thể tiếp tục sản xuất.`, 'success', ['technician'], `/work-order/${woId}`);
        },

        createNcr: (input) => {
          const id = `NCR-${`${get().ncrs.length + 1}`.padStart(4, '0')}`;
          const user = getCurrentUser();
          const now = Date.now();
          const ncr: Ncr = {
            ...input,
            id,
            status: 'open',
            createdBy: userName(),
            createdById: user?.id ?? '',
            createdAt: now,
            history: [{ at: now, by: userName(), action: 'Tạo NCR' }],
          };
          set((s) => ({ ncrs: [ncr, ...s.ncrs] }));
          record({
            type: 'ncr',
            woId: input.woId,
            mpn: input.mpn,
            ncrId: id,
            message: `Tạo ${id} (${input.severity.toUpperCase()}): ${input.description}`,
          });
          if (input.severity === 'critical' && input.woId) {
            const wo = findWo(input.woId);
            if (wo && !wo.hold && !isWoDone(wo)) {
              if (currentStep(wo)?.status === 'running') get().pauseStep(wo.id);
              patchWo(wo.id, (w) => ({ ...w, hold: { type: 'manual', reason: `Dừng do ${id} (Critical)`, at: now } }));
            }
          }
          notify(
            `NCR mới – ${input.severity === 'critical' ? 'NGHIÊM TRỌNG' : input.severity === 'major' ? 'Major' : 'Minor'}`,
            `${id}${input.woId ? ` (${input.woId})` : ''}: ${input.description}`,
            input.severity === 'minor' ? 'warning' : 'danger',
            ['manager', 'qc'],
            `/ncr/${id}`,
          );
          return id;
        },

        updateNcr: (id, patch) => {
          const ncr = get().ncrs.find((n) => n.id === id);
          if (!ncr) return;
          const action =
            patch.status === 'closed' ? 'Đóng NCR' : patch.status === 'reviewing' ? 'Tiếp nhận xử lý' : 'Mở lại NCR';
          set((s) => ({
            ncrs: s.ncrs.map((n) =>
              n.id === id
                ? {
                    ...n,
                    status: patch.status,
                    disposition: patch.disposition ?? n.disposition,
                    rootCause: patch.rootCause ?? n.rootCause,
                    history: [...n.history, { at: Date.now(), by: userName(), action, note: patch.note }],
                  }
                : n,
            ),
          }));
          record({ type: 'ncr', woId: ncr.woId, mpn: ncr.mpn, ncrId: id, message: `${action} ${id}${patch.note ? `: ${patch.note}` : ''}` });
          if (patch.status === 'closed' && ncr.woId) {
            patchWo(ncr.woId, (w) => (w.hold?.reason.includes(id) ? { ...w, hold: undefined } : w));
          }
          notify(`${action}: ${id}`, patch.note || ncr.description, patch.status === 'closed' ? 'success' : 'info', ['technician', 'manager'], `/ncr/${id}`);
        },

        inspectLot: (id, checklist, accept, note) => {
          const lot = get().iqcLots.find((l) => l.id === id);
          if (!lot) return;
          set((s) => ({
            iqcLots: s.iqcLots.map((l) =>
              l.id === id
                ? { ...l, checklist, note, status: accept ? 'accepted' : 'rejected', inspectedBy: userName(), inspectedAt: Date.now() }
                : l,
            ),
          }));
          record({
            type: 'iqc',
            mpn: lot.mpn,
            lot: lot.lot,
            message: `IQC ${accept ? 'CHẤP NHẬN' : 'TỪ CHỐI'} lô ${lot.lot} (${lot.mpn})${note ? `: ${note}` : ''}`,
          });
          notify(
            accept ? 'IQC chấp nhận lô hàng' : 'IQC từ chối lô hàng',
            `Lô ${lot.lot} – ${lot.mpn} (${lot.supplier})${note ? `: ${note}` : ''}`,
            accept ? 'success' : 'danger',
            accept ? ['technician', 'manager'] : ['manager'],
          );
        },

        savePqc: (woId, stepNo, type, items, note) => {
          const result: 'pass' | 'fail' = items.every((i) => i.result === 'pass') ? 'pass' : 'fail';
          set((s) => ({
            pqcRecords: [
              { id: uid('PQC'), woId, stepNo, type, items, result, note, by: userName(), at: Date.now() },
              ...s.pqcRecords,
            ],
          }));
          record({ type: 'pqc', woId, message: `${type} công đoạn ${stepNo}: ${result === 'pass' ? 'ĐẠT' : 'KHÔNG ĐẠT'}${note ? ` – ${note}` : ''}` });
          if (type === 'FAI' && result === 'pass') {
            patchWo(woId, (w) => (w.hold?.type === 'fai' ? { ...w, hold: undefined } : w));
          }
          notify(
            `${type} ${result === 'pass' ? 'đạt' : 'không đạt'} – ${woId}`,
            result === 'pass' ? 'Lệnh được phép tiếp tục sản xuất.' : note || 'Cần xử lý trước khi tiếp tục.',
            result === 'pass' ? 'success' : 'danger',
            ['technician', 'manager'],
            `/work-order/${woId}`,
          );
          return result;
        },

        addDraftPhoto: (photo) => set((s) => ({ draftPhotos: [...s.draftPhotos, photo] })),
        removeDraftPhoto: (id) => set((s) => ({ draftPhotos: s.draftPhotos.filter((p) => p.id !== id) })),
        clearDraftPhotos: () => set({ draftPhotos: [] }),

        markRead: (id) => {
          const userId = getCurrentUser()?.id;
          if (!userId) return;
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.id === id && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n,
            ),
          }));
        },

        markAllRead: () => {
          const user = getCurrentUser();
          if (!user) return;
          set((s) => ({
            notifications: s.notifications.map((n) =>
              n.roles.includes(user.role) && !n.readBy.includes(user.id) ? { ...n, readBy: [...n.readBy, user.id] } : n,
            ),
          }));
        },

        setNetConnected: (connected) => {
          const was = isOnline(get());
          set({ netConnected: connected });
          if (!was && isOnline(get())) void get().syncNow();
        },

        setForcedOffline: (offline) => {
          set({ forcedOffline: offline });
          if (!offline && isOnline(get())) void get().syncNow();
        },

        syncNow: async () => {
          const s = get();
          if (s.syncing || !isOnline(s)) return;
          const pending = s.syncQueue.filter((i) => !i.syncedAt);
          if (pending.length === 0) return;
          set({ syncing: true });
          try {
            const { syncedIds } = await pushChanges(pending);
            const now = Date.now();
            set((st) => {
              const queue = st.syncQueue.map((i) => (syncedIds.includes(i.id) ? { ...i, syncedAt: now } : i));
              // Giữ toàn bộ mục chưa đồng bộ + 30 mục đã đồng bộ gần nhất
              const unsynced = queue.filter((i) => !i.syncedAt);
              const synced = queue.filter((i) => i.syncedAt).slice(0, 30);
              return {
                syncQueue: [...unsynced, ...synced].sort((a, b) => b.createdAt - a.createdAt),
                lastSyncAt: now,
              };
            });
          } finally {
            set({ syncing: false });
          }
          // Có thay đổi mới phát sinh trong lúc đang đồng bộ
          if (isOnline(get()) && get().syncQueue.some((i) => !i.syncedAt)) void get().syncNow();
        },

        resetDemo: () =>
          set({ ...createSeed(), syncQueue: [], draftPhotos: [], lastSyncAt: undefined, forcedOffline: false }),
      };
    },
    {
      name: 'vmes-data',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated, syncing, netConnected, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        useMesStore.setState({ hydrated: true });
      },
    },
  ),
);
