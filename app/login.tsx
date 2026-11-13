import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, Field, Icon } from '@/components/ui';
import { C } from '@/constants/theme';
import { ROLE_LABEL, USERS } from '@/store/seed';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (!code.trim() || !pin.trim()) {
      setError('Vui lòng nhập mã nhân viên và mã PIN.');
      return;
    }
    const res = login(code, pin);
    // Đăng nhập thành công: Stack.Protected tự chuyển sang màn hình chính theo vai trò
    if (!res.ok) setError(res.message ?? 'Đăng nhập thất bại.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Icon name="precision-manufacturing" size={44} color={C.white} />
          </View>
          <Text style={styles.title}>Hệ thống vMES</Text>
          <Text style={styles.subtitle}>Điều hành sản xuất điện tử hàng không</Text>

          <Field
            label="Mã nhân viên"
            placeholder="VD: VTX1001"
            autoCapitalize="characters"
            autoCorrect={false}
            value={code}
            onChangeText={(t) => {
              setCode(t);
              setError('');
            }}
          />
          <Field
            label="Mã PIN"
            placeholder="••••"
            secureTextEntry
            keyboardType="number-pad"
            maxLength={6}
            value={pin}
            onChangeText={(t) => {
              setPin(t);
              setError('');
            }}
            onSubmitEditing={handleLogin}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="ĐĂNG NHẬP" icon="login" onPress={handleLogin} />

          <Text style={styles.demoTitle}>Tài khoản demo (chạm để điền nhanh)</Text>
          {USERS.map((u) => (
            <Pressable
              key={u.id}
              accessibilityRole="button"
              style={styles.demoRow}
              onPress={() => {
                setCode(u.code);
                setPin(u.pin);
                setError('');
              }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.demoName}>{u.name}</Text>
                <Text style={styles.demoCode}>
                  {u.code} · PIN {u.pin}
                </Text>
              </View>
              <Badge
                label={ROLE_LABEL[u.role]}
                tone={u.role === 'manager' ? 'purple' : u.role === 'qc' ? 'green' : 'primary'}
              />
            </Pressable>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { padding: 24, paddingTop: 48, maxWidth: 520, width: '100%', alignSelf: 'center' },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: C.primary, marginTop: 14 },
  subtitle: { fontSize: 14, textAlign: 'center', color: C.sub, marginBottom: 28, marginTop: 4 },
  error: { color: C.red, marginBottom: 12, fontWeight: '600' },
  demoTitle: { marginTop: 28, marginBottom: 8, color: C.sub, fontWeight: '700', fontSize: 13 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  demoName: { fontSize: 15, fontWeight: '700', color: C.text },
  demoCode: { fontSize: 13, color: C.sub, marginTop: 2 },
});
