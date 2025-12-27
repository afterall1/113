# NEBULA NEXUS API PROTOCOL
> **Version**: 1.0.0  
> **Codename**: "The Manipulation Hunter"  
> **Last Updated**: 2025-12-25

---

## 1. SYSTEM IDENTITY

**Nebula Nexus High-Frequency Data Interface**

A real-time market intelligence API designed for AI-driven trading systems, manipulation detection algorithms, and quantitative research. This interface provides fused Spot/Futures market data optimized for machine learning pipelines.

---

## 2. AUTHENTICATION

All Nexus API endpoints require API key authentication.

| Header | Value |
|--------|-------|
| `x-nebula-api-key` | `NEXUS-7-OMEGA-PROTOCOL-2025` |

**Request without valid key will receive:**
```json
{
  "error": "ACCESS_DENIED",
  "message": "Missing or invalid Nexus clearance credentials."
}
```

---

## 3. BASE URL

```
Production: https://your-domain.com
Development: http://localhost:3000
```

---

## 4. ENDPOINT MAP

### 4.1 Deep Scan (Historical + Fused Data)

```
GET /api/nexus/v1/deep-scan
```

**Purpose**: Fetches historical Spot + Futures data, fuses them on timestamp axis, and returns AI-ready unified market data for backtesting and manipulation detection.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | ✅ Yes | - | Trading pair (e.g., `BTCUSDT`, `ETHUSDT`) |
| `interval` | string | No | `1h` | Candlestick interval: `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d` |
| `limit` | integer | No | `100` | Number of data points (max: 500) |

#### Response Schema

```typescript
interface DeepScanResponse {
  symbol: string;         // "BTCUSDT"
  interval: string;       // "1h"
  count: number;          // Number of data points
  startTime: number;      // First timestamp (ms)
  endTime: number;        // Last timestamp (ms)
  data: UnifiedMarketData[];
}

interface UnifiedMarketData {
  timestamp: number;      // Unix timestamp in milliseconds
  
  price: {
    spot: number;         // Spot market close price
    futures: number;      // Futures market close price
  };
  
  volume: {
    spot: number;         // Spot trading volume
    futures: number;      // Futures trading volume
  };
  
  metrics: {
    openInterest: number;    // Open Interest in USD
    fundingRate: number;     // Funding rate (decimal, e.g., 0.0001 = 0.01%)
    longShortRatio: number;  // Global Long/Short ratio
  };
  
  signals: {
    spread: number;       // (futures - spot) / spot * 100 (percentage)
    divergence: number;   // Price divergence score
  };
}
```

#### Example Response

```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "count": 100,
  "startTime": 1703520000000,
  "endTime": 1703876400000,
  "data": [
    {
      "timestamp": 1703520000000,
      "price": {
        "spot": 42150.50,
        "futures": 42165.30
      },
      "volume": {
        "spot": 1250.50,
        "futures": 3420.10
      },
      "metrics": {
        "openInterest": 12500000000,
        "fundingRate": 0.0001,
        "longShortRatio": 1.12
      },
      "signals": {
        "spread": 0.0351,
        "divergence": 0.0351
      }
    }
  ]
}
```

#### Use Cases

- **Manipulation Detection**: Analyze `spread` and `fundingRate` anomalies
- **Backtesting**: Historical simulation with complete market context
- **ML Training**: DataFrame-ready format for feature engineering

---

## 5. ERROR CODES

| Code | Error | Description |
|------|-------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Missing or invalid parameters |
| `401` | Unauthorized | Missing or invalid `x-nebula-api-key` |
| `500` | Internal Error | Server-side failure (check logs) |

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description"
}
```

---

## 6. PYTHON SDK EXAMPLE

### Installation

```bash
pip install requests pandas
```

### Basic Usage

```python
import requests
import pandas as pd
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:3000"
API_KEY = "NEXUS-7-OMEGA-PROTOCOL-2025"

def deep_scan(symbol: str, interval: str = "1h", limit: int = 100) -> pd.DataFrame:
    """
    Fetch fused market data from Nebula Nexus API.
    
    Args:
        symbol: Trading pair (e.g., "BTCUSDT")
        interval: Candlestick interval (default: "1h")
        limit: Number of data points (default: 100, max: 500)
    
    Returns:
        pandas DataFrame with unified market data
    """
    url = f"{BASE_URL}/api/nexus/v1/deep-scan"
    
    headers = {
        "x-nebula-api-key": API_KEY,
        "Content-Type": "application/json"
    }
    
    params = {
        "symbol": symbol,
        "interval": interval,
        "limit": limit
    }
    
    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 401:
        raise PermissionError("Invalid API key")
    
    if response.status_code != 200:
        raise Exception(f"API Error: {response.json()}")
    
    data = response.json()
    
    # Convert to DataFrame
    df = pd.DataFrame(data["data"])
    
    # Flatten nested structures
    df["price_spot"] = df["price"].apply(lambda x: x["spot"])
    df["price_futures"] = df["price"].apply(lambda x: x["futures"])
    df["volume_spot"] = df["volume"].apply(lambda x: x["spot"])
    df["volume_futures"] = df["volume"].apply(lambda x: x["futures"])
    df["open_interest"] = df["metrics"].apply(lambda x: x["openInterest"])
    df["funding_rate"] = df["metrics"].apply(lambda x: x["fundingRate"])
    df["long_short_ratio"] = df["metrics"].apply(lambda x: x["longShortRatio"])
    df["spread"] = df["signals"].apply(lambda x: x["spread"])
    df["divergence"] = df["signals"].apply(lambda x: x["divergence"])
    
    # Convert timestamp to datetime
    df["datetime"] = pd.to_datetime(df["timestamp"], unit="ms")
    
    # Drop nested columns
    df = df.drop(columns=["price", "volume", "metrics", "signals"])
    
    return df


# Example: Fetch BTC data and detect manipulation signals
if __name__ == "__main__":
    # Fetch data
    df = deep_scan("BTCUSDT", interval="1h", limit=200)
    
    print(f"Fetched {len(df)} data points")
    print(df.head())
    
    # Simple manipulation detection: High spread + extreme funding
    df["manipulation_score"] = (
        abs(df["spread"]) * 10 + 
        abs(df["funding_rate"]) * 10000
    )
    
    # Flag anomalies (top 5% by score)
    threshold = df["manipulation_score"].quantile(0.95)
    anomalies = df[df["manipulation_score"] > threshold]
    
    print(f"\n⚠️ Detected {len(anomalies)} potential manipulation events")
    print(anomalies[["datetime", "spread", "funding_rate", "manipulation_score"]])
```

### Output Example

```
Fetched 200 data points
   timestamp  price_spot  price_futures  spread  funding_rate
0  1703520000000   42150.50      42165.30  0.0351       0.0001
1  1703523600000   42280.00      42295.50  0.0367       0.0001
2  1703527200000   42150.25      42160.00  0.0231       0.0002

⚠️ Detected 10 potential manipulation events
              datetime   spread  funding_rate  manipulation_score
45 2024-12-26 05:00:00   0.1523        0.0005              2.523
78 2024-12-27 14:00:00  -0.2145        0.0008              4.945
```

---

## 7. RATE LIMITS

| Tier | Requests/Minute | Notes |
|------|-----------------|-------|
| Standard | 100 | Default tier |
| Premium | 500 | Contact admin |

Rate limit headers in response:
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp

---

## 8. CHANGELOG

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-25 | Initial release with Deep Scan endpoint |

---

## 9. CONTACT

For API access issues or feature requests, contact the Nebula Nexus development team.

---

*Document generated for AI-to-AI communication. Optimized for LLM parsing.*
