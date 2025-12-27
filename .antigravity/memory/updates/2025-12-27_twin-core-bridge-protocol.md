# Twin-Core Bridge Protocol - Session Documentation
> **Date**: 2025-12-27
> **Session ID**: BRIDGE-V1.0-PROVIDER-READY
> **Hash**: `BRIDGE-V1.0-PROVIDER-READY`
> **Status**: PRODUCTION READY

---

## QUICK NAVIGATION

| File | Content |
|------|---------|
| `API_EXPORT_PROTOCOL.md` | Nebula Data Bridge v1.0 - API specification for external consumers |

---

## EXECUTIVE SUMMARY

Bu oturum, mevcut **Liquidity Nebula** uygulamasının harici **Backtest & Anomali Tespiti** (code name: **Nebula Forge**) uygulamasına veri sağlayabilmesi için bir entegrasyon protokolü oluşturulmasını içermiştir.

### Key Deliverables:
1. **API Export Protocol Document** (`.antigravity/memory/API_EXPORT_PROTOCOL.md`) - Nebula Data Bridge v1.0 specification
2. **Context Hash Update** (`.antigravity/memory/CONTEXT_HASH.md`) - Sprint Oscar: Twin-Core Bridge Protocol

---

## SESSION TIMELINE

### Step 1: Context Alignment (System Initialization)

Oturum başlangıcında projenin mevcut durumu okunarak bağlam senkronizasyonu yapıldı:

**Okunan Dosyalar:**
| Dosya | Amaç |
|-------|------|
| `.antigravity/memory/00_GOVERNANCE.md` | Immutable file kuralları, APPEND-ONLY politikası |
| `.antigravity/memory/PROJECT_BIBLE.md` | Visual Language, Proxy-First mandate, Data Structures |
| `.antigravity/memory/TECH_STACK_LOCK.md` | lightweight-charts v5 constraints, SWR lock |
| `.antigravity/memory/CONTEXT_HASH.md` | Mevcut hash: `MVP-V1.6-TOKEN-METADATA-PROXY` |
| `.antigravity/memory/updates/2024-12-24_market-intelligence-system/_00_OVERVIEW.md` | Wide Cockpit UI, Backend Data Tunnel architecture |
| `store/useMarketStore.ts` | Zustand state management, persist middleware |
| `components/NebulaCanvas.tsx` | PixiJS WebGL visualization, streamStore pattern |
| `app/api/binance/metrics/route.ts` | Edge Runtime proxy, FUTURES/SPOT endpoints |
| `components/DetailDrawer.tsx` | Wide Cockpit layout, MetricChart integration |

**Anlaşılan Kısıtlamalar:**
- Proxy-First Architecture: Tüm harici API çağrıları `/api/*` route'ları üzerinden
- lightweight-charts v5: `addSeries(LineSeries, options)` syntax zorunlu
- Transient Update Pattern: High-frequency data için Mutable Ref + streamStore
- CSS Grid Discipline: `min-w-0 overflow-hidden` tüm chart grid item'larında

---

### Step 2: API Export Protocol Creation

**Görev:** Backtest uygulaması için API entegrasyon belgesi oluşturulması

**Araştırma Yapılan Dosyalar:**
| Dosya | İncelenen İçerik |
|-------|------------------|
| `app/api/token/metadata/route.ts` | CMC/CoinGecko/DeFiLlama proxy, TokenMetadata response |
| `app/api/binance/klines/route.ts` | CandleData[] response, interval parameters |
| `lib/types.ts` | Tüm TypeScript interface tanımları |

**Oluşturulan Dosya:** `.antigravity/memory/API_EXPORT_PROTOCOL.md`

**İçerik Detayları:**

#### Protocol Identity
```
Name: Nebula Data Bridge
Version: 1.0
Purpose: Enable external applications to consume market data from Liquidity Nebula
```

#### Base URL Configuration
| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000` |
| Production | `https://[DEPLOYMENT_DOMAIN]` |

