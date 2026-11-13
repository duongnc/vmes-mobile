import { Tabs } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { C } from '@/constants/theme';
import { useCurrentUser } from '@/store/useAuthStore';
import { isOnline, useMesStore } from '@/store/useMesStore';

// Chỉ báo kết nối + số thay đổi đang chờ đồng bộ, hiển thị ở góc phải tiêu đề
function SyncIndicator() {
  const online = useMesStore(isOnline);
  const pending = useMesStore((s) => s.syncQueue.filter((i) => !i.syncedAt).length);
  return (
    <View
      accessibilityLabel={online ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 14 }}>
      <Icon name={online ? 'cloud-done' : 'cloud-off'} size={22} color={online ? '#B9F6CA' : '#FFD180'} />
      {pending > 0 ? <Text style={{ color: C.white, fontWeight: '700', fontSize: 13 }}>{pending}</Text> : null}
    </View>
  );
}

export default function TabLayout() {
  const user = useCurrentUser();
  const role = user?.role;
  const unread = useMesStore(
    (s) => s.notifications.filter((n) => !!user && n.roles.includes(user.role) && !n.readBy.includes(user.id)).length,
  );

  const homeTitle = role === 'manager' ? 'Dashboard' : role === 'qc' ? 'Kiểm tra' : 'Lệnh SX';
  const homeIcon = role === 'manager' ? 'dashboard' : role === 'qc' ? 'fact-check' : 'assignment';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.gray,
        headerStyle: { backgroundColor: C.primary },
        headerTintColor: C.white,
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => <SyncIndicator />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: homeTitle,
          headerTitle: role === 'manager' ? 'Dashboard sản xuất' : role === 'qc' ? 'Kiểm soát chất lượng' : 'Lệnh sản xuất của tôi',
          tabBarIcon: ({ color, size }) => <Icon name={homeIcon} size={size} color={color} />,
        }}
      />
      <Tabs.Protected guard={role === 'manager'}>
        <Tabs.Screen
          name="work-orders"
          options={{
            title: 'Điều phối',
            headerTitle: 'Điều phối lệnh sản xuất',
            tabBarIcon: ({ color, size }) => <Icon name="low-priority" size={size} color={color} />,
          }}
        />
      </Tabs.Protected>
      <Tabs.Screen
        name="ncr"
        options={{
          title: 'NCR',
          headerTitle: 'Báo cáo không phù hợp (NCR)',
          tabBarIcon: ({ color, size }) => <Icon name="report-problem" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarBadge: unread > 0 ? unread : undefined,
          tabBarIcon: ({ color, size }) => <Icon name="notifications" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Tài khoản',
          headerTitle: 'Tài khoản & đồng bộ',
          tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
