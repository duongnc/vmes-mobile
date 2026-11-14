# vMES - Hệ thống Điều hành Sản xuất Điện tử Hàng không Thông minh

**Phiên bản:** 1.0  
**Ngày phát hành:** 12/06/2026  
**Tổ chức thực hiện:** VHT

## Giới thiệu Dự án

vMES là một hệ thống Manufacturing Execution System (MES) di động, được thiết kế để tối ưu hóa quy trình lắp ráp và kiểm soát chất lượng sản phẩm điện tử trong môi trường xưởng. Hệ thống hỗ trợ ba nhóm người dùng chính:

- **Kỹ thuật viên (Technician):** Thực hiện lắp ráp, kiểm tra, và báo cáo tiến độ công việc
- **Nhân viên QC (Quality Control):** Kiểm soát chất lượng đầu vào, quá trình, và đầu ra
- **Quản lý sản xuất (Production Manager):** Giám sát tiến độ, phát hiện bottleneck, và điều phối công việc

## Tính năng Chính

### 1. Quét Mã và Đối Soát Linh Kiện
- Quét QR/MPN tự động bằng camera điện thoại
- Đối chiếu tự động giữa linh kiện nhận được và BOM (Bill of Materials)
- Cảnh báo nếu có sai mã, hết hạn, hoặc không khớp chứng chỉ xuất xứ (COC)

### 2. Ghi Nhận Tiến Độ Công Đoạn
- Xác nhận hoàn thành từng bước lắp ráp
- Tự động đếm giờ cho từng công đoạn
- Cảnh báo khi vượt thời gian định mức

### 3. Chụp Ảnh và Lưu Biên Bản
- Chụp ảnh bán thành phẩm, linh kiện lỗi tại chỗ
- Tự động lưu vào hồ sơ sản xuất
- Vẽ khoanh vùng lỗi trên ảnh để dễ truy xuất

### 4. Tạo Báo Cáo NCR (Non-Conformance Report)
- Tạo NCR nhanh chóng tại chỗ
- Phân loại mức độ lỗi (Minor/Major/Critical); NCR Critical tự động tạm dừng và giữ lệnh
- Tự động thông báo trong ứng dụng đến quản lý và QC

### 5. Dashboard Tổng Quan (cho Quản lý)
- Hiển thị tiến độ từng Work Order (WO) từ dữ liệu trên máy (chưa có backend nên chưa dùng chung giữa nhiều máy)
- Màu sắc trạng thái: Xanh (trôi chảy), Vàng (sắp tắc), Đỏ (tắc)
- Cảnh báo bottleneck tự động
- Thống kê OEE và năng suất từng trạm

### 6. Hỗ Trợ Offline
- Dữ liệu được lưu cục bộ khi mất kết nối
- Tự động đồng bộ khi kết nối lại

## Yêu Cầu Người Dùng

### Kỹ Thuật Viên (Technician)
- Xem lệnh sản xuất và công đoạn hiện tại
- Quét linh kiện và xác nhận nhận được
- Báo cáo lỗi hoặc yêu cầu thêm linh kiện (Request Extra Part)
- Xem hướng dẫn công đoạn (hiện dạng văn bản kèm lưu ý an toàn; video/ảnh chưa có)
- Giảm thao tác giấy tờ tối đa

### Nhân Viên QC
- Kiểm tra linh kiện đầu vào (IQC)
- Kiểm tra quá trình (PQC)
- Tạo NCR và theo dõi lỗi
- Xem lịch sử truy xuất sản phẩm

### Quản Lý Sản Xuất
- Dashboard tiến độ, màu trạng thái, bottleneck, OEE (dữ liệu trên máy, chưa có thời gian thực qua máy chủ)
- Cảnh báo sự cố: vượt định mức, yêu cầu cấp bù linh kiện, NCR, bottleneck (cảnh báo máy hỏng chưa có)
- Điều phối ưu tiên các lô hàng
- Xem báo cáo OEE, năng suất, thống kê lỗi

