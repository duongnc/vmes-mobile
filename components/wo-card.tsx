import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Badge, Card, Icon, ProgressBar, Row, styles as ui } from '@/components/ui';
import { C, HEALTH_TONE } from '@/constants/theme';
import { formatDate, formatDuration } from '@/lib/format';
import { currentStep, stepElapsedSec, woHealth, woProgress } from '@/lib/metrics';
import type { WorkOrder } from '@/store/types';
import { findUser } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

export function WoCard({ wo, now }: { wo: WorkOrder; now: number }) {
  const router = useRouter();
  const ncrs = useMesStore((s) => s.ncrs);
  const requests = useMesStore((s) => s.partRequests);
  const health = woHealth(wo, ncrs, requests, now);
  const tone = HEALTH_TONE[health.color];
  const step = currentStep(wo);
  const doneCount = wo.steps.filter((s) => s.status === 'done').length;

  return (
    <Card tone={tone} onPress={() => router.push(`/work-order/${wo.id}`)}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row>
          <Text style={ui.title}>{wo.id}</Text>
          <Badge label={health.label} tone={tone} />
        </Row>
        <Icon name="chevron-right" size={24} />
      </Row>
      <Text style={[ui.text, { marginTop: 4 }]}>{wo.product}</Text>
      <Text style={[ui.sub, { marginTop: 2 }]}>
        SL {wo.qty} · Hạn {formatDate(wo.dueDate)} · {findUser(wo.assigneeId)?.name ?? '—'}
      </Text>

      <View style={{ marginTop: 10, gap: 6 }}>
        <ProgressBar value={woProgress(wo)} tone={tone === 'gray' ? 'green' : tone} />
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={ui.sub}>
            {step ? `Bước ${step.no}/${wo.steps.length}: ${step.name}` : `Xong ${doneCount}/${wo.steps.length} công đoạn`}
          </Text>
          {step && step.status !== 'pending' ? (
            <Row style={{ gap: 4 }}>
              <Icon name={step.status === 'running' ? 'timer' : 'pause-circle-outline'} size={16} color={C.sub} />
              <Text style={[ui.sub, { fontVariant: ['tabular-nums'] }]}>
                {formatDuration(stepElapsedSec(step, now))} / {step.standardMin}′
              </Text>
            </Row>
          ) : null}
        </Row>
      </View>

      {health.reasons.length > 0 ? (
        <View style={{ marginTop: 8, gap: 2 }}>
          {health.reasons.map((r) => (
            <Row key={r} style={{ gap: 6 }}>
              <Icon name="error-outline" size={16} color={health.color === 'red' ? C.red : C.yellow} />
              <Text style={{ fontSize: 13, color: C.text, flex: 1 }}>{r}</Text>
            </Row>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
