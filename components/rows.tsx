import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Icon, IconName, Row, styles as ui } from '@/components/ui';
import {
  C,
  NCR_STATUS_LABEL,
  NCR_STATUS_TONE,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  Tone,
} from '@/constants/theme';
import { formatDateTime } from '@/lib/format';
import type { Ncr, PartRequest, TraceEvent, TraceType } from '@/store/types';
import { useMesStore } from '@/store/useMesStore';

export function NcrRow({ ncr }: { ncr: Ncr }) {
  const router = useRouter();
  return (
    <Card tone={NCR_STATUS_TONE[ncr.status]} onPress={() => router.push(`/ncr/${ncr.id}`)}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Text style={ui.title}>{ncr.id}</Text>
          <Badge label={SEVERITY_LABEL[ncr.severity]} tone={SEVERITY_TONE[ncr.severity]} />
          <Badge label={NCR_STATUS_LABEL[ncr.status]} tone={NCR_STATUS_TONE[ncr.status]} />
        </Row>
        <Icon name="chevron-right" size={24} />
      </Row>
      <Text style={[ui.text, { marginTop: 6 }]} numberOfLines={2}>
        {ncr.description}
      </Text>
      <Text style={[ui.sub, { marginTop: 4 }]}>
        {[ncr.woId, ncr.mpn, ncr.category].filter(Boolean).join(' · ')} · {ncr.createdBy} · {formatDateTime(ncr.createdAt)}
        {ncr.photos.length ? ` · ${ncr.photos.length} ảnh` : ''}
      </Text>
    </Card>
  );
}

const REQ_TONE: Record<PartRequest['status'], Tone> = { pending: 'yellow', approved: 'green', rejected: 'red' };
const REQ_LABEL: Record<PartRequest['status'], string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export function RequestCard({ req, canDecide }: { req: PartRequest; canDecide: boolean }) {
  const decide = useMesStore((s) => s.decideRequest);
  return (
    <Card tone={REQ_TONE[req.status]}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={ui.title}>
          {req.qty} × {req.mpn}
        </Text>
        <Badge label={REQ_LABEL[req.status]} tone={REQ_TONE[req.status]} />
      </Row>
      <Text style={[ui.text, { marginTop: 4 }]}>{req.reason}</Text>
      <Text style={[ui.sub, { marginTop: 4 }]}>
        {req.id} · {req.woId} · {req.requestedBy} · {formatDateTime(req.createdAt)}
        {req.decidedBy ? ` · Quyết định: ${req.decidedBy}` : ''}
      </Text>
      {canDecide && req.status === 'pending' ? (
        <Row style={{ marginTop: 10 }}>
          <Button small label="Duyệt cấp bù" icon="check" tone="green" style={{ flex: 1 }} onPress={() => decide(req.id, true)} />
          <Button small label="Từ chối" icon="close" tone="red" variant="outline" style={{ flex: 1 }} onPress={() => decide(req.id, false)} />
        </Row>
      ) : null}
    </Card>
  );
}

export const TRACE_META: Record<TraceType, { icon: IconName; color: string; label: string }> = {
  'scan-ok': { icon: 'qr-code-scanner', color: C.green, label: 'Quét đạt' },
  'scan-fail': { icon: 'qr-code-scanner', color: C.red, label: 'Quét lỗi' },
  step: { icon: 'build', color: C.primary, label: 'Công đoạn' },
  photo: { icon: 'photo-camera', color: C.purple, label: 'Ảnh' },
  ncr: { icon: 'report-problem', color: C.red, label: 'NCR' },
  iqc: { icon: 'inventory', color: C.green, label: 'IQC' },
  pqc: { icon: 'fact-check', color: C.green, label: 'PQC' },
  request: { icon: 'add-shopping-cart', color: C.yellow, label: 'Cấp bù' },
  wo: { icon: 'assignment', color: C.primary, label: 'Lệnh SX' },
};

export function TraceRow({ ev }: { ev: TraceEvent }) {
  const meta = TRACE_META[ev.type];
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.graySoft }}>
      <Icon name={meta.icon} size={20} color={meta.color} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, color: C.text }}>{ev.message}</Text>
        <Text style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
          {formatDateTime(ev.at)} · {ev.by}
          {ev.woId ? ` · ${ev.woId}` : ''}
          {ev.lot ? ` · Lô ${ev.lot}` : ''}
        </Text>
      </View>
    </View>
  );
}
