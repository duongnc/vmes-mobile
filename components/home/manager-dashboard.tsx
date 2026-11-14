import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { RequestCard } from '@/components/rows';
import { Banner, Button, Card, Empty, ProgressBar, Row, Screen, SectionTitle, styles as ui, useNow } from '@/components/ui';
import { WoCard } from '@/components/wo-card';
import { C, SEVERITY_LABEL, Tone, TONE } from '@/constants/theme';
import { percent } from '@/lib/format';
import { bottlenecks, computeOee, countBy, isWoDone, stationLoads, woHealth } from '@/lib/metrics';
import { useMesStore } from '@/store/useMesStore';

function Kpi({ value, label, tone }: { value: number | string; label: string; tone: Tone }) {
  return (
    <View style={{ flex: 1, backgroundColor: TONE[tone].bg, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', color: TONE[tone].fg }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.text, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Meter({ label, value, tone }: { label: string; value: number; tone?: Tone }) {
  const t: Tone = tone ?? (value >= 0.85 ? 'green' : value >= 0.7 ? 'yellow' : 'red');
  return (
    <View style={{ gap: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={ui.sub}>{label}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{percent(value)}</Text>
      </Row>
      <ProgressBar value={value} tone={t} />
    </View>
  );
}

function CountBar({ label, count, max, tone }: { label: string; count: number; max: number; tone: Tone }) {
  return (
    <Row>
      <Text style={[ui.sub, { width: 86 }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={{ flex: 1 }}>
        <ProgressBar value={max > 0 ? count / max : 0} tone={tone} />
      </View>
      <Text style={{ width: 24, textAlign: 'right', fontWeight: '700', color: C.text }}>{count}</Text>
    </Row>
  );
}

export function ManagerDashboard() {
  const router = useRouter();
  const now = useNow(1000);
  const workOrders = useMesStore((s) => s.workOrders);
  const ncrs = useMesStore((s) => s.ncrs);
  const requests = useMesStore((s) => s.partRequests);
  const stats = useMesStore((s) => s.stationStats);

  // Tính lại mỗi 5 giây là đủ cho các chỉ số tổng hợp
  const tick = Math.floor(now / 5000);
  const data = useMemo(() => {
    const t = tick * 5000;
    const active = workOrders.filter((w) => !isWoDone(w)).sort((a, b) => a.priority - b.priority);
    const colors = active.map((w) => woHealth(w, ncrs, requests, t).color);
    const loads = stationLoads(workOrders, t);
    return {
      active,
      green: colors.filter((c) => c === 'green').length,
      yellow: colors.filter((c) => c === 'yellow').length,
      red: colors.filter((c) => c === 'red').length,
      done: workOrders.length - active.length,
      loads: loads.filter((l) => l.wip > 0 || l.completed > 0),
      alerts: bottlenecks(loads),
      oee: computeOee(workOrders, stats, ncrs),
      bySeverity: countBy(ncrs, (n) => n.severity),
      byCategory: countBy(ncrs, (n) => n.category),
    };
  }, [workOrders, ncrs, requests, stats, tick]);

  const pending = requests.filter((r) => r.status === 'pending');
  const openNcr = ncrs.filter((n) => n.status !== 'closed').length;
  const maxCat = Math.max(1, ...data.byCategory.map((c) => c.count));

  return (
    <Screen>
      <Row>
        <Kpi value={data.green} label="Trôi chảy" tone="green" />
        <Kpi value={data.yellow} label="Sắp tắc" tone="yellow" />
        <Kpi value={data.red} label="Tắc" tone="red" />
        <Kpi value={data.done} label="Hoàn thành" tone="gray" />
      </Row>

      <SectionTitle>Cảnh báo bottleneck</SectionTitle>
      {data.alerts.length === 0 ? (
        <Banner tone="green" icon="check-circle" title="Không có điểm nghẽn" text="Tất cả các trạm đang chạy trong định mức." />
      ) : (
        data.alerts.map((a) => (
          <Banner
            key={a.station}
            tone={a.level}
            icon={a.level === 'red' ? 'warning' : 'hourglass-top'}
            title={`Trạm ${a.station}`}
            text={a.message}
          />
        ))
      )}

      {pending.length > 0 ? <SectionTitle>Yêu cầu cấp bù chờ duyệt ({pending.length})</SectionTitle> : null}
      {pending.map((r) => (
        <RequestCard key={r.id} req={r} canDecide />
      ))}

      <SectionTitle>Tiến độ lệnh sản xuất</SectionTitle>
      {data.active.length === 0 ? <Empty text="Không có lệnh đang chạy." /> : null}
      {data.active.map((wo) => (
        <WoCard key={wo.id} wo={wo} now={now} />
      ))}

      <SectionTitle>OEE toàn xưởng (ca hiện tại)</SectionTitle>
      <Card>
        <Row style={{ alignItems: 'flex-end', marginBottom: 10 }}>
          <Text style={{ fontSize: 40, fontWeight: '800', color: C.primary }}>{percent(data.oee.oee)}</Text>
          <Text style={[ui.sub, { marginBottom: 8 }]}>= Sẵn sàng × Hiệu suất × Chất lượng</Text>
        </Row>
        <View style={{ gap: 10 }}>
          <Meter label="Sẵn sàng (Availability)" value={data.oee.availability} />
          <Meter label="Hiệu suất (Performance)" value={data.oee.performance} />
          <Meter label="Chất lượng (Quality)" value={data.oee.quality} />
        </View>
      </Card>

      <SectionTitle>Năng suất từng trạm</SectionTitle>
      <Card>
        <Row style={{ paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={[ui.sub, { flex: 1.4, fontWeight: '700' }]}>Trạm</Text>
          <Text style={[ui.sub, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>Tồn</Text>
          <Text style={[ui.sub, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>Xong</Text>
          <Text style={[ui.sub, { flex: 1.2, textAlign: 'center', fontWeight: '700' }]}>TT/ĐM</Text>
          <Text style={[ui.sub, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>OEE</Text>
        </Row>
        {data.loads.map((l) => {
          const oee = computeOee(workOrders, stats, ncrs, l.station).oee;
          const ratioColor = l.avgRatio > 1.05 ? C.red : C.text;
          return (
            <Row key={l.station} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.graySoft }}>
              <Text style={{ flex: 1.4, fontSize: 14, fontWeight: '600', color: l.overtime ? C.red : C.text }}>{l.station}</Text>
              <Text style={{ flex: 1, textAlign: 'center', color: C.text }}>{l.wip}</Text>
              <Text style={{ flex: 1, textAlign: 'center', color: C.text }}>{l.completed}</Text>
              <Text style={{ flex: 1.2, textAlign: 'center', color: ratioColor }}>{l.completed ? percent(l.avgRatio) : '—'}</Text>
              <Text style={{ flex: 1, textAlign: 'right', fontWeight: '700', color: C.text }}>{percent(oee)}</Text>
            </Row>
          );
        })}
        <Text style={[ui.sub, { marginTop: 8, fontSize: 12 }]}>
          Tồn: số lệnh đang nằm tại trạm · TT/ĐM: thời gian thực tế so với định mức (trên 100% là chậm).
        </Text>
      </Card>

      <SectionTitle>Thống kê lỗi (NCR)</SectionTitle>
      <Card>
        <Text style={[ui.text, { marginBottom: 10 }]}>
          Tổng {ncrs.length} NCR · <Text style={{ fontWeight: '700', color: openNcr ? C.red : C.green }}>{openNcr} chưa đóng</Text>
        </Text>
        <View style={{ gap: 8 }}>
          {(['critical', 'major', 'minor'] as const).map((sev) => (
            <CountBar
              key={sev}
              label={SEVERITY_LABEL[sev]}
              count={data.bySeverity.find((s) => s.key === sev)?.count ?? 0}
              max={Math.max(1, ncrs.length)}
              tone={sev === 'minor' ? 'yellow' : 'red'}
            />
          ))}
        </View>
        {data.byCategory.length > 0 ? (
          <View style={{ gap: 8, marginTop: 14 }}>
            <Text style={[ui.sub, { fontWeight: '700' }]}>Theo nhóm lỗi</Text>
            {data.byCategory.map((c) => (
              <CountBar key={c.key} label={c.key} count={c.count} max={maxCat} tone="primary" />
            ))}
          </View>
        ) : null}
      </Card>

      <Button label="TRUY XUẤT NGUỒN GỐC" icon="manage-search" variant="outline" onPress={() => router.push('/trace')} />
    </Screen>
  );
}
