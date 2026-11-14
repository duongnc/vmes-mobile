# vMES Architecture Documentation

## Tổng Quan Kiến Trúc

vMES là ứng dụng di động (Expo / React Native) chạy hoàn toàn trên máy: **chưa có backend**. Dữ liệu nghiệp vụ nằm trong Zustand store và được lưu xuống AsyncStorage; điểm nối với máy chủ tương lai là `services/api.ts`. Hai đặc tính chính: **offline-first** (mọi thao tác chạy được khi mất mạng, thay đổi vào hàng đợi đồng bộ) và **phân quyền theo vai trò** (kỹ thuật viên, QC, quản lý).

```
┌────────────────────────────────────────────────────────────────┐
│ Giao diện (app/, components/) - Expo Router                    │
│ Màn hình chính và tab thay đổi theo vai trò:                   │
│   Kỹ thuật viên: tab Lệnh SX                                   │
│   QC: tab Kiểm tra                                             │
│   Quản lý: tab Dashboard và Điều phối                          │
│   Dùng chung: NCR, Thông báo, Tài khoản                        │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Logic nghiệp vụ                                                │
│   store/useMesStore.ts   dữ liệu và action (Zustand)           │
│   store/useAuthStore.ts  phiên đăng nhập                       │
│   lib/scan.ts, lib/metrics.ts   logic thuần, có unit test      │
└────────────────────────────────────────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────────┐
│ Lưu trữ cục bộ                                                 │
│   AsyncStorage: vmes-data, vmes-auth (zustand persist)         │
│   Hệ thống tệp: Paths.document/photos/ (ảnh)                   │
│   syncQueue (hàng đợi đồng bộ) + NetInfo (trạng thái mạng)     │
└────────────────────────────────────────────────────────────────┘
                              ▼  services/api.ts: pushChanges()
                                 (hiện chỉ mô phỏng độ trễ 600 ms)
┌────────────────────────────────────────────────────────────────┐
│ Backend API (chưa triển khai)                                  │
└────────────────────────────────────────────────────────────────┘
```

## Folder Structure Chi Tiết

```
vmes-mobile/
├── app/                               # Expo Router - File-based routing
│   ├── _layout.tsx                   # Root Stack, Stack.Protected theo đăng nhập, NetInfo, giám sát quá giờ
│   ├── login.tsx                     # Đăng nhập mã nhân viên + PIN
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Tab theo vai trò (Tabs.Protected)
│   │   ├── index.tsx                 # KTV: lệnh SX · QC: IQC/PQC · Quản lý: dashboard
│   │   ├── work-orders.tsx           # Điều phối ưu tiên (Quản lý)
│   │   ├── ncr.tsx                   # Danh sách NCR
│   │   ├── notifications.tsx         # Thông báo theo vai trò
│   │   └── profile.tsx               # Tài khoản, offline, hàng đợi đồng bộ
│   ├── work-order/[id].tsx           # Chi tiết lệnh: công đoạn, đếm giờ, BOM, ảnh
│   ├── scanner.tsx                   # Quét QR + đối soát
│   ├── camera.tsx                    # Chụp ảnh + khoanh vùng lỗi
│   ├── ncr/new.tsx, ncr/[id].tsx     # Tạo / xử lý NCR
│   ├── iqc/[id].tsx                  # Kiểm tra đầu vào
│   ├── pqc/[woId].tsx                # Kiểm tra quá trình / FAI
│   └── trace.tsx                     # Truy xuất nguồn gốc
│
├── components/
│   ├── ui.tsx                        # UI kit: Screen, Card, Button, Badge, Chips, Field…
│   ├── wo-card.tsx, rows.tsx         # Thẻ lệnh SX, NCR, yêu cầu cấp bù, nhật ký
│   ├── checklist.tsx                 # Phiếu kiểm Đạt / Không đạt
│   ├── marked-photo.tsx              # Ảnh + vòng khoanh vùng lỗi
│   └── home/                         # Màn hình chính theo vai trò
│
├── lib/                               # Logic thuần, có unit test
│   ├── scan.ts                       # Phân tích mã QR, đối soát BOM/IQC/COC/hạn dùng
│   ├── metrics.ts                    # Tiến độ, màu trạng thái, bottleneck, OEE
│   ├── format.ts, photos.ts
│
├── store/
│   ├── types.ts                      # Mô hình dữ liệu
│   ├── seed.ts                       # Dữ liệu mẫu (thay cho máy chủ)
│   ├── useAuthStore.ts               # Phiên đăng nhập
│   └── useMesStore.ts                # Lệnh SX, chất lượng, thông báo, truy xuất, đồng bộ
│
├── services/api.ts                   # pushChanges(): điểm nối backend (hiện mô phỏng)
├── __tests__/                        # Jest: scan.test.ts, metrics.test.ts
├── e2e/                              # Playwright E2E trên bản web (flow-all-roles, regress-stuck, serve)
├── docs/                             # Báo cáo đồ án (docx)
├── constants/theme.ts                # Màu sắc, nhãn trạng thái
└── test.md, SPECS.md                 # Tài liệu kiểm thử, bảng specs và hiệu năng
```

