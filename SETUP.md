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
├── (tabs)/              # Tab navigation group
│   ├── _layout.tsx      # Tab layout
│   └── index.tsx        # Technician screen
├── _layout.tsx          # Root layout
├── scanner.tsx          # Scanner screen
└── index.tsx            # Home screen

components/             # Reusable components
store/                  # Zustand stores
constants/              # Constants & config
hooks/                  # Custom hooks
```

### Tạo Màn Hình Mới (Page)

```bash
# Tạo file screen mới
touch app/new-screen.tsx
```

File structure:
```typescript
// app/new-screen.tsx
import { View, Text } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function NewScreen() {
  return (
    <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText type="title">New Screen</ThemedText>
    </ThemedView>
  );
}
```

### Tạo Component Mới

```bash
# Tạo component mới
touch components/MyComponent.tsx
```

File structure:
```typescript
// components/MyComponent.tsx
import { View, Text, StyleSheet } from 'react-native';
import { ThemedText } from './ThemedText';

interface Props {
  title: string;
  onPress?: () => void;
}

export function MyComponent({ title, onPress }: Props) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
});
```

### Sử Dụng Zustand Store

```typescript
// store/useMyStore.ts
import { create } from 'zustand';

interface MyStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

Usage trong component:
```typescript
import { useMyStore } from '@/store/useMyStore';

export default function Counter() {
  const { count, increment, decrement } = useMyStore();
  
  return (
    <View>
      <Text>{count}</Text>
      <Button title="+" onPress={increment} />
      <Button title="-" onPress={decrement} />
    </View>
  );
}
```

### Custom Hooks

```typescript
// hooks/useCustom.ts
import { useState, useEffect } from 'react';

export function useCustom() {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Setup logic
    return () => {
      // Cleanup logic
    };
  }, []);
  
  return state;
}
```

## Testing

### Unit Tests (Jest)

```bash
# Chạy tất cả tests
npm test

# Chạy tests trong watch mode
npm test -- --watch

# Chạy test file cụ thể
npm test -- store/useBomStore.test.ts
```

File structure:
```typescript
// store/useBomStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useBomStore } from './useBomStore';

describe('useBomStore', () => {
  it('should add BOM item', () => {
    const { result } = renderHook(() => useBomStore());
    
    act(() => {
      result.current.addBomItem({ id: '1', mpn: 'TEST', qty: 1 });
    });
    
    expect(result.current.bom).toHaveLength(1);
  });
});
```

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
