// Kiểu dữ liệu dùng chung cho toàn bộ ứng dụng vMES

export type Role = 'technician' | 'qc' | 'manager';

export interface User {
  id: string;
  code: string; // Mã nhân viên, VD: VTX1001
  pin: string;
  name: string;
  role: Role;
  station?: string;
}

export interface ScannedLot {
  lot: string;
  dateCode: string;
  coc: string;
  at: number;
  by: string;
}

export interface BomItem {
  id: string;
  mpn: string;
  name: string;
  stepNo: number; // Công đoạn sử dụng linh kiện
  qtyRequired: number;
  scans: ScannedLot[];
}

export type StepStatus = 'pending' | 'running' | 'paused' | 'done';

export interface Step {
  no: number;
  name: string;
  station: string;
  standardMin: number; // Thời gian định mức (phút)
  status: StepStatus;
  startedAt?: number; // Mốc bắt đầu lần chạy gần nhất
  elapsedSec: number; // Thời gian đã tích lũy (không tính lần đang chạy)
  finishedAt?: number;
  operatorId?: string;
  overtimeNotified?: boolean;
  instructions: string[];
  cautions?: string[];
}

export interface Hold {
  type: 'part' | 'fai' | 'manual';
  reason: string;
  at: number;
}

export interface PhotoMark {
  x: number; // Toạ độ tương đối 0..1
  y: number;
  r: number; // Bán kính tương đối so với chiều rộng ảnh
}

export interface Photo {
  id: string;
  uri: string;
  takenAt: number;
  by: string;
  note?: string;
  marks: PhotoMark[];
}

export interface WorkOrder {
  id: string;
  product: string;
  productCode: string;
  qty: number;
  priority: number; // 1 = cao nhất
  dueDate: string; // YYYY-MM-DD
  assigneeId: string;
  hold?: Hold;
  steps: Step[];
  bom: BomItem[];
  photos: Photo[];
  completedAt?: number;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface PartRequest {
  id: string;
  woId: string;
  mpn: string;
  qty: number;
  reason: string;
  status: RequestStatus;
  requestedBy: string;
  createdAt: number;
  decidedBy?: string;
  decidedAt?: number;
}

export type Severity = 'minor' | 'major' | 'critical';
export type NcrStatus = 'open' | 'reviewing' | 'closed';
export type Disposition = 'rework' | 'scrap' | 'use-as-is' | 'return';

export interface NcrHistory {
  at: number;
  by: string;
  action: string;
  note?: string;
}

export interface Ncr {
  id: string;
  woId?: string;
  stepNo?: number;
  lotId?: string;
  mpn?: string;
  severity: Severity;
  category: string;
  description: string;
  qtyDefect: number;
  photos: Photo[];
  status: NcrStatus;
  disposition?: Disposition;
  rootCause?: string;
  createdBy: string;
  createdById: string;
  createdAt: number;
  history: NcrHistory[];
}

export type CheckResult = 'pass' | 'fail' | null;

export interface CheckItem {
  label: string;
  result: CheckResult;
}

export type LotStatus = 'pending' | 'accepted' | 'rejected';

export interface IqcLot {
  id: string;
  mpn: string;
  name: string;
  lot: string;
  dateCode: string;
  expiry: string; // YYYY-MM-DD
  coc: string;
  supplier: string;
  qty: number;
  receivedAt: number;
  status: LotStatus;
  checklist: CheckItem[];
  note?: string;
  inspectedBy?: string;
  inspectedAt?: number;
}

export interface PqcRecord {
  id: string;
  woId: string;
  stepNo: number;
  type: 'FAI' | 'PQC';
  items: CheckItem[];
  result: 'pass' | 'fail';
  note?: string;
  by: string;
  at: number;
}

export type TraceType =
  | 'scan-ok'
  | 'scan-fail'
  | 'step'
  | 'photo'
  | 'ncr'
  | 'iqc'
  | 'pqc'
  | 'request'
  | 'wo';

export interface TraceEvent {
  id: string;
  at: number;
  by: string;
  type: TraceType;
  message: string;
  woId?: string;
  mpn?: string;
  lot?: string;
  ncrId?: string;
}

export type NotiLevel = 'info' | 'warning' | 'danger' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  level: NotiLevel;
  roles: Role[]; // Vai trò nhận thông báo
  createdAt: number;
  readBy: string[];
  href?: string; // Đường dẫn mở khi bấm
}

export interface SyncItem {
  id: string;
  type: TraceType;
  summary: string;
  createdAt: number;
  syncedAt?: number;
}

// Số liệu vận hành trạm (phục vụ tính OEE - Availability)
export interface StationStat {
  station: string;
  plannedMin: number;
  downtimeMin: number;
  goodUnits: number;
  defectUnits: number;
}
