// Lưu ảnh chụp vào bộ nhớ ứng dụng để không bị hệ điều hành dọn khỏi thư mục cache.
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

export function persistPhoto(uri: string, id: string): string {
  // Trên web ảnh là data/blob URI, không có hệ thống tệp
  if (Platform.OS === 'web') return uri;
  try {
    const dir = new Directory(Paths.document, 'photos');
    if (!dir.exists) dir.create({ intermediates: true });
    const ext = uri.split('?')[0].split('.').pop()?.toLowerCase();
    const dest = new File(dir, `${id}.${ext && ext.length <= 4 ? ext : 'jpg'}`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    // Không sao chép được thì vẫn dùng tệp gốc
    return uri;
  }
}
