import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { TRACE_META, TraceRow } from '@/components/rows';
import { Card, Chips, Empty, Field, Screen, SectionTitle, styles as ui } from '@/components/ui';
import { C } from '@/constants/theme';
import { formatDateTime } from '@/lib/format';
import type { TraceType } from '@/store/types';
import { useMesStore } from '@/store/useMesStore';

type Group = 'all' | 'scan' | 'step' | 'quality' | 'other';

const GROUPS: Record<Exclude<Group, 'all'>, TraceType[]> = {
  scan: ['scan-ok', 'scan-fail'],
  step: ['step', 'wo'],
  quality: ['ncr', 'iqc', 'pqc'],
  other: ['photo', 'request'],
};

// Truy xuất nguồn gốc: tra theo lệnh sản xuất, mã linh kiện, số lô hoặc NCR
export default function TraceScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const trace = useMesStore((s) => s.trace);
  const workOrders = useMesStore((s) => s.workOrders);
  const [q, setQ] = useState(params.q ?? '');
  const [group, setGroup] = useState<Group>('all');

  const query = q.trim().toUpperCase();

  const events = useMemo(() => {
    return trace.filter((e) => {
      if (group !== 'all' && !GROUPS[group].includes(e.type)) return false;
      if (!query) return true;
      return [e.woId, e.mpn, e.lot, e.ncrId, e.message, e.by].some((v) => v?.toUpperCase().includes(query));
    });
  }, [trace, query, group]);

  // Phả hệ linh kiện: lệnh nào dùng lô nào
  const genealogy = useMemo(() => {
    if (!query) return [];
    const rows: { woId: string; product: string; mpn: string; lot: string; coc: string; at: number; by: string }[] = [];
    for (const wo of workOrders) {
      for (const b of wo.bom) {
        for (const s of b.scans) {
          if ([wo.id, b.mpn, s.lot, s.coc].some((v) => v.toUpperCase().includes(query))) {
            rows.push({ woId: wo.id, product: wo.product, mpn: b.mpn, lot: s.lot, coc: s.coc, at: s.at, by: s.by });
          }
        }
      }
    }
    return rows;
  }, [workOrders, query]);

  return (
    <Screen>
      <Field
        label="Tra cứu theo lệnh SX / MPN / số lô / NCR"
        placeholder="VD: WO-2427, STM32F407, L2401B, NCR-0001"
        autoCapitalize="characters"
        autoCorrect={false}
        value={q}
        onChangeText={setQ}
      />
      <Chips<Group>
        value={group}
        onChange={setGroup}
        options={[
          { value: 'all', label: 'Tất cả' },
          { value: 'scan', label: 'Quét linh kiện' },
          { value: 'step', label: 'Công đoạn' },
          { value: 'quality', label: 'Chất lượng' },
          { value: 'other', label: 'Khác' },
        ]}
      />

      {genealogy.length > 0 ? (
        <>
          <SectionTitle>Linh kiện đã lắp vào sản phẩm</SectionTitle>
          <Card>
            {genealogy.map((g, i) => (
              <View key={i} style={{ paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.graySoft }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>
                  {g.mpn} · Lô {g.lot} → {g.woId}
                </Text>
                <Text style={{ fontSize: 12, color: C.sub }}>
                  {g.product} · {g.coc} · {g.by} · {formatDateTime(g.at)}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Nhật ký ({events.length})</SectionTitle>
      <Card>
        {events.length === 0 ? <Empty icon="history" text="Không có bản ghi phù hợp." /> : null}
        {events.slice(0, 100).map((e) => (
          <TraceRow key={e.id} ev={e} />
        ))}
        {events.length > 100 ? <Text style={[ui.sub, { marginTop: 8 }]}>Đang hiển thị 100 bản ghi mới nhất.</Text> : null}
      </Card>
      <Text style={[ui.sub, { fontSize: 12 }]}>
        Loại bản ghi: {Object.values(TRACE_META).map((m) => m.label).join(', ')}.
      </Text>
    </Screen>
  );
}
