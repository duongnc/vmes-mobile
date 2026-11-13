import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Empty, Icon, Screen, SectionTitle, styles as ui, useNow } from '@/components/ui';
import { WoCard } from '@/components/wo-card';
import { C } from '@/constants/theme';
import { isWoDone } from '@/lib/metrics';
import { useMesStore } from '@/store/useMesStore';

// Quản lý điều phối thứ tự ưu tiên các lệnh sản xuất
export default function WorkOrdersScreen() {
  const now = useNow(1000);
  const workOrders = useMesStore((s) => s.workOrders);
  const movePriority = useMesStore((s) => s.movePriority);

  const { active, done } = useMemo(() => {
    const sorted = [...workOrders].sort((a, b) => a.priority - b.priority);
    return { active: sorted.filter((w) => !isWoDone(w)), done: sorted.filter((w) => isWoDone(w)) };
  }, [workOrders]);

  return (
    <Screen>
      <Text style={ui.sub}>Dùng mũi tên để thay đổi thứ tự ưu tiên. Kỹ thuật viên sẽ nhận thông báo khi thứ tự thay đổi.</Text>
      <SectionTitle>Đang sản xuất ({active.length})</SectionTitle>
      {active.length === 0 ? <Empty text="Không có lệnh đang chạy." /> : null}
      {active.map((wo, i) => (
        <View key={wo.id} style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontWeight: '800', color: C.primary, fontSize: 16, flex: 1 }}>Ưu tiên #{i + 1}</Text>
            <ArrowButton icon="arrow-upward" label={`Tăng ưu tiên ${wo.id}`} disabled={i === 0} onPress={() => movePriority(wo.id, 'up')} />
            <ArrowButton
              icon="arrow-downward"
              label={`Giảm ưu tiên ${wo.id}`}
              disabled={i === active.length - 1}
              onPress={() => movePriority(wo.id, 'down')}
            />
          </View>
          <WoCard wo={wo} now={now} />
        </View>
      ))}
      {done.length > 0 ? <SectionTitle>Đã hoàn thành ({done.length})</SectionTitle> : null}
      {done.map((wo) => (
        <WoCard key={wo.id} wo={wo} now={now} />
      ))}
    </Screen>
  );
}

function ArrowButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'arrow-upward' | 'arrow-downward';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.3 : 1,
        backgroundColor: C.white,
      }}>
      <Icon name={icon} size={22} color={C.primary} />
    </Pressable>
  );
}
