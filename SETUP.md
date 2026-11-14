# vMES Setup & Installation Guide

## Yêu Cầu Hệ Thống

### Môi Trường Phát Triển

- **Hệ điều hành:** macOS, Windows hoặc Linux có hỗ trợ Node.js 20. iOS Simulator chỉ chạy trên macOS (cần Xcode).
- **Node.js:** 20.19.4 trở lên (yêu cầu của React Native 0.81).
- **npm:** đi kèm Node.js. Dự án dùng `package-lock.json`, nên dùng npm thay vì yarn.
- **Expo CLI:** không cần cài toàn cục. Dùng `npx expo` hoặc các script trong `package.json` (CLI đi kèm gói `expo`).

### Thiết Bị Mobile

- **iOS:** iOS 15.1 trở lên (yêu cầu của React Native 0.81).
- **Android:** Android 7.0 trở lên (API 24).
- **Expo Go:** phải là bản hỗ trợ **Expo SDK 54** (dự án dùng SDK 54).
- **Emulator:**
  - iOS: Xcode Simulator (chỉ macOS)
  - Android: Android Studio Emulator

> Simulator và Emulator thường không có camera thật. Ở màn hình quét hãy dùng nút **Dùng mã demo** (xem mục Định Dạng Mã QR).

## Cài Đặt Ban Đầu

### 1. Cài Đặt Node.js và npm

#### Trên macOS

```bash
# Sử dụng Homebrew
brew install node

# Kiểm tra phiên bản (cần Node 20.19.4 trở lên)
node --version
npm --version
```

#### Trên Windows

- Tải bản LTS từ https://nodejs.org
- Chạy trình cài đặt và làm theo hướng dẫn
- Kiểm tra: `node --version` và `npm --version`

#### Trên Linux