## State Management (Zustand)

Hai store, đều `persist` xuống AsyncStorage nên dữ liệu còn nguyên khi tắt ứng dụng hoặc mất mạng:

- **useAuthStore** – `userId`, `login(code, pin)`, `logout()`.
- **useMesStore** – toàn bộ dữ liệu nghiệp vụ và action:

```typescript
{
  workOrders, iqcLots, ncrs, partRequests, pqcRecords,   // dữ liệu nghiệp vụ
  notifications, trace,                                  // thông báo, nhật ký truy xuất
  syncQueue, netConnected, forcedOffline, lastSyncAt,    // đồng bộ offline

  startStep / pauseStep / completeStep(woId)             // công đoạn + đếm giờ
  scan(woId, raw)                                        // đối soát mã quét
  requestPart / decideRequest / movePriority / setHold / releaseHold
  createNcr / updateNcr / inspectLot / savePqc
  syncNow()                                              // đẩy hàng đợi khi có mạng
}
```

Mọi action thay đổi dữ liệu đều gọi `record()` nội bộ: ghi một `TraceEvent` (phục vụ truy xuất) và một `SyncItem` vào hàng đợi. Khi `netConnected && !forcedOffline`, hàng đợi được đẩy qua `services/api.ts`.

### Quy tắc nghiệp vụ chính

- Chỉ hoàn thành công đoạn khi đã bắt đầu tính giờ và quét đủ linh kiện BOM của công đoạn đó.
- Lệnh bị giữ (`hold`) không thể chạy: chờ cấp bù (gỡ khi quản lý duyệt), chờ FAI (gỡ khi QC lưu FAI đạt), NCR Critical (gỡ khi NCR đóng), hoặc quản lý giữ thủ công.
- Màu trạng thái: **đỏ** nếu bị giữ / vượt định mức / NCR Major-Critical mở / trễ hạn; **vàng** nếu ≥ 80% định mức / NCR Minor mở / chờ duyệt cấp bù; còn lại **xanh**.
- OEE = Availability × Performance × Quality; Performance tính từ thời gian thực tế so với định mức của các công đoạn đã xong.

## Mô Hình Dữ Liệu

Toàn bộ kiểu dữ liệu nằm trong `store/types.ts`. Ứng dụng **không có cơ sở dữ liệu quan hệ**: dữ liệu là các mảng đối tượng JSON trong `useMesStore`, lưu xuống AsyncStorage. Các thực thể tham chiếu nhau bằng **mã chuỗi** (`woId`, `lotId`, `ncrId`, `mpn`…); hệ thống không có khóa ngoại và không tự thực thi ràng buộc toàn vẹn, các quy tắc nằm trong action của store (`store/useMesStore.ts`) và logic thuần (`lib/scan.ts`, `lib/metrics.ts`).

### Sơ đồ quan hệ

```
User ──────────────(assigneeId)────────────┐
                                           ▼
                                      WorkOrder ──── 0..1 Hold
                                       │  │  │
                       ┌───────────────┘  │  └───────────────┐
                       ▼                  ▼                  ▼
                1..* Step           0..* BomItem        0..* Photo ── 0..* PhotoMark
                  (no)                 │  (stepNo → Step.no)
                                       ▼
                                  0..* ScannedLot

PartRequest ──(woId)──▶ WorkOrder
PqcRecord   ──(woId, stepNo)──▶ WorkOrder / Step ── 1..* CheckItem
Ncr ──(woId?, stepNo?)──▶ WorkOrder      Ncr ──(lotId?)──▶ IqcLot
Ncr ── 0..* Photo,  1..* NcrHistory
IqcLot ── 1..* CheckItem        BomItem.mpn + ScannedLot.lot  ⇄  IqcLot.mpn + IqcLot.lot  (đối soát khi quét)
TraceEvent ──(woId?, ncrId?, mpn?, lot?)──▶ các thực thể trên     (nhật ký chỉ thêm)
AppNotification ──(roles[], readBy[])──▶ Role / User             SyncItem: hàng đợi đồng bộ
StationStat: số liệu trạm, dùng cho OEE
```

