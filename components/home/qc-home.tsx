import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Icon, Row, Screen, SectionTitle, styles as ui } from '@/components/ui';
import { C, LOT_STATUS_LABEL, LOT_STATUS_TONE, Tone, TONE } from '@/constants/theme';
import { formatDate } from '@/lib/format';
import { currentStep, isWoDone } from '@/lib/metrics';
import { todayIso } from '@/lib/scan';
import { useMesStore } from '@/store/useMesStore';

function Kpi({ value, label, tone }: { value: number; label: string; tone: Tone }) {
  return (
    <View style={{ flex: 1, backgroundColor: TONE[tone].bg, borderRadius: 12, padding: 12, alignItems: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', color: TONE[tone].fg }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.text, textAlign: 'center', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export function QcHome() {
  const router = useRouter();
  const lots = useMesStore((s) => s.iqcLots);
  const workOrders = useMesStore((s) => s.workOrders);
  const ncrs = useMesStore((s) => s.ncrs);
  const pqcRecords = useMesStore((s) => s.pqcRecords);
  const today = todayIso();

  const sortedLots = useMemo(
    () => [...lots].sort((a, b) => Number(a.status !== 'pending') - Number(b.status !== 'pending')),
    [lots],
  );
  const activeWos = useMemo(
    () => workOrders.filter((w) => !isWoDone(w)).sort((a, b) => Number(b.hold?.type === 'fai') - Number(a.hold?.type === 'fai')),
    [workOrders],
  );

  return (
    <Screen>
      <Row>
        <Kpi value={lots.filter((l) => l.status === 'pending').length} label="Lô chờ IQC" tone="yellow" />
        <Kpi value={workOrders.filter((w) => w.hold?.type === 'fai').length} label="Lệnh chờ FAI" tone="primary" />
        <Kpi value={ncrs.filter((n) => n.status !== 'closed').length} label="NCR chưa đóng" tone="red" />
      </Row>

      <Button label="TRUY XUẤT NGUỒN GỐC" icon="manage-search" variant="outline" onPress={() => router.push('/trace')} />

      <SectionTitle>Kiểm tra đầu vào (IQC)</SectionTitle>
      {sortedLots.map((lot) => {
        const expired = lot.expiry < today;
        return (
          <Card key={lot.id} tone={LOT_STATUS_TONE[lot.status]} onPress={() => router.push(`/iqc/${lot.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row>
                <Text style={ui.title}>{lot.mpn}</Text>
                <Badge label={LOT_STATUS_LABEL[lot.status]} tone={LOT_STATUS_TONE[lot.status]} />
                {expired ? <Badge label="Hết hạn" tone="red" /> : null}
              </Row>
              <Icon name="chevron-right" size={24} />
            </Row>
            <Text style={[ui.text, { marginTop: 4 }]}>{lot.name}</Text>
            <Text style={[ui.sub, { marginTop: 2 }]}>
              Lô {lot.lot} · {lot.supplier} · SL {lot.qty} · HSD {formatDate(lot.expiry)}
            </Text>
          </Card>
        );
      })}

      <SectionTitle>Kiểm tra quá trình (PQC / FAI)</SectionTitle>
      {activeWos.length === 0 ? <Empty text="Không có lệnh sản xuất đang chạy." /> : null}
      {activeWos.map((wo) => {
        const step = currentStep(wo);
        const count = pqcRecords.filter((r) => r.woId === wo.id).length;
        const waitingFai = wo.hold?.type === 'fai';
        return (
          <Card key={wo.id} tone={waitingFai ? 'primary' : undefined} onPress={() => router.push(`/pqc/${wo.id}`)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row>
                <Text style={ui.title}>{wo.id}</Text>
                {waitingFai ? <Badge label="Chờ duyệt FAI" tone="primary" /> : null}
              </Row>
              <Icon name="chevron-right" size={24} />
            </Row>
            <Text style={[ui.text, { marginTop: 4 }]}>{wo.product}</Text>
            <Text style={[ui.sub, { marginTop: 2 }]}>
              {step ? `Bước ${step.no}/${wo.steps.length}: ${step.name} (${step.station})` : 'Đã xong'} · {count} phiếu kiểm
            </Text>
          </Card>
        );
      })}
    </Screen>
  );
}
