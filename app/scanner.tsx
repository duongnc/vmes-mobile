import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner, Button, Empty, Field, Icon, Row, styles as ui } from '@/components/ui';
import { C } from '@/constants/theme';
import { currentStep } from '@/lib/metrics';
import { buildCode, ScanResult } from '@/lib/scan';
import { useMesStore } from '@/store/useMesStore';

export default function ScannerScreen() {
  const { woId } = useLocalSearchParams<{ woId: string }>();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const wo = useMesStore((s) => s.workOrders.find((w) => w.id === woId));
  const lots = useMesStore((s) => s.iqcLots);
  const scan = useMesStore((s) => s.scan);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [manual, setManual] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const lastScan = useRef({ code: '', at: 0 });

  // Mã mẫu để thử khi không có nhãn QR thật: sinh từ hồ sơ lô của các linh kiện trong BOM
  const demoCodes = useMemo(() => {
    if (!wo) return [];
    const mpns = new Set(wo.bom.map((b) => b.mpn));
    const fromLots = lots
      .filter((l) => mpns.has(l.mpn))
      .map((l) => ({ label: `${l.mpn} · lô ${l.lot}`, code: buildCode(l) }));
    const first = lots.find((l) => mpns.has(l.mpn) && l.status === 'accepted');
    return [
      ...fromLots,
      ...(first ? [{ label: `${first.mpn} · sai COC`, code: buildCode({ ...first, coc: 'COC-9999' }) }] : []),
      { label: 'LM358 · ngoài BOM', code: 'LM358|L9999Z|2401|2030-01-01|COC-0000' },
    ];
  }, [wo, lots]);

  if (!wo) {
    return <Empty icon="search-off" text="Không tìm thấy lệnh sản xuất." />;
  }

  const step = currentStep(wo);
  const stepBom = wo.bom.filter((b) => !step || b.stepNo === step.no);
  const allDone = stepBom.length > 0 && stepBom.every((b) => b.scans.length >= b.qtyRequired);

  const handleCode = (raw: string) => {
    const res = scan(wo.id, raw);
    setResult(res);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(
        res.ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
      );
    }
  };

  const onBarcode = ({ data }: { data: string }) => {
    // Chống đọc lặp cùng một mã liên tục
    const now = Date.now();
    if (lastScan.current.code === data && now - lastScan.current.at < 3000) return;
    lastScan.current = { code: data, at: now };
    handleCode(data);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={styles.cameraBox}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={result ? undefined : onBarcode}
              barcodeScannerSettings={{ barcodeTypes: ['qr', 'datamatrix', 'code128'] }}
            />
            <View style={styles.frame} />
            <Text style={styles.hint}>{result ? 'Đã tạm dừng quét' : 'Đưa mã QR trên nhãn linh kiện vào khung'}</Text>
          </>
        ) : (
          <View style={styles.permission}>
            <Icon name="no-photography" size={36} color={C.white} />
            <Text style={{ color: C.white, textAlign: 'center' }}>
              Cần quyền camera để quét mã linh kiện. Bạn vẫn có thể nhập mã thủ công bên dưới.
            </Text>
            {permission && permission.canAskAgain ? (
              <Button small label="Cấp quyền camera" icon="photo-camera" onPress={() => void requestPermission()} />
            ) : null}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {result ? (
          <>
            <Banner
              tone={result.ok ? 'green' : 'red'}
              icon={result.ok ? 'check-circle' : 'cancel'}
              title={result.ok ? 'KHỚP BOM' : 'LỖI ĐỐI SOÁT'}
              text={result.message}
            />
            <Row>
              <Button small style={{ flex: 1 }} label="Quét tiếp" icon="qr-code-scanner" onPress={() => setResult(null)} />
              {!result.ok ? (
                <Button
                  small
                  style={{ flex: 1 }}
                  tone="red"
                  variant="outline"
                  icon="report-problem"
                  label="Tạo NCR"
                  onPress={() =>
                    router.push({
                      pathname: '/ncr/new',
                      params: { woId: wo.id, mpn: result.parsed.mpn, desc: result.message, category: 'Linh kiện' },
                    })
                  }
                />
              ) : null}
            </Row>
          </>
        ) : null}

        <View style={ui.card}>
          <Text style={[ui.title, { marginBottom: 6 }]}>
            {wo.id}
            {step ? ` · Bước ${step.no}: ${step.name}` : ''}
          </Text>
          {stepBom.length === 0 ? <Text style={ui.sub}>Công đoạn này không yêu cầu linh kiện.</Text> : null}
          {stepBom.map((b) => {
            const full = b.scans.length >= b.qtyRequired;
            return (
              <Row key={b.id} style={{ paddingVertical: 5 }}>
                <Icon name={full ? 'check-circle' : 'radio-button-unchecked'} size={20} color={full ? C.green : C.gray} />
                <Text style={[ui.text, { flex: 1 }]}>
                  {b.mpn} <Text style={ui.sub}>({b.name})</Text>
                </Text>
                <Text style={{ fontWeight: '800', color: full ? C.green : C.text }}>
                  {b.scans.length}/{b.qtyRequired}
                </Text>
              </Row>
            );
          })}
          {allDone ? (
            <Button style={{ marginTop: 10 }} tone="green" icon="done-all" label="ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN" onPress={() => router.back()} />
          ) : null}
        </View>

        <View style={ui.card}>
          <Field
            label="Nhập mã thủ công (MPN|LÔ|DATECODE|HSD|COC)"
            placeholder="VD: ADUM4160|L2345A|2345|2028-03-28|COC-0091"
            autoCapitalize="characters"
            autoCorrect={false}
            value={manual}
            onChangeText={setManual}
          />
          <Button
            small
            label="Đối soát mã đã nhập"
            icon="keyboard"
            disabled={!manual.trim()}
            onPress={() => {
              handleCode(manual);
              setManual('');
            }}
          />
          <Button
            small
            style={{ marginTop: 8 }}
            variant="outline"
            tone="gray"
            icon={showDemo ? 'expand-less' : 'science'}
            label={showDemo ? 'Ẩn mã demo' : 'Dùng mã demo (không cần nhãn QR)'}
            onPress={() => setShowDemo((v) => !v)}
          />
          {showDemo
            ? demoCodes.map((d) => (
                <Pressable key={d.label} accessibilityRole="button" onPress={() => handleCode(d.code)} style={styles.demoRow}>
                  <Text style={{ fontWeight: '700', color: C.text }}>{d.label}</Text>
                  <Text style={{ fontSize: 12, color: C.sub }}>{d.code}</Text>
                </Pressable>
              ))
            : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraBox: { height: 260, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  frame: { pointerEvents: 'none', width: 190, height: 190, borderWidth: 3, borderColor: C.white, borderRadius: 16 },
  hint: { position: 'absolute', bottom: 8, color: C.white, fontSize: 13, fontWeight: '600' },
  permission: { padding: 24, gap: 12, alignItems: 'center' },
  demoRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.graySoft },
});