Thực thể lồng nhau (`Step`, `BomItem`, `ScannedLot`, `Photo`, `NcrHistory`, `CheckItem`) nằm **bên trong** đối tượng cha, không có bảng riêng.

### Thực thể

| Thực thể | Khóa | Thuộc tính chính | Quan hệ và ghi chú |
|---|---|---|---|
| `User` | `id` (`u1`…); `code` duy nhất (`VTX1001`) | `code`, `pin`, `name`, `role`, `station?` | Là `assigneeId` của lệnh. Dữ liệu tài khoản nằm trong `store/seed.ts` |
| `WorkOrder` | `id` (`WO-2427`) | `product`, `productCode`, `qty`, `priority` (1 = cao nhất), `dueDate` (`YYYY-MM-DD`), `assigneeId`, `hold?`, `steps[]`, `bom[]`, `photos[]`, `completedAt?` | Chứa `Step`, `BomItem`, `Photo`. Xong khi mọi `Step` ở trạng thái `done` |
| `Step` | `no` (duy nhất trong một lệnh) | `name`, `station`, `standardMin`, `status`, `startedAt?`, `elapsedSec`, `finishedAt?`, `operatorId?`, `overtimeNotified?`, `instructions[]`, `cautions?` | Bước hiện tại là bước đầu tiên chưa `done` |
| `BomItem` | `id` | `mpn`, `name`, `stepNo`, `qtyRequired`, `scans[]` | `stepNo` trỏ tới `Step.no`; đủ khi `scans.length ≥ qtyRequired` |
| `ScannedLot` | không có | `lot`, `dateCode`, `coc`, `at`, `by` | Một lần quét đạt. Thuộc `BomItem.scans` |
| `Hold` | không có | `type`, `reason`, `at` | Tối đa một `Hold` cho mỗi lệnh |
| `Photo` | `id` | `uri`, `takenAt`, `by`, `note?`, `marks[]` | Thuộc `WorkOrder.photos` hoặc `Ncr.photos`. Tệp ảnh nằm ở `Paths.document/photos/`, store chỉ giữ URI |
| `PhotoMark` | không có | `x`, `y`, `r` (tọa độ và bán kính tương đối, 0 đến 1) | Vòng khoanh vùng lỗi trên ảnh |
| `PartRequest` | `id` (`PR-0001`) | `woId`, `mpn`, `qty`, `reason`, `status`, `requestedBy`, `createdAt`, `decidedBy?`, `decidedAt?` | Trỏ tới `WorkOrder` qua `woId` |
| `Ncr` | `id` (`NCR-0001`) | `woId?`, `stepNo?`, `lotId?`, `mpn?`, `severity`, `category`, `description`, `qtyDefect`, `photos[]`, `status`, `disposition?`, `rootCause?`, `createdBy`, `createdById`, `createdAt`, `history[]` | Tham chiếu lệnh, bước, lô (đều tùy chọn) |
| `NcrHistory` | không có | `at`, `by`, `action`, `note?` | Chỉ thêm vào cuối, thuộc `Ncr.history` |
| `IqcLot` | `id`; cặp (`mpn`, `lot`) dùng để tra khi quét | `mpn`, `name`, `lot`, `dateCode`, `expiry`, `coc`, `supplier`, `qty`, `receivedAt`, `status`, `checklist[]`, `note?`, `inspectedBy?`, `inspectedAt?` | Chỉ lô `accepted` mới được dùng |
| `CheckItem` | không có | `label`, `result` | Phiếu kiểm của `IqcLot.checklist` hoặc `PqcRecord.items` |
| `PqcRecord` | `id` (`PQC-…`) | `woId`, `stepNo`, `type` (`FAI`/`PQC`), `items[]`, `result`, `note?`, `by`, `at` | `result = pass` khi mọi mục `pass` |
| `TraceEvent` | `id` (`T-…`) | `at`, `by`, `type`, `message`, `woId?`, `mpn?`, `lot?`, `ncrId?` | Nhật ký chỉ thêm; giữ **500** sự kiện mới nhất |
| `AppNotification` | `id` (`N-…`) | `title`, `body`, `level`, `roles[]`, `createdAt`, `readBy[]`, `href?` | Gửi theo vai trò; `readBy` chứa `User.id`; giữ **200** thông báo mới nhất |
| `SyncItem` | `id` (`S-…`) | `type`, `summary`, `createdAt`, `syncedAt?` | Sinh cùng mỗi `TraceEvent`. Giữ mọi mục chưa đồng bộ và 30 mục đã đồng bộ gần nhất |
| `StationStat` | `station` | `plannedMin`, `downtimeMin`, `goodUnits`, `defectUnits` | Cấp dữ liệu cho Availability và Quality của OEE |

