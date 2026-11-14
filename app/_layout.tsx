import NetInfo from '@react-native-community/netinfo';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { C } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

export default function RootLayout() {
  const userId = useAuthStore((s) => s.userId);
  const authReady = useAuthStore((s) => s.hydrated);
  const dataReady = useMesStore((s) => s.hydrated);
  const loggedIn = !!userId;

  // Theo dõi kết nối mạng thật của thiết bị để tự động đồng bộ khi có mạng trở lại
  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      useMesStore.getState().setNetConnected(state.isConnected !== false);
    });
  }, []);

  // Giám sát công đoạn vượt thời gian định mức để đẩy cảnh báo
  useEffect(() => {
    if (!loggedIn || !dataReady) return;
    const check = () => useMesStore.getState().checkOvertime();
    check();
    const timer = setInterval(check, 10_000);
    return () => clearInterval(timer);
  }, [loggedIn, dataReady]);

  if (!authReady || !dataReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: C.white,
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: 'Quay lại',
          contentStyle: { backgroundColor: C.bg },
        }}>
        <Stack.Protected guard={!loggedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={loggedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="work-order/[id]" options={{ title: 'Lệnh sản xuất' }} />
          <Stack.Screen name="scanner" options={{ title: 'Quét linh kiện' }} />
          <Stack.Screen name="camera" options={{ title: 'Chụp ảnh biên bản' }} />
          <Stack.Screen name="ncr/new" options={{ title: 'Tạo NCR' }} />
          <Stack.Screen name="ncr/[id]" options={{ title: 'Chi tiết NCR' }} />
          <Stack.Screen name="iqc/[id]" options={{ title: 'Kiểm tra đầu vào (IQC)' }} />
          <Stack.Screen name="pqc/[woId]" options={{ title: 'Kiểm tra quá trình (PQC)' }} />
          <Stack.Screen name="trace" options={{ title: 'Truy xuất nguồn gốc' }} />
        </Stack.Protected>
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
