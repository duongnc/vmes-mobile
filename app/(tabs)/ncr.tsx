import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { NcrRow } from '@/components/rows';
import { Button, Chips, Empty, Screen } from '@/components/ui';
import type { NcrStatus } from '@/store/types';
import { useMesStore } from '@/store/useMesStore';

type Filter = 'all' | NcrStatus;

export default function NcrListScreen() {
  const router = useRouter();
  const ncrs = useMesStore((s) => s.ncrs);
  const [filter, setFilter] = useState<Filter>('all');

  const list = useMemo(() => (filter === 'all' ? ncrs : ncrs.filter((n) => n.status === filter)), [ncrs, filter]);
  const count = (s: NcrStatus) => ncrs.filter((n) => n.status === s).length;

  return (
    <Screen>
      <Button label="TẠO NCR MỚI" icon="add-circle-outline" tone="red" onPress={() => router.push('/ncr/new')} />
      <Chips<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `Tất cả (${ncrs.length})` },
          { value: 'open', label: `Mới mở (${count('open')})` },
          { value: 'reviewing', label: `Đang xử lý (${count('reviewing')})` },
          { value: 'closed', label: `Đã đóng (${count('closed')})` },
        ]}
      />
      {list.length === 0 ? <Empty icon="verified" text="Không có NCR nào." /> : null}
      {list.map((n) => (
        <NcrRow key={n.id} ncr={n} />
      ))}
    </Screen>
  );
}
