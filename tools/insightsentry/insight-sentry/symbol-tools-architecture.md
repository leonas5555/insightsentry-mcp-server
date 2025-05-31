# Symbol Information Tools Architecture

## Overview

The symbol information tools are structured in two layers following the same pattern as the financial data tools:

1. **Base Tools** (`symbol-information.js`) - Core API access with optimization options
2. **Derived Tools** (`symbol-derived-tools.js`) - Strategy-specific tools optimized for trading use cases

## Strategy Matrix Alignment

Based on the [strategy matrix](../../../docs/strategy_matrix.md), these tools serve the following data flow requirements:

| **Strategy/Agent** | **Tool Used** | **Data Purpose** | **Update Frequency** |
|-------------------|---------------|------------------|---------------------|
| **ORB Strategy** | `orbTradingContextTool` | Gap analysis, volume assessment, session timing | Real-time before market open |
| **PEAD Strategy** | `peadTimingTool` | Earnings calendar, drift window detection | Daily + triggered by earnings headlines |
| **SentimentAgent** | `sentimentNewsContextTool` | News impact assessment, valuation context | Streaming with news feed |
| **Supervisor** | `supervisorRiskTool` | Position sizing, risk limits, trading constraints | Real-time for position management |
| **IndicatorsService** | `sessionInfoTool` | Market timing, trading schedule | Program start + every 15 min |

## Base Tools (`symbol-information.js`)

### Core Function
- `executeFunction({ symbol, sections, optimize, minimal })` - Base API call to InsightSentry

### Specialized Tools
- `orbEssentialsTool` - Trading mechanics for ORB strategy
- `peadEssentialsTool` - Earnings timing for PEAD strategy  
- `sentimentEssentialsTool` - Valuation context for sentiment analysis
- `riskManagementTool` - Risk assessment data for supervisor
- `sessionInfoTool` - Market session timing

### Extraction Functions
- `extractTradingEssentials()` - Gap analysis, volume, session timing
- `extractEarningsTiming()` - PEAD window calculations
- `extractSentimentContext()` - News impact assessment context
- `extractRiskManagement()` - Position sizing and risk metrics

## Derived Tools (`symbol-derived-tools.js`)

### Strategy-Optimized Tools

#### 1. ORB Trading Context (`orbTradingContextTool`)
**Purpose**: Opening Range Breakout strategy support
**Key Data**:
- Gap analysis and classification
- Volume assessment for breakout potential
- Session timing for ORB windows
- Trading mechanics (point value, min movement)

**Usage**: Called before market open to assess ORB candidates

#### 2. PEAD Timing Context (`peadTimingTool`)
**Purpose**: Post-Earnings Announcement Drift detection
**Key Data**:
- Earnings calendar (next/last announcement dates)
- PEAD window status (5-day drift period)
- Market cap and liquidity eligibility
- Drift stage classification

**Usage**: Triggered by earnings headlines, updated daily

#### 3. Sentiment News Context (`sentimentNewsContextTool`)
**Purpose**: News impact assessment for sentiment strategy
**Key Data**:
- Company size and liquidity for impact scaling
- Valuation context for sentiment weighting
- News sensitivity classification
- Price extremes for context

**Usage**: Called with each news headline for impact assessment

#### 4. Supervisor Risk Assessment (`supervisorRiskTool`)
**Purpose**: Risk management and position sizing
**Key Data**:
- Position sizing limits based on liquidity
- Risk level classification
- Strategy approval flags (ORB/PEAD/Sentiment eligible)
- Trading constraints and limits

**Usage**: Real-time for position management decisions

## Helper Functions

### Classification Functions
- `classifyGap()` - Gap size categories for ORB
- `classifyMarketCap()` - Size tiers (mega/large/mid/small/micro cap)
- `classifyLiquidity()` - Volume-based liquidity assessment
- `classifyPE()` - Valuation tier classification

### Assessment Functions
- `assessOrbSuitability()` - ORB strategy eligibility
- `assessPeadEligibility()` - PEAD strategy qualification
- `assessNewsSensitivity()` - News impact potential
- `assessRiskLevel()` - Overall risk classification

### Calculation Functions
- `calculateMaxPositionSize()` - Position limits based on liquidity
- `calculateSentimentWeight()` - News impact weighting
- `calculateSharesLimit()` - Share count limits
- `calculateRangePosition()` - Price position in historical range

## Data Flow Integration

### Real-time Data
- ORB context fetched before market open
- Risk assessment updated with each position change
- Session info cached and refreshed every 15 minutes

### Event-driven Data
- PEAD timing triggered by earnings headlines via SentimentAgent
- Sentiment context fetched with each news item

### Cached Data
- Symbol metadata cached in PolarsEngine
- Risk parameters cached in Supervisor memory
- Session timing exposed as Prometheus metrics

## Error Handling

All tools return standardized error objects:
```javascript
{ error: 'Failed to fetch symbol data' }
```

This allows strategies to gracefully handle API failures and continue operation with cached or default values.

## Performance Optimization

- **Section-based extraction**: Only fetch needed data sections
- **Minimal mode**: Return only essential fields
- **Caching**: Results cached in respective services
- **Batch processing**: Multiple symbols processed efficiently

## Testing Strategy

Each tool should be tested with:
1. Valid symbols (NASDAQ:AAPL, NYSE:MSFT)
2. Invalid symbols (error handling)
3. Edge cases (missing earnings dates, extreme valuations)
4. Performance under load (batch requests)