### Giá trị liệt kê và vòng đời

| Trường | Giá trị | Chuyển trạng thái |
|---|---|---|
| `User.role` | `technician`, `qc`, `manager` | Không đổi |
| `Step.status` | `pending`, `running`, `paused`, `done` | `pending` → `running` ⇄ `paused` → `done`. Hoàn thành cần đã bắt đầu và quét đủ BOM của bước |
| `Hold.type` | `part`, `fai`, `manual` | `part` gỡ khi quản lý **duyệt** một yêu cầu và lệnh không còn yêu cầu nào đang chờ (từ chối yêu cầu cuối cùng thì không tự gỡ); `fai` gỡ khi lưu FAI đạt; `manual` do quản lý giữ, hoặc do NCR Critical và gỡ khi NCR đó đóng |
| `PartRequest.status` | `pending`, `approved`, `rejected` | `pending` → `approved` hoặc `rejected` |
| `Ncr.severity` | `minor`, `major`, `critical` | Không đổi. `critical` gắn lệnh sẽ tự tạm dừng bước đang chạy và giữ lệnh |
| `Ncr.status` | `open`, `reviewing`, `closed` | `open` → `reviewing` → `closed`, hoặc `open` → `closed` trực tiếp; `closed` → `open` (Mở lại NCR) |
| `Ncr.disposition` | `rework`, `scrap`, `use-as-is`, `return` | Chọn khi đóng NCR |
| `IqcLot.status` | `pending`, `accepted`, `rejected` | `pending` → `accepted` hoặc `rejected` |
| `CheckItem.result` | `pass`, `fail`, `null` | `null` = chưa kiểm |
| `TraceEvent.type` | `scan-ok`, `scan-fail`, `step`, `photo`, `ncr`, `iqc`, `pqc`, `request`, `wo` | Cố định |
| `AppNotification.level` | `info`, `warning`, `danger`, `success` | Cố định |

Việc bắt buộc chọn hướng xử lý và nhập nguyên nhân gốc trước khi đóng NCR được kiểm ở giao diện (`app/ncr/[id].tsx`), **không** kiểm trong store.

### Quy ước dữ liệu

- **Thời điểm** là số mili giây từ epoch (`number`). **Ngày** là chuỗi `YYYY-MM-DD` (`dueDate`, `expiry`), so sánh bằng so sánh chuỗi.
- **Thời gian chạy của một bước** = `elapsedSec` (đã tích lũy) + `(now - startedAt)` khi bước đang `running`. `startedAt` chỉ có giá trị trong lúc chạy; khi tạm dừng, thời gian được cộng dồn vào `elapsedSec`.
- **Mã bản ghi:** dữ liệu mẫu dùng mã cố định. `PR-xxxx` và `NCR-xxxx` sinh từ số bản ghi hiện có cộng một (đệm 4 chữ số). Các mã còn lại dùng `uid(prefix)` = tiền tố + mốc thời gian (hệ 36) + bộ đếm.
- **Không xóa bản ghi**; trạng thái thay đổi tại chỗ, lịch sử nằm ở `TraceEvent` và `Ncr.history`.
- **Người thực hiện** được lưu lẫn lộn: một số trường lưu tên hiển thị (`by`, `requestedBy`, `decidedBy`, `createdBy`), một số lưu `User.id` (`assigneeId`, `operatorId`, `createdById`, `readBy`).

### Lưu trữ

| Nơi lưu | Nội dung | Ghi chú |
|---|---|---|
| AsyncStorage `vmes-auth` | `userId` | Phiên đăng nhập |
| AsyncStorage `vmes-data` (version 1) | `workOrders`, `iqcLots`, `ncrs`, `partRequests`, `pqcRecords`, `notifications`, `trace`, `stationStats`, `syncQueue`, `lastSyncAt`, `forcedOffline`, `draftPhotos` | Không lưu `hydrated`, `syncing`, `netConnected`. `persist` ghi lại toàn bộ trạng thái sau mỗi thay đổi (dữ liệu mẫu khoảng 20 kB) |
| Hệ thống tệp `Paths.document/photos/` | Tệp ảnh `<id>.<ext>` | Sao chép khỏi thư mục cache để không bị hệ điều hành dọn. Trên web, ảnh là data/blob URI |

`resetDemo()` đưa dữ liệu về `createSeed()` và xóa hàng đợi đồng bộ, ảnh nháp.

### Điểm cần xử lý khi nối backend

