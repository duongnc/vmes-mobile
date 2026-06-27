import { MOCK_BOM_WO2428, useBomStore } from '@/store/useBomStore'; // cú pháp @/store/... để import từ thư mục gốc (root) của dự án
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Lấy state và action từ Zustand
  const { currentWO, bomList, markAsScanned, resetAndSwitchWO } = useBomStore();

  // Xử lý mã QR từ màn hình scanner trả về
  useEffect(() => {
    if (params.scannedCode) {
      const code = params.scannedCode as string;
      const success = markAsScanned(code);
      
      if (success) {
        Alert.alert("Khớp BOM", `Đã xác nhận: ${code}`);
      } else {
        Alert.alert("Lỗi Đối Soát", `Mã ${code} không có trong BOM hoặc đã quét.`);
      }
      // Dọn param URL
      router.setParams({ scannedCode: '' });
    }
  }, [params.scannedCode]);

  const handleCompleteStep = () => {
    const isAllScanned = bomList.every(item => item.isScanned === true);
    
    if (!isAllScanned) {
      Alert.alert("Cảnh báo", "Bạn chưa đối soát hết linh kiện trong BOM!");
      Alert.alert("Quay lại bấm nút quét linh kiện để tiếp tục đối soát.");
      router.push('/scanner');
      return;
    }
    
    Alert.alert("Thành công", "Đã xác nhận hoàn thành công đoạn!");
  };

  const handleSwitchWO = () => {
    Alert.alert("Chuyển lệnh", "Bắt đầu sản xuất WO-2428", [
      {
        text: "OK",
        onPress: () => {
          // Dùng hàm Zustand để nạp dữ liệu mới, reset trạng thái tự động
          resetAndSwitchWO('WO-2428', MOCK_BOM_WO2428);
        }
      }
    ]);
  };

  // Kiểm tra xem lệnh hiện tại đã xong chưa để hiện nút chuyển lệnh
  const isOrderFinished = bomList.every(item => item.isScanned === true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.userName}>👤 Nguyễn Văn A - Công nhân</Text>
        <Text style={styles.woText}>📋 Lệnh SX: {currentWO} (Đang chạy)</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔧 Công đoạn hiện tại:</Text>
        <Text style={styles.taskName}>▶ Hàn sóng (Bước 3/8)</Text>
        
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Danh mục vật tư (BOM):</Text>
          {bomList.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ color: item.isScanned ? 'green' : 'black', fontSize: 16 }}>
                {item.isScanned ? '✅' : '⏳'} {item.mpn} ({item.name})
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#007bff', marginBottom: 10 }]} 
          onPress={() => router.push('/scanner')}
        >
          <Text style={styles.buttonText}>📷 QUÉT LINH KIỆN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleCompleteStep}>
          <Text style={styles.buttonText}>✅ HOÀN THÀNH BƯỚC</Text>
        </TouchableOpacity>

        {/* Nút chuyển lệnh chỉ hiện ra khi đã quét xong BOM */}
        {isOrderFinished && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#6f42c1', marginTop: 10 }]} 
            onPress={handleSwitchWO}
          >
            <Text style={styles.buttonText}>🔄 CHUYỂN LỆNH TIẾP THEO</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { marginTop: 16 }]}>
        <Text style={styles.cardTitle}>📊 Các lệnh chờ:</Text>
        {currentWO === 'WO-2427' && <Text style={styles.pendingItem}>• WO-2428 – Chờ linh kiện cấp bù</Text>}
        <Text style={styles.pendingItem}>• WO-2429 – Chờ QC FAI duyệt</Text>
      </View>
    </View>
  );
}

// ... (Giữ nguyên phần styles như cũ)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa', marginTop: 40 },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 10 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  woText: { fontSize: 16, color: '#666', marginTop: 4 },
  card: { backgroundColor: 'white', padding: 16, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTitle: { fontSize: 16, color: '#555', marginBottom: 8 },
  taskName: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111' },
  button: { backgroundColor: '#28a745', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  pendingItem: { fontSize: 16, color: '#333', marginBottom: 8, fontWeight: '500' }
});