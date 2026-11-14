import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { C } from '@/constants/theme';
import type { CheckItem, CheckResult } from '@/store/types';

// Danh sách hạng mục kiểm tra Đạt / Không đạt
export function Checklist({
  items,
  onChange,
  readOnly,
}: {
  items: CheckItem[];
  onChange?: (items: CheckItem[]) => void;
  readOnly?: boolean;
}) {
  const set = (index: number, result: CheckResult) =>
    onChange?.(items.map((it, i) => (i === index ? { ...it, result: it.result === result ? null : result } : it)));

  return (
    <View>
      {items.map((it, i) => (
        <View key={it.label} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.graySoft, gap: 8 }}>
          <Text style={{ fontSize: 15, color: C.text }}>
            {i + 1}. {it.label}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Toggle label="Đạt" icon="check" color={C.green} active={it.result === 'pass'} disabled={readOnly} onPress={() => set(i, 'pass')} />
            <Toggle label="Không đạt" icon="close" color={C.red} active={it.result === 'fail'} disabled={readOnly} onPress={() => set(i, 'fail')} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Toggle({
  label,
  icon,
  color,
  active,
  disabled,
  onPress,
}: {
  label: string;
  icon: 'check' | 'close';
  color: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: active ? color : C.border,
        backgroundColor: active ? color : C.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled && !active ? 0.4 : 1,
      }}>
      <Icon name={icon} size={18} color={active ? C.white : color} />
      <Text style={{ fontWeight: '700', color: active ? C.white : color }}>{label}</Text>
    </Pressable>
  );
}
