import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { MarkedPhoto } from '@/components/marked-photo';
import { Badge, Button, Card, Chips, Empty, Field, Icon, InfoLine, notifyUser, Row, Screen, SectionTitle, styles as ui } from '@/components/ui';
import { C, DISPOSITION_LABEL, NCR_STATUS_LABEL, NCR_STATUS_TONE, SEVERITY_LABEL, SEVERITY_TONE } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';
import type { Disposition } from '@/store/types';
import { useCurrentUser } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

export default function NcrDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const ncr = useMesStore((s) => s.ncrs.find((n) => n.id === id));
  const updateNcr = useMesStore((s) => s.updateNcr);

  const [disposition, setDisposition] = useState<Disposition | undefined>(ncr?.disposition);
  const [rootCause, setRootCause] = useState(ncr?.rootCause ?? '');
  const [note, setNote] = useState('');

  if (!ncr || !user) {
    return (
      <Screen>
        <Empty icon="search-off" text={`Không tìm thấy ${id}.`} />
      </Screen>
    );
  }

  // QC và quản lý được xử lý NCR; kỹ thuật viên chỉ xem
  const canProcess = user.role === 'qc' || user.role === 'manager';

  const close = () => {
    if (!disposition) return notifyUser('Thiếu thông tin', 'Hãy chọn hướng xử lý trước khi đóng NCR.');
    if (!rootCause.trim()) return notifyUser('Thiếu thông tin', 'Hãy nhập nguyên nhân gốc.');
    updateNcr(ncr.id, {
      status: 'closed',
      disposition,
      rootCause: rootCause.trim(),
      note: note.trim() || DISPOSITION_LABEL[disposition],
    });
    setNote('');
  };

  return (
    <Screen>
      <Card tone={NCR_STATUS_TONE[ncr.status]}>
        <Row style={{ flexWrap: 'wrap' }}>
          <Text style={[ui.title, { fontSize: 20 }]}>{ncr.id}</Text>
          <Badge label={SEVERITY_LABEL[ncr.severity]} tone={SEVERITY_TONE[ncr.severity]} />
          <Badge label={NCR_STATUS_LABEL[ncr.status]} tone={NCR_STATUS_TONE[ncr.status]} />
        </Row>
        <Text style={[ui.text, { marginVertical: 8 }]}>{ncr.description}</Text>
        <InfoLine label="Nhóm lỗi" value={ncr.category} />
        {ncr.woId ? <InfoLine label="Lệnh sản xuất" value={`${ncr.woId}${ncr.stepNo ? ` · bước ${ncr.stepNo}` : ''}`} /> : null}
        {ncr.mpn ? <InfoLine label="Linh kiện" value={ncr.mpn} /> : null}
        <InfoLine label="Số lượng lỗi" value={ncr.qtyDefect} />
        <InfoLine label="Người lập" value={`${ncr.createdBy} · ${formatDateTime(ncr.createdAt)}`} />
        {ncr.disposition ? <InfoLine label="Hướng xử lý" value={DISPOSITION_LABEL[ncr.disposition]} /> : null}
        {ncr.rootCause ? <InfoLine label="Nguyên nhân gốc" value={ncr.rootCause} /> : null}
        {ncr.woId ? (
          <Button small style={{ marginTop: 8 }} variant="outline" icon="assignment" label={`Mở ${ncr.woId}`} onPress={() => router.push(`/work-order/${ncr.woId}`)} />
        ) : null}
      </Card>

      <SectionTitle>Ảnh biên bản ({ncr.photos.length})</SectionTitle>
      {ncr.photos.length === 0 ? <Text style={ui.sub}>NCR này không có ảnh đính kèm.</Text> : null}
      {ncr.photos.map((p) => (
        <View key={p.id}>
          <MarkedPhoto uri={p.uri} marks={p.marks} />
          <Text style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>
            {p.note ? `${p.note} · ` : ''}
            {p.marks.length} vùng đánh dấu · {p.by} · {formatDateTime(p.takenAt)}
          </Text>
        </View>
      ))}

      {canProcess && ncr.status !== 'closed' ? (
        <>
          <SectionTitle>Xử lý NCR</SectionTitle>
          <Card>
            {ncr.status === 'open' ? (
              <Button
                small
                style={{ marginBottom: 14 }}
                tone="yellow"
                icon="assignment-ind"
                label="Tiếp nhận xử lý"
                onPress={() => updateNcr(ncr.id, { status: 'reviewing', note: 'Đã tiếp nhận, đang phân tích' })}
              />
            ) : null}
            <Text style={ui.fieldLabel}>Hướng xử lý (Disposition)</Text>
            <Chips<Disposition>
              value={disposition}
              onChange={setDisposition}
              options={(Object.keys(DISPOSITION_LABEL) as Disposition[]).map((d) => ({ value: d, label: DISPOSITION_LABEL[d] }))}
            />
            <View style={{ height: 12 }} />
            <Field label="Nguyên nhân gốc" placeholder="VD: nhiệt độ bể thiếc thấp" value={rootCause} onChangeText={setRootCause} />
            <Field label="Ghi chú xử lý" placeholder="Hành động khắc phục / phòng ngừa" value={note} onChangeText={setNote} multiline />
            <Button label="ĐÓNG NCR" icon="task-alt" tone="green" onPress={close} />
          </Card>
        </>
      ) : null}

      {canProcess && ncr.status === 'closed' ? (
        <Button small variant="outline" tone="gray" icon="restore" label="Mở lại NCR" onPress={() => updateNcr(ncr.id, { status: 'open', note: 'Mở lại để xem xét thêm' })} />
      ) : null}

      <SectionTitle>Lịch sử</SectionTitle>
      <Card>
        {ncr.history.map((h, i) => (
          <Row key={i} style={{ alignItems: 'flex-start', paddingVertical: 6 }}>
            <Icon name="fiber-manual-record" size={14} color={C.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{h.action}</Text>
              {h.note ? <Text style={ui.text}>{h.note}</Text> : null}
              <Text style={{ fontSize: 12, color: C.sub }}>
                {h.by} · {formatDateTime(h.at)}
              </Text>
            </View>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
