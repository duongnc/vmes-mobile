import { bottlenecks, computeOee, currentStep, stationLoads, stepElapsedSec, woHealth, woProgress } from '../lib/metrics';
import { createSeed } from '../store/seed';

const NOW = new Date('2026-11-13T08:00:00').getTime();
const seed = createSeed(NOW);
const wo = (id: string) => seed.workOrders.find((w) => w.id === id)!;

describe('tiến độ & đếm giờ', () => {
  it('tính tiến độ theo số công đoạn đã xong', () => {
    expect(woProgress(wo('WO-2427'))).toBeCloseTo(2 / 8);
    expect(currentStep(wo('WO-2427'))?.name).toBe('Hàn sóng');
    expect(currentStep(wo('WO-2426'))).toBeUndefined();
  });
  it('cộng thời gian đang chạy vào thời gian tích luỹ', () => {
    const step = { ...wo('WO-2427').steps[2], status: 'running' as const, elapsedSec: 100, startedAt: NOW - 30_000 };
    expect(stepElapsedSec(step, NOW)).toBe(130);
    expect(stepElapsedSec({ ...step, status: 'paused', startedAt: undefined }, NOW)).toBe(100);
  });
});

describe('màu trạng thái lệnh sản xuất', () => {
  const health = (id: string) => woHealth(wo(id), seed.ncrs, seed.partRequests, NOW, '2026-11-13');
  it('xanh khi trôi chảy', () => expect(health('WO-2427').color).toBe('green'));
  it('đỏ khi bị giữ', () => expect(health('WO-2428').color).toBe('red'));
  it('đỏ khi công đoạn vượt định mức', () => {
    expect(health('WO-2430').reasons.join()).toContain('vượt định mức');
  });
  it('vàng khi sắp vượt định mức', () => {
    const w = wo('WO-2427');
    const steps = w.steps.map((s) => (s.no === 3 ? { ...s, status: 'running' as const, startedAt: NOW - 26 * 60_000 } : s));
    expect(woHealth({ ...w, steps }, [], [], NOW, '2026-11-13').color).toBe('yellow');
  });
  it('đỏ khi có NCR Major chưa đóng', () => {
    const ncr = { ...seed.ncrs[0], woId: 'WO-2427', severity: 'major' as const, status: 'open' as const };
    expect(woHealth(wo('WO-2427'), [ncr], [], NOW, '2026-11-13').color).toBe('red');
  });
  it('xám khi hoàn thành', () => expect(health('WO-2426').color).toBe('done'));
});

describe('bottleneck & OEE', () => {
  it('phát hiện trạm SMT đang nghẽn', () => {
    const alerts = bottlenecks(stationLoads(seed.workOrders, NOW));
    expect(alerts[0]).toMatchObject({ station: 'SMT', level: 'red' });
  });
  it('OEE là tích của ba thành phần và nằm trong [0,1]', () => {
    const o = computeOee(seed.workOrders, seed.stationStats, seed.ncrs);
    expect(o.oee).toBeCloseTo(o.availability * o.performance * o.quality);
    expect(o.oee).toBeGreaterThan(0);
    expect(o.oee).toBeLessThanOrEqual(1);
  });
});
