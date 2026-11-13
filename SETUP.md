# vMES Setup & Installation Guide

## Yêu Cầu Hệ Thống

### Môi Trường Phát Triển

- **Operating System:** macOS 10.14+, Windows 10+, Linux (Ubuntu 18.04+)
- **Node.js:** v16.0.0 hoặc cao hơn
- **npm:** v7.0.0 hoặc cao hơn (hoặc yarn v1.22.0+)
- **Expo CLI:** Latest version

### Thiết Bị Mobile

- **iOS:** iPhone/iPad iOS 13.0+
- **Android:** Android 8.0+ (API level 26+)
- **Emulator:** 
  - iOS: Xcode Simulator (macOS only)
  - Android: Android Studio Emulator

## Cài Đặt Ban Đầu

### 1. Cài Đặt Node.js và npm

#### Trên macOS

```bash
# Sử dụng Homebrew
brew install node

# Kiểm tra phiên bản
node --version
npm --version
```

#### Trên Windows

- Download từ https://nodejs.org
- Chạy installer và follow hướng dẫn
- Kiểm tra: `node --version` & `npm --version`

#### Trên Linux (Ubuntu)

```bash
sudo apt update
sudo apt install nodejs npm

# Hoặc sử dụng nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

### 2. Cài Đặt Expo CLI

```bash
# Cài đặt toàn cục
npm install -g expo-cli

# Hoặc cài đặt với yarn
yarn global add expo-cli

# Kiểm tra cài đặt
expo --version
```

### 3. Clone Repository

```bash
# Clone từ GitHub
git clone https://github.com/duongnc/vmes-mobile.git
cd vmes-mobile

# Hoặc nếu bạn đã có local repo
cd /Users/duong/MobileApps/vmes-mobile
```

### 4. Cài Đặt Dependencies

```bash
# Sử dụng npm
npm install

# Hoặc sử dụng yarn (recommended)
yarn install

# Nếu bạn gặp vấn đề, thử xóa node_modules
rm -rf node_modules package-lock.json
npm install
```

### 5. Cấu Hình Environment

Tạo file `.env` tại root directory (không commit lên git):

```bash
# .env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_ENV=development
REACT_APP_DEBUG=true
```

Thêm vào `.gitignore`:

```
.env
.env.local
.env.*.local
```

## Chạy Ứng Dụng

### Phương Pháp 1: Sử Dụng Expo CLI (Recommended)

```bash
# Khởi động Expo server
npx expo start

# Tùy chọn khác
npx expo start --clear          # Clear cache
npx expo start --tunnel         # Sử dụng tunnel (network)
npx expo start --localhost      # Localhost only
```

Sau khi chạy, bạn sẽ thấy:

```
Expo CLI 6.0.0 starting...

› Metro waiting on exp://192.168.1.100:19000

› Scan this QR code:

  ┌────────────────────────────┐
  │  [QR CODE HERE]            │
  └────────────────────────────┘

Press:
  a - open Android
  i - open iOS simulator
  w - open web
  r - reload app
  m - toggle menu
  o - open project in Expo Go
```

### Phương Pháp 2: Mở iOS Simulator (macOS only)

```bash
npx expo start -c
# Nhấn 'i'
```

### Phương Pháp 3: Mở Android Emulator

#### Yêu Cầu Setup Android

```bash
# Cài đặt Android Studio từ https://developer.android.com/studio

# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Hoặc thêm vào ~/.zshrc hoặc ~/.bash_profile
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
```

#### Chạy Emulator

```bash
# Liệt kê các emulator khả dụng
emulator -list-avds

# Khởi động emulator
emulator -avd Pixel_6_API_30