- **Mã `PR-` và `NCR-` sinh theo số bản ghi cục bộ**, nhiều máy sẽ sinh trùng mã. Cần cấp mã phía máy chủ hoặc dùng UUID.
- **`SyncItem` chỉ chứa `summary`**, không chứa dữ liệu thực thể, nên chưa đủ để máy chủ dựng lại trạng thái. Cần đồng bộ theo thực thể hoặc thêm payload.
- **Mỗi máy giữ toàn bộ lệnh, NCR, lô IQC**; chưa có phạm vi theo người dùng hay trạm.
- **Trường người thực hiện** lẫn tên và `id`; nên thống nhất dùng `id`.
- **Chưa có hàm `migrate`** cho `vmes-data`. Theo hành vi của Zustand `persist`, nếu tăng `version` mà không viết `migrate` thì dữ liệu đã lưu trên máy bị bỏ qua (Zustand chỉ ghi `console.error`) và store quay về dữ liệu mẫu.
- **`pin` nằm trong `User` ở phía máy khách**; cần xác thực phía máy chủ.

## Authentication & Authorization

### Phân Quyền (Role-Based Access Control)

| Vai trò | Tab hiển thị | Thao tác chính (theo mã nguồn) |
|---|---|---|
| Kỹ thuật viên (`technician`) | Lệnh SX, NCR, Thông báo, Tài khoản | Bắt đầu, tạm dừng, hoàn thành công đoạn; quét linh kiện; chụp ảnh hồ sơ; yêu cầu cấp bù |
| QC (`qc`) | Kiểm tra, NCR, Thông báo, Tài khoản | IQC (chấp nhận hoặc từ chối lô); PQC/FAI; xử lý và đóng NCR |
| Quản lý (`manager`) | Dashboard, Điều phối, NCR, Thông báo, Tài khoản | Đổi ưu tiên; giữ và gỡ giữ lệnh; duyệt cấp bù; xử lý NCR; xem dashboard và OEE |

Mọi vai trò đều lập được NCR và xem màn hình truy xuất (mã nguồn không chặn theo vai trò); thông báo được lọc theo vai trò.

Cơ chế thực thi:

- `Stack.Protected` trong `app/_layout.tsx`: chỉ người đã đăng nhập mới vào được các màn hình nghiệp vụ.
- `Tabs.Protected` trong `app/(tabs)/_layout.tsx`: tab Điều phối chỉ hiện với quản lý; tiêu đề tab đầu đổi theo vai trò.
- Từng màn hình ẩn hoặc hiện nút theo `user.role` (ví dụ `iqc/[id].tsx`, `pqc/[woId].tsx`, `ncr/[id].tsx`, `work-order/[id].tsx`).
- **Các action trong `useMesStore` không kiểm tra vai trò.** Phân quyền hiện chỉ nằm ở giao diện; khi có backend cần kiểm tra lại phía máy chủ.

### Login Flow

1. Người dùng nhập **mã nhân viên** (ví dụ `VTX1001`) và **PIN**.
2. `useAuthStore.login()` tìm mã trong danh sách `USERS` (`store/seed.ts`, không phân biệt hoa thường) rồi so PIN. Sai thì báo "Mã nhân viên không tồn tại." hoặc "Mã PIN không đúng.".
3. Đúng thì lưu `userId` vào AsyncStorage (`vmes-auth`). Không có token.
4. `Stack.Protected` chuyển sang nhóm màn hình đã đăng nhập; tab hiển thị theo `user.role`.
5. Toàn bộ xác thực chạy trên máy, không gọi máy chủ, nên hoạt động cả khi ngoại tuyến.

## Data Flow

### QR Code Scanning & Validation

Nhãn linh kiện có dạng `MPN|LÔ|DATECODE|HSD|COC` (tách theo `|` hoặc `;`). Logic nằm ở `lib/scan.ts`:

```
Nguồn mã: camera (expo-camera) | nhập tay | mã demo
            │
            ▼
   parseCode: tách MPN, lô, datecode, HSD, COC
            │
            ▼
   validateScan: kiểm tra lần lượt, dừng ở lỗi đầu tiên
     1. EMPTY              mã rỗng
     2. NOT_IN_BOM         MPN không có trong BOM của lệnh
     3. ALREADY_FULL       đã quét đủ số lượng
     4. NO_LOT_INFO        nhãn thiếu số lô
     5. LOT_UNKNOWN        lô chưa có hồ sơ IQC
     6. LOT_NOT_ACCEPTED   lô IQC chưa đạt hoặc bị từ chối
     7. EXPIRED            hết hạn (lấy mốc sớm hơn giữa nhãn và hồ sơ lô)
     8. COC_MISMATCH       COC không khớp hồ sơ lô
            │
      ┌─────┴──────┐
      ▼            ▼
     OK          Lỗi
      │            │
      ▼            ▼
  scan(): thêm ScannedLot   ghi TraceEvent scan-fail và hiện lý do
  vào BomItem.scans,        (NO_LOT_INFO: cho chọn lô đã qua IQC
  ghi TraceEvent scan-ok     và còn hạn thay vì từ chối hẳn)
```

### Production Progress Tracking

```
Thao tác (bắt đầu, tạm dừng, hoàn thành bước, quét, lập NCR…)
            │
            ▼
Action trong useMesStore cập nhật state
            ├──▶ zustand persist ghi lại vào AsyncStorage (vmes-data)
            ├──▶ record(): TraceEvent (giữ 500 mới nhất) + SyncItem vào syncQueue
            └──▶ notify(): AppNotification theo vai trò (giữ 200 mới nhất)
            │
            ▼
   Có mạng và không ép ngoại tuyến?
      ┌─────┴───────────────┐
      ▼                     ▼
     Có                   Không
      │                     │
      ▼                     ▼
syncNow(): pushChanges()   Giữ trong syncQueue; tự đồng bộ khi
(mô phỏng 600 ms), đánh    có mạng trở lại hoặc khi tắt chế độ
dấu syncedAt               ngoại tuyến
```

Thông báo cho quản lý hiện là thông báo cục bộ trên cùng máy; chưa có kênh đẩy qua máy chủ.

## Network Architecture

**Chưa triển khai.** Hiện ứng dụng không gọi mạng nào; `NetInfo` chỉ dùng để biết trạng thái kết nối. Thiết kế dự kiến khi có backend:

```
Mobile App ←── API / WebSocket ──→ Backend Server
    │                                   │
    │                                   ▼
    │                          Sự kiện thời gian thực
    │                          (hiện đã có dạng thông báo cục bộ)
    │                          - Công đoạn vượt định mức
    │                          - NCR mới, NCR nghiêm trọng
    │                          - Yêu cầu và duyệt cấp bù
    │                          - Kết quả IQC, PQC/FAI
    │                          - Đổi ưu tiên, hoàn thành lệnh
    │                                   │
    └───────────────────────────────────┘
                 Kéo dữ liệu cập nhật
```

## Offline-First Strategy

### Sync Engine

1. **Nơi lưu dữ liệu cục bộ:**
   - AsyncStorage: toàn bộ dữ liệu nghiệp vụ (`vmes-data`) và phiên đăng nhập (`vmes-auth`). Không dùng SQLite.
   - Hệ thống tệp: ảnh, tại `Paths.document/photos/`.

2. **Trạng thái kết nối:** `netConnected` (từ `NetInfo`, đăng ký trong `app/_layout.tsx`) và `forcedOffline` (công tắc ở tab Tài khoản để thử ngoại tuyến). `isOnline = netConnected && !forcedOffline`.

3. **Luồng đồng bộ:**
   ```
   Mỗi record() thêm một SyncItem vào syncQueue
           │
           ▼
   Đang online? ── Không ──▶ giữ trong hàng đợi
           │ Có
           ▼
   syncNow(): gọi pushChanges() một lần cho mọi mục chưa đồng bộ
           │
           ▼
   Đánh dấu syncedAt; giữ mọi mục chưa đồng bộ + 30 mục đã đồng bộ gần nhất
           │
           ▼
   Nếu có mục mới phát sinh trong lúc đồng bộ thì chạy tiếp
   ```
   `syncNow()` được kích hoạt khi: có bản ghi mới lúc đang online; mạng trở lại; tắt chế độ ngoại tuyến.

4. **Chưa có:**
   - Gửi dữ liệu thật: `pushChanges()` chỉ mô phỏng, và `SyncItem` chỉ chứa tóm tắt (`summary`), không chứa dữ liệu thực thể.
   - Thử lại có chờ tăng dần (backoff) và xử lý lỗi (`syncNow` chưa có `catch`).
   - Giải quyết xung đột (chưa có máy chủ). Dự kiến: thời điểm của máy chủ thắng, giữ thời điểm máy cục bộ để kiểm toán, dữ liệu quan trọng xem xét thủ công.
   - Đồng bộ ảnh: tệp ảnh không nằm trong hàng đợi.

## Camera & Scanner Integration

### QR Code Scanner Module

Cài đặt ở `app/scanner.tsx`:

- Dùng `CameraView` của `expo-camera`, đọc `qr`, `datamatrix`, `code128`.
- Quyền camera qua `useCameraPermissions`: chưa cấp quyền thì hiện nút "Cấp quyền camera" (nếu còn hỏi lại được).
- Ba nguồn mã: camera, nhập tay (ô "Nhập mã thủ công") và mã demo (cho máy không có camera, ví dụ Simulator).
- Sau mỗi lần đọc, camera tạm dừng ("Đã tạm dừng quét") đến khi bấm "Quét tiếp".
- Việc kiểm tra do `validateScan` đảm nhận (xem Data Flow). **Không có** kiểm tra checksum hay độ dài mã.

