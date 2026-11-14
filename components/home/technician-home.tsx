import { useMemo } from 'react';
import { Text } from 'react-native';

import { Card, Empty, Icon, Row, Screen, SectionTitle, styles as ui, useNow } from '@/components/ui';
import { WoCard } from '@/components/wo-card';
import { C } from '@/constants/theme';
import { isWoDone } from '@/lib/metrics';
import { ROLE_LABEL } from '@/store/seed';
import type { User } from '@/store/types';
import { useMesStore } from '@/store/useMesStore';

export function TechnicianHome({ user }: { user: User }) {
  const now = useNow(1000);
  const workOrders = useMesStore((s) => s.workOrders);

  const { mine, others, done } = useMemo(() => {
    const sorted = [...workOrders].sort((a, b) => a.priority - b.priority);
    const active = sorted.filter((w) => !isWoDone(w));
    return {
      mine: active.filter((w) => w.assigneeId === user.id),
      others: active.filter((w) => w.assigneeId !== user.id),
      done: sorted.filter((w) => isWoDone(w)),
    };
  }, [workOrders, user.id]);

  return (
    <Screen>
      <Card>
        <Row>
          <Icon name="account-circle" size={40} color={C.primary} />
          <Text style={[ui.title, { flex: 1 }]}>
            {user.name}
            {'\n'}
            <Text style={ui.sub}>
              {ROLE_LABEL[user.role]}
              {user.station ? ` · Trạm ${user.station}` : ''}
            </Text>
          </Text>
        </Row>
      </Card>

      <SectionTitle>Lệnh được giao ({mine.length})</SectionTitle>
      {mine.length === 0 ? <Empty icon="assignment-turned-in" text="Không có lệnh nào đang chờ bạn." /> : null}
      {mine.map((wo) => (
        <WoCard key={wo.id} wo={wo} now={now} />
      ))}

      {others.length > 0 ? <SectionTitle>Lệnh khác trong xưởng</SectionTitle> : null}
      {others.map((wo) => (
        <WoCard key={wo.id} wo={wo} now={now} />
      ))}

      {done.length > 0 ? <SectionTitle>Đã hoàn thành</SectionTitle> : null}
      {done.map((wo) => (
        <WoCard key={wo.id} wo={wo} now={now} />
      ))}
    </Screen>
  );
}