# Sau đó start Expo
npx expo start -c
# Nhấn 'a'
```

### Phương Pháp 4: Sử Dụng Expo Go (Mobile Phone)

1. Download **Expo Go** từ:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id1293062562)
   - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Chạy Expo server:
   ```bash
   npx expo start
   ```

3. Quét QR code bằng camera hoặc Expo Go app

4. App sẽ load trong vài giây

## Phát Triển

### File Structure

```
app/
├── _layout.tsx          # Root Stack + bảo vệ route theo trạng thái đăng nhập
├── login.tsx            # Đăng nhập (mã nhân viên + PIN)
├── (tabs)/              # Tab chính, thay đổi theo vai trò
│   ├── index.tsx        # Lệnh SX (KTV) / Kiểm tra (QC) / Dashboard (Quản lý)
│   ├── work-orders.tsx  # Điều phối ưu tiên (chỉ Quản lý)
│   ├── ncr.tsx          # Danh sách NCR
│   ├── notifications.tsx
│   └── profile.tsx      # Tài khoản, offline & hàng đợi đồng bộ
├── work-order/[id].tsx  # Chi tiết lệnh, đếm giờ công đoạn, BOM
├── scanner.tsx          # Quét QR + đối soát BOM
├── camera.tsx           # Chụp ảnh + khoanh vùng lỗi
├── ncr/new.tsx, ncr/[id].tsx
├── iqc/[id].tsx, pqc/[woId].tsx
└── trace.tsx            # Truy xuất nguồn gốc

components/              # UI kit (ui.tsx) và component dùng chung
lib/                     # Logic thuần: scan.ts, metrics.ts, format.ts, photos.ts
store/                   # Zustand: useAuthStore, useMesStore, seed, types
services/api.ts          # Điểm tích hợp backend (hiện mô phỏng)
__tests__/               # Unit test (Jest)
```

### Tài Khoản Demo

| Mã nhân viên | PIN | Vai trò |
|---|---|---|
| VTX1001 | 1234 | Kỹ thuật viên (Nguyễn Văn A) |
| VTX1002 | 1234 | Kỹ thuật viên (Lê Văn C) |
| VTX2001 | 1234 | Nhân viên QC (Trần Thị B) |
| VTX3001 | 1234 | Quản lý sản xuất (Phạm Văn D) |

Dữ liệu demo nằm ở `store/seed.ts`. Vào **Tài khoản → Khôi phục dữ liệu demo** để đưa dữ liệu về trạng thái ban đầu.

### Định Dạng Mã QR Linh Kiện

```
MPN|SỐ_LÔ|DATECODE|HẠN_SỬ_DỤNG(YYYY-MM-DD)|SỐ_COC
VD: STM32F407|L2401B|2401|2028-10-13|COC-0092
```

Màn hình quét có ô nhập thủ công và danh sách **mã demo** (sinh từ hồ sơ lô IQC) để thử khi không có nhãn QR thật.

### Tạo Màn Hình Mới (Page)

Tạo file trong `app/` (Expo Router tự sinh route) và khai báo trong `app/_layout.tsx`:

```typescript
// app/new-screen.tsx
import { Text } from 'react-native';
import { Card, Screen, styles as ui } from '@/components/ui';

export default function NewScreen() {
  return (
    <Screen>
      <Card>
        <Text style={ui.title}>Màn hình mới</Text>
      </Card>
    </Screen>
  );
}
```

### Sử Dụng Zustand Store

```typescript
import { useMesStore } from '@/store/useMesStore';

// Chọn đúng phần state cần dùng; KHÔNG trả về mảng/object mới trong selector
const workOrders = useMesStore((s) => s.workOrders);
const startStep = useMesStore((s) => s.startStep);
```

Mọi action làm thay đổi dữ liệu đều tự ghi nhật ký truy xuất và đưa vào hàng đợi đồng bộ.

## Kiểm Thử

### Unit Tests (Jest)

```bash
# Chạy tất cả tests
npm test

# Kiểm tra kiểu và lint
npm run typecheck
npm run lint
```

Test nằm trong `__tests__/` và kiểm tra logic thuần ở `lib/` (đối soát mã quét, màu trạng thái, bottleneck, OEE).

### E2E Tests (Detox)

```bash
# Build detox configuration
detox build-framework-cache
detox build-app --configuration ios.sim.debug

# Chạy E2E tests
detox test --configuration ios.sim.debug --cleanup
```

## Debugging

### Remote Debugger (React Native Debugger)

```bash
# Cài đặt React Native Debugger
brew install react-native-debugger

# Hoặc download từ:
# https://github.com/jhen0409/react-native-debugger

# Mở app
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

### Console Logging