Gói `nodejs` trong kho mặc định của nhiều bản Ubuntu quá cũ. Nên dùng nvm (xem hướng dẫn cài tại https://github.com/nvm-sh/nvm), rồi:

```bash
nvm install --lts
nvm use --lts
node --version   # phải từ 20.19.4 trở lên
```

### 2. Clone Repository

```bash
git clone https://github.com/duongnc/vmes-mobile.git
cd vmes-mobile
```

### 3. Cài Đặt Dependencies

```bash
npm install
```

Nếu gặp lỗi lạ, thử cài lại từ đầu:

```bash
rm -rf node_modules
npm install
```

### 4. Cấu Hình Môi Trường

**Không cần tạo tệp `.env`.** Ứng dụng không đọc biến môi trường nào và chưa có địa chỉ API, vì chưa có backend. Dữ liệu ban đầu lấy từ `store/seed.ts`; việc "đẩy lên máy chủ" trong `services/api.ts` chỉ mô phỏng độ trễ mạng.

## Chạy Ứng Dụng

### Phương Pháp 1: Dùng Expo CLI (khuyến nghị)

```bash
npm start                       # tương đương npx expo start
```

Tùy chọn thường dùng:

```bash
npx expo start --clear          # Xóa cache Metro
npx expo start --tunnel         # Dùng tunnel khi điện thoại và máy tính khác mạng
npx expo start --localhost      # Chỉ truy cập từ máy này
npx expo start --port 8082      # Đổi cổng (mặc định 8081)
```

Metro mặc định chạy ở cổng **8081**. Sau khi khởi động, các phím tắt trong terminal:

| Phím | Tác dụng |
|---|---|
| `a` | Mở Android |
| `i` | Mở iOS Simulator |
| `w` | Mở bản web |
| `r` | Tải lại app |
| `j` | Mở debugger |
| `m` | Bật/tắt menu |
| `o` | Mở mã nguồn trong editor |
| `?` | Xem toàn bộ phím tắt |

Có sẵn các script rút gọn: `npm run ios`, `npm run android`, `npm run web`.

### Phương Pháp 2: iOS Simulator (chỉ macOS)

```bash
npm run ios
# hoặc: npm start rồi nhấn 'i'
```

Cần Xcode và đã cài iOS Simulator. Expo sẽ cài Expo Go vào Simulator nếu chưa có.

### Phương Pháp 3: Android Emulator

#### Yêu Cầu Setup Android

Cài Android Studio từ https://developer.android.com/studio rồi đặt biến môi trường:

```bash
# macOS
export ANDROID_HOME=$HOME/Library/Android/sdk
# Linux: export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Thêm các dòng trên vào `~/.zshrc` hoặc `~/.bashrc` để dùng lâu dài.

#### Chạy Emulator

```bash
# Liệt kê các emulator khả dụng
emulator -list-avds

# Khởi động emulator (thay <tên_avd> bằng tên trong danh sách)
emulator -avd <tên_avd>

# Sau đó chạy Expo
npm run android
# hoặc: npm start rồi nhấn 'a'
```

### Phương Pháp 4: Dùng Expo Go Trên Điện Thoại

1. Cài **Expo Go** (bản hỗ trợ SDK 54) từ:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id1293062562)
   - [Android Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Chạy Expo server:
   ```bash
   npm start
   ```

3. Quét mã QR bằng camera (iOS) hoặc bằng Expo Go (Android). Điện thoại và máy tính cần cùng mạng Wi-Fi, nếu không dùng `--tunnel`.

### Phương Pháp 5: Bản Web

```bash
npm run web
```

Build bản web tĩnh (đầu ra ở `dist/`, đã nằm trong `.gitignore`):

```bash
npx expo export --platform web
```

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
e2e/                     # Kịch bản E2E (Playwright) trên bản web
docs/                    # Báo cáo đồ án (docx)
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
VD: STM32F407|L2401B|2401|2028-10-14|COC-0092
```

Dấu phân tách có thể là `|` hoặc `;`. Màn hình quét có ô nhập thủ công và danh sách **mã demo** (sinh từ hồ sơ lô IQC) để thử khi không có nhãn QR thật. Nếu nhãn chỉ ghi mã linh kiện (không có số lô), ứng dụng cho chọn một lô đã qua IQC và còn hạn thay vì từ chối.

### Tạo Màn Hình Mới (Page)

Expo Router tự sinh route từ tệp trong `app/`. Để đặt tiêu đề, khai báo thêm `Stack.Screen` trong nhóm `Stack.Protected` của `app/_layout.tsx`:

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

Mọi action làm thay đổi dữ liệu đều tự ghi nhật ký truy xuất và đưa vào hàng đợi đồng bộ. Chi tiết mô hình dữ liệu ở [ARCHITECTURE.md](ARCHITECTURE.md).

## Kiểm Thử

### Kiểm Tra Tĩnh và Unit Test (Jest)

```bash
npm test             # Chạy unit test
npm run typecheck    # Kiểm tra kiểu TypeScript
npm run lint         # ESLint
```

Test nằm trong `__tests__/` và kiểm tra logic thuần ở `lib/` (đối soát mã quét, màu trạng thái, bottleneck, OEE).

### E2E Tests (Playwright, bản web)

Kịch bản E2E chạy trên bản web đã build, không dùng Detox. Playwright **chưa khai báo trong `package.json`**, cần cài riêng:

```bash
npm install --no-save playwright
npx playwright install chromium
```

Chạy (theo hướng dẫn ở đầu mỗi tệp trong `e2e/`):

```bash
npx expo export --platform web --output-dir dist
node e2e/serve.js dist &            # phục vụ bản build ở http://localhost:8099/

node e2e/flow-all-roles.js          # đi hết luồng của 3 vai trò
node e2e/regress-stuck.js           # hồi quy lỗi kỹ thuật viên bị kẹt
```

Đặt biến `BASE_URL` để đổi địa chỉ. Ảnh chụp màn hình được lưu vào `e2e/shots/` (đã nằm trong `.gitignore`). Các ca kiểm thử và kết quả chi tiết ở [test.md](test.md).

## Debugging

### Công Cụ Phát Triển

Khi `npm start` đang chạy, nhấn `j` để mở debugger, `m` để mở menu phát triển, `r` để tải lại app.

### Console Logging

```typescript
// Chỉ log khi phát triển
if (__DEV__) {
  console.log('Debug info');
}
```

### Network Debugging

Ứng dụng hiện không gọi mạng nào (chưa có backend). Khi nối máy chủ, địa chỉ API và logic gọi nằm ở `services/api.ts`.

### Xem Logs

```bash
# Log Metro: xem ngay trong terminal đang chạy npm start

# Android logs
adb logcat

# iOS Simulator logs
xcrun simctl spawn booted log stream --predicate 'eventMessage contains[c] "vmes"'
```

## Build & Deployment

> Dự án **chưa có cấu hình build bản cài đặt**: chưa có `eas.json`, `app.json` chưa khai báo `ios.bundleIdentifier` và `android.package`, và chưa cài `expo-updates`. Các bước dưới đây là việc cần làm khi muốn phát hành.

### Bản Web Tĩnh

```bash
npx expo export --platform web      # đầu ra ở dist/
```

### Build Native Cục Bộ

```bash
# Sinh thư mục ios/ và android/ (đã nằm trong .gitignore)
npx expo prebuild

# Build và chạy trên simulator/emulator
npx expo run:ios                    # cần Xcode
npx expo run:android                # cần Android SDK
```

### Build Bằng EAS

Trước hết thêm `ios.bundleIdentifier` và `android.package` vào `app.json`, rồi:

```bash
npx eas-cli login
npx eas-cli build:configure         # tạo eas.json
npx eas-cli build --platform ios
npx eas-cli build --platform android
```

### Over-the-Air (OTA) Updates

Cần cài `expo-updates` và cấu hình EAS Update trước; chưa được thiết lập trong dự án này. Xem [tài liệu EAS Update](https://docs.expo.dev/eas-update/introduction/).

## Troubleshooting

### Issue: Port 8081 Already in Use

```bash
# Tìm process dùng port 8081
lsof -i :8081

# Kill process
kill -9 <PID>

# Hoặc dùng port khác
npx expo start --port 8082
```

### Issue: Module Not Found

```bash
# Xóa cache và cài lại
rm -rf node_modules
npm install
npx expo start --clear
```

### Issue: Expo Cảnh Báo Phiên Bản Gói Không Tương Thích

Khi khởi động, Expo có thể báo "The following packages should be updated for best compatibility". Kiểm tra và sửa:

```bash
npx expo install --check            # liệt kê gói lệch phiên bản
npx expo install --fix              # đưa về phiên bản tương thích với SDK
```

### Issue: Camera Không Hoạt Động

- Ứng dụng xin quyền camera bằng `useCameraPermissions` của `expo-camera`. Nếu chưa cấp quyền, màn hình quét và chụp ảnh hiện nút **Cấp quyền camera** (khi hệ điều hành còn cho hỏi lại).
- Nếu đã từ chối hẳn, bật lại quyền camera cho Expo Go (hoặc app) trong phần Cài đặt của hệ điều hành.
- iOS Simulator không có camera thật: dùng **Dùng mã demo** để thử đối soát.

### Issue: Quyền Lưu Trữ / Thư Viện Ảnh

Ứng dụng không cần quyền ghi bộ nhớ ngoài: ảnh chụp được sao chép vào thư mục tài liệu của app (`photos/`). Chọn ảnh từ thư viện dùng `expo-image-picker`; nội dung xin quyền được khai báo trong `app.json`.

### Issue: Dữ Liệu Demo Bị Lệch Hoặc App Lỗi Sau Khi Đổi Cấu Trúc Dữ Liệu

Dữ liệu lưu trên máy (`vmes-data`) có `version: 1` và chưa có hàm `migrate`. Vào **Tài khoản → Khôi phục dữ liệu demo**, hoặc xóa dữ liệu ứng dụng (gỡ và cài lại Expo Go / app) để làm sạch.

### Issue: Build Fails

```bash
# Kiểm tra môi trường
npx expo-doctor

# Sinh lại thư mục native và cài lại gói
npx expo prebuild --clean
rm -rf node_modules
npm install
```

## Performance Optimization

- Số đo hiệu năng thực tế (kích thước bundle, tốc độ logic, bộ nhớ) và so sánh với mục tiêu: [SPECS.md](SPECS.md), mục 10 và 11.
- Cách tổ chức dữ liệu và bộ nhớ đệm: [ARCHITECTURE.md](ARCHITECTURE.md), mục Performance Optimization.
- Khi viết màn hình mới: chọn đúng phần state trong selector (xem ví dụ Zustand ở trên) và dọn dẹp bộ đếm trong `useEffect` (ví dụ `useNow` trong `components/ui.tsx`).

## Version Management

### Update Dependencies

```bash
# Kiểm tra gói đã cũ
npm outdated

# Kiểm tra và sửa gói lệch phiên bản so với Expo SDK
npx expo install --check
npx expo install --fix
```

Nâng cấp Expo SDK theo hướng dẫn chính thức: https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction)

## Support & Contact

- **GitHub Issues:** https://github.com/duongnc/vmes-mobile/issues
- **Tài liệu:** [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md), [SPECS.md](SPECS.md), [test.md](test.md)

## Quick Command Reference

```bash
# Phát triển
npm install              # Cài dependencies
npm start                # Chạy Expo server (Metro, cổng 8081)
npm run ios              # Mở iOS Simulator
npm run android          # Mở Android Emulator
npm run web              # Chạy bản web

# Chất lượng
npm test                 # Unit test (Jest)
npm run typecheck        # Kiểm tra kiểu
npm run lint             # ESLint

# Tiện ích
npx expo install --check # Kiểm tra gói lệch phiên bản
npx expo-doctor          # Kiểm tra môi trường
npx expo export --platform web   # Build bản web tĩnh
```