## Nguyên Tắc Thiết Kế Cốt Lõi

| Nguyên Tắc | Giải Thích |
|-----------|-----------|
| **Tối giản thao tác vật lý** | Nút bấm to, quét mã tự động (thao tác bằng giọng nói: chưa làm) |
| **Không dùng giấy** | Mọi biên bản, BOM, phiếu kiểm tra đều số hóa |
| **Hoạt động offline** | Dữ liệu lưu local, đồng bộ sau khi có kết nối |
| **Cảnh báo thông minh** | Chủ động đẩy thông báo, không để người dùng phải đi hỏi |
| **Phân quyền theo vai trò** | Mỗi người chỉ thấy và làm được việc của mình |

## Cài Đặt và Chạy Ứng Dụng

### Yêu Cầu
- Node.js 20.19.4 trở lên (yêu cầu của React Native 0.81)
- npm (đi kèm Node.js; dự án dùng `package-lock.json`)
- Không cần cài Expo CLI toàn cục, dùng `npx expo`
- Thiết bị chạy thử: iOS 15.1 trở lên, Android 7.0 trở lên, hoặc iOS Simulator / Android Emulator

### Các Bước Cài Đặt

1. **Cài đặt dependencies**
   ```bash
   npm install
   ```

2. **Khởi động ứng dụng**
   ```bash
   npm start
   ```

3. **Mở ứng dụng**
   - Nhập `i` để mở iOS Simulator
   - Nhập `a` để mở Android Emulator
   - Nhập `w` để mở bản web
   - Quét QR code bằng Expo Go (iOS/Android)

   Simulator không có camera: ở màn hình quét dùng nút **Dùng mã demo**. Hướng dẫn chi tiết ở [SETUP.md](SETUP.md).

### Kiểm Tra Chất Lượng

```bash
npm test             # Unit test (Jest)
npm run typecheck    # Kiểm tra kiểu TypeScript
npm run lint         # ESLint
```

### Phát Triển

Dự án sử dụng [file-based routing](https://docs.expo.dev/router/introduction). Bắt đầu chỉnh sửa các file trong thư mục **app** để phát triển.

## Trạng Thái Hoàn Thiện

| Tính năng | Trạng thái |
|---|---|
| Đăng nhập, phân quyền 3 vai trò (KTV / QC / Quản lý) | ✅ |
| Quét QR, đối soát BOM (sai mã, hết hạn, lô chưa qua IQC, không khớp COC) | ✅ |
| Ghi nhận công đoạn, đếm giờ, cảnh báo vượt định mức | ✅ |
| Hướng dẫn công đoạn (dạng văn bản + lưu ý an toàn) | ✅ |
| Yêu cầu cấp bù linh kiện và duyệt của quản lý | ✅ |
| Chụp ảnh, khoanh vùng lỗi, lưu hồ sơ sản xuất | ✅ |
| NCR: tạo, phân loại Minor/Major/Critical, xử lý, đóng | ✅ |
| IQC, PQC/FAI, truy xuất nguồn gốc | ✅ |
| Dashboard: màu trạng thái, bottleneck, OEE, năng suất trạm, thống kê lỗi | ✅ |
| Điều phối ưu tiên, giữ / gỡ giữ lệnh | ✅ |
| Thông báo trong ứng dụng theo vai trò | ✅ |
| Offline: lưu cục bộ (AsyncStorage) + hàng đợi tự đồng bộ khi có mạng | ✅ (máy chủ mô phỏng) |
| Kiểm thử: unit test Jest cho logic ở `lib/`, E2E Playwright trên bản web (`e2e/`) | ✅ |
| Backend API, WebSocket, push notification, đa ngôn ngữ, điều khiển giọng nói, hướng dẫn công đoạn dạng video/ảnh | ⏳ Chưa làm |

> Dự án chưa có backend: dữ liệu ban đầu lấy từ `store/seed.ts`, việc "đẩy lên máy chủ" trong `services/api.ts` chỉ mô phỏng độ trễ mạng.

### Tài khoản demo

| Mã nhân viên | PIN | Vai trò |
|---|---|---|
| VTX1001 | 1234 | Kỹ thuật viên (Nguyễn Văn A, trạm Hàn sóng) |
| VTX1002 | 1234 | Kỹ thuật viên (Lê Văn C, trạm SMT) |
| VTX2001 | 1234 | Nhân viên QC (Trần Thị B) |
| VTX3001 | 1234 | Quản lý sản xuất (Phạm Văn D) |

Vào **Tài khoản → Khôi phục dữ liệu demo** để đưa dữ liệu về trạng thái ban đầu.

## Cấu Trúc Dự Án

```
vmes-mobile/
├── app/                      # Màn hình (Expo Router)
│   ├── login.tsx            # Đăng nhập
│   ├── (tabs)/              # Tab chính theo vai trò
│   ├── work-order/[id].tsx  # Chi tiết lệnh sản xuất, công đoạn, BOM
│   ├── scanner.tsx          # Quét QR và đối soát BOM
│   ├── camera.tsx           # Chụp ảnh, khoanh vùng lỗi
│   ├── ncr/                 # Tạo và xử lý NCR
│   ├── iqc/, pqc/           # Kiểm tra đầu vào / quá trình
│   └── trace.tsx            # Truy xuất nguồn gốc
├── components/              # UI kit và component dùng chung
├── lib/                     # Logic nghiệp vụ thuần (đối soát, OEE, bottleneck)
├── store/                   # Zustand: useAuthStore, useMesStore, dữ liệu mẫu
├── services/api.ts          # Điểm tích hợp backend (hiện mô phỏng)
├── __tests__/               # Unit test (Jest)
├── e2e/                     # Kịch bản E2E Playwright trên bản web
├── docs/                    # Báo cáo đồ án (docx)
├── assets/                  # Hình ảnh và tài nguyên
└── ARCHITECTURE.md, SETUP.md, SPECS.md, test.md   # Tài liệu (xem bên dưới)
```

## Tài Liệu

| Tệp | Nội dung |
|---|---|
| [SETUP.md](SETUP.md) | Cài đặt, chạy trên simulator và thiết bị, kiểm thử, xử lý sự cố |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Kiến trúc, mô hình dữ liệu, luồng dữ liệu, offline, bảo mật |
| [SPECS.md](SPECS.md) | Bảng specs, số đo hiệu năng, so sánh thiết kế và thực tế |
| [test.md](test.md) | Các ca kiểm thử và kết quả |

## Công Nghệ Sử Dụng

- **Framework:** React Native 0.81 + Expo SDK 54
- **State Management:** Zustand (persist qua AsyncStorage)
- **Navigation:** Expo Router (Stack.Protected / Tabs.Protected cho phân quyền)
- **Thiết bị:** expo-camera (quét mã, chụp ảnh), expo-image-picker, expo-file-system, NetInfo
- **Kiểm thử:** Jest (jest-expo) – `npm test`; Playwright cho E2E bản web (cài riêng, xem [SETUP.md](SETUP.md))
- **TypeScript:** chế độ `strict`

## Các Tính Năng Sắp Triển Khai

- [ ] Backend API integration (NodeJS/Express) – thay thân hàm `pushChanges` trong `services/api.ts`
- [ ] Database (PostgreSQL/MongoDB)
- [ ] Real-time dashboard WebSocket
- [ ] Hướng dẫn công đoạn dạng video/ảnh
- [ ] Multi-language support (Vietnamese/English)
- [ ] Push notifications
- [ ] Thao tác bằng giọng nói

## Hỗ Trợ và Tài Liệu

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Giấy Phép

Để xác định được giấy phép, vui lòng liên hệ với tổ chức thực hiện VHT.

## Liên Hệ

Để có thêm thông tin về dự án, vui lòng liên hệ:
- **Tổ chức:** VHT
- **Người dùng cuối:** VHT
