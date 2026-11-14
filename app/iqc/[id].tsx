import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { Checklist } from '@/components/checklist';
import { Badge, Banner, Button, Card, confirmUser, Empty, Field, InfoLine, notifyUser, Row, Screen, SectionTitle, styles as ui } from '@/components/ui';
import { LOT_STATUS_LABEL, LOT_STATUS_TONE } from '@/constants/theme';
import { formatDate, formatDateTime } from '@/lib/format';
import { todayIso } from '@/lib/scan';
import { useCurrentUser } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

export default function IqcScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const lot = useMesStore((s) => s.iqcLots.find((l) => l.id === id));
  const inspectLot = useMesStore((s) => s.inspectLot);

  const [items, setItems] = useState(lot?.checklist ?? []);
  const [note, setNote] = useState(lot?.note ?? '');

  if (!lot) {
    return (
      <Screen>
        <Empty icon="search-off" text="Không tìm thấy lô hàng." />
      </Screen>
    );
  }

  const pending = lot.status === 'pending';
  const canInspect = pending && user?.role === 'qc';
  const expired = lot.expiry < todayIso();
  const unanswered = items.filter((i) => i.result === null).length;
  const failed = items.filter((i) => i.result === 'fail').length;

  const accept = () => {
    if (unanswered > 0) return notifyUser('Chưa hoàn tất', `Còn ${unanswered} hạng mục chưa đánh giá.`);
    if (failed > 0) return notifyUser('Không thể chấp nhận', 'Có hạng mục không đạt. Hãy từ chối lô hoặc đánh giá lại.');
    if (expired) return notifyUser('Không thể chấp nhận', 'Lô hàng đã hết hạn sử dụng.');
    inspectLot(lot.id, items, true, note.trim());
    notifyUser('Đã chấp nhận lô', `Lô ${lot.lot} được phép đưa vào sản xuất.`);
    router.back();
  };

  const reject = () => {
    if (!note.trim()) return notifyUser('Thiếu thông tin', 'Hãy ghi rõ lý do từ chối vào ô ghi chú.');
    confirmUser('Từ chối lô hàng', `Lô ${lot.lot} sẽ không được phép sử dụng. Tiếp tục?`, () => {
      inspectLot(lot.id, items, false, note.trim());
      router.replace({
        pathname: '/ncr/new',
        params: { lotId: lot.id, mpn: lot.mpn, category: 'Linh kiện', desc: `IQC từ chối lô ${lot.lot} (${lot.supplier}): ${note.trim()}` },
      });
    }, 'Từ chối');
  };

  return (
    <Screen>
      <Card tone={LOT_STATUS_TONE[lot.status]}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[ui.title, { fontSize: 20 }]}>{lot.mpn}</Text>
          <Badge label={LOT_STATUS_LABEL[lot.status]} tone={LOT_STATUS_TONE[lot.status]} />
        </Row>
        <Text style={[ui.text, { marginVertical: 4 }]}>{lot.name}</Text>
        <InfoLine label="Số lô" value={lot.lot} />
        <InfoLine label="Nhà cung cấp" value={lot.supplier} />
        <InfoLine label="Số lượng" value={lot.qty} />
        <InfoLine label="Date code" value={lot.dateCode} />
        <InfoLine label="Hạn sử dụng" value={formatDate(lot.expiry)} />
        <InfoLine label="Chứng chỉ COC" value={lot.coc} />
        <InfoLine label="Ngày nhập" value={formatDateTime(lot.receivedAt)} />
        {lot.inspectedBy ? <InfoLine label="Người kiểm" value={`${lot.inspectedBy} · ${lot.inspectedAt ? formatDateTime(lot.inspectedAt) : ''}`} /> : null}
        {!pending && lot.note ? <InfoLine label="Ghi chú" value={lot.note} /> : null}
      </Card>

      {expired ? <Banner tone="red" icon="event-busy" title="Lô hàng đã hết hạn sử dụng" text={`Hạn sử dụng ${formatDate(lot.expiry)}. Không được đưa vào sản xuất.`} /> : null}

      <SectionTitle>Phiếu kiểm tra đầu vào</SectionTitle>
      <Card>
        <Checklist items={items} onChange={setItems} readOnly={!canInspect} />
      </Card>

      {canInspect ? (
        <>
          <Field label="Ghi chú / lý do từ chối" placeholder="Nhập nhận xét khi kiểm tra" value={note} onChangeText={setNote} multiline />
          <Button label="CHẤP NHẬN LÔ" icon="check-circle" tone="green" onPress={accept} />
          <Button label="TỪ CHỐI LÔ & LẬP NCR" icon="cancel" tone="red" variant="outline" onPress={reject} />
        </>
      ) : pending ? (
        <Text style={ui.sub}>Chỉ nhân viên QC mới được thực hiện kiểm tra đầu vào.</Text>
      ) : null}
    </Screen>
  );
}
