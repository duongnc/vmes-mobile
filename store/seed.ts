// Dữ liệu mẫu (demo) – đóng vai trò dữ liệu lấy từ máy chủ MES khi chưa có backend.
import type {
  AppNotification,
  BomItem,
  CheckItem,
  IqcLot,
  Ncr,
  PartRequest,
  PqcRecord,
  StationStat,
  Step,
  TraceEvent,
  User,
  WorkOrder,
} from './types';

export const USERS: User[] = [
  { id: 'u1', code: 'VTX1001', pin: '1234', name: 'Nguyễn Văn A', role: 'technician', station: 'Hàn sóng' },
  { id: 'u2', code: 'VTX1002', pin: '1234', name: 'Lê Văn C', role: 'technician', station: 'SMT' },
  { id: 'u3', code: 'VTX2001', pin: '1234', name: 'Trần Thị B', role: 'qc' },
  { id: 'u4', code: 'VTX3001', pin: '1234', name: 'Phạm Văn D', role: 'manager' },
];

export const ROLE_LABEL: Record<User['role'], string> = {
  technician: 'Kỹ thuật viên',
  qc: 'Nhân viên QC',
  manager: 'Quản lý sản xuất',
};

export const IQC_CHECKLIST = [
  'Ngoại quan bao bì, nhãn mác nguyên vẹn',
  'Mã MPN khớp đơn đặt hàng',
  'Số lượng khớp phiếu giao hàng',
  'Date code / hạn sử dụng hợp lệ',
  'Chứng chỉ xuất xứ (COC) đầy đủ, khớp số lô',
  'Bảo quản chống tĩnh điện (ESD) / chống ẩm (MSL)',
];

export const PQC_CHECKLIST = [
  'Linh kiện đúng vị trí, đúng chiều theo bản vẽ',
  'Mối hàn đạt chuẩn IPC-A-610 Class 3',
  'Không có vật thể lạ (FOD) trên bo mạch',
  'Kích thước / lực siết nằm trong dung sai',
  'Nhãn serial và hồ sơ đi kèm đầy đủ',
];

export const NCR_CATEGORIES = ['Linh kiện', 'Mối hàn', 'Lắp ráp', 'Chức năng', 'Ngoại quan', 'Hồ sơ'];

const MIN = 60_000;
const DAY = 24 * 60 * MIN;

function isoDate(ts: number) {
  return new Date(ts).toISOString().slice(0, 10);
}

function checklist(labels: string[], result: CheckItem['result'] = null): CheckItem[] {
  return labels.map((label) => ({ label, result }));
}

interface StepDef {
  name: string;
  station: string;
  standardMin: number;
  instructions: string[];
  cautions?: string[];
}

const STEP_LIBRARY: Record<string, StepDef> = {
  prep: {
    name: 'Chuẩn bị vật tư',
    station: 'Kho',
    standardMin: 15,
    instructions: [
      'Nhận khay vật tư theo lệnh sản xuất từ kho.',
      'Kiểm đếm sơ bộ số lượng theo BOM.',
      'Đặt linh kiện nhạy tĩnh điện lên thảm ESD.',
    ],
    cautions: ['Luôn đeo vòng tay chống tĩnh điện trước khi chạm vào linh kiện.'],
  },
  smt: {
    name: 'Dán linh kiện SMT',
    station: 'SMT',
    standardMin: 45,
    instructions: [
      'Kiểm tra stencil và kem hàn (hạn dùng, thời gian rã đông).',
      'In kem hàn, kiểm tra SPI 100% pad.',
      'Chạy chương trình gắp đặt đúng mã sản phẩm.',
      'Qua lò reflow theo profile đã phê duyệt.',
    ],
    cautions: ['Không dùng kem hàn quá 8 giờ sau khi mở hộp.'],
  },
  wave: {
    name: 'Hàn sóng',
    station: 'Hàn sóng',
    standardMin: 30,
    instructions: [
      'Quét đối soát toàn bộ linh kiện xuyên lỗ theo BOM.',
      'Cắm linh kiện đúng chiều theo bản vẽ lắp.',
      'Kiểm tra nhiệt độ bể thiếc 255 ± 5 °C.',
      'Chạy băng tải, kiểm tra mối hàn sau khi nguội.',
    ],
    cautions: ['Đeo kính và găng tay chịu nhiệt.', 'Không chạm tay trần vào bo mạch sau hàn.'],
  },
  mech: {
    name: 'Lắp cơ khí',
    station: 'Lắp ráp',
    standardMin: 25,
    instructions: [
      'Lắp đầu nối và tản nhiệt theo bản vẽ.',
      'Siết vít đúng lực 0,6 N·m bằng tua vít lực.',
      'Đánh dấu sơn chống xoay lên đầu vít.',
    ],
  },
  fw: {
    name: 'Nạp firmware',
    station: 'Nạp FW',
    standardMin: 20,
    instructions: [
      'Kết nối jig nạp, chọn đúng phiên bản firmware đã phê duyệt.',
      'Nạp và xác nhận checksum.',
      'Dán nhãn phiên bản lên bo mạch.',
    ],
  },
  test: {
    name: 'Kiểm tra chức năng',
    station: 'Test',
    standardMin: 40,
    instructions: [
      'Gắn bo mạch lên jig test tự động (ATE).',
      'Chạy kịch bản test đầy đủ, lưu log theo serial.',
      'Bo mạch FAIL phải tách riêng và lập NCR.',
    ],
  },
  coat: {
    name: 'Phủ bảo vệ',
    station: 'Coating',
    standardMin: 30,
    instructions: [
      'Che chắn đầu nối và điểm test.',
      'Phun phủ conformal coating đều 2 mặt.',
      'Sấy khô và kiểm tra dưới đèn UV.',
    ],
    cautions: ['Làm việc trong buồng hút, đeo khẩu trang lọc hơi dung môi.'],
  },
  pack: {
    name: 'Đóng gói',
    station: 'Đóng gói',
    standardMin: 15,
    instructions: [
      'Kiểm tra ngoại quan lần cuối.',
      'Đóng túi chống tĩnh điện kèm gói hút ẩm.',
      'Dán nhãn serial, đính kèm hồ sơ xuất xưởng.',
    ],
  },
};

