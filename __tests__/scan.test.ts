import { buildCode, parseCode, validateScan } from '../lib/scan';
import { createSeed } from '../store/seed';

const NOW = new Date('2026-11-13T08:00:00').getTime();
const TODAY = '2026-11-13';
const seed = createSeed(NOW);
const wo = seed.workOrders.find((w) => w.id === 'WO-2427')!;
const lotOf = (lot: string) => seed.iqcLots.find((l) => l.lot === lot)!;

describe('parseCode', () => {
  it('tách đủ 5 trường và chuẩn hoá chữ hoa', () => {
    expect(parseCode(' adum4160|l2345a|2345|2028-01-01|coc-0091 ')).toEqual({
      raw: 'adum4160|l2345a|2345|2028-01-01|coc-0091',
      mpn: 'ADUM4160',
      lot: 'L2345A',
      dateCode: '2345',
      expiry: '2028-01-01',
      coc: 'COC-0091',
    });
  });
  it('chấp nhận dấu chấm phẩy', () => {
    expect(parseCode('RES10K;L2402D').lot).toBe('L2402D');
  });
});

describe('validateScan', () => {
  it('khớp BOM với lô đã qua IQC', () => {
    const res = validateScan(buildCode(lotOf('L2345A')), wo, seed.iqcLots, TODAY);
    expect(res.ok).toBe(true);
    expect(res.bomItemId).toBe('WO-2427-B1');
  });
  it('báo sai mã khi không có trong BOM', () => {
    expect(validateScan('LM358|L1|2401|2030-01-01|COC-1', wo, seed.iqcLots, TODAY).code).toBe('NOT_IN_BOM');
  });
  it('từ chối mã thiếu thông tin lô', () => {
    expect(validateScan('ADUM4160', wo, seed.iqcLots, TODAY).code).toBe('NO_LOT_INFO');
  });
  it('từ chối lô không có hồ sơ', () => {
    expect(validateScan('ADUM4160|LXXXX|2345|2030-01-01|COC-0091', wo, seed.iqcLots, TODAY).code).toBe('LOT_UNKNOWN');
  });
  it('từ chối lô chưa được IQC chấp nhận', () => {
    const wo2428 = seed.workOrders.find((w) => w.id === 'WO-2428')!;
    expect(validateScan(buildCode(lotOf('L2310C')), wo2428, seed.iqcLots, TODAY).code).toBe('LOT_NOT_ACCEPTED');
  });
  it('cảnh báo linh kiện hết hạn', () => {
    expect(validateScan(buildCode(lotOf('L2212E')), wo, seed.iqcLots, TODAY).code).toBe('EXPIRED');
  });
  it('cảnh báo không khớp COC', () => {
    const code = buildCode({ ...lotOf('L2345A'), coc: 'COC-9999' });
    expect(validateScan(code, wo, seed.iqcLots, TODAY).code).toBe('COC_MISMATCH');
  });
  it('báo đã đủ số lượng', () => {
    const full = { bom: wo.bom.map((b) => (b.mpn === 'ADUM4160' ? { ...b, scans: [{ lot: 'L2345A', dateCode: '', coc: '', at: 0, by: '' }] } : b)) };
    expect(validateScan(buildCode(lotOf('L2345A')), full, seed.iqcLots, TODAY).code).toBe('ALREADY_FULL');
  });
});
