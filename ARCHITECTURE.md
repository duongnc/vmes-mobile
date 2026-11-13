# vMES Architecture Documentation

## Tổng Quan Kiến Trúc

vMES được thiết kế theo mô hình **3-tier architecture** với phân tách rõ ràng giữa presentation layer, business logic, và data layer. Ứng dụng di động hỗ trợ **offline-first** và **role-based access**.

```
┌─────────────────────────────────────────────────┐
│           Presentation Layer                    │
│  (React Native UI - Tab Navigation)             │
│  ┌──────────────────────────────────────────┐  │
│  │ Technician Tab │ QC Tab │ Manager Tab    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────┐
│      Business Logic Layer (Hooks & Store)       │
│  ┌──────────────────────────────────────────┐  │
│  │ State Management (Zustand)                │  │
│  │ - useBomStore                            │  │
│  │ - useProductionStore                     │  │
│  │ - useQCStore                             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────┐
│          Data Layer (Storage & API)             │
│  ┌──────────────────────────────────────────┐  │
│  │ Local Storage (SQLite/AsyncStorage)      │  │
│  │ Cache Management                          │  │
│  │ Sync Engine (Offline-first)               │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
           ▼
┌─────────────────────────────────────────────────┐
│        Backend API (Future Implementation)      │
│  ┌──────────────────────────────────────────┐  │
│  │ RESTful API / GraphQL                    │  │
│  │ WebSocket (Real-time Notifications)      │  │
│  │ Database (PostgreSQL / MongoDB)          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
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
├── __tests__/                        # Jest
└── constants/theme.ts                # Màu sắc, nhãn trạng thái
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

## Authentication & Authorization

### Phân Quyền (Role-Based Access Control)

```
┌─────────────────────────────────┐
│      User Authentication        │
└─────────────────┬───────────────┘
                  │
        ┌─────────┴──────────┬─────────────┐
        │                    │             │
        ▼                    ▼             ▼
   TECHNICIAN            QC/QA         MANAGER
   (Lắp ráp)          (Kiểm tra)      (Quản lý)
   ┌──────────┐      ┌──────────┐    ┌──────────┐
   │ Quét mã  │      │ Kiểm tra │    │Dashboard │
   │ Lắp ráp  │      │ Tạo NCR  │    │ Cảnh báo │
   │ Ghi kết  │      │ Xem lỗi  │    │ Điều phối│
   │ quả      │      │ Truy xuất│    │ OEE      │
   └──────────┘      └──────────┘    └──────────┘
```

### Login Flow
1. User nhập username/password
2. Xác thực với server (hoặc local database nếu offline)
3. Lưu token vào SecureStore
4. Load role-specific UI
5. Redirect đến dashboard tương ứng

## Data Flow

### QR Code Scanning & Validation

```
┌──────────────────────┐
│  Quét QR Code        │
│  (Camera Input)      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Parse QR String      │
│ Extract MPN/LOT      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Lookup in BOM Store              │
│ - Kiểm tra MPN có tồn tại?       │
│ - Kiểm tra số lượng đã scan?     │
│ - Kiểm tra expiry date?          │
└──────────┬───────────────────────┘
           │
      ┌────┴─────┐
      │           │
      ▼           ▼
   PASS        FAIL
    │            │
    ▼            ▼
Add to   Show Error &
Scanned  Suggest Action
Items
    │
    ▼
Update UI &
Local Storage
```

### Production Progress Tracking

```
Technician Action → Local Update → Store Update
                         │
                         ▼
                   Save to Local DB
                         │
                         ▼
                   Sync Queue
                         │
        ┌────────────────┴────────────────┐
        │                                 │
   Online?                           Offline?
        │                                 │
        ▼                                 ▼
  Push to Server            Wait for Connection
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
                   Update Remote DB
                         │
                         ▼
                   Notify Manager
```

## Network Architecture

### Real-time Communication (Planned)

```
Mobile App ←─WebSocket─→ Backend Server
    │                        │
    │                        ▼
    │                  Real-time Events
    │                  - Bottleneck Alert
    │                  - Equipment Failure
    │                  - Low Stock Alert
    │                        │
    └────────────────────────┘
         Pull Updated Data
```

## Offline-First Strategy

### Sync Engine

1. **Local Storage Hierarchy:**
   - SQLite: Structured data (BOM, Work Orders, Results)
   - AsyncStorage: Preferences, Cache
   - File System: Images, Logs

2. **Sync Logic:**
   ```
   Changes Made Offline
           │
           ▼
   Store in Queue
           │
           ▼
   Wait for Network
           │
           ▼
   Batching & Retry
           │
           ▼
   Push to Server
           │
           ▼
   Verify & Update Local
           │
           ▼
   Clear Queue Entry
   ```

3. **Conflict Resolution:**
   - Server timestamp wins
   - Local timestamp recorded for audit
   - Manual review for critical data

## Camera & Scanner Integration

### QR Code Scanner Module

```
┌─────────────────────────────────┐
│   Camera Permission Handler      │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Camera Component (expo-camera) │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   QR Code Decoder               │
│   (expo-camera)        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Parse & Validate              │
│   - Format check                │
│   - Checksum verify             │
│   - Length validation           │
└────────┬────────────────────────┘
         │
    ┌────┴─────┐
    │           │
    ▼           ▼
 VALID      INVALID
    │           │
    ▼           ▼
Process      Alert User
    │
    ▼
Update Store
```

## Image Capture & Storage

### Photo Documentation System

```
User Action: "Chụp ảnh lỗi"
        │
        ▼
┌─────────────────────────────────┐
│  Camera or Photo Library        │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Compress Image                 │
│  (Optimize for storage)         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Save to App Storage            │
│  /Documents/images/NCR_####/   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Attach to Record               │
│  (NCR, Inspection Result)       │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Sync with Metadata             │
│  (Timestamp, User, Location)    │
└─────────────────────────────────┘
```

## Performance Optimization

### Caching Strategy

```
┌─────────────────────────────────┐
│  Data Request                   │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Check Local Cache              │
│  (Zustand Store)                │
└────────┬────────────────────────┘
         │
    ┌────┴──────┐
    │            │
   HIT          MISS
    │            │
    ▼            ▼
 Return      Fetch from
 Cached      Local DB
 Data            │
    │            ▼
    │        ┌──────────────┐
    │        │ Query SQLite │
    │        └──────┬───────┘
    │               │
    │        ┌──────┴──────┐
    │        │             │
    │       HIT           MISS
    │        │             │
    │        ▼             ▼
    │      Update      Fetch from
    │      Store       Server
    │        │             │
    └────────┴─────────────┘
           │
           ▼
      Return Data &
      Update All Caches
```

## Error Handling & Logging

### Error Categories

1. **Network Errors**
   - Connection timeout
   - Server unavailable
   - Sync failure

2. **Validation Errors**
   - Invalid MPN format
   - BOM mismatch
   - Quantity exceed

3. **User Errors**
   - Missing required field
   - Duplicate scan
   - Invalid action sequence

4. **System Errors**
   - Camera permission denied
   - Storage full
   - Database corruption

### Logging System

```
Log Event
    │
    ├─→ Console (Development)
    ├─→ Local File (AsyncStorage)
    ├─→ Server (When online)
    └─→ Crash Reports (Sentry/Firebase)
```

## Technology Stack Justification

| Layer | Technology | Reason |
|-------|-----------|--------|
| **Framework** | React Native + Expo | Cross-platform, fast development, OTA updates |
| **State** | Zustand | Lightweight, performant, easy to use |
| **Navigation** | Expo Router | File-based routing, type-safe |
| **Storage** | SQLite + AsyncStorage | Offline capability, structured data |
| **Camera** | expo-camera, expo-camera | Native integration, performant |
| **Styling** | React Native StyleSheet | Native performance |
| **Language** | TypeScript | Type safety, better DX |
| **API Client** | Axios (planned) | Simple, powerful, interceptor support |

## Security Considerations

### Data Security

1. **In Transit:**
   - HTTPS/TLS for all API calls
   - Token-based authentication (JWT)
   - Certificate pinning (planned)

2. **At Rest:**
   - Sensitive data encrypted (AsyncStorage, SQLite)
   - Biometric authentication for login
   - Auto-logout on app background

3. **Access Control:**
   - Role-based permissions
   - User audit trail
   - Session management

## Testing Strategy

### Test Types

1. **Unit Tests:** Hooks, Store, Utils
2. **Integration Tests:** Store + Components
3. **E2E Tests:** User workflows
4. **Performance Tests:** Load testing, memory profiling

## Deployment & Updates

### CI/CD Pipeline (Planned)

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

- Major.Minor.Patch
- Track in package.json & app.json
- Release notes for each version
