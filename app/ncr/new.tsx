import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MarkedPhoto } from '@/components/marked-photo';
import { Banner, Button, Card, Chips, Field, Icon, notifyUser, Screen, styles as ui } from '@/components/ui';
import { C } from '@/constants/theme';
import { currentStep, isWoDone } from '@/lib/metrics';
import { NCR_CATEGORIES } from '@/store/seed';
import type { Severity } from '@/store/types';
import { useMesStore } from '@/store/useMesStore';

export default function NewNcrScreen() {
  const params = useLocalSearchParams<{ woId?: string; mpn?: string; lotId?: string; desc?: string; category?: string }>();
  const router = useRouter();
  const workOrders = useMesStore((s) => s.workOrders);
  const draftPhotos = useMesStore((s) => s.draftPhotos);
  const removeDraftPhoto = useMesStore((s) => s.removeDraftPhoto);
  const clearDraftPhotos = useMesStore((s) => s.clearDraftPhotos);
  const createNcr = useMesStore((s) => s.createNcr);

  const [woId, setWoId] = useState<string | undefined>(params.woId);
  const [severity, setSeverity] = useState<Severity>('minor');
  const [category, setCategory] = useState<string>(params.category ?? NCR_CATEGORIES[0]);
  const [description, setDescription] = useState(params.desc ?? '');
  const [mpn, setMpn] = useState(params.mpn ?? '');
  const [qty, setQty] = useState('1');

  const woOptions = workOrders.filter((w) => !isWoDone(w) || w.id === params.woId);

  const submit = () => {
    if (!description.trim()) return notifyUser('Thiếu thông tin', 'Hãy mô tả lỗi phát hiện.');
    const wo = workOrders.find((w) => w.id === woId);
    const id = createNcr({
      woId,
      stepNo: wo ? currentStep(wo)?.no : undefined,
      lotId: params.lotId,
      mpn: mpn.trim().toUpperCase() || undefined,
      severity,
      category,
      description: description.trim(),
      qtyDefect: Math.max(1, parseInt(qty, 10) || 1),
      photos: draftPhotos,
    });
    clearDraftPhotos();
    router.replace(`/ncr/${id}`);
  };

  return (
    <Screen>
      <Card>
        <Text style={ui.fieldLabel}>Mức độ lỗi</Text>
        <Chips<Severity>
          value={severity}
          onChange={setSeverity}
          tones={{ minor: 'yellow', major: 'red', critical: 'red' }}
          options={[
            { value: 'minor', label: 'Minor – nhẹ' },
            { value: 'major', label: 'Major – nặng' },
            { value: 'critical', label: 'Critical – nghiêm trọng' },
          ]}
        />
        {severity === 'critical' ? (
          <View style={{ marginTop: 10 }}>
            <Banner tone="red" icon="pan-tool" title="Lỗi nghiêm trọng" text="Lệnh sản xuất liên quan sẽ tự động bị giữ cho đến khi NCR được đóng." />
          </View>
        ) : null}
      </Card>

      <Card>
        <Text style={ui.fieldLabel}>Lệnh sản xuất liên quan</Text>
        <Chips
          value={woId ?? 'none'}
          onChange={(v) => setWoId(v === 'none' ? undefined : v)}
          options={[{ value: 'none', label: 'Không có' }, ...woOptions.map((w) => ({ value: w.id, label: w.id }))]}
        />
        <Text style={[ui.fieldLabel, { marginTop: 14 }]}>Nhóm lỗi</Text>
        <Chips value={category} onChange={setCategory} options={NCR_CATEGORIES.map((c) => ({ value: c, label: c }))} />
      </Card>

      <Card>
        <Field label="Mô tả lỗi *" placeholder="Mô tả hiện tượng, vị trí, điều kiện phát hiện…" multiline value={description} onChangeText={setDescription} />
        <Field label="Mã linh kiện liên quan (MPN)" placeholder="VD: STM32F407" autoCapitalize="characters" value={mpn} onChangeText={setMpn} />
        <Field label="Số lượng lỗi" keyboardType="number-pad" value={qty} onChangeText={setQty} />
      </Card>

      <Card>
        <Text style={ui.fieldLabel}>Ảnh đính kèm ({draftPhotos.length})</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: draftPhotos.length ? 10 : 0 }}>
          {draftPhotos.map((p) => (
            <View key={p.id} style={{ width: '47%' }}>
              <MarkedPhoto uri={p.uri} marks={p.marks} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xoá ảnh"
                onPress={() => removeDraftPhoto(p.id)}
                style={{ position: 'absolute', top: 6, right: 6, backgroundColor: C.red, borderRadius: 14, padding: 4 }}>
                <Icon name="close" size={18} color={C.white} />
              </Pressable>
            </View>
          ))}
        </View>
        <Button small variant="outline" icon="add-a-photo" label="Chụp ảnh lỗi" onPress={() => router.push({ pathname: '/camera', params: { target: 'draft' } })} />
      </Card>

      <Button label="GỬI NCR" icon="send" tone="red" onPress={submit} />
    </Screen>
  );
}
