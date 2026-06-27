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
│
├── app/                               # Expo Router - File-based routing
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Tab navigation layout
│   │   ├── index.tsx                 # Technician dashboard
│   │   └── explore.tsx               # Manager dashboard
│   ├── _layout.tsx                   # Root layout & navigation
│   ├── index.tsx                     # App entry point
│   ├── scanner.tsx                   # QR Code scanner screen
│   └── modal.tsx                     # Modal dialog template
│
├── components/                        # Reusable React Components
│   ├── ThemedText.tsx                # Text component with theme
│   ├── ThemedView.tsx                # View component with theme
│   ├── HapticTab.tsx                 # Tab with haptic feedback
│   ├── external-link.tsx             # External link component
│   ├── parallax-scroll-view.tsx       # Parallax scroll effect
│   ├── hello-wave.tsx                # Welcome animation
│   └── ui/
│       ├── Collapsible.tsx           # Collapsible menu
│       ├── icon-symbol.tsx           # Icon component
│       └── icon-symbol.ios.tsx       # iOS specific icon
│
├── hooks/                             # Custom React Hooks
│   ├── use-color-scheme.ts           # Color scheme detection
│   ├── use-color-scheme.web.ts       # Web-specific color scheme
│   └── use-theme-color.ts            # Theme color hook
│
├── store/                             # Zustand State Management
│   ├── useBomStore.ts                # BOM data & operations
│   ├── useProductionStore.ts         # Production status (planned)
│   ├── useQCStore.ts                 # QC data (planned)
│   └── useSyncStore.ts               # Offline sync (planned)
│
├── constants/
│   └── theme.ts                      # Theme colors & configuration
│
├── assets/
│   └── images/                       # Static images & icons
│
├── scripts/
│   └── reset-project.js              # Project reset utility
│
├── app.json                          # Expo configuration
├── tsconfig.json                     # TypeScript configuration
├── eslint.config.js                  # ESLint configuration
├── package.json                      # Dependencies
└── README.md                         # Project documentation
```

## State Management (Zustand)

### Store Structure

```typescript
// useBomStore.ts
{
  // State
  bom: BOMItem[]                    // Bill of Materials
  selectedOrder: WorkOrder          // Current work order
  scannedItems: ScannedItem[]       // Items scanned
  errors: ValidationError[]         // Validation errors
  
  // Actions
  setBOM(items: BOMItem[])          // Load BOM
  addScannedItem(item: ScannedItem) // Add scanned item
  validateBOM()                     // Validate against BOM
  syncToServer()                    // Sync to backend
}
```

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
│   (expo-barcode-scanner)        │
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
| **Camera** | expo-camera, expo-barcode-scanner | Native integration, performant |
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