#### Documented Endpoints

**1. GET /api/binance/metrics**
- **Kaynak:** `app/api/binance/metrics/route.ts`
- **Runtime:** Edge
- **Parametreler:**
  - `symbol` (required): Trading pair (e.g., `BTCUSDT`)
  - `metric` (required): MetricType enum value
  - `period` (optional, default: `5m`): Valid periods: `5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d`
  - `marketType` (optional, default: `futures`): `futures` or `spot`
  - `limit` (optional, default: `30`): Number of data points

- **Futures Metric Types:**
  - `openInterest` → `OpenInterestData[]`
  - `globalLongShort` → `LongShortRatioData[]`
  - `topLongShortAccounts` → `LongShortRatioData[]`
  - `topLongShortPositions` → `LongShortRatioData[]`
  - `takerBuySell` → `TakerBuySellData[]`
  - `fundingRate` → `FundingRateData[]`

- **Spot/Margin Metric Types:**
  - `moneyFlow` → `MoneyFlowData[]`
  - `24hrLargeInflow` → `MoneyFlowData[]`
  - `marginDebtGrowth` → `MarginDebtData[]`
  - `marginLongShortRatio` → `MarginLongShortData[]`
  - `isoMarginBorrowRatio` → `IsoMarginBorrowData[]`

**2. GET /api/token/metadata**
- **Kaynak:** `app/api/token/metadata/route.ts` (884 satır)
- **Runtime:** Edge
- **Parametreler:**
  - `symbol` (required): Token symbol without quote (e.g., `BTC`)
- **Response:** `TokenMetadata` interface
- **Data Sources:**
  1. CoinMarketCap Deep State Extraction (`__NEXT_DATA__` regex)
  2. CoinGecko API fallback (dynamic `/search`)
  3. DeFiLlama unlock scraping
  4. Static JSON fallback (`lib/data/tokenUnlocks.json`)

**3. GET /api/binance/klines**
- **Kaynak:** `app/api/binance/klines/route.ts`
- **Runtime:** Edge
- **Parametreler:**
  - `symbol` (required): Trading pair (e.g., `BTCUSDT`)
  - `interval` (optional, default: `15m`): Candlestick interval
  - `limit` (optional, default: `100`): Max 1500 candles
- **Response:** `CandleData[]`
- **Cache:** `revalidate: 0` (No cache, fresh data)

#### Integration Rules Documented

1. **Server-Side Consumption:**
```typescript
const res = await fetch('http://localhost:3000/api/binance/metrics?symbol=BTCUSDT&metric=openInterest&period=1h');
const data = await res.json();
```

2. **Client-Side with SWR:**
```typescript
import useSWR from 'swr';
const { data, error } = useSWR<OpenInterestData[]>(
  '/api/binance/metrics?symbol=BTCUSDT&metric=openInterest',
  fetcher
);
```

3. **Type Compatibility:** Tüm consuming uygulamalar `lib/types.ts`'den type import etmeli

4. **Rate Limiting & Caching:**
| Endpoint | Cache Duration |
|----------|----------------|
| `/api/binance/metrics` | 60s |
| `/api/token/metadata` | 60s |
| `/api/binance/klines` | 0s (No cache) |

---

### Step 3: Context Hash Update

**Görev:** Projenin evrimini `CONTEXT_HASH.md` dosyasına kaydetme (APPEND-ONLY)

**Değişiklik Tipi:** APPEND (mevcut içerik korundu, yeni kayıt eklendi)

