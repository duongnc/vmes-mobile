import { Switch, Text, View } from 'react-native';

import { TRACE_META } from '@/components/rows';
import { Badge, Banner, Button, Card, confirmUser, Empty, Icon, InfoLine, Row, Screen, SectionTitle, styles as ui } from '@/components/ui';
import { C } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';
import { ROLE_LABEL } from '@/store/seed';
import { useAuthStore, useCurrentUser } from '@/store/useAuthStore';
import { isOnline, useMesStore } from '@/store/useMesStore';

export default function ProfileScreen() {
  const user = useCurrentUser();
  const logout = useAuthStore((s) => s.logout);
  const online = useMesStore(isOnline);
  const netConnected = useMesStore((s) => s.netConnected);
  const forcedOffline = useMesStore((s) => s.forcedOffline);
  const setForcedOffline = useMesStore((s) => s.setForcedOffline);
  const syncing = useMesStore((s) => s.syncing);
  const queue = useMesStore((s) => s.syncQueue);
  const lastSyncAt = useMesStore((s) => s.lastSyncAt);
  const syncNow = useMesStore((s) => s.syncNow);
  const resetDemo = useMesStore((s) => s.resetDemo);

  const pending = queue.filter((i) => !i.syncedAt).length;
  if (!user) return null;

  return (
    <Screen>
      <Card>
        <Row>
          <Icon name="account-circle" size={52} color={C.primary} />
          <View style={{ flex: 1 }}>
            <Text style={ui.title}>{user.name}</Text>
            <Text style={ui.sub}>
              {user.code}
              {user.station ? ` · Trạm ${user.station}` : ''}
            </Text>
          </View>
          <Badge label={ROLE_LABEL[user.role]} tone="primary" />
        </Row>
      </Card>

      <SectionTitle>Kết nối & đồng bộ offline</SectionTitle>
      <Banner
        tone={online ? 'green' : 'yellow'}
        icon={online ? 'cloud-done' : 'cloud-off'}
        title={online ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
        text={
          online
            ? pending > 0
              ? `Đang đẩy ${pending} thay đổi lên máy chủ…`
              : 'Mọi thay đổi đã được đồng bộ.'
            : `${pending} thay đổi được lưu trên máy, sẽ tự đồng bộ khi có mạng.`
        }
      />
      <Card>
        <InfoLine label="Mạng thiết bị" value={netConnected ? 'Có kết nối' : 'Mất kết nối'} />
        <InfoLine label="Thay đổi chờ đồng bộ" value={pending} />
        <InfoLine label="Đồng bộ lần cuối" value={lastSyncAt ? formatDateTime(lastSyncAt) : 'Chưa có'} />
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={[ui.text, { flex: 1 }]}>Chế độ ngoại tuyến (giả lập mất mạng)</Text>
          <Switch
            accessibilityLabel="Chế độ ngoại tuyến"
            value={forcedOffline}
            onValueChange={setForcedOffline}
            trackColor={{ true: C.yellow, false: C.border }}
          />
        </Row>
        <Button
          small
          style={{ marginTop: 10 }}
          icon="sync"
          label={syncing ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
          disabled={!online || syncing || pending === 0}
          onPress={() => void syncNow()}
        />
      </Card>

      <SectionTitle>Hàng đợi đồng bộ</SectionTitle>
      <Card>
        {queue.length === 0 ? <Empty icon="cloud-queue" text="Chưa có thay đổi nào." /> : null}
        {queue.slice(0, 20).map((i) => (
          <Row key={i.id} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.graySoft, alignItems: 'flex-start' }}>
            <Icon name={i.syncedAt ? 'cloud-done' : 'schedule'} size={18} color={i.syncedAt ? C.green : C.yellow} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.text }} numberOfLines={2}>
                {i.summary}
              </Text>
              <Text style={{ fontSize: 12, color: C.sub }}>
                {TRACE_META[i.type].label} · {formatDateTime(i.createdAt)} · {i.syncedAt ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
              </Text>
            </View>
          </Row>
        ))}
      </Card>

      <SectionTitle>Hệ thống</SectionTitle>
      <Button
        label="Khôi phục dữ liệu demo"
        icon="restart-alt"
        variant="outline"
        tone="gray"
        onPress={() =>
          confirmUser('Khôi phục dữ liệu demo', 'Toàn bộ dữ liệu đã thao tác sẽ bị xoá và trở về trạng thái ban đầu.', resetDemo, 'Khôi phục')
        }
      />
      <Button label="ĐĂNG XUẤT" icon="logout" tone="red" onPress={logout} />
      <Text style={[ui.sub, { textAlign: 'center', fontSize: 12 }]}>vMES Mobile 1.0 · Dữ liệu lưu cục bộ trên thiết bị</Text>
    </Screen>
  );
}
