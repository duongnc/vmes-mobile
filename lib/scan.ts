// Phân tích mã QR linh kiện và đối soát với BOM / kết quả IQC.
// Định dạng mã: MPN|LOT|DATECODE|EXPIRY(YYYY-MM-DD)|COC  (chấp nhận dấu | hoặc ;)
import type { BomItem, IqcLot, WorkOrder } from '../store/types';

export interface ParsedCode {
  raw: string;
  mpn: string;
  lot?: string;
  dateCode?: string;
  expiry?: string;
  coc?: string;
}

export type ScanCode =
  | 'OK'
  | 'EMPTY'
  | 'NOT_IN_BOM'
  | 'ALREADY_FULL'
  | 'NO_LOT_INFO'
  | 'LOT_UNKNOWN'
  | 'LOT_NOT_ACCEPTED'
  | 'EXPIRED'
  | 'COC_MISMATCH';

export interface ScanResult {
  ok: boolean;
  code: ScanCode;
  message: string;
  parsed: ParsedCode;
  bomItemId?: string;
}

export function parseCode(raw: string): ParsedCode {
  const clean = raw.trim();
  const parts = clean.split(/[|;]/).map((p) => p.trim());
  const [mpn = '', lot, dateCode, expiry, coc] = parts;
  return {
    raw: clean,
    mpn: mpn.toUpperCase(),
    lot: lot ? lot.toUpperCase() : undefined,
    dateCode: dateCode || undefined,
    expiry: expiry || undefined,
    coc: coc ? coc.toUpperCase() : undefined,
  };
}

export function buildCode(lot: Pick<IqcLot, 'mpn' | 'lot' | 'dateCode' | 'expiry' | 'coc'>): string {
  return [lot.mpn, lot.lot, lot.dateCode, lot.expiry, lot.coc].join('|');
}

export function todayIso(now: number = Date.now()): string {
  const d = new Date(now);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isBomItemFull(item: BomItem): boolean {
  return item.scans.length >= item.qtyRequired;
}

export function validateScan(
  raw: string,
  wo: Pick<WorkOrder, 'bom'>,
  lots: IqcLot[],
  today: string = todayIso(),
): ScanResult {
  const parsed = parseCode(raw);
  const fail = (code: ScanCode, message: string, bomItemId?: string): ScanResult => ({
    ok: false,
    code,
    message,
    parsed,
    bomItemId,
  });

  if (!parsed.mpn) return fail('EMPTY', 'Mã quét rỗng hoặc không đọc được.');

  const candidates = wo.bom.filter((b) => b.mpn.toUpperCase() === parsed.mpn);
  if (candidates.length === 0) {
    return fail('NOT_IN_BOM', `Sai mã: ${parsed.mpn} không có trong BOM của lệnh này.`);
  }
  const item = candidates.find((b) => !isBomItemFull(b));
  if (!item) {
    return fail('ALREADY_FULL', `${parsed.mpn} đã quét đủ số lượng theo BOM.`, candidates[0].id);
  }

  if (!parsed.lot) {
    return fail(
      'NO_LOT_INFO',
      `Mã ${parsed.mpn} thiếu thông tin số lô/COC nên không thể truy xuất nguồn gốc.`,
      item.id,
    );
  }

  const lot = lots.find((l) => l.mpn.toUpperCase() === parsed.mpn && l.lot.toUpperCase() === parsed.lot);
  if (!lot) {
    return fail('LOT_UNKNOWN', `Lô ${parsed.lot} của ${parsed.mpn} chưa được nhập kho / chưa có hồ sơ IQC.`, item.id);
  }
  if (lot.status !== 'accepted') {
    return fail(
      'LOT_NOT_ACCEPTED',
      lot.status === 'rejected'
        ? `Lô ${lot.lot} đã bị IQC từ chối – không được sử dụng.`
        : `Lô ${lot.lot} chưa được IQC kiểm tra – không được sử dụng.`,
      item.id,
    );
  }

  // Hạn sử dụng: lấy mốc sớm nhất giữa nhãn và hồ sơ lô
  const expiries = [parsed.expiry, lot.expiry].filter(Boolean) as string[];
  const expiry = expiries.sort()[0];
  if (expiry && expiry < today) {
    return fail('EXPIRED', `Linh kiện hết hạn sử dụng từ ${expiry} (lô ${lot.lot}).`, item.id);
  }

  if (!parsed.coc || parsed.coc !== lot.coc.toUpperCase()) {
    return fail(
      'COC_MISMATCH',
      `Không khớp chứng chỉ xuất xứ: nhãn ghi ${parsed.coc ?? '(trống)'}, hồ sơ lô là ${lot.coc}.`,
      item.id,
    );
  }

  return {
    ok: true,
    code: 'OK',
    message: `Khớp BOM: ${item.mpn} – ${item.name} (lô ${lot.lot}, ${lot.coc}).`,
    parsed: { ...parsed, dateCode: parsed.dateCode ?? lot.dateCode },
    bomItemId: item.id,
  };
}
