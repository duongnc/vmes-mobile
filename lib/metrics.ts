// Các phép tính tiến độ, trạng thái, bottleneck và OEE (thuần logic, không phụ thuộc UI).
import type { Ncr, PartRequest, StationStat, Step, WorkOrder } from '../store/types';

export const WARN_RATIO = 0.8; // Sắp vượt định mức
export const OVER_RATIO = 1.0; // Vượt định mức

export function stepElapsedSec(step: Step, now: number = Date.now()): number {
  const running = step.status === 'running' && step.startedAt ? Math.max(0, (now - step.startedAt) / 1000) : 0;
  return Math.floor(step.elapsedSec + running);
}

export function stepRatio(step: Step, now: number = Date.now()): number {
  return stepElapsedSec(step, now) / (step.standardMin * 60);
}

export function currentStep(wo: WorkOrder): Step | undefined {
  return wo.steps.find((s) => s.status !== 'done');
}

export function isWoDone(wo: WorkOrder): boolean {
  return wo.steps.every((s) => s.status === 'done');
}

export function woProgress(wo: WorkOrder): number {
  if (wo.steps.length === 0) return 0;
  return wo.steps.filter((s) => s.status === 'done').length / wo.steps.length;
}

export type HealthColor = 'green' | 'yellow' | 'red' | 'done';

export interface WoHealth {
  color: HealthColor;
  label: string;
  reasons: string[];
}

export function woHealth(
  wo: WorkOrder,
  ncrs: Ncr[],
  requests: PartRequest[],
  now: number = Date.now(),
  today: string = new Date(now).toISOString().slice(0, 10),
): WoHealth {
  if (isWoDone(wo)) return { color: 'done', label: 'Hoàn thành', reasons: [] };

  const red: string[] = [];
  const yellow: string[] = [];
  const step = currentStep(wo);
  const openNcrs = ncrs.filter((n) => n.woId === wo.id && n.status !== 'closed');

  if (wo.hold) red.push(wo.hold.reason);
  if (openNcrs.some((n) => n.severity === 'critical')) red.push('Có NCR nghiêm trọng chưa đóng');
  else if (openNcrs.some((n) => n.severity === 'major')) red.push('Có NCR mức Major chưa đóng');
  else if (openNcrs.length > 0) yellow.push('Có NCR mức Minor chưa đóng');

  if (step && step.status !== 'pending') {
    const ratio = stepRatio(step, now);
    if (ratio >= OVER_RATIO) red.push(`Công đoạn "${step.name}" vượt định mức`);
    else if (ratio >= WARN_RATIO) yellow.push(`Công đoạn "${step.name}" sắp vượt định mức`);
  }

  if (!wo.hold && requests.some((r) => r.woId === wo.id && r.status === 'pending')) {
    yellow.push('Đang chờ duyệt cấp bù linh kiện');
  }
  if (wo.dueDate < today) red.push('Trễ hạn giao');
  else if (wo.dueDate === today && woProgress(wo) < 0.8) yellow.push('Đến hạn giao hôm nay');

  if (red.length) return { color: 'red', label: 'Tắc', reasons: [...red, ...yellow] };
  if (yellow.length) return { color: 'yellow', label: 'Sắp tắc', reasons: yellow };
  return { color: 'green', label: 'Trôi chảy', reasons: [] };
}

export interface StationLoad {
  station: string;
  wip: number; // Số lệnh đang nằm tại trạm (đang chạy hoặc chờ)
  running: number;
  overtime: number; // Số lệnh đang vượt định mức tại trạm
  held: number;
  completed: number; // Số công đoạn đã hoàn thành
  avgRatio: number; // Thực tế / định mức của các công đoạn đã xong (1 = đúng định mức)
}

export function stationLoads(wos: WorkOrder[], now: number = Date.now()): StationLoad[] {
  const map = new Map<string, StationLoad & { actual: number; standard: number }>();
  const get = (station: string) => {
    let v = map.get(station);
    if (!v) {
      v = { station, wip: 0, running: 0, overtime: 0, held: 0, completed: 0, avgRatio: 0, actual: 0, standard: 0 };
      map.set(station, v);
    }
    return v;
  };

  for (const wo of wos) {
    for (const s of wo.steps) {
      const st = get(s.station);
      if (s.status === 'done') {
        st.completed += 1;
        st.actual += s.elapsedSec;
        st.standard += s.standardMin * 60;
      }
    }
    const cur = currentStep(wo);
    if (cur) {
      const st = get(cur.station);
      st.wip += 1;
      if (wo.hold) st.held += 1;
      if (cur.status === 'running') st.running += 1;
      if (cur.status !== 'pending' && stepRatio(cur, now) >= OVER_RATIO) st.overtime += 1;
    }
  }

  return [...map.values()].map(({ actual, standard, ...rest }) => ({
    ...rest,
    avgRatio: standard > 0 ? actual / standard : 0,
  }));
}

export interface Bottleneck {
  station: string;
  level: 'red' | 'yellow';
  message: string;
}

export function bottlenecks(loads: StationLoad[]): Bottleneck[] {
  const out: Bottleneck[] = [];
  for (const l of loads) {
    if (l.overtime > 0) {
      out.push({
        station: l.station,
        level: 'red',
        message: `${l.overtime} lệnh đang vượt thời gian định mức, ${l.wip} lệnh tồn tại trạm.`,
      });
    } else if (l.wip >= 2) {
      out.push({
        station: l.station,
        level: l.wip >= 3 ? 'red' : 'yellow',
        message: `${l.wip} lệnh đang dồn tại trạm${l.held ? ` (${l.held} lệnh bị giữ)` : ''}.`,
      });
    } else if (l.avgRatio > 1.15) {
      out.push({
        station: l.station,
        level: 'yellow',
        message: `Thời gian thực tế trung bình cao hơn định mức ${Math.round((l.avgRatio - 1) * 100)}%.`,
      });
    }
  }
  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'red' ? -1 : 1));
}

export interface Oee {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// OEE = Availability × Performance × Quality
export function computeOee(wos: WorkOrder[], stats: StationStat[], ncrs: Ncr[], station?: string): Oee {
  const sel = station ? stats.filter((s) => s.station === station) : stats;
  const planned = sel.reduce((a, s) => a + s.plannedMin, 0);
  const down = sel.reduce((a, s) => a + s.downtimeMin, 0);
  const availability = planned > 0 ? clamp01((planned - down) / planned) : 1;

  let standard = 0;
  let actual = 0;
  for (const wo of wos) {
    for (const s of wo.steps) {
      if (s.status === 'done' && (!station || s.station === station)) {
        standard += s.standardMin * 60;
        actual += s.elapsedSec;
      }
    }
  }
  const performance = actual > 0 ? clamp01(standard / actual) : 1;

  const stationOfNcr = (n: Ncr) => {
    const wo = wos.find((w) => w.id === n.woId);
    return wo?.steps.find((s) => s.no === n.stepNo)?.station;
  };
  const good = sel.reduce((a, s) => a + s.goodUnits, 0);
  const defect =
    sel.reduce((a, s) => a + s.defectUnits, 0) +
    ncrs.filter((n) => !station || stationOfNcr(n) === station).reduce((a, n) => a + n.qtyDefect, 0);
  const quality = good + defect > 0 ? clamp01(good / (good + defect)) : 1;

  return { availability, performance, quality, oee: availability * performance * quality };
}

export function countBy<T>(items: T[], key: (item: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const it of items) map.set(key(it), (map.get(key(it)) ?? 0) + 1);
  return [...map.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}
