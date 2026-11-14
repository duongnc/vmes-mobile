// Bảng màu và kích thước dùng chung. Nút bấm to, tương phản cao để thao tác trong xưởng.
export const C = {
  primary: '#0B4F8A',
  primaryDark: '#083B68',
  primarySoft: '#E3EEF8',
  bg: '#F2F4F7',
  card: '#FFFFFF',
  text: '#16202B',
  sub: '#5B6775',
  border: '#D9DEE5',
  green: '#1E8E3E',
  greenSoft: '#E3F4E8',
  yellow: '#B7791F',
  yellowSoft: '#FDF3D7',
  red: '#C5221F',
  redSoft: '#FBE4E3',
  gray: '#7A8594',
  graySoft: '#E9ECF0',
  purple: '#6B3FA0',
  white: '#FFFFFF',
};

export type Tone = 'primary' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';

export const TONE: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: C.primary, bg: C.primarySoft },
  green: { fg: C.green, bg: C.greenSoft },
  yellow: { fg: C.yellow, bg: C.yellowSoft },
  red: { fg: C.red, bg: C.redSoft },
  gray: { fg: C.gray, bg: C.graySoft },
  purple: { fg: C.purple, bg: '#EFE6F8' },
};

export const HEALTH_TONE = { green: 'green', yellow: 'yellow', red: 'red', done: 'gray' } as const;
export const SEVERITY_TONE = { minor: 'yellow', major: 'red', critical: 'red' } as const;
export const SEVERITY_LABEL = { minor: 'Minor', major: 'Major', critical: 'Critical' } as const;
export const NCR_STATUS_LABEL = { open: 'Mới mở', reviewing: 'Đang xử lý', closed: 'Đã đóng' } as const;
export const NCR_STATUS_TONE = { open: 'red', reviewing: 'yellow', closed: 'green' } as const;
export const DISPOSITION_LABEL = {
  rework: 'Sửa lại (Rework)',
  scrap: 'Huỷ bỏ (Scrap)',
  'use-as-is': 'Chấp nhận dùng (Use as is)',
  return: 'Trả nhà cung cấp',
} as const;
export const LOT_STATUS_LABEL = { pending: 'Chờ kiểm', accepted: 'Chấp nhận', rejected: 'Từ chối' } as const;
export const LOT_STATUS_TONE = { pending: 'yellow', accepted: 'green', rejected: 'red' } as const;
