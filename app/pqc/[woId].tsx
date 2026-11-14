import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Checklist } from '@/components/checklist';
import { Badge, Banner, Button, Card, Chips, Empty, Field, InfoLine, notifyUser, Row, Screen, SectionTitle, styles as ui } from '@/components/ui';
import { C } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';
import { currentStep } from '@/lib/metrics';
import { PQC_CHECKLIST } from '@/store/seed';
import type { CheckItem } from '@/store/types';
import { useCurrentUser } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

const blank = (): CheckItem[] => PQC_CHECKLIST.map((label) => ({ label, result: null }));

export default function PqcScreen() {
  const { woId } = useLocalSearchParams<{ woId: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const wo = useMesStore((s) => s.workOrders.find((w) => w.id === woId));
  const allRecords = useMesStore((s) => s.pqcRecords);
  const savePqc = useMesStore((s) => s.savePqc);

  const [type, setType] = useState<'FAI' | 'PQC'>(wo?.hold?.type === 'fai' ? 'FAI' : 'PQC');
  const [items, setItems] = useState<CheckItem[]>(blank);
  const [note, setNote] = useState('');

  if (!wo) {
    return (
      <Screen>
        <Empty icon="search-off" text="Không tìm thấy lệnh sản xuất." />
      </Screen>
    );
  }

  const records = allRecords.filter((r) => r.woId === wo.id);
  const step = currentStep(wo) ?? wo.steps[wo.steps.length - 1];
  const canInspect = user?.role === 'qc';

  const save = () => {
    const unanswered = items.filter((i) => i.result === null).length;
    if (unanswered > 0) return notifyUser('Chưa hoàn tất', `Còn ${unanswered} hạng mục chưa đánh giá.`);
    const failedLabels = items.filter((i) => i.result === 'fail').map((i) => i.label);
    if (failedLabels.length > 0 && !note.trim()) return notifyUser('Thiếu thông tin', 'Có hạng mục không đạt, hãy ghi chú chi tiết.');
    const result = savePqc(wo.id, step.no, type, items, note.trim());
    setItems(blank());
    setNote('');
    if (result === 'fail') {
      router.replace({
        pathname: '/ncr/new',
        params: { woId: wo.id, desc: `${type} không đạt tại bước ${step.no} (${step.name}): ${failedLabels.join('; ')}. ${note.trim()}` },
      });
    } else {
      notifyUser(`${type} đạt`, type === 'FAI' ? 'Lệnh sản xuất được phép chạy hàng loạt.' : 'Đã lưu phiếu kiểm tra.');
    }
  };

  return (
    <Screen>
      <Card>
        <Text style={[ui.title, { fontSize: 20 }]}>{wo.id}</Text>
        <Text style={[ui.text, { marginVertical: 4 }]}>{wo.product}</Text>
        <InfoLine label="Công đoạn kiểm tra" value={`Bước ${step.no}: ${step.name}`} />
        <InfoLine label="Trạm" value={step.station} />
      </Card>

      {wo.hold?.type === 'fai' ? (
        <Banner tone="primary" icon="hourglass-top" title="Lệnh đang chờ duyệt FAI" text="Kết quả FAI đạt sẽ tự động cho phép lệnh tiếp tục sản xuất." />
      ) : null}

      {canInspect ? (
        <>
          <SectionTitle>Phiếu kiểm tra mới</SectionTitle>
          <Card>
            <Text style={ui.fieldLabel}>Loại kiểm tra</Text>
            <Chips<'FAI' | 'PQC'>
              value={type}
              onChange={setType}
              options={[
                { value: 'FAI', label: 'FAI – sản phẩm đầu tiên' },
                { value: 'PQC', label: 'PQC – trong quá trình' },
              ]}
            />
            <View style={{ height: 6 }} />
            <Checklist items={items} onChange={setItems} />
          </Card>
          <Field label="Ghi chú" placeholder="Kết quả đo, nhận xét…" value={note} onChangeText={setNote} multiline />
          <Button label="LƯU KẾT QUẢ KIỂM TRA" icon="save" tone="green" onPress={save} />
        </>
      ) : (
        <Text style={ui.sub}>Chỉ nhân viên QC mới được lập phiếu kiểm tra.</Text>
      )}

      <SectionTitle>Lịch sử kiểm tra ({records.length})</SectionTitle>
      {records.length === 0 ? <Text style={ui.sub}>Chưa có phiếu kiểm tra nào cho lệnh này.</Text> : null}
      {records.map((r) => (
        <Card key={r.id} tone={r.result === 'pass' ? 'green' : 'red'}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text style={ui.title}>
              {r.type} · Bước {r.stepNo}
            </Text>
            <Badge label={r.result === 'pass' ? 'ĐẠT' : 'KHÔNG ĐẠT'} tone={r.result === 'pass' ? 'green' : 'red'} />
          </Row>
          {r.items
            .filter((i) => i.result === 'fail')
            .map((i) => (
              <Text key={i.label} style={{ color: C.red, marginTop: 4 }}>
                ✗ {i.label}
              </Text>
            ))}
          {r.note ? <Text style={[ui.text, { marginTop: 4 }]}>{r.note}</Text> : null}
          <Text style={[ui.sub, { marginTop: 4 }]}>
            {r.by} · {formatDateTime(r.at)}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