```
Quyền camera ──▶ CameraView (expo-camera) ──▶ parseCode ──▶ validateScan
                                                     │
                           ┌─────────────────────────┴──────────┐
                           ▼                                    ▼
                    OK: cập nhật store                 Lỗi: báo lý do, ghi nhật ký
```

## Image Capture & Storage

### Photo Documentation System

Cài đặt ở `app/camera.tsx` và `lib/photos.ts`:

```
Chụp bằng expo-camera (quality 0.5)  hoặc  chọn từ thư viện (expo-image-picker, quality 0.5)
            │
            ▼
Xem lại; chạm lên ảnh để khoanh vùng lỗi (PhotoMark); ghi chú
            │
            ▼
persistPhoto(): sao chép vào Paths.document/photos/<id>.<ext>
(web giữ nguyên URI; lỗi sao chép thì vẫn dùng tệp gốc)
            │
            ▼
Tạo Photo { id, uri, takenAt, by, note, marks }
            │
      ┌─────┴──────────────────────┐
      ▼                            ▼
target = mã lệnh              target = "draft"
addWoPhoto: lưu vào hồ sơ     addDraftPhoto: ảnh nháp, đính vào NCR
sản xuất, ghi TraceEvent      khi tạo NCR rồi xóa nháp
```

- Chỉ **URI** nằm trong store; tệp ảnh nằm trên hệ thống tệp, không đi qua hàng đợi đồng bộ. Khi có backend cần cơ chế tải ảnh riêng.
- Siêu dữ liệu ảnh: thời điểm chụp, người chụp, ghi chú, các vùng khoanh. Không lưu vị trí.

## Performance Optimization

### Chiến lược dữ liệu và bộ nhớ đệm

Không có tầng cache riêng và không có cơ sở dữ liệu cục bộ. Dữ liệu được tổ chức như sau:

- **Zustand store là nguồn dữ liệu duy nhất.** Khi mở app, `persist` nạp `vmes-data` từ AsyncStorage một lần (cờ `hydrated`); sau đó mọi đọc ghi đều trên bộ nhớ, và `persist` ghi lại sau mỗi thay đổi.
- **Giá trị suy ra không lưu**: tiến độ, màu trạng thái, điểm nghẽn, OEE được tính khi hiển thị bằng `lib/metrics.ts`.
- **Nhịp cập nhật:** đồng hồ đếm giờ 1 giây (`useNow`), chỉ chạy ở màn hình có bộ đếm; giám sát quá giờ 10 giây (`app/_layout.tsx`).
- **Giới hạn kích thước dữ liệu:** nhật ký truy xuất 500, thông báo 200, hàng đợi đồng bộ giữ 30 mục đã đồng bộ.
- **Ảnh:** nén ở mức 0,5 và lưu thành tệp; store chỉ giữ URI, không giữ base64.
- **React Compiler** được bật (`app.json`, `experiments.reactCompiler`).

Số đo thực tế (kích thước bundle, tốc độ logic, bộ nhớ) và so sánh với mục tiêu nằm ở `SPECS.md`, mục 10 và 11.

## Error Handling & Logging

### Error Categories

1. **Lỗi nghiệp vụ trong action:** trả về `ActionResult { ok, message }`; giao diện hiện bằng `notifyUser` (`Alert` trên di động, `window.alert` trên web). Ví dụ: "Hãy bấm BẮT ĐẦU trước khi hoàn thành công đoạn.", "Chưa đối soát đủ linh kiện…", "Lệnh đang bị giữ…".
2. **Lỗi đối soát linh kiện:** 8 mã lỗi của `validateScan` (xem Data Flow), mỗi lỗi có thông báo riêng và được ghi `TraceEvent` loại `scan-fail`.
3. **Lỗi nhập liệu:** thiếu trường bắt buộc thì hiện "Thiếu thông tin" (ví dụ chưa mô tả lỗi khi lập NCR, chưa chọn hướng xử lý khi đóng NCR).
4. **Lỗi hệ thống:** quyền camera bị từ chối thì hiện màn hình xin quyền; sao chép ảnh thất bại thì dùng tệp gốc.

**Chưa có xử lý cho:** đồng bộ thất bại (`syncNow` không có `catch`), hết dung lượng, hỏng dữ liệu AsyncStorage, `version` store không khớp (xem mục Mô Hình Dữ Liệu).

