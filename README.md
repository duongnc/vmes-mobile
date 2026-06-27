# vMES - Hệ thống Điều hành Sản xuất Điện tử Hàng không Thông minh

**Phiên bản:** 1.0  
**Ngày phát hành:** 12/06/2026  
**Tổ chức thực hiện:** VTX

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
- Phân loại mức độ lỗi (Minor/Major/Critical)
- Tự động thông báo đến quản lý

### 5. Dashboard Tổng Quan (cho Quản lý)
- Hiển thị tiến độ từng Work Order (WO) theo thời gian thực
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
- Xem hướng dẫn công đoạn dạng video/ảnh
- Giảm thao tác giấy tờ tối đa

### Nhân Viên QC
- Kiểm tra linh kiện đầu vào (IQC)
- Kiểm tra quá trình (PQC)
- Tạo NCR và theo dõi lỗi
- Xem lịch sử truy xuất sản phẩm

### Quản Lý Sản Xuất
- Dashboard theo thời gian thực
- Cảnh báo sự cố: thiếu linh kiện, máy hỏng, bottleneck
- Điều phối ưu tiên các lô hàng
- Xem báo cáo OEE, năng suất, thống kê lỗi

## Nguyên Tắc Thiết Kế Cốt Lõi

| Nguyên Tắc | Giải Thích |
|-----------|-----------|
| **Tối giản thao tác vật lý** | Hỗ trợ thao tác bằng giọng nói, nút bấm to, quét mã tự động |
| **Không dùng giấy** | Mọi biên bản, BOM, phiếu kiểm tra đều số hóa |
| **Hoạt động offline** | Dữ liệu lưu local, đồng bộ sau khi có kết nối |
| **Cảnh báo thông minh** | Chủ động đẩy thông báo, không để người dùng phải đi hỏi |
| **Phân quyền theo vai trò** | Mỗi người chỉ thấy và làm được việc của mình |

## Cài Đặt và Chạy Ứng Dụng

### Yêu Cầu
- Node.js 16+
- npm hoặc yarn
- Expo CLI

### Các Bước Cài Đặt

1. **Cài đặt dependencies**
   ```bash
   npm install
   ```

2. **Khởi động ứng dụng**
   ```bash
   npx expo start
   ```

3. **Mở ứng dụng**
   - Nhập `i` để mở iOS Simulator
   - Nhập `a` để mở Android Emulator
   - Quét QR code bằng Expo Go (iOS/Android)

### Phát Triển

Dự án sử dụng [file-based routing](https://docs.expo.dev/router/introduction). Bắt đầu chỉnh sửa các file trong thư mục **app** để phát triển.

## Cấu Trúc Dự Án

```
vmes-mobile/
├── app/                      # Các màn hình ứng dụng
│   ├── (tabs)/              # Tab navigation
│   ├── scanner.tsx          # Màn hình quét mã QR
│   ├── index.tsx            # Màn hình chính
│   └── modal.tsx            # Modal dialog
├── components/              # React components tái sử dụng
├── constants/               # Các hằng số (theme, config)
├── hooks/                   # Custom React hooks
├── store/                   # State management (Zustand)
│   └── useBomStore.ts       # BOM data store
└── assets/                  # Hình ảnh và tài nguyên
```

## Công Nghệ Sử Dụng

- **Framework:** React Native + Expo
- **State Management:** Zustand
- **Navigation:** Expo Router
- **UI Components:** React Native components + Custom themed components
- **TypeScript:** Type-safe development

## Các Tính Năng Sắp Triển Khai

- [ ] Backend API integration (NodeJS/Express)
- [ ] Database (PostgreSQL/MongoDB)
- [ ] Real-time dashboard WebSocket
- [ ] Camera QR code scanner optimization
- [ ] Offline-first sync strategy
- [ ] Multi-language support (Vietnamese/English)
- [ ] Push notifications

## Hỗ Trợ và Tài Liệu

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Giấy Phép

Để xác định được giấy phép, vui lòng liên hệ với tổ chức thực hiện VTX.

## Liên Hệ

Để có thêm thông tin về dự án, vui lòng liên hệ:
- **Tổ chức:** VTX
- **Người dùng cuối:** VTX
