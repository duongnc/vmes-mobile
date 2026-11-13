// Ảnh kèm các vòng khoanh vùng lỗi. Toạ độ lưu dạng tương đối nên hiển thị đúng ở mọi kích thước.
import { Image } from 'expo-image';
import { useState } from 'react';
import { GestureResponderEvent, Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { C } from '@/constants/theme';
import type { PhotoMark } from '@/store/types';

export function MarkedPhoto({
  uri,
  marks,
  aspectRatio = 4 / 3,
  onAddMark,
  style,
}: {
  uri: string;
  marks: PhotoMark[];
  aspectRatio?: number;
  onAddMark?: (mark: PhotoMark) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const handlePress = (e: GestureResponderEvent) => {
    if (!onAddMark || size.w === 0) return;
    // Trên web sự kiện là MouseEvent của DOM (offsetX/offsetY), trên native là locationX/locationY
    const ev = e.nativeEvent as typeof e.nativeEvent & { offsetX?: number; offsetY?: number };
    const x = ev.locationX ?? ev.offsetX;
    const y = ev.locationY ?? ev.offsetY;
    if (typeof x !== 'number' || typeof y !== 'number') return;
    onAddMark({ x: x / size.w, y: y / size.h, r: 0.09 });
  };

  return (
    <View
      style={[{ width: '100%', aspectRatio, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' }, style]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      {onAddMark ? (
        <Pressable
          accessibilityLabel="Chạm vào ảnh để khoanh vùng lỗi"
          onPress={handlePress}
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
        />
      ) : null}
      {marks.map((m, i) => {
        const r = m.r * size.w;
        return (
          <View
            key={i}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              left: m.x * size.w - r,
              top: m.y * size.h - r,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              borderWidth: Math.max(2, size.w * 0.008),
              borderColor: C.red,
            }}
          />
        );
      })}
    </View>
  );
}