### Logging System

Không có hệ thống log riêng. **`TraceEvent` là nhật ký nghiệp vụ** (người thực hiện, thời điểm, nội dung; giữ 500 sự kiện mới nhất) và được hiển thị ở màn hình truy xuất. Không dùng Sentry hay Firebase, không ghi log ra tệp, không gửi log lên máy chủ.

## Technology Stack Justification

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Framework** | Expo SDK 54, React Native 0.81, React 19 (New Architecture, React Compiler) | Đa nền tảng iOS, Android, Web; phát triển nhanh |
| **State** | Zustand 5 + middleware `persist` | Nhẹ, ít khuôn mẫu, lưu bền xuống AsyncStorage |
| **Navigation** | Expo Router 6 (`typedRoutes`) trên React Navigation 7 | Định tuyến theo tệp, có kiểu dữ liệu |
| **Storage** | AsyncStorage (dữ liệu), `expo-file-system` (ảnh) | Chạy được ngoại tuyến; không dùng SQLite |
| **Network** | `@react-native-community/netinfo` (chỉ lấy trạng thái mạng) | Chưa có API client vì chưa có backend |
| **Camera** | `expo-camera` (quét và chụp), `expo-image-picker` (thư viện ảnh) | Tích hợp native, một bộ quyền camera cho cả quét lẫn chụp |
| **Styling** | React Native `StyleSheet` | Hiệu năng native |
| **Language** | TypeScript (`strict`) | An toàn kiểu |
| **Testing** | Jest (`jest-expo`); Playwright cho E2E bản web | Playwright chưa khai báo trong `package.json`, cần cài riêng |

## Security Considerations

### Hiện trạng

- **Xác thực chạy trên máy:** danh sách `USERS` và PIN nằm trong `store/seed.ts` (mã nguồn). Phù hợp bản demo, chưa phải xác thực thật.
- **Phân quyền chỉ ở giao diện** (`Stack.Protected`, `Tabs.Protected`, ẩn hiện nút); action trong store không kiểm tra vai trò.
- **Dữ liệu lưu cục bộ không mã hóa** (AsyncStorage); phiên chỉ là `userId`, không có token, không tự đăng xuất khi app ra nền, không sinh trắc học.
- **Dấu vết kiểm toán:** `TraceEvent` ghi người thực hiện (tên hiển thị) và thời điểm cho mọi thay đổi.

### Chưa triển khai (dự kiến khi có backend)

- HTTPS/TLS và xác thực bằng token (JWT) cho mọi lời gọi API; ghim chứng chỉ (certificate pinning).
- Xác thực và phân quyền phía máy chủ; không để PIN trong mã máy khách.
- Mã hóa dữ liệu nhạy cảm lưu trên máy (ví dụ SecureStore), đăng nhập sinh trắc học, tự đăng xuất khi ra nền.

## Testing Strategy

### Test Types

1. **Kiểm tra tĩnh:** `npm run typecheck` (`tsc --noEmit`) và `npm run lint`.
2. **Unit test (Jest + `jest-expo`):** `__tests__/scan.test.ts` (10 test) và `__tests__/metrics.test.ts` (10 test), chạy bằng `npm test`. Chỉ phủ logic thuần ở `lib/`.
3. **E2E (Playwright, bản web):** `e2e/flow-all-roles.js` (đi qua cả 3 vai trò) và `e2e/regress-stuck.js` (hồi quy lỗi kỹ thuật viên bị kẹt); `e2e/serve.js` phục vụ bản build từ `expo export`. Cần cài `playwright` riêng.
4. **Chưa có:** integration test cho store với component, kiểm thử hiệu năng tự động, kiểm thử trên thiết bị thật.

Chi tiết các ca kiểm thử ở `test.md`; số đo hiệu năng ở `SPECS.md`.

## Deployment & Updates

### Chạy và build hiện tại

- Phát triển: `npm start`, `npm run ios`, `npm run android`, `npm run web` (đều qua `expo start`).
- Bản web tĩnh: `npx expo export --platform web`.
- Chưa có tệp cấu hình build cho cửa hàng ứng dụng (`eas.json`).

### CI/CD Pipeline (Planned)

Repo chưa có `.github/workflows`. Quy trình dự kiến:

```
Git Push
  ↓
GitHub Actions
  ↓
Build & Test
  ↓
EAS Build
  ↓
Deploy APK/IPA
  ↓
OTA Update (EAS Update)
```

### Versioning

- Major.Minor.Patch; hiện là `1.0.0` trong `package.json` và `app.json`.
- Phiên bản schema dữ liệu lưu trên máy: `version: 1` của `vmes-data` (chưa có `migrate`).