function makeSteps(
  keys: string[],
  now: number,
  doneCount: number,
  ratios: number[] = [],
  operatorId?: string,
): Step[] {
  let cursor = now - (doneCount + 1) * 60 * MIN;
  return keys.map((key, i) => {
    const def = STEP_LIBRARY[key];
    const base: Step = {
      no: i + 1,
      name: def.name,
      station: def.station,
      standardMin: def.standardMin,
      status: 'pending',
      elapsedSec: 0,
      instructions: def.instructions,
      cautions: def.cautions,
    };
    if (i < doneCount) {
      const actualSec = Math.round(def.standardMin * 60 * (ratios[i] ?? 0.95));
      cursor += actualSec * 1000 + 5 * MIN;
      return { ...base, status: 'done', elapsedSec: actualSec, finishedAt: cursor, operatorId };
    }
    return base;
  });
}

function bom(woId: string, rows: [string, string, number, number][]): BomItem[] {
  return rows.map(([mpn, name, stepNo, qtyRequired], i) => ({
    id: `${woId}-B${i + 1}`,
    mpn,
    name,
    stepNo,
    qtyRequired,
    scans: [],
  }));
}

export interface SeedData {
  workOrders: WorkOrder[];
  iqcLots: IqcLot[];
  ncrs: Ncr[];
  partRequests: PartRequest[];
  pqcRecords: PqcRecord[];
  notifications: AppNotification[];
  trace: TraceEvent[];
  stationStats: StationStat[];
}

