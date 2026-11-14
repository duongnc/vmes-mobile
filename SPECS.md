# Bảng specs phần mềm vMES Mobile

Số liệu lấy từ mã nguồn (`package.json`, `app.json`, `store/`, `lib/`, `app/`) tại nhánh `claude/wonderful-mendel-o6d10k`. Chỗ nào khác với `ARCHITECTURE.md` thì theo mã nguồn.

## 1. Tổng quan

| Hạng mục | Nội dung |
|---|---|
| Tên / slug | vMES (`vmes-mobile`), v1.0.0 |
| Mục đích | Quản lý sản xuất cho nhà máy lắp ráp điện tử: lệnh sản xuất, công đoạn, đối soát linh kiện, kiểm soát chất lượng, truy xuất nguồn gốc |
| Người dùng | Kỹ thuật viên, QC, Quản lý |
| Nền tảng | iOS, Android, Web (`react-native-web`); chỉ dọc (`portrait`) |
| Ngôn ngữ giao diện | Tiếng Việt |
| Quy mô mã | ~4.500 dòng TS/TSX (app, components, lib, services, store, constants) |
| Trạng thái backend | **Chưa có.** `services/api.ts` chỉ giả lập độ trễ 600 ms; dữ liệu mẫu nằm trong `store/seed.ts` |

## 2. Công nghệ

| Lớp | Công nghệ | Phiên bản |
|---|---|---|
| Framework | Expo SDK / React Native / React | `~54.0.34` / 0.81.5 / 19.1.0 |
| Định tuyến | Expo Router (file-based, `typedRoutes`) + React Navigation | `~6.0.23` / `^7` |
| Trạng thái | Zustand + middleware `persist` | `^5.0.14` |
| Lưu trữ cục bộ | AsyncStorage | 2.2.0 |
| Mạng | `@react-native-community/netinfo` | 11.4.1 |
| Camera / quét | `expo-camera` (QR, DataMatrix, Code128) | `~17.0.10` |
| Ảnh | `expo-image-picker`, `expo-image` | `~17.0.11`, `~3.0.11` |
| Biên dịch | React Compiler (bật), New Architecture (bật), TypeScript strict | TS `~5.9.2` |
| Kiểm thử | Jest + `jest-expo`; Playwright cho E2E (script trong `e2e/`) | Jest `^29.7.0` |
| Lint | ESLint + `eslint-config-expo` | `^9.25.0` |

## 3. Vai trò và quyền

| Vai trò | Tab hiển thị | Chức năng chính |
|---|---|---|
| Kỹ thuật viên (`technician`) | Lệnh SX, NCR, Thông báo, Tài khoản | Chạy công đoạn, quét linh kiện, chụp ảnh, lập NCR, yêu cầu cấp bù |
| QC (`qc`) | Kiểm tra, NCR, Thông báo, Tài khoản | IQC, PQC/FAI, xử lý NCR |
| Quản lý (`manager`) | Dashboard, Điều phối, NCR, Thông báo, Tài khoản | Dashboard, đổi ưu tiên, giữ/gỡ giữ lệnh, duyệt cấp bù, OEE |

Phân quyền ở tầng điều hướng: `Stack.Protected` theo trạng thái đăng nhập, `Tabs.Protected` theo vai trò. Đăng nhập bằng mã nhân viên và PIN, phiên được lưu qua AsyncStorage. Tài khoản demo trong seed: `VTX1001`, `VTX1002` (kỹ thuật viên), `VTX2001` (QC), `VTX3001` (quản lý). PIN và mã nhân viên nằm thẳng trong `store/seed.ts` ở phía client, phù hợp bản demo, chưa phải xác thực thật.

## 4. Chức năng

| Phân hệ | Màn hình | Chức năng và quy tắc nghiệp vụ |
|---|---|---|
| Đăng nhập | `login` | Mã nhân viên + PIN; báo "Mã nhân viên không tồn tại" hoặc "Mã PIN không đúng" |
| Lệnh sản xuất | `work-order/[id]` | 8 công đoạn mẫu: Chuẩn bị vật tư, Dán SMT, Hàn sóng, Lắp cơ khí, Nạp firmware, Kiểm tra chức năng, Phủ bảo vệ, Đóng gói. Trạng thái bước: `pending`, `running`, `paused`, `done`. Có đồng hồ đếm giờ, hướng dẫn công đoạn và lưu ý an toàn |
| Điều kiện chạy bước | `work-order/[id]` | Không bắt đầu hoặc hoàn thành khi lệnh bị giữ; không hoàn thành khi chưa bắt đầu; không hoàn thành khi chưa quét đủ linh kiện của bước. Nút luôn bấm được và trả lý do. Khung "Bước tiếp theo" nêu đang bị chặn ở đâu |
| Quét linh kiện | `scanner` | Mã `MPN\|LÔ\|DATECODE\|HSD\|COC` (chấp nhận `\|` hoặc `;`). Camera, nhập tay hoặc mã demo. Mã chỉ có MPN thì cho chọn lô đã qua IQC và còn hạn |
| Đối soát | `lib/scan.ts` | 9 mã kết quả: `OK`, `EMPTY`, `NOT_IN_BOM`, `ALREADY_FULL`, `NO_LOT_INFO`, `LOT_UNKNOWN`, `LOT_NOT_ACCEPTED`, `EXPIRED`, `COC_MISMATCH`. Hạn dùng lấy mốc sớm hơn giữa nhãn và hồ sơ lô; COC phải khớp hồ sơ IQC |
| Ảnh hồ sơ | `camera` | Chụp ảnh, chạm để khoanh vùng lỗi (toạ độ tương đối 0..1), ghi chú, gắn vào lệnh hoặc NCR |
| NCR | `ncr/new`, `ncr/[id]`, tab NCR | Mức Minor, Major, Critical. Trạng thái `open`, `reviewing`, `closed`. Xử lý: `rework`, `scrap`, `use-as-is`, `return`. Ghi nguyên nhân gốc và lịch sử. Mã tự tăng `NCR-0001`. NCR **Critical** gắn lệnh sẽ tự tạm dừng bước đang chạy và giữ lệnh |
| Cấp bù linh kiện | trong lệnh | Kỹ thuật viên yêu cầu (có thể kèm giữ lệnh), quản lý duyệt hoặc từ chối |
| IQC | `iqc/[id]` | Phiếu kiểm Đạt / Không đạt, chấp nhận hoặc từ chối lô. Chỉ lô `accepted` mới được dùng khi quét |
| PQC / FAI | `pqc/[woId]` | Phiếu kiểm theo công đoạn; kết quả đạt khi mọi mục đạt. FAI đạt thì gỡ giữ lệnh loại `fai` |
| Điều phối | tab Điều phối | Đổi thứ tự ưu tiên (lên/xuống), giữ và gỡ giữ lệnh thủ công |
| Dashboard | `manager-dashboard` | Tiến độ lệnh, mức sức khoẻ, tải theo trạm, điểm nghẽn, OEE |
| Truy xuất | `trace` | Nhật ký theo 9 loại sự kiện: quét đạt/không đạt, bước, ảnh, NCR, IQC, PQC, cấp bù, lệnh |
| Thông báo | tab Thông báo | Gửi theo vai trò, đánh dấu đã đọc, bấm để mở màn hình liên quan; huy hiệu số chưa đọc |
| Giám sát quá giờ | `_layout`, `checkOvertime` | Bước đang chạy vượt 100% định mức thì thông báo một lần (`overtimeNotified`) |
| Ngoại tuyến | tab Tài khoản | NetInfo cộng chế độ ép ngoại tuyến; thay đổi vào hàng đợi, hiện số thay đổi chưa đồng bộ; đồng bộ lại khi có mạng, giữ tối đa 30 mục đã đồng bộ |
| Đặt lại demo | tab Tài khoản | `resetDemo` đưa dữ liệu về seed |

## 5. Chỉ số và ngưỡng

| Chỉ số | Công thức / giá trị |
|---|---|
| Tiến độ bước | thời gian đã chạy / định mức; `WARN_RATIO = 0.8` (vàng), `OVER_RATIO = 1.0` (đỏ) |
| OEE | Availability × Performance × Quality |
| Availability | (kế hoạch − dừng máy) / kế hoạch, theo `StationStat` |
| Performance | tổng định mức / tổng thời gian thực của các bước đã xong (tối đa 1) |
| Quality | tốt / (tốt + lỗi), lỗi gồm cả số lượng lỗi từ NCR (tối đa 1) |

## 6. Dữ liệu và lưu trữ

| Thành phần | Chi tiết |
|---|---|
| Kho dữ liệu | Zustand store `vmes-data` (version 1), AsyncStorage; bỏ qua `hydrated`, `syncing`, `netConnected` khi lưu |
| Kho phiên | `vmes-auth`, chỉ lưu `userId` |
| Thực thể chính | `User`, `WorkOrder` (steps, bom, photos, hold), `BomItem`/`ScannedLot`, `PartRequest`, `Ncr`, `IqcLot`, `PqcRecord`, `TraceEvent`, `AppNotification`, `SyncItem`, `StationStat` |
| Dữ liệu mẫu | 4 người dùng, các lệnh `WO-2426` đến `WO-2430`, NCR/yêu cầu cấp bù/thông báo mẫu |
| Đồng bộ | Hàng đợi `SyncItem`; `pushChanges` hiện chỉ mô phỏng, thay thân hàm này khi có API thật |

## 7. Quyền truy cập thiết bị

| Quyền | Mục đích (khai báo trong `app.json`) |
|---|---|
| Camera | "quét mã linh kiện và chụp ảnh biên bản" |
| Thư viện ảnh | "chọn ảnh từ thư viện để đính kèm biên bản" |

## 8. Chất lượng

| Hạng mục | Trạng thái |
|---|---|
| Typecheck (`npm run typecheck`) | Đạt |
| Lint (`npm run lint`) | Đạt |
| Jest | 20 test đạt (`scan.test.ts`, `metrics.test.ts`; mỗi file 10 test) |
| E2E Playwright | Có `e2e/flow-all-roles.js` (3 vai trò) và `e2e/regress-stuck.js`; `test.md` ghi kết quả 34/34 và 13/13 |
| Demo trên simulator | Luồng kỹ thuật viên điển hình trên iPhone 17 Pro, đạt |

## 9. Hạn chế đã biết

| Hạn chế | Ghi chú |
|---|---|
| Chưa có backend | Không có API, cơ sở dữ liệu hay đẩy thông báo thật |
| Xác thực chỉ phía client | PIN nằm trong seed, không mã hoá |
| Camera trên simulator | Preview đen, phải dùng "mã demo" |
| `ARCHITECTURE.md` lệch mã nguồn | Tài liệu nhắc SQLite, `useBomStore`/`useProductionStore`/`useQCStore`, WebSocket; thực tế chỉ có `useMesStore` và `useAuthStore` trên AsyncStorage |
| Gói lệch phiên bản nhẹ | `expo` 54.0.35 so với `~54.0.37`, `expo-constants` 18.0.13 so với `~18.0.14`, `@types/jest` 30 so với 29.5.14 |

## 10. Hiệu năng

Tất cả số liệu dưới đây **đo thực tế** ngày 14/11/2026, không phải ước lượng. Phần chưa đo được liệt kê riêng ở mục 10.6.

### 10.1 Điều kiện đo

| Hạng mục | Giá trị |
|---|---|
| Máy đo | Apple M5 Pro, macOS 26.5 |
| Node.js (benchmark logic) | v25.9.0, darwin/arm64 |
| Thiết bị chạy app | iPhone 17 Pro (iOS 26.5 Simulator), Expo Go 54.0.7 |
| Dữ liệu | Dữ liệu mẫu `createSeed()`: 5 lệnh sản xuất, 7 lô IQC, 1 NCR; lệnh nhân bản khi đo quy mô 100 và 1.000 lệnh |
| Chế độ | Bản phát triển (Metro) cho bộ nhớ và CPU; bản phát hành (`expo export`) cho kích thước bundle |

### 10.2 Build và kích thước

| Chỉ tiêu | Kết quả |
|---|---|
| Metro dev bundle (cache sạch, iOS) | 3,8 s, 1.502 module |
| `expo export` iOS | 7,0 s, 1.349 module |
| `expo export` Web | 5,5 s, 1.133 module |
| Tổng thời gian `expo export` cả hai nền tảng | 12 s |
| Bundle iOS (Hermes bytecode) | 4,02 MB |
| Bundle Web (JS) | 2,11 MB, gzip 0,53 MB |
| Tài nguyên đóng gói | 43 tệp; lớn nhất là font MaterialIcons 357 kB, còn lại là ảnh nhỏ dưới 10 kB |
| Thư mục `export` (iOS + Web) | 6,8 MB |
| Mã nguồn | 4.536 dòng TS/TSX |
| Phụ thuộc | 32 `dependencies`, 7 `devDependencies`; `node_modules` 449 MB |
| Jest | 20 test, 0,82 s |

### 10.3 Tốc độ xử lý logic nghiệp vụ

Thời gian trung vị của 7 lượt đo, sau khi khởi động (warm-up). Đơn vị µs (1 µs = 0,001 ms) cho mỗi lần gọi.

| Thao tác | 5 lệnh (dữ liệu mẫu) | 100 lệnh | 1.000 lệnh |
|---|---|---|---|
| `validateScan`, mã hợp lệ (`OK`) | 0,31 | | |
| `validateScan`, mã ngoài BOM | 0,21 | | |
| `woHealth`, tính cho toàn bộ lệnh | 1,72 | 34,3 | 342 |
| `stationLoads` + `bottlenecks` | 1,16 | 5,4 | 44,1 |
| `computeOee` | 0,08 | 1,1 | 11,1 |
| `createSeed()` | 4,96 | | |

Thời gian tăng gần tuyến tính theo số lệnh: với 1.000 lệnh, tính sức khoẻ toàn bộ lệnh mất khoảng 0,34 ms.

### 10.4 Lưu trữ và bộ nhớ

| Chỉ tiêu | Kết quả |
|---|---|
| Kích thước dữ liệu mẫu khi lưu (JSON) | 20.470 byte (~20 kB) |
| `JSON.stringify` dữ liệu mẫu (chi phí mỗi lần `persist` ghi) | 12,6 µs |
| `JSON.parse` dữ liệu mẫu (khi mở app) | 27,3 µs |
| Bộ nhớ tiến trình Expo Go trên Simulator | RSS 427.264 kB (~417 MiB) |
| CPU trung bình của tiến trình Expo Go | 2,4% trong 20 phút chạy |

Bộ nhớ và CPU đo trong Expo Go ở chế độ phát triển, gồm cả bộ máy Expo Go và công cụ dev, nên **cao hơn** bản phát hành thật.

### 10.5 Tham số thời gian trong thiết kế

| Tham số | Giá trị | Vị trí |
|---|---|---|
| Nhịp đồng hồ đếm giờ công đoạn | 1 s | `useNow` trong `components/ui.tsx` |
| Chu kỳ giám sát quá giờ | 10 s | `app/_layout.tsx` |
| Ngưỡng cảnh báo / vượt định mức | 80% / 100% định mức | `lib/metrics.ts` |
| Độ trễ đồng bộ (mô phỏng, chưa có backend) | 600 ms | `services/api.ts` |
| Hàng đợi đồng bộ giữ lại | toàn bộ mục chưa đồng bộ + 30 mục đã đồng bộ gần nhất | `store/useMesStore.ts` |

### 10.6 Chưa đo

| Hạng mục | Lý do |
|---|---|
| Thời gian khởi động nguội trên máy thật | Mới chạy trên Simulator |
| Tốc độ khung hình, độ mượt khi cuộn | Chưa có công cụ đo trong phiên |
| Tiêu thụ pin | Cần thiết bị thật |
| Bộ nhớ và CPU của bản phát hành | Mới đo trong Expo Go ở chế độ dev |
| Hiệu năng mạng và API | Chưa có backend |
| Nhiều người dùng đồng thời | Dữ liệu nằm cục bộ trên từng máy |
| Kích thước cài đặt cuối (IPA / APK) | Chưa build bản cài đặt |
| Tốc độ logic trên thiết bị | Benchmark chạy bằng Node trên máy Mac, không phải Hermes trên điện thoại; trên điện thoại sẽ chậm hơn |

## 11. So sánh hiệu năng thiết kế và thực tế (100 người dùng, điện thoại đời cũ)

### 11.1 Bối cảnh và giả định

| Hạng mục | Nội dung |
|---|---|
| Quy mô | 100 người dùng tại xưởng |
| Thiết bị mục tiêu | iPhone X (2017, chip A11, 3 GB RAM, tối đa iOS 16.7) và Galaxy A15 (giả định "Galaxy 15" là A15; Android 14, 4 đến 8 GB RAM). Thông số máy theo hiểu biết của tôi, chưa kiểm chứng trong phiên |
| Mục tiêu thiết kế | Mã nguồn và tài liệu **không ghi chỉ tiêu hiệu năng nào**. Cột "Thiết kế" là mục tiêu **đề xuất** theo bối cảnh trên, cần xác nhận |
| Thực tế | Số đo trên Mac (Apple M5 Pro) và iOS Simulator. **Chưa có máy thật** |

### 11.2 Bảng so sánh

| Chỉ tiêu | Thiết kế (đề xuất) | Thực tế đo được | Đánh giá |
|---|---|---|---|
| HĐH iPhone X | Chạy trên iOS 16.7 | React Native 0.81 yêu cầu iOS ≥ 15.1 (đọc từ `node_modules`) | Đạt về điều kiện HĐH; chưa chạy máy thật |
| HĐH Galaxy A15 | Chạy trên Android 14 | `minSdk` = 24 (Android 7.0) | Đạt về điều kiện HĐH; chưa chạy máy thật |
| Quét mã bằng camera | Đọc QR, DataMatrix, Code128 | `expo-camera` cấu hình đủ 3 loại; Simulator không có camera nên chỉ thử bằng mã demo | Chưa kiểm chứng |
| Hiện màn hình đầu | ≤ 3 s trên máy cũ | Bản web: 0,17 s (CPU thường), 0,35 s (chậm 4×), 0,48 s (chậm 6×) | Đạt theo chỉ báo gần đúng; chưa đo bản native |
| Phản hồi thao tác logic (đối soát, tính sức khoẻ lệnh) | ≤ 100 ms | `validateScan` 0,31 µs; tính sức khoẻ 1.000 lệnh 0,34 ms (đo trên Mac). Nhân 6× vẫn dưới 3 ms (ước tính) | Đạt theo ước tính; chưa đo trên Hermes |
| Ghi dữ liệu sau mỗi thay đổi | ≤ 50 ms | `persist` ghi toàn bộ state: `JSON.stringify` 12,6 µs cho 20 kB (Mac) | Đạt theo ước tính |
| Độ mượt giao diện | ≥ 30 FPS khi cuộn | Chưa đo | Chưa đo |
| Bộ nhớ RAM | ≤ ~300 MB (10% RAM máy 3 GB) | Bản web: JS heap 7,9 MiB. Expo Go dev trên Simulator ~417 MiB, không đại diện bản phát hành | Chưa kết luận |
| Kích thước bundle | ≤ 10 MB | iOS 4,02 MB; Web 2,11 MB (gzip 0,53 MB) | Đạt; dung lượng cài đặt (IPA/APK) chưa đo |
| Dữ liệu cục bộ | Dưới giới hạn 6 MB của AsyncStorage trên Android (mặc định thư viện) | Dữ liệu mẫu 20 kB. Mã chỉ giới hạn nhật ký 500 mục (~75 kB) và thông báo 200 mục (~40 kB); NCR, IQC, PQC không thấy giới hạn. Ảnh lưu thành tệp, không vào AsyncStorage | Đạt trong điều kiện thường; theo dõi nếu NCR/PQC tăng nhiều |
| Pin và nhiệt | Dùng đủ một ca làm việc khi quét liên tục | Chưa đo | Chưa đo |
| Dữ liệu dùng chung cho 100 máy | Mọi máy thấy cùng dữ liệu (`ARCHITECTURE.md` nêu backend API là việc tương lai) | Chưa có backend; mỗi điện thoại giữ bản dữ liệu riêng từ dữ liệu mẫu | **Chưa đạt**: quản lý không thấy việc của kỹ thuật viên ở máy khác |
| Đồng bộ ngoại tuyến | Đẩy hàng đợi lên máy chủ khi có mạng | Hàng đợi hoạt động, nhưng `pushChanges` chỉ giả lập 600 ms, không gửi đi đâu | Mới là mô phỏng |
| Thông báo theo vai trò | Gần thời gian thực tới đúng người | Thông báo tạo cục bộ trên từng máy, không có đẩy | **Chưa đạt** |
| Tài khoản | 100 tài khoản, xác thực an toàn | 4 tài khoản trong `store/seed.ts`, PIN nằm trong mã ở máy | **Chưa đạt** |
| Tải máy chủ | Chịu 100 người dùng đồng thời | Không có máy chủ nên không thể đo | Không áp dụng; đo khi có backend |

### 11.3 Đo giả lập CPU chậm (chỉ báo gần đúng cho máy đời cũ)

| CPU giả lập | Màn hình đầu hiện (trung vị 5 lần) | Khoảng | DOMContentLoaded | JS heap |
|---|---|---|---|---|
| Thường (1×) | 165 ms | 144 đến 190 ms | 51 ms | 7,9 MiB |
| Chậm 4× | 354 ms | 346 đến 359 ms | 119 ms | 7,9 MiB |
| Chậm 6× | 480 ms | 463 đến 518 ms | 183 ms | 7,9 MiB |

Đo bằng Chrome 148 headless trên Mac, bản web (`expo export`), phục vụ từ localhost (không tính độ trễ mạng), tắt cache. Giả lập CPU của Chrome không tái hiện đúng bộ nhớ, GPU và Hermes, nên chỉ dùng để so sánh tương đối, **không thay cho đo trên iPhone X và Galaxy A15 thật**.

### 11.4 Kết luận

- Theo các chỉ báo hiện có, hiệu năng **không phải nút thắt** trên máy đời cũ: bundle nhỏ, logic rất nhẹ, dữ liệu cục bộ nhỏ.
- Rào cản thật cho 100 người dùng là **thiếu backend**: dữ liệu dùng chung, đồng bộ, thông báo, tài khoản.
- Việc cần làm trước khi triển khai: build bản phát hành và đo trên iPhone X, Galaxy A15 thật (khởi động nguội, FPS, RAM, pin, dung lượng cài đặt).
