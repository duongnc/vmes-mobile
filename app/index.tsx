import { useRouter } from 'expo-router'; // Import công cụ điều hướng
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter(); // Khởi tạo router
  
  const handleLogin = () => {
    // Gọi lệnh chuyển trang
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hệ thống vMES</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Mã nhân viên (VD: VTX1234)" 
        autoCapitalize="characters"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Mã PIN" 
        secureTextEntry={true} 
        keyboardType="numeric"
      />
      
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>ĐĂNG NHẬP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f8f9fa' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: '#0056b3' },
  input: { 
    backgroundColor: 'white', padding: 16, borderRadius: 8, 
    marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: '#ccc' 
  },
  button: { backgroundColor: '#0056b3', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});