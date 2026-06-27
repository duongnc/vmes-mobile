import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();

  // Đang tải trạng thái quyền
  if (!permission) {
    return <View style={styles.container} />;
  }

  // Nếu chưa được cấp quyền, hiển thị nút xin quyền
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Chúng tôi cần quyền truy cập Camera để quét mã linh kiện</Text>
        <Button onPress={requestPermission} title="Cấp quyền Camera" color="#0056b3" />
      </View>
    );
  }

  // Hàm xử lý khi quét được mã QR
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    alert(`Đã quét mã linh kiện: ${data}`);
    
    // Tự động quay lại màn hình trước đó sau 1.5 giây
    setTimeout(() => {
      // Dùng router.replace để quay về tab index và truyền param
      router.replace({ 
        pathname: '/(tabs)', 
        params: { scannedCode: data }
      });
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // Chỉ quét mã QR
        }}
      />
      {/* Nút hỗ trợ quét lại nếu bị lỗi thao tác */}
      {scanned && <Button title="Quét lại mã" onPress={() => setScanned(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'black' },
  text: { textAlign: 'center', marginBottom: 20, color: 'white', fontSize: 16 },
});