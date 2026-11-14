# Tài liệu kiểm thử vMES Mobile

Tài liệu này ghi lại các bài kiểm thử đã chạy, logic của từng bài, trình tự thực hiện, lỗi tìm ra, kết quả lần chạy gần nhất và những phần chưa được kiểm thử.

- Lần chạy gần nhất: 14/11/2026, nhánh `claude/wonderful-mendel-o6d10k`, sau commit sửa lỗi kỹ thuật viên bị kẹt.
- Môi trường: Node 22, Expo SDK 54, Jest 29 (jest-expo), Chromium headless qua Playwright (khổ màn hình 400 × 860, camera giả lập).

## 1. Tổng quan

| Lớp | Công cụ | Kiểm tra cái gì | Số lượng | Kết quả |
|---|---|---|---|---|
| Kiểm tra tĩnh | `tsc --noEmit` (strict), `expo lint` | Kiểu dữ liệu, quy tắc lint | Toàn bộ mã nguồn | Đạt, không cảnh báo |
| Kiểm thử đơn vị | Jest | Logic thuần: đối soát mã quét, tiến độ, màu trạng thái, điểm nghẽn, OEE | 20 ca / 2 tệp | 20/20 đạt |
| Build | `expo export --platform web` | Ứng dụng biên dịch và đóng gói được | 1 | Đạt |
| Đầu-cuối (E2E) toàn luồng | Playwright | Luồng nối tiếp của 3 vai trò trên bản web | 34 kiểm tra | 34/34 đạt |
| E2E hồi quy lỗi kẹt | Playwright | Kỹ thuật viên không bị chặn mà không có lý do | 13 kiểm tra | 13/13 đạt |
| Rà soát giao diện | Ảnh chụp từ E2E | Bố cục, chữ bị cắt, số liệu bất thường | Xem mục 3.6 | Tìm ra 3 lỗi, đã sửa |
| Chạy tay trên điện thoại | Expo Go (iPhone) | Màn hình thực tế | Xem mục 3.7 | Một phần |

## 2. Trình tự kiểm thử

Mỗi thay đổi lớn đi qua chuỗi sau theo đúng thứ tự, bước sau chỉ có ý nghĩa khi bước trước đạt:

1. **Kiểm tra kiểu và lint.** Bắt lỗi nhanh nhất, không cần chạy ứng dụng.
2. **Kiểm thử đơn vị.** Xác nhận các quy tắc nghiệp vụ cốt lõi trước khi dùng chúng ở giao diện.
3. **Build bản web.** Xác nhận ứng dụng biên dịch được. Bước này từng phát hiện lỗi khởi động (mục 4).
4. **E2E toàn luồng.** Chạy trên bản đã build, theo thứ tự kỹ thuật viên, QC, quản lý.
5. **Xem ảnh chụp từ E2E.** Phát hiện lỗi bố cục mà kiểm tra tự động không bắt được.
6. **E2E hồi quy** sau mỗi lần sửa lỗi người dùng báo.
7. **Chạy tay trên điện thoại** để kiểm phần phụ thuộc phần cứng, những phần E2E trên web không kiểm được.

Cách chạy lại:

```bash
npm install
npm test                                  # 20 unit test
npm run typecheck                         # tsc strict
npm run lint
npx expo export --platform web            # build ra thư mục dist
node e2e/serve.js dist &                  # phục vụ bản web ở cổng 8099
node e2e/flow-all-roles.js                # E2E toàn luồng
node e2e/regress-stuck.js                 # hồi quy lỗi kẹt
```

Playwright chưa nằm trong `package.json`. Nếu máy chưa có, cài bằng `npm i -D playwright` và `npx playwright install chromium`. Hai kịch bản E2E thoát với mã 0 khi đạt, mã 1 khi có kiểm tra trượt, và lưu ảnh chụp vào `e2e/shots/` (đã bỏ qua trong git).

## 3. Chi tiết từng lớp

### 3.1 Kiểm tra tĩnh

- `npm run typecheck`: TypeScript chế độ strict trên toàn bộ `app/`, `components/`, `lib/`, `store/`, `services/`, `__tests__/`.
- `npm run lint`: bộ quy tắc `eslint-config-expo`. Lần chạy đầu của dự án gốc có 1 cảnh báo `react-hooks/exhaustive-deps`; mã hiện tại không còn cảnh báo.

### 3.2 Kiểm thử đơn vị (Jest)

**Logic kiểm thử.** Chỉ kiểm các hàm thuần ở `lib/scan.ts` và `lib/metrics.ts`, nên không cần thiết bị hay mô phỏng giao diện. Dữ liệu vào là dữ liệu mẫu `createSeed(NOW)` với thời điểm cố định `2026-11-13 08:00`, và ngày "hôm nay" truyền vào hàm là `2026-11-13`, nhờ vậy kết quả không phụ thuộc đồng hồ thật. Mỗi ca kiểm một quy tắc, dùng một lệnh hoặc một lô mẫu đã biết trước kết quả.

Dữ liệu mẫu dùng trong các ca: lệnh `WO-2427` (đang ở bước 3, BOM gồm ADUM4160, STM32F407, CONN-DB9), `WO-2428` (bị giữ chờ cấp bù, lô MAX31855 mới chờ IQC), `WO-2430` (bước SMT đã chạy 52 phút so với định mức 45), `WO-2426` (đã hoàn thành), lô `L2212E` đã quá hạn.

**`__tests__/scan.test.ts` (10 ca)**

| # | Ca kiểm thử | Đầu vào | Kết quả mong đợi |
|---|---|---|---|
| 1 | Tách đủ 5 trường và chuẩn hoá chữ hoa | `' adum4160\|l2345a\|2345\|2028-01-01\|coc-0091 '` | MPN, lô, date code, hạn, COC được tách đúng, chữ hoa, bỏ khoảng trắng thừa |
| 2 | Chấp nhận dấu chấm phẩy | `RES10K;L2402D` | Số lô là `L2402D` |
| 3 | Khớp BOM với lô đã qua IQC | Mã của lô `L2345A` trên `WO-2427` | Đạt, trỏ đúng dòng BOM `WO-2427-B1` |
| 4 | Sai mã, không có trong BOM | `LM358\|L1\|2401\|2030-01-01\|COC-1` | Mã lỗi `NOT_IN_BOM` |
| 5 | Thiếu thông tin lô | `ADUM4160` | Mã lỗi `NO_LOT_INFO` |
| 6 | Lô không có hồ sơ | `ADUM4160\|LXXXX\|…` | Mã lỗi `LOT_UNKNOWN` |
| 7 | Lô chưa được IQC chấp nhận | Lô `L2310C` (MAX31855, chờ kiểm) trên `WO-2428` | Mã lỗi `LOT_NOT_ACCEPTED` |
| 8 | Linh kiện hết hạn | Lô `L2212E` (hết hạn trước ngày kiểm) | Mã lỗi `EXPIRED` |
| 9 | Không khớp COC | Mã lô `L2345A` nhưng COC `COC-9999` | Mã lỗi `COC_MISMATCH` |
| 10 | Đã đủ số lượng | BOM ADUM4160 đã có 1 lần quét (yêu cầu 1) | Mã lỗi `ALREADY_FULL` |

Các ca 4 đến 10 phủ lần lượt các mã lỗi theo đúng thứ tự kiểm tra của hàm `validateScan` (mục 3.8 của báo cáo).

**`__tests__/metrics.test.ts` (10 ca)**

| # | Ca kiểm thử | Đầu vào | Kết quả mong đợi |
|---|---|---|---|
| 1 | Tiến độ theo công đoạn đã xong | `WO-2427` (2/8 bước xong); `WO-2426` (xong hết) | Tiến độ 2/8; công đoạn hiện tại là "Hàn sóng"; `WO-2426` không còn công đoạn hiện tại |
| 2 | Cộng thời gian đang chạy vào thời gian tích luỹ | Bước đang chạy, tích luỹ 100 giây, bắt đầu cách đây 30 giây; cùng bước ở trạng thái tạm dừng | 130 giây khi đang chạy; 100 giây khi tạm dừng |
| 3 | Xanh khi trôi chảy | `WO-2427` | Màu xanh |
| 4 | Đỏ khi bị giữ | `WO-2428` | Màu đỏ |
| 5 | Đỏ khi công đoạn vượt định mức | `WO-2430` (52/45 phút) | Màu đỏ, lý do chứa "vượt định mức" |
| 6 | Vàng khi sắp vượt định mức | `WO-2427`, bước 3 đang chạy 26/30 phút (87%) | Màu vàng |
| 7 | Đỏ khi có NCR Major chưa đóng | `WO-2427` kèm một NCR Major đang mở | Màu đỏ |
| 8 | Xám khi hoàn thành | `WO-2426` | Nhãn hoàn thành |
| 9 | Phát hiện trạm SMT đang nghẽn | Tải trạm tính từ toàn bộ lệnh mẫu | Cảnh báo đầu tiên là trạm SMT, mức đỏ |
| 10 | OEE là tích ba thành phần | OEE toàn xưởng từ dữ liệu mẫu | OEE bằng Sẵn sàng × Hiệu suất × Chất lượng, lớn hơn 0 và không vượt 1 |

### 3.3 Build bản web

`npx expo export --platform web` đóng gói toàn bộ ứng dụng bằng Metro. Bước này vừa kiểm cú pháp và import ở mọi màn hình, vừa tạo sản phẩm để chạy E2E.

### 3.4 E2E toàn luồng ba vai trò (`e2e/flow-all-roles.js`)

**Logic kiểm thử.** Mở bản web đã build trong Chromium headless ở khổ điện thoại, camera giả lập. Kịch bản đi như một người dùng thật: chạm vào chữ hiển thị trên giao diện, điền ô nhập, bấm nút, rồi kiểm tra chữ mong đợi xuất hiện hoặc hộp thoại có nội dung đúng. Các bước **nối tiếp và dùng chung dữ liệu**: NCR và yêu cầu cấp bù do kỹ thuật viên tạo ở đầu kịch bản chính là dữ liệu mà QC và quản lý xử lý ở cuối. Mỗi kiểm tra in `OK` hoặc `FAIL`; có bất kỳ `FAIL` nào thì kịch bản thoát mã 1. Kết quả lần gần nhất: 34/34 đạt.

**Vai trò kỹ thuật viên (`VTX1001`)**

| # | Thao tác | Kỳ vọng |
|---|---|---|
| 1 | Đăng nhập với PIN sai | Báo "Mã PIN không đúng." |
| 2 | Đăng nhập đúng | Hiện "Lệnh được giao (2)" |
| 3 | Mở `WO-2427` | Thấy công đoạn "Hàn sóng" |
| 4 | Bấm Hoàn thành khi chưa bắt đầu | Bị từ chối, thông báo "Hãy bấm BẮT ĐẦU trước…" |
| 5 | Bấm Bắt đầu công đoạn | Trạng thái "Đang chạy" |
| 6 | Bấm Hoàn thành khi chưa quét linh kiện | Bị từ chối, nêu ADUM4160 (0/1), STM32F407 (0/1) |
| 7 | Mở hướng dẫn công đoạn | Hiện các bước và lưu ý an toàn (chỉ chụp ảnh để xem, không có kiểm tra tự động) |
| 8 | Quét mã demo `LM358` (ngoài BOM) | "Sai mã: LM358…" |
| 9 | Quét mã ADUM4160 với COC sai | "Không khớp chứng chỉ xuất xứ" |
| 10 | Quét ADUM4160 lô `L2345A` | "KHỚP BOM" |
| 11 | Quét STM32F407 lô `L2401B` | Hiện nút "ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN" |
| 12 | Quay lại, bấm Hoàn thành | "Đã hoàn thành công đoạn Hàn sóng"; sang bước "Lắp cơ khí" |
| 13 | Bắt đầu bước 4, quét CONN-DB9 lô `L2212E` | Báo "hết hạn sử dụng" |
| 14 | Yêu cầu cấp bù CONN-DB9, bật tạm giữ lệnh | "Đã gửi yêu cầu"; lệnh hiện "Lệnh đang bị giữ" |
| 15 | Chụp ảnh hồ sơ, chạm hai vùng khoanh lỗi, ghi chú, lưu | "(2 vùng)"; mục "Ảnh hồ sơ sản xuất (1)" |
| 16 | Lập NCR Major nhóm Mối hàn, đính kèm ảnh có khoanh vùng | "Ảnh đính kèm (1)"; gửi xong ra `NCR-0002` |
| 17 | Bật chế độ ngoại tuyến, lập NCR cho `WO-2428` | "Đang ngoại tuyến"; hàng đợi báo "1 thay đổi được lưu trên máy" |
| 18 | Tải lại trang | Hàng đợi vẫn còn 1 thay đổi (dữ liệu được lưu bền) |
| 19 | Tắt chế độ ngoại tuyến | "Mọi thay đổi đã được đồng bộ." |

**Vai trò QC (`VTX2001`)**

| # | Thao tác | Kỳ vọng |
|---|---|---|
| 20 | Đăng nhập | Màn hình chính có "Lô chờ IQC" |
| 21 | IQC lô MAX31855: chọn Đạt cả 6 hạng mục, Chấp nhận | "Đã chấp nhận lô L2310C…" |
| 22 | IQC lô CAP100N: 1 hạng mục Không đạt, ghi lý do, Từ chối | Mở biểu mẫu NCR có sẵn "IQC từ chối lô L2399X"; gửi xong ra `NCR-0004` |
| 23 | Mở PQC của `WO-2429` | Hiện "Lệnh đang chờ duyệt FAI" |
| 24 | Chọn Đạt cả 5 hạng mục, lưu | "FAI đạt…"; "Lịch sử kiểm tra (1)" |
| 25 | Mở `NCR-0002`: tiếp nhận, chọn hướng xử lý Rework, nhập nguyên nhân, đóng | Trạng thái "Đã đóng" |
| 26 | Truy xuất theo số lô `L2401B` | "STM32F407 · Lô L2401B → WO-2427" |

**Vai trò quản lý (`VTX3001`)**

| # | Thao tác | Kỳ vọng |
|---|---|---|
| 27 | Đăng nhập | Dashboard có "Cảnh báo bottleneck" |
| 28 | Đếm yêu cầu cấp bù chờ duyệt | Đúng 2 (1 mẫu + 1 do kỹ thuật viên ở bước 14) |
| 29 | Duyệt cả hai yêu cầu | Danh sách chờ duyệt trống |
| 30 | Tăng ưu tiên `WO-2430` ở tab Điều phối | Thứ tự thay đổi (chỉ chụp ảnh để xem, không có kiểm tra tự động) |
| 31 | Mở `WO-2428` | Không còn "Lệnh đang bị giữ" (tự gỡ giữ sau khi duyệt) |
| 32 | Giữ lệnh với lý do "Máy SMT bảo trì" | Lý do hiện trên lệnh |
| 33 | Bấm Gỡ giữ | Banner "Lệnh đang bị giữ" biến mất |

Ghi chú: bảng liệt kê theo thao tác; số kiểm tra tự động (34) tính theo số điểm kiểm trong mã, một thao tác có thể có nhiều điểm kiểm hoặc không có. Các bước 7 và 30 chỉ chụp ảnh nên việc đổi thứ tự ưu tiên chưa được kiểm tự động; ngoài ra, các bước đăng nhập của QC (20) và quản lý (27) được kiểm gộp với màn hình chính.

### 3.5 E2E hồi quy lỗi kẹt (`e2e/regress-stuck.js`)

Viết sau khi người dùng báo kỹ thuật viên bị dừng ở màn hình lệnh sản xuất. Kịch bản tái hiện đúng tình huống cũ và kiểm tra trạng thái mới. Kết quả: 13/13 đạt.

| # | Thao tác | Kỳ vọng |
|---|---|---|
| 1 | Mở `WO-2428` (đang bị giữ) | Có khung "Bước tiếp theo" và nội dung "Lệnh đang bị giữ (Chờ linh kiện cấp bù)" |
| 2 | Bấm Bắt đầu | Hộp thoại "Lệnh đang bị giữ: Chờ linh kiện cấp bù." |
| 3 | Mở `WO-2427` | Khung gợi ý "Bấm BẮT ĐẦU CÔNG ĐOẠN để tính giờ." |
| 4 | Bấm Hoàn thành khi chưa bắt đầu | Hộp thoại "Hãy bấm BẮT ĐẦU trước…" |
| 5 | Bấm Bắt đầu | Gợi ý chuyển thành "đã 0/2" linh kiện |
| 6 | Quét tay mã chỉ có `adum4160` | "LỖI ĐỐI SOÁT" và bộ chọn "Nhãn không ghi số lô, chọn lô đang cầm trên tay" |
| 7 | Chọn lô `L2345A` | "KHỚP BOM" |
| 8 | Quét `STM32F407`, chọn lô `L2401B` | Hiện nút "ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN" |
| 9 | Quay lại màn lệnh | Gợi ý "Đã đủ điều kiện. Bấm HOÀN THÀNH BƯỚC." |
| 10 | Bấm Hoàn thành | "Đã hoàn thành công đoạn…", sang "Lắp cơ khí" |

### 3.6 Rà soát giao diện bằng ảnh chụp

E2E chụp ảnh ở các bước chính (đăng nhập, lệnh, quét mã, chụp ảnh, NCR, IQC, PQC, dashboard…) vào `e2e/shots/`. Người kiểm thử xem từng ảnh để phát hiện lỗi mà các kiểm tra tự động bằng chữ không bắt được: chữ bị cắt, hình bị lệch, số liệu bất thường. Cách này tìm ra 3 lỗi ở mục 4.

### 3.7 Chạy tay trên điện thoại

Người dùng chạy ứng dụng bằng Expo Go trên iPhone. Đã xác nhận bằng ảnh chụp (14/11/2026): màn hình **Dashboard của quản lý** hiển thị đúng cảnh báo trạm SMT, yêu cầu cấp bù chờ duyệt và tiến độ các lệnh. Lần chạy đầu tiên vô tình dùng bản cũ chưa cập nhật nên chưa đại diện cho bản hiện tại. Các luồng còn lại (quét QR bằng camera thật, chụp ảnh, hoàn thành công đoạn trên điện thoại) **chưa có kết quả xác nhận**.

## 4. Lỗi phát hiện và đã xử lý

| # | Lỗi | Phát hiện bởi | Nguyên nhân | Cách sửa |
|---|---|---|---|---|
| 1 | Bản web không khởi động: `Cannot use 'import.meta' outside a module` | Build web và lần chạy E2E đầu tiên | Bản ESM của zustand dùng `import.meta` mà Metro web không hiểu | Thêm `babel.config.js` bật `unstable_transformImportMeta`, cài `babel-preset-expo` đúng phiên bản |
| 2 | Vòng khoanh vùng lỗi sai vị trí trên web | Xem ảnh chụp bước chụp ảnh | Sự kiện chạm trên web không có `locationX/locationY` | Đọc thêm `offsetX/offsetY` |
| 3 | Nhãn thanh tab bị cắt | Xem ảnh chụp dashboard | Biểu tượng tab đặt kích thước cố định quá lớn | Dùng kích thước do thanh tab cung cấp |
| 4 | OEE trạm Kho bằng 0% | Xem ảnh chụp dashboard | Dữ liệu mẫu thiếu số liệu sản lượng của trạm Kho | Bổ sung số liệu vào dữ liệu mẫu |
| 5 | Nút tăng/giảm ưu tiên lồng trong thẻ lệnh bấm được, khiến E2E báo trùng phần tử | Lần chạy E2E ở bước điều phối | Nút nằm bên trong một thẻ cũng là nút | Tách nút ra ngoài thẻ lệnh |
| 6 | Kỹ thuật viên bị kẹt ở màn hình lệnh: nút mờ không phản hồi, nhãn QR chỉ có mã linh kiện bị từ chối hẳn | Người dùng báo | Nút `disabled` không nêu lý do; đối soát đòi đủ 5 trường | Nút luôn bấm được và nêu lý do; thêm khung "Bước tiếp theo"; cho chọn lô khi nhãn thiếu số lô; thêm kịch bản hồi quy (mục 3.5) |

Một kiểm tra trong E2E (nút Hoàn thành bị mờ trước khi bắt đầu) trở nên lỗi thời sau sửa lỗi số 6 và đã được thay bằng kiểm tra "bấm vào thì bị từ chối kèm lý do".

## 5. Kết quả lần chạy gần nhất

| Hạng mục | Kết quả |
|---|---|
| `npm run typecheck` | Đạt |
| `npm run lint` | Đạt, không cảnh báo |
| `npm test` | 2 tệp, 20/20 ca đạt (khoảng 0,3 giây) |
| `expo export --platform web` | Thành công |
| `e2e/flow-all-roles.js` | 34/34 kiểm tra đạt |
| `e2e/regress-stuck.js` | 13/13 kiểm tra đạt |

## 6. Phạm vi chưa kiểm thử và hạn chế

- **Không có unit test cho store** (`store/useMesStore.ts`). Các quy tắc trong store (hoàn thành công đoạn, giữ và gỡ giữ lệnh, duyệt cấp bù, đóng NCR) chỉ được kiểm gián tiếp qua E2E. Đây là khoảng trống lớn nhất của bộ kiểm thử.
- **Không đo độ phủ mã** (coverage) và không có CI, nên các lệnh ở mục 2 phải chạy tay.
- **E2E chạy trên web (react-native-web) với camera giả lập**, không phải trên Android hoặc iOS. Chưa kiểm: quét QR bằng camera thật, lưu ảnh vào bộ nhớ máy bằng `expo-file-system`, rung phản hồi, phát hiện mạng thật bằng NetInfo, giao diện khi bàn phím hiện.
- **Kịch bản E2E chọn phần tử theo chữ tiếng Việt trên giao diện**, nên đổi nhãn nút hoặc câu chữ sẽ làm kịch bản trượt dù chức năng vẫn đúng. Các bước còn phụ thuộc nhau theo thứ tự.
- **Chưa có máy chủ**, nên không có kiểm thử đồng bộ nhiều thiết bị, xung đột dữ liệu hay xác thực thật.
- **Chưa kiểm thử hiệu năng, độ bền khi dùng lâu và trợ năng** ngoài các nhãn truy cập đặt trên nút.
- **Dữ liệu OEE đầu vào** (dừng máy, sản lượng trạm) là số mẫu nên chỉ kiểm được công thức, không kiểm được độ chính xác so với thực tế.
