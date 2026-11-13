// Bộ component giao diện dùng chung của vMES
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { ComponentProps, ReactNode, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { C, TONE, Tone } from '@/constants/theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export function Icon({ name, size = 20, color = C.sub }: { name: IconName; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  if (!scroll) return <View style={styles.screen}>{children}</View>;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: Tone;
}) {
  const toneStyle = tone ? { borderLeftWidth: 5, borderLeftColor: TONE[tone].fg } : null;
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.card, toneStyle, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, toneStyle, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Badge({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.badge, { backgroundColor: TONE[tone].bg }]}>
      <Text style={[styles.badgeText, { color: TONE[tone].fg }]}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  tone = 'primary',
  variant = 'solid',
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  tone?: Tone;
  variant?: 'solid' | 'outline';
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const color = TONE[tone].fg;
  const solid = variant === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        solid ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color, backgroundColor: C.white },
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {icon ? <Icon name={icon} size={small ? 18 : 22} color={solid ? C.white : color} /> : null}
      <Text style={[styles.buttonText, small && { fontSize: 14 }, { color: solid ? C.white : color }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ value, tone = 'primary' }: { value: number; tone?: Tone }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: TONE[tone].fg }]} />
    </View>
  );
}

export function Field({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={C.gray}
        {...props}
        style={[styles.input, props.multiline && { minHeight: 90, textAlignVertical: 'top' }, props.style]}
      />
    </View>
  );
}

export function Chips<T extends string>({
  options,
  value,
  onChange,
  tones,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  tones?: Partial<Record<T, Tone>>;
}) {
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        const tone = TONE[tones?.[o.value] ?? 'primary'];
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.chip, active && { backgroundColor: tone.fg, borderColor: tone.fg }]}>
            <Text style={[styles.chipText, active && { color: C.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Empty({ icon = 'inbox', text }: { icon?: IconName; text: string }) {
  return (
    <View style={styles.empty}>
      <Icon name={icon} size={40} color={C.gray} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function InfoLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      {typeof value === 'string' || typeof value === 'number' ? <Text style={styles.infoValue}>{value}</Text> : value}
    </View>
  );
}

export function Banner({ tone, icon, title, text }: { tone: Tone; icon: IconName; title: string; text?: string }) {
  return (
    <View style={[styles.banner, { backgroundColor: TONE[tone].bg, borderColor: TONE[tone].fg }]}>
      <Icon name={icon} size={24} color={TONE[tone].fg} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bannerTitle, { color: TONE[tone].fg }]}>{title}</Text>
        {text ? <Text style={styles.bannerText}>{text}</Text> : null}
      </View>
    </View>
  );
}

// Đồng hồ nhịp 1 giây cho các màn hình có bộ đếm giờ
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// Alert hoạt động trên cả native lẫn web
export function notifyUser(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

export function confirmUser(title: string, message: string, onOk: () => void, okLabel = 'Đồng ý') {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onOk();
  } else {
    Alert.alert(title, message, [
      { text: 'Huỷ', style: 'cancel' },
      { text: okLabel, onPress: onOk },
    ]);
  }
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  screenContent: { padding: 14, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.sub, textTransform: 'uppercase', letterSpacing: 0.4 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  button: {
    minHeight: 54,
    borderRadius: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSmall: { minHeight: 40, paddingHorizontal: 12 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: C.graySoft, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.sub, marginBottom: 6 },
  input: {
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: C.text,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: C.text },
  empty: { alignItems: 'center', paddingVertical: 36, gap: 8 },
  emptyText: { color: C.gray, fontSize: 15, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 5 },
  infoLabel: { color: C.sub, fontSize: 14 },
  infoValue: { color: C.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  bannerText: { fontSize: 14, color: C.text, marginTop: 2 },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  sub: { fontSize: 14, color: C.sub },
  text: { fontSize: 15, color: C.text },
});