**Eklenen Sprint Kaydı:**
```markdown
### [Sprint Oscar: Twin-Core Bridge Protocol]
- **Date**: 2025-12-27
- **Hash**: `BRIDGE-V1.0-PROVIDER-READY`
- **Module**: Twin-Core Architecture Preparation
- **Feature Added**: API Export Protocol for external consumption.
- **New Files**:
  - `.antigravity/memory/API_EXPORT_PROTOCOL.md` (Nebula Data Bridge v1.0 specification)
- **Architecture Change**: Mevcut uygulama, harici Backtest uygulaması (Nebula Forge) için Veri Sağlayıcı (Data Provider) rolüne uyarlandı.
- **Endpoints Documented**:
  - `GET /api/binance/metrics` (Futures + Spot metrics)
  - `GET /api/token/metadata` (CMC/CoinGecko/DeFiLlama proxy)
  - `GET /api/binance/klines` (OHLC candlestick data)
- **Integration Rules**: Server-side ve SWR tüketim kalıpları, `lib/types.ts` uyumluluğu tanımlandı.
- **Status**: Production Ready.
```

---

## FILES CREATED

| Path | Purpose | Lines |
|------|---------|-------|
| `.antigravity/memory/API_EXPORT_PROTOCOL.md` | Nebula Data Bridge v1.0 specification | ~180 |

---

## FILES MODIFIED

| Path | Changes |
|------|---------|
| `.antigravity/memory/CONTEXT_HASH.md` | APPENDED Sprint Oscar: Twin-Core Bridge Protocol entry |

---

## TYPE DEFINITIONS REFERENCED

Aşağıdaki tipler `lib/types.ts` dosyasından belgelendi:

```typescript
// Core Data
CandleData, TickerData

// Token Metadata
TokenMetadata, TokenUnlock, UnlockAllocation

// Market Metrics
MetricType, MarketType
OpenInterestData, LongShortRatioData, TakerBuySellData
FundingRateData, MoneyFlowData, MarginDebtData
IsoMarginBorrowData, MarginLongShortData

// AI Fusion (Future Use)
UnifiedMarketData
```

---

## ARCHITECTURE DECISIONS

### Decision 1: Twin-Core Data Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    TWIN-CORE ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────┐         ┌───────────────────┐       │
│  │  LIQUIDITY NEBULA │         │   NEBULA FORGE    │       │
│  │  (Data Provider)  │ ──────▶ │   (Data Consumer) │       │
│  │                   │   API   │                   │       │
│  │  - Real-time viz  │         │  - Backtest       │       │
│  │  - WebSocket      │         │  - Anomaly detect │       │
│  │  - API Routes     │         │  - AI Analysis    │       │
│  └───────────────────┘         └───────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Decision 2: Endpoint Selection
- `/api/binance/metrics` seçildi çünkü: Derivatives + Spot metrics tek endpoint'te birleşik
- `/api/token/metadata` seçildi çünkü: Multi-source fallback (CMC → CoinGecko → DeFiLlama → Static)
- `/api/binance/klines` seçildi çünkü: OHLC data, backtest için temel gereksinim

### Decision 3: No Code Changes
- Mevcut API route'ları değiştirilmedi
- Sadece dokümantasyon oluşturuldu
- Reason: Mevcut yapı zaten consumer-ready durumda

---

## GOVERNANCE COMPLIANCE

| Rule | Status |
|------|--------|
| Immutable files preserved | ✅ `00_GOVERNANCE.md`, `PROJECT_BIBLE.md`, `TECH_STACK_LOCK.md` untouched |
| CONTEXT_HASH.md APPEND-ONLY | ✅ Mevcut içerik korundu, yeni entry eklendi |
| TECH_STACK_LOCK versions | ✅ Hiçbir versiyon değiştirilmedi |
| Proxy-First pattern | ✅ Tüm endpoints Edge Runtime proxy |

---

## NEXT STEPS (Not Implemented in This Session)

1. **Nebula Forge Initialization**: Yeni Next.js projesi oluşturulacak
2. **Type Sharing**: `lib/types.ts` monorepo veya npm package olarak paylaşılabilir
3. **WebSocket Bridge**: Real-time data için WebSocket proxy endpoint eklenebilir
4. **Authentication Layer**: Production için API key authentication

---

*Document generated: 2025-12-27T18:45:49+03:00*
*State Hash: BRIDGE-V1.0-PROVIDER-READY*
*Session Status: COMPLETE*