export function createSeed(now: number = Date.now()): SeedData {
  const full = ['prep', 'smt', 'wave', 'mech', 'fw', 'test', 'coat', 'pack'];

  // WO-2430: đang chạy quá định mức tại trạm SMT (minh hoạ cảnh báo bottleneck)
  const wo2430Steps = makeSteps(['prep', 'smt', 'wave', 'test', 'pack'], now, 1, [1.0], 'u2');
  wo2430Steps[1] = { ...wo2430Steps[1], status: 'running', startedAt: now - 52 * MIN, operatorId: 'u2' };

  const done2426 = makeSteps(['prep', 'smt', 'wave', 'test', 'pack'], now - DAY, 5, [0.9, 1.05, 0.95, 1.1, 0.85], 'u1');

  const workOrders: WorkOrder[] = [
    {
      id: 'WO-2427',
      product: 'Bo mạch điều khiển bay FCU-200',
      productCode: 'FCU-200-A',
      qty: 20,
      priority: 1,
      dueDate: isoDate(now + 2 * DAY),
      assigneeId: 'u1',
      steps: makeSteps(full, now, 2, [0.92, 1.08], 'u1'),
      bom: bom('WO-2427', [
        ['ADUM4160', 'IC cách ly USB', 3, 1],
        ['STM32F407', 'Vi điều khiển', 3, 1],
        ['CONN-DB9', 'Đầu nối DB9', 4, 2],
      ]),
      photos: [],
    },
    {
      id: 'WO-2428',
      product: 'Module cảm biến nhiệt TSM-31',
      productCode: 'TSM-31-B',
      qty: 50,
      priority: 2,
      dueDate: isoDate(now + 4 * DAY),
      assigneeId: 'u1',
      hold: { type: 'part', reason: 'Chờ linh kiện cấp bù', at: now - 3 * 60 * MIN },
      steps: makeSteps(['prep', 'smt', 'wave', 'fw', 'test', 'pack'], now, 0),
      bom: bom('WO-2428', [
        ['MAX31855', 'IC cảm biến cặp nhiệt', 1, 1],
        ['RES10K', 'Điện trở 10K 0,1%', 1, 1],
      ]),
      photos: [],
    },
    {
      id: 'WO-2429',
      product: 'Bộ nguồn PSU-28V',
      productCode: 'PSU-28V-C',
      qty: 10,
      priority: 3,
      dueDate: isoDate(now + 6 * DAY),
      assigneeId: 'u2',
      hold: { type: 'fai', reason: 'Chờ QC FAI duyệt', at: now - 90 * MIN },
      steps: makeSteps(['prep', 'smt', 'mech', 'test', 'coat', 'pack'], now, 2, [1.0, 0.97], 'u2'),
      bom: bom('WO-2429', [['CAP100N', 'Tụ gốm 100nF', 3, 1]]),
      photos: [],
    },
    {
      id: 'WO-2430',
      product: 'Bo giao tiếp ARINC-429',
      productCode: 'ARC-429-D',
      qty: 30,
      priority: 4,
      dueDate: isoDate(now + 1 * DAY),
      assigneeId: 'u2',
      steps: wo2430Steps,
      bom: bom('WO-2430', [['STM32F407', 'Vi điều khiển', 3, 1]]),
      photos: [],
    },
    {
      id: 'WO-2426',
      product: 'Bo hiển thị buồng lái DSP-7',
      productCode: 'DSP-7-A',
      qty: 15,
      priority: 5,
      dueDate: isoDate(now - DAY),
      assigneeId: 'u1',
      steps: done2426,
      bom: [],
      photos: [],
      completedAt: done2426[4].finishedAt,
    },
  ];

  const lot = (
    id: string,
    mpn: string,
    name: string,
    lotNo: string,
    dateCode: string,
    expiry: string,
    coc: string,
    supplier: string,
    qty: number,
    status: IqcLot['status'],
  ): IqcLot => ({
    id,
    mpn,
    name,
    lot: lotNo,
    dateCode,
    expiry,
    coc,
    supplier,
    qty,
    receivedAt: now - 2 * DAY,
    status,
    checklist: checklist(IQC_CHECKLIST, status === 'accepted' ? 'pass' : null),
    inspectedBy: status === 'accepted' ? 'Trần Thị B' : undefined,
    inspectedAt: status === 'accepted' ? now - DAY : undefined,
  });

  const iqcLots: IqcLot[] = [
    lot('LOT-01', 'ADUM4160', 'IC cách ly USB', 'L2345A', '2345', isoDate(now + 500 * DAY), 'COC-0091', 'Analog Devices', 200, 'accepted'),
    lot('LOT-02', 'STM32F407', 'Vi điều khiển', 'L2401B', '2401', isoDate(now + 700 * DAY), 'COC-0092', 'STMicroelectronics', 120, 'accepted'),
    lot('LOT-03', 'MAX31855', 'IC cảm biến cặp nhiệt', 'L2310C', '2310', isoDate(now + 300 * DAY), 'COC-0105', 'Maxim Integrated', 60, 'pending'),
    lot('LOT-04', 'RES10K', 'Điện trở 10K 0,1%', 'L2402D', '2402', isoDate(now + 900 * DAY), 'COC-0093', 'Vishay', 5000, 'accepted'),
    lot('LOT-05', 'CONN-DB9', 'Đầu nối DB9', 'L2212E', '2212', isoDate(now - 40 * DAY), 'COC-0077', 'Amphenol', 80, 'accepted'),
    lot('LOT-06', 'CONN-DB9', 'Đầu nối DB9', 'L2405F', '2405', isoDate(now + 400 * DAY), 'COC-0110', 'Amphenol', 100, 'accepted'),
    lot('LOT-07', 'CAP100N', 'Tụ gốm 100nF', 'L2399X', '2399', isoDate(now + 600 * DAY), 'COC-0111', 'Murata', 10000, 'pending'),
  ];

  const partRequests: PartRequest[] = [
    {
      id: 'PR-0001',
      woId: 'WO-2428',
      mpn: 'MAX31855',
      qty: 5,
      reason: 'Thiếu 5 con so với BOM, lô cũ bị ẩm phải loại',
      status: 'pending',
      requestedBy: 'Nguyễn Văn A',
      createdAt: now - 3 * 60 * MIN,
    },
  ];

  const ncrs: Ncr[] = [
    {
      id: 'NCR-0001',
      woId: 'WO-2426',
      stepNo: 3,
      severity: 'minor',
      category: 'Mối hàn',
      description: 'Mối hàn chân J3 thiếu thiếc, đã hàn bổ sung.',
      qtyDefect: 1,
      photos: [],
      status: 'closed',
      disposition: 'rework',
      rootCause: 'Sóng thiếc thấp do bể thiếu thiếc',
      createdBy: 'Nguyễn Văn A',
      createdById: 'u1',
      createdAt: now - DAY - 2 * 60 * MIN,
      history: [
        { at: now - DAY - 2 * 60 * MIN, by: 'Nguyễn Văn A', action: 'Tạo NCR' },
        { at: now - DAY - 60 * MIN, by: 'Trần Thị B', action: 'Đóng NCR', note: 'Sửa lại (rework) – đạt' },
      ],
    },
  ];

  const pqcRecords: PqcRecord[] = [];

  const notifications: AppNotification[] = [
    {
      id: 'N-seed-1',
      title: 'Yêu cầu cấp bù linh kiện',
      body: 'WO-2428 cần thêm 5 × MAX31855. Chờ quản lý duyệt.',
      level: 'warning',
      roles: ['manager'],
      createdAt: now - 3 * 60 * MIN,
      readBy: [],
      href: '/work-order/WO-2428',
    },
    {
      id: 'N-seed-2',
      title: 'Chờ duyệt FAI',
      body: 'WO-2429 đang chờ QC kiểm tra sản phẩm đầu tiên (FAI).',
      level: 'info',
      roles: ['qc'],
      createdAt: now - 90 * MIN,
      readBy: [],
      href: '/pqc/WO-2429',
    },
    {
      id: 'N-seed-3',
      title: 'Lô hàng mới chờ IQC',
      body: 'Có 2 lô linh kiện vừa nhập kho đang chờ kiểm tra đầu vào.',
      level: 'info',
      roles: ['qc'],
      createdAt: now - 2 * 60 * MIN,
      readBy: [],
    },
  ];

  const trace: TraceEvent[] = [
    {
      id: 'T-seed-2',
      at: now - DAY - 60 * MIN,
      by: 'Trần Thị B',
      type: 'ncr',
      message: 'Đóng NCR-0001 (rework)',
      woId: 'WO-2426',
      ncrId: 'NCR-0001',
    },
    {
      id: 'T-seed-1',
      at: now - DAY - 2 * 60 * MIN,
      by: 'Nguyễn Văn A',
      type: 'ncr',
      message: 'Tạo NCR-0001: Mối hàn chân J3 thiếu thiếc',
      woId: 'WO-2426',
      ncrId: 'NCR-0001',
    },
  ];

  // Số liệu ca hiện tại của từng trạm (giả lập dữ liệu máy)
  const stationStats: StationStat[] = [
    { station: 'Kho', plannedMin: 480, downtimeMin: 0, goodUnits: 210, defectUnits: 0 },
    { station: 'SMT', plannedMin: 480, downtimeMin: 62, goodUnits: 188, defectUnits: 6 },
    { station: 'Hàn sóng', plannedMin: 480, downtimeMin: 25, goodUnits: 140, defectUnits: 3 },
    { station: 'Lắp ráp', plannedMin: 480, downtimeMin: 10, goodUnits: 95, defectUnits: 1 },
    { station: 'Nạp FW', plannedMin: 480, downtimeMin: 5, goodUnits: 90, defectUnits: 0 },
    { station: 'Test', plannedMin: 480, downtimeMin: 38, goodUnits: 82, defectUnits: 5 },
    { station: 'Coating', plannedMin: 480, downtimeMin: 20, goodUnits: 60, defectUnits: 1 },
    { station: 'Đóng gói', plannedMin: 480, downtimeMin: 0, goodUnits: 75, defectUnits: 0 },
  ];

  return { workOrders, iqcLots, ncrs, partRequests, pqcRecords, notifications, trace, stationStats };
}