```typescript
// Tắt __DEV__ logs trong production
if (__DEV__) {
  console.log('Debug info');
}
```

### Network Debugging

```bash
# Sử dụng Charles Proxy hoặc Wireshark
# Cấu hình proxy trong app:
const API_URL = __DEV__ 
  ? 'http://192.168.1.100:3000'
  : 'https://api.production.com';
```

### Xem Logs

```bash
# Expo logs realtime
npx expo start --clear

# Android logs
adb logcat

# iOS logs
xcrun simctl spawn booted log stream --predicate 'eventMessage contains[c] "vmes"'
```

## Build & Deployment

### Local Build

#### iOS

```bash
# Yêu cầu: Xcode & Apple Developer Account

# Build .ipa file
eas build --platform ios --local

# Hoặc sử dụng Xcode directly
xcodebuild -workspace ios/vmesMobile.xcworkspace \
  -scheme vmesMobile \
  -configuration Release \
  -derivedDataPath build \
  -archivePath build/vmesMobile.xcarchive \
  archive
```

#### Android

```bash
# Yêu cầu: Android SDK, Keystore

# Build APK
eas build --platform android --local

# Hoặc sử dụng Gradle
cd android
./gradlew assembleRelease
cd ..
```

### Cloud Build (EAS)

```bash
# Login vào EAS
eas login

# Build trên cloud
eas build --platform ios
eas build --platform android

# Build & submit to app store
eas build --platform ios --auto-submit
eas submit --platform ios
```

### Over-the-Air (OTA) Updates

```bash
# Publish update
eas update

# Hoặc update specific channel
eas update --branch production
```

## Troubleshooting

### Issue: Port 8081 Already in Use

```bash
# Tìm process dùng port 8081
lsof -i :8081

# Kill process
kill -9 <PID>

# Hoặc sử dụng port khác
npx expo start --port 8082
```

### Issue: Module Not Found

```bash
# Xóa cache & reinstall
rm -rf node_modules yarn.lock
yarn install

# Hoặc
npm cache clean --force
npm install
```

### Issue: Camera Permission Denied (Android)

```typescript
// Request permissions
import * as Permissions from 'expo-permissions';

const requestCameraPermission = async () => {
  const { status } = await Permissions.askAsync(Permissions.CAMERA);
  return status === 'granted';
};
```

### Issue: Storage Permission (Android)

```typescript
import * as MediaLibrary from 'expo-media-library';

const requestMediaPermission = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  return status === 'granted';
};
```

### Issue: Build Fails

```bash
# Xem detailed error
npx expo start --verbose

# Clear all caches
expo prebuild --clean
rm -rf node_modules package-lock.json
npm install
```

## Performance Optimization

### Memory Management

```typescript
// Cleanup trong useEffect
useEffect(() => {
  // Setup
  return () => {
    // Cleanup to prevent memory leaks
  };
}, []);
```

### Image Optimization

```typescript
import { Image } from 'react-native';

<Image
  source={require('./image.png')}
  style={{ width: 200, height: 200 }}
  resizeMode="contain"
/>
```

### List Optimization

```typescript
import { FlatList } from 'react-native';

<FlatList
  data={items}
  renderItem={({ item }) => <Item item={item} />}
  keyExtractor={(item) => item.id}
  removeClippedSubviews
  maxToRenderPerBatch={10}
/>
```

## Version Management

### Update Dependencies

```bash
# Kiểm tra outdated packages
npm outdated

# Update minor/patch versions
npm update

# Update major versions (careful!)
npm install package@latest

# Expo SDK update
expo upgrade
```

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction)

## Support & Contact

For issues or questions:
- **GitHub Issues:** https://github.com/duongnc/vmes-mobile/issues
- **Documentation:** See README.md and ARCHITECTURE.md
- **Email:** [Support contact info]

## Quick Command Reference

```bash
# Development
npm install              # Install dependencies
npm start               # Start Expo server
npm test                # Run tests
npm run lint            # Run ESLint

# Building
eas build --platform ios
eas build --platform android

# Deployment
eas update              # OTA update
eas submit --platform ios

# Utilities
expo doctor             # Check environment
expo reset              # Reset project
expo logout             # Logout from Expo account
```
