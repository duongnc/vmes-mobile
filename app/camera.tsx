import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MarkedPhoto } from '@/components/marked-photo';
import { Button, Field, Icon, notifyUser, Row, styles as ui } from '@/components/ui';
import { C } from '@/constants/theme';
import { persistPhoto } from '@/lib/photos';
import type { PhotoMark } from '@/store/types';
import { useCurrentUser } from '@/store/useAuthStore';
import { uid, useMesStore } from '@/store/useMesStore';

interface Shot {
  uri: string;
  aspectRatio: number;
}

// target = mã lệnh sản xuất (lưu vào hồ sơ) hoặc "draft" (đính kèm NCR đang soạn)
export default function CameraScreen() {
  const { target } = useLocalSearchParams<{ target?: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const addWoPhoto = useMesStore((s) => s.addWoPhoto);
  const addDraftPhoto = useMesStore((s) => s.addDraftPhoto);

  const [shot, setShot] = useState<Shot | null>(null);
  const [marks, setMarks] = useState<PhotoMark[]>([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const takePicture = async () => {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (pic) setShot({ uri: pic.uri, aspectRatio: pic.width && pic.height ? pic.width / pic.height : 3 / 4 });
    } catch {
      notifyUser('Không chụp được ảnh', 'Hãy thử lại hoặc chọn ảnh từ thư viện.');
    } finally {
      setBusy(false);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (!res.canceled && res.assets[0]) {
      const a = res.assets[0];
      setShot({ uri: a.uri, aspectRatio: a.width && a.height ? a.width / a.height : 4 / 3 });
    }
  };

  const save = () => {
    if (!shot) return;
    const id = uid('P');
    const photo = {
      id,
      uri: persistPhoto(shot.uri, id),
      takenAt: Date.now(),
      by: user?.name ?? '',
      note: note.trim() || undefined,
      marks,
    };
    if (!target || target === 'draft') addDraftPhoto(photo);
    else addWoPhoto(target, photo);
    router.back();
  };

  // Bước 2: xem lại, khoanh vùng lỗi và lưu
  if (shot) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 14, gap: 12 }} keyboardShouldPersistTaps="handled">
        <Text style={ui.sub}>Chạm vào ảnh để khoanh vùng lỗi ({marks.length} vùng).</Text>
        <MarkedPhoto uri={shot.uri} marks={marks} aspectRatio={shot.aspectRatio} onAddMark={(m) => setMarks((prev) => [...prev, m])} />
        <Row>
          <Button small style={{ flex: 1 }} variant="outline" tone="gray" icon="undo" label="Bỏ vùng cuối" disabled={marks.length === 0} onPress={() => setMarks((p) => p.slice(0, -1))} />
          <Button
            small
            style={{ flex: 1 }}
            variant="outline"
            tone="gray"
            icon="replay"
            label="Chụp lại"
            onPress={() => {
              setShot(null);
              setMarks([]);
            }}
          />
        </Row>
        <Field label="Ghi chú ảnh (tuỳ chọn)" placeholder="VD: mối hàn J3 thiếu thiếc" value={note} onChangeText={setNote} />
        <Button label={!target || target === 'draft' ? 'ĐÍNH KÈM VÀO NCR' : `LƯU VÀO HỒ SƠ ${target}`} icon="save" tone="green" onPress={save} />
      </ScrollView>
    );
  }

  // Bước 1: chụp ảnh
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {permission?.granted ? (
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      ) : (
        <View style={styles.permission}>
          <Icon name="no-photography" size={40} color={C.white} />
          <Text style={{ color: C.white, textAlign: 'center' }}>Cần quyền camera để chụp ảnh biên bản. Bạn cũng có thể chọn ảnh có sẵn từ thư viện.</Text>
          {permission && permission.canAskAgain ? (
            <Button small label="Cấp quyền camera" icon="photo-camera" onPress={() => void requestPermission()} />
          ) : null}
        </View>
      )}
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Chọn ảnh từ thư viện" onPress={() => void pickImage()} style={styles.side}>
          <Icon name="photo-library" size={28} color={C.white} />
          <Text style={styles.sideText}>Thư viện</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Chụp ảnh"
          disabled={!permission?.granted || busy}
          onPress={() => void takePicture()}
          style={[styles.shutter, (!permission?.granted || busy) && { opacity: 0.4 }]}>
          <View style={styles.shutterInner} />
        </Pressable>
        <View style={styles.side} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 28 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 18, backgroundColor: '#000' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: C.white, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.white },
  side: { width: 80, alignItems: 'center' },
  sideText: { color: C.white, fontSize: 12, marginTop: 2 },
});
