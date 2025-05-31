/**
 * Derived symbol information tools optimized for specific trading strategies
 * These tools extract and transform data from the base symbol-information tool
 */

// Import the base execution function
const executeFunction = async (args) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  try {
    // Construct the URL with the symbol path variable
    const url = `${baseUrl}/v2/symbols/${encodeURIComponent(args.symbol)}/info`;

    // Set up headers for the request
    const headers = {
      'X-RapidAPI-Key': apiKey
    };

    // Perform the fetch request
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    // Check if the response was successful
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    // Parse and return the response data
    return await response.json();
  } catch (error) {
    console.error('Error retrieving symbol information:', error);
    return { error: 'An error occurred while retrieving symbol information.' };
  }
};

/**
 * Tool for ORB strategy - opening range breakout context
 * Used by: ORB strategy for gap analysis and volatility assessment
 */
const orbTradingContextTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    const gapPercent = rawData.prev_close_price ? 
      ((rawData.regular_close_price - rawData.prev_close_price) / rawData.prev_close_price * 100) : null;
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      orb_context: {
        // Core trading mechanics
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        point_value: rawData.point_value,
        min_movement: rawData.minimum_movement,
        currency: rawData.currency_code,
        
        // Gap analysis for ORB
        current_price: rawData.regular_close_price,
        prev_close: rawData.prev_close_price,
        gap_percent: gapPercent,
        gap_category: classifyGap(gapPercent),
        
        // Volume context
        avg_volume: rawData.average_volume,
        volume_tier: classifyVolume(rawData.average_volume),
        
        // Session timing
        market_open: rawData.open_time,
        market_close: rawData.regular_close_time,
        
        // Volatility indicators
        ath_distance: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
        
        // Trading suitability
        orb_suitability: assessOrbSuitability(rawData.average_volume, gapPercent, rawData.market_cap)
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_orb_trading_context',
      description: 'Fetch opening range breakout (ORB) trading context including gap analysis and volatility assessment.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch ORB trading context for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for PEAD strategy - post-earnings announcement drift timing
 * Used by: PEAD strategy for earnings window detection and drift analysis
 */
const peadTimingTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    const nextEarnings = rawData.earnings_release_next_date;
    const lastEarnings = rawData.earnings_release_date;
    const now = Date.now();
    
    // Calculate days since/until earnings
    const daysSinceLast = lastEarnings ? 
      Math.ceil((now - lastEarnings * 1000) / (1000 * 60 * 60 * 24)) : null;
    const daysToNext = nextEarnings ? 
      Math.ceil((nextEarnings * 1000 - now) / (1000 * 60 * 60 * 24)) : null;
    
    // PEAD window: 5 trading days post-earnings
    const inPeadWindow = daysSinceLast !== null && daysSinceLast >= 0 && daysSinceLast <= 5;
    const peadWindowRemaining = inPeadWindow ? Math.max(0, 5 - daysSinceLast) : 0;
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      pead_timing: {
        // Earnings calendar
        next_earnings: nextEarnings,
        last_earnings: lastEarnings,
        days_since_last: daysSinceLast,
        days_to_next: daysToNext,
        
        // PEAD window status
        in_pead_window: inPeadWindow,
        pead_window_remaining: peadWindowRemaining,
        pead_stage: determinePeadStage(daysSinceLast),
        
        // Market context for PEAD
        market_cap: rawData.market_cap,
        size_tier: classifyMarketCap(rawData.market_cap),
        avg_volume: rawData.average_volume,
        liquidity_tier: classifyLiquidity(rawData.average_volume, rawData.regular_close_price),
        
        // Strategy eligibility
        pead_eligible: assessPeadEligibility(rawData.market_cap, rawData.average_volume, inPeadWindow)
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_pead_timing_context',
      description: 'Fetch PEAD (Post-Earnings Announcement Drift) timing context for earnings-based trading strategies.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch PEAD timing context for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for sentiment strategy - news analysis context
 * Used by: SentimentAgent for news impact assessment and valuation context
 */
const sentimentNewsContextTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      sentiment_context: {
        // Company basics
        description: rawData.description,
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        currency: rawData.currency_code,
        
        // Size and liquidity for impact assessment
        market_cap: rawData.market_cap,
        size_tier: classifyMarketCap(rawData.market_cap),
        avg_volume: rawData.average_volume,
        dollar_volume: rawData.average_volume * rawData.regular_close_price,
        
        // Valuation context for sentiment weighting
        current_price: rawData.regular_close_price,
        pe_ratio: rawData.price_earnings_ttm,
        valuation_tier: classifyPE(rawData.price_earnings_ttm),
        
        // Volatility context
        ath: rawData.all_time_high,
        atl: rawData.all_time_low,
        ath_distance_pct: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
        
        // News impact potential
        news_sensitivity: assessNewsSensitivity(rawData.market_cap, rawData.average_volume, rawData.price_earnings_ttm),
        sentiment_weight: calculateSentimentWeight(rawData.market_cap, rawData.average_volume)
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_sentiment_news_context',
      description: 'Fetch sentiment analysis context for news-based trading with valuation and impact assessment.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch sentiment news context for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for supervisor risk management - position sizing and constraints
 * Used by: Supervisor for risk assessment, position sizing, and trading limits
 */
const supervisorRiskTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    const dollarVolume = rawData.average_volume * rawData.regular_close_price;
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      risk_assessment: {
        // Basic metrics
        market_cap: rawData.market_cap,
        current_price: rawData.regular_close_price,
        avg_volume: rawData.average_volume,
        dollar_volume: dollarVolume,
        
        // Risk classifications
        size_tier: classifyMarketCap(rawData.market_cap),
        liquidity_tier: classifyLiquidity(rawData.average_volume, rawData.regular_close_price),
        risk_level: assessRiskLevel(rawData.market_cap, dollarVolume),
        
        // Position sizing constraints
        max_position_pct: calculateMaxPositionSize(rawData.market_cap, rawData.average_volume),
        suggested_shares_limit: calculateSharesLimit(dollarVolume, rawData.regular_close_price),
        
        // Trading mechanics
        point_value: rawData.point_value,
        min_movement: rawData.minimum_movement,
        currency: rawData.currency_code,
        
        // Volatility flags
        price_extremes: {
          ath: rawData.all_time_high,
          atl: rawData.all_time_low,
          ath_date: rawData.all_time_high_day,
          atl_date: rawData.all_time_low_day,
          current_range_position: calculateRangePosition(rawData.regular_close_price, rawData.all_time_low, rawData.all_time_high)
        },
        
        // Strategy constraints
        orb_approved: assessOrbSuitability(rawData.average_volume, null, rawData.market_cap),
        pead_approved: assessPeadEligibility(rawData.market_cap, rawData.average_volume, false),
        sentiment_approved: dollarVolume > 1000000 // Minimum $1M daily volume for news trading
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_supervisor_risk_assessment',
      description: 'Fetch comprehensive risk assessment for supervisor position sizing and trading constraints.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to assess risk parameters for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

// Helper functions
function classifyGap(gapPercent) {
  if (!gapPercent) return 'no_gap';
  const absGap = Math.abs(gapPercent);
  if (absGap > 5) return 'large_gap';
  if (absGap > 2) return 'medium_gap';
  if (absGap > 0.5) return 'small_gap';
  return 'minimal_gap';
}

function classifyVolume(avgVolume) {
  if (!avgVolume) return 'unknown';
  if (avgVolume > 10000000) return 'very_high';
  if (avgVolume > 1000000) return 'high';
  if (avgVolume > 100000) return 'medium';
  if (avgVolume > 10000) return 'low';
  return 'very_low';
}

function classifyMarketCap(marketCap) {
  if (!marketCap) return 'unknown';
  if (marketCap > 200000000000) return 'mega_cap';    // > $200B
  if (marketCap > 10000000000) return 'large_cap';    // > $10B
  if (marketCap > 2000000000) return 'mid_cap';       // > $2B
  if (marketCap > 300000000) return 'small_cap';      // > $300M
  return 'micro_cap';
}

function classifyPE(peRatio) {
  if (!peRatio || peRatio <= 0) return 'unknown';
  if (peRatio > 40) return 'expensive';
  if (peRatio > 20) return 'moderate';
  if (peRatio > 12) return 'reasonable';
  return 'cheap';
}

function classifyLiquidity(avgVolume, price) {
  if (!avgVolume || !price) return 'unknown';
  const dollarVolume = avgVolume * price;
  
  if (dollarVolume > 100000000) return 'high';        // > $100M daily
  if (dollarVolume > 10000000) return 'medium';       // > $10M daily
  if (dollarVolume > 1000000) return 'low';           // > $1M daily
  return 'very_low';
}

function assessOrbSuitability(avgVolume, gapPercent, marketCap) {
  // ORB works best with liquid stocks that have meaningful gaps
  const volumeOk = avgVolume && avgVolume > 500000;
  const capOk = marketCap && marketCap > 1000000000; // > $1B
  const gapOk = !gapPercent || Math.abs(gapPercent) > 0.5; // Some gap or unknown
  
  return volumeOk && capOk && gapOk;
}

function determinePeadStage(daysSinceLast) {
  if (daysSinceLast === null || daysSinceLast < 0) return 'pre_earnings';
  if (daysSinceLast === 0) return 'earnings_day';
  if (daysSinceLast <= 2) return 'early_drift';
  if (daysSinceLast <= 5) return 'late_drift';
  return 'post_window';
}

function assessPeadEligibility(marketCap, avgVolume, inWindow) {
  // PEAD works best with mid-large cap stocks with decent volume
  const capOk = marketCap && marketCap > 2000000000; // > $2B
  const volumeOk = avgVolume && avgVolume > 1000000;
  
  return capOk && volumeOk;
}

function assessNewsSensitivity(marketCap, avgVolume, peRatio) {
  // Smaller, growth stocks tend to be more news-sensitive
  let sensitivity = 'medium';
  
  if (marketCap && marketCap < 5000000000) sensitivity = 'high'; // < $5B
  if (peRatio && peRatio > 30) sensitivity = 'high'; // Growth stocks
  if (avgVolume && avgVolume < 500000) sensitivity = 'very_high'; // Low volume = high impact
  
  if (marketCap && marketCap > 100000000000) sensitivity = 'low'; // Mega caps less sensitive
  
  return sensitivity;
}

function calculateSentimentWeight(marketCap, avgVolume) {
  // Weight based on how much news typically moves the stock
  const dollarVolume = avgVolume * 100; // Rough price estimate
  
  if (marketCap && marketCap < 2000000000) return 0.8; // Small caps: high weight
  if (marketCap && marketCap < 10000000000) return 0.6; // Mid caps: medium weight
  if (dollarVolume && dollarVolume < 5000000) return 0.7; // Low liquidity: higher weight
  
  return 0.4; // Large caps: lower weight
}

function assessRiskLevel(marketCap, dollarVolume) {
  if (!marketCap || !dollarVolume) return 'high';
  
  if (marketCap > 50000000000 && dollarVolume > 50000000) return 'low';
  if (marketCap > 10000000000 && dollarVolume > 10000000) return 'medium';
  if (marketCap > 2000000000 && dollarVolume > 5000000) return 'medium_high';
  
  return 'high';
}

function calculateMaxPositionSize(marketCap, avgVolume) {
  if (!marketCap || !avgVolume) return 0.5;
  
  // Conservative position sizing based on liquidity
  if (marketCap > 100000000000 && avgVolume > 10000000) return 5.0;  // Large, liquid
  if (marketCap > 10000000000 && avgVolume > 1000000) return 3.0;    // Mid-large
  if (marketCap > 2000000000 && avgVolume > 500000) return 2.0;      // Mid cap
  return 1.0; // Small/illiquid
}

function calculateSharesLimit(dollarVolume, price) {
  if (!dollarVolume || !price) return 1000;
  
  // Limit to 5% of daily volume in shares
  const maxDollarPosition = dollarVolume * 0.05;
  return Math.floor(maxDollarPosition / price);
}

function calculateRangePosition(currentPrice, atl, ath) {
  if (!currentPrice || !atl || !ath) return null;
  
  const range = ath - atl;
  if (range === 0) return 50; // Edge case
  
  return ((currentPrice - atl) / range) * 100;
}

export { 
  orbTradingContextTool,
  peadTimingTool,
  sentimentNewsContextTool,
  supervisorRiskTool
};
