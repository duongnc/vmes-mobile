import { Href, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Empty, Icon, IconName, Row, Screen, styles as ui } from '@/components/ui';
import { C, Tone, TONE } from '@/constants/theme';
import { timeAgo } from '@/lib/format';
import type { NotiLevel } from '@/store/types';
import { useCurrentUser } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

const LEVEL: Record<NotiLevel, { tone: Tone; icon: IconName }> = {
  info: { tone: 'primary', icon: 'info' },
  warning: { tone: 'yellow', icon: 'warning' },
  danger: { tone: 'red', icon: 'error' },
  success: { tone: 'green', icon: 'check-circle' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const notifications = useMesStore((s) => s.notifications);
  const markRead = useMesStore((s) => s.markRead);
  const markAllRead = useMesStore((s) => s.markAllRead);

  const list = useMemo(
    () => (user ? notifications.filter((n) => n.roles.includes(user.role)) : []),
    [notifications, user],
  );
  const unread = list.filter((n) => user && !n.readBy.includes(user.id)).length;

  return (
    <Screen>
      {unread > 0 ? (
        <Button small variant="outline" icon="done-all" label={`Đánh dấu đã đọc tất cả (${unread})`} onPress={markAllRead} />
      ) : null}
      {list.length === 0 ? <Empty icon="notifications-none" text="Chưa có thông báo." /> : null}
      {list.map((n) => {
        const isUnread = !!user && !n.readBy.includes(user.id);
        const meta = LEVEL[n.level];
        return (
          <Card
            key={n.id}
            tone={isUnread ? meta.tone : undefined}
            style={{ opacity: isUnread ? 1 : 0.7 }}
            onPress={() => {
              markRead(n.id);
              if (n.href) router.push(n.href as Href);
            }}>
            <Row style={{ alignItems: 'flex-start' }}>
              <Icon name={meta.icon} size={24} color={TONE[meta.tone].fg} />
              <View style={{ flex: 1 }}>
                <Text style={[ui.title, { fontSize: 15, fontWeight: isUnread ? '800' : '600' }]}>{n.title}</Text>
                <Text style={[ui.text, { marginTop: 2 }]}>{n.body}</Text>
                <Text style={[ui.sub, { marginTop: 4, fontSize: 12 }]}>{timeAgo(n.createdAt)}</Text>
              </View>
              {isUnread ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.red, marginTop: 6 }} /> : null}
            </Row>
          </Card>
        );
      })}
    </Screen>
  );
}
