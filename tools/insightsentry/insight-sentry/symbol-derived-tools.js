/**
 * Enhanced symbol information tools optimized for LLM consumption
 * These tools provide structured, context-rich data for trading strategy analysis
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
 * Tool for comprehensive breakout trading analysis
 * Provides gap analysis, volatility context, and market structure data
 */
const breakoutAnalysisTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      breakout_context: {
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        instrument_type: rawData.type,
        currency: rawData.currency_code,
        
        // Price structure
        current_price: rawData.regular_close_price,
        prev_close: rawData.prev_close_price,
        price_gap_dollars: rawData.regular_close_price && rawData.prev_close_price ? 
          rawData.regular_close_price - rawData.prev_close_price : null,
        price_gap_percent: rawData.prev_close_price ? 
          ((rawData.regular_close_price - rawData.prev_close_price) / rawData.prev_close_price * 100) : null,
        
        // Volume and liquidity
        avg_volume: rawData.average_volume,
        market_cap: rawData.market_cap,
        daily_dollar_volume: rawData.average_volume && rawData.regular_close_price ? 
          rawData.average_volume * rawData.regular_close_price : null,
        
        // Trading mechanics
        point_value: rawData.point_value,
        min_movement: rawData.minimum_movement,
        
        // Session timing
        market_open: rawData.open_time,
        market_close: rawData.regular_close_time,
        
        // Price extremes for range analysis
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low,
        distance_from_ath_percent: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_breakout_analysis',
      description: 'Retrieve comprehensive breakout trading analysis including gap analysis, volatility assessment, and market structure data. Perfect for opening range breakouts, momentum strategies, and volatility trading. Provides price gaps, volume context, trading mechanics, and price extremes for pattern recognition.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format. Examples: "NASDAQ:AAPL" (for gap-ups/downs), "NYSE:SPY" (for market ETF breakouts), "BINANCE:BTCUSDT" (for crypto volatility). Works with stocks, ETFs, crypto, forex, and futures.',
            pattern: '^[A-Z]+:[A-Z0-9!]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for comprehensive earnings-based trading analysis
 * Provides earnings calendar, market context, and drift opportunity assessment
 */
const earningsAnalysisTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    const nextEarnings = rawData.earnings_release_next_date;
    const lastEarnings = rawData.earnings_release_date;
    const currentTime = Date.now();
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      earnings_analysis: {
        // Earnings calendar
        next_earnings_date: nextEarnings,
        last_earnings_date: lastEarnings,
        
        // Time calculations (raw for LLM interpretation)
        days_to_next_earnings: nextEarnings ? 
          Math.ceil((nextEarnings * 1000 - currentTime) / (1000 * 60 * 60 * 24)) : null,
        days_since_last_earnings: lastEarnings ? 
          Math.ceil((currentTime - lastEarnings * 1000) / (1000 * 60 * 60 * 24)) : null,
        
        // Market context for impact assessment
        market_cap: rawData.market_cap,
        avg_volume: rawData.average_volume,
        current_price: rawData.regular_close_price,
        daily_dollar_volume: rawData.average_volume && rawData.regular_close_price ? 
          rawData.average_volume * rawData.regular_close_price : null,
        
        // Valuation context
        pe_ratio: rawData.price_earnings_ttm,
        earnings_per_share: rawData.earnings_per_share_fq,
        
        // Price positioning
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low,
        distance_from_ath_percent: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_earnings_analysis',
      description: 'Retrieve comprehensive earnings analysis for earnings-based trading strategies including PEAD (Post-Earnings Announcement Drift), pre-earnings positioning, and earnings momentum plays. Provides earnings calendar, market context, valuation data, and time calculations for strategy timing.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for stocks with earnings data. Examples: "NASDAQ:AAPL", "NYSE:MSFT", "NASDAQ:GOOGL", "NYSE:JPM". Only applicable to individual stocks, not ETFs, crypto, or other instruments.',
            pattern: '^[A-Z]+:[A-Z0-9]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for comprehensive news impact and sentiment analysis
 * Provides market context, valuation framework, and impact assessment data
 */
const newsImpactAnalysisTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      news_impact_context: {
        // Company identification
        description: rawData.description,
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        currency: rawData.currency_code,
        instrument_type: rawData.type,
        
        // Market size and liquidity (for impact assessment)
        market_cap: rawData.market_cap,
        avg_volume: rawData.average_volume,
        daily_dollar_volume: rawData.average_volume && rawData.regular_close_price ? 
          rawData.average_volume * rawData.regular_close_price : null,
        
        // Price and valuation context
        current_price: rawData.regular_close_price,
        pe_ratio: rawData.price_earnings_ttm,
        earnings_per_share: rawData.earnings_per_share_fq,
        total_revenue: rawData.total_revenue,
        
        // Price positioning (sentiment context)
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low,
        distance_from_ath_percent: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
        distance_from_atl_percent: rawData.all_time_low ? 
          ((rawData.regular_close_price - rawData.all_time_low) / rawData.all_time_low * 100) : null,
        
        // Recent performance context
        prev_close: rawData.prev_close_price,
        recent_change_percent: rawData.prev_close_price ? 
          ((rawData.regular_close_price - rawData.prev_close_price) / rawData.prev_close_price * 100) : null
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_news_impact_analysis',
      description: 'Retrieve comprehensive context for news sentiment analysis and impact assessment. Includes company fundamentals, market positioning, valuation metrics, and liquidity data. Essential for evaluating how news events might affect price movement based on company size, current valuation, and market positioning.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for stocks, ETFs, or major instruments with fundamental data. Examples: "NASDAQ:AAPL" (individual stock), "NYSE:SPY" (ETF), "NASDAQ:QQQ" (tech ETF). Best for stocks and equity instruments where news impact matters.',
            pattern: '^[A-Z]+:[A-Z0-9]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for comprehensive risk and portfolio management analysis
 * Provides liquidity assessment, volatility context, and position sizing data
 */
const portfolioRiskAnalysisTool = {
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      risk_analysis: {
        // Liquidity metrics
        market_cap: rawData.market_cap,
        avg_volume: rawData.average_volume,
        current_price: rawData.regular_close_price,
        daily_dollar_volume: rawData.average_volume && rawData.regular_close_price ? 
          rawData.average_volume * rawData.regular_close_price : null,
        
        // Volatility and range analysis
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low,
        ath_date: rawData.all_time_high_day,
        atl_date: rawData.all_time_low_day,
        
        // Price positioning for risk assessment
        distance_from_ath_percent: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
        distance_from_atl_percent: rawData.all_time_low ? 
          ((rawData.regular_close_price - rawData.all_time_low) / rawData.all_time_low * 100) : null,
        
        // Historical range
        ath_to_atl_range_percent: rawData.all_time_high && rawData.all_time_low ? 
          ((rawData.all_time_high - rawData.all_time_low) / rawData.all_time_low * 100) : null,
        
        // Trading mechanics
        point_value: rawData.point_value,
        min_movement: rawData.minimum_movement,
        
        // Market context
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        currency: rawData.currency_code,
        instrument_type: rawData.type,
        
        // Recent performance
        prev_close: rawData.prev_close_price,
        recent_change_percent: rawData.prev_close_price ? 
          ((rawData.regular_close_price - rawData.prev_close_price) / rawData.prev_close_price * 100) : null
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_portfolio_risk_analysis',
      description: 'Retrieve comprehensive risk analysis for portfolio management, position sizing, and trading constraints. Provides liquidity assessment, volatility analysis, price range data, and trading mechanics. Essential for calculating appropriate position sizes, assessing market impact, and understanding instrument-specific risks across all asset classes.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for any tradeable instrument. Examples: "NASDAQ:AAPL" (large cap stock), "NASDAQ:TSLA" (volatile stock), "BINANCE:BTCUSDT" (crypto volatility), "FOREXCOM:EURUSD" (currency risk), "COMEX:GC1!" (commodity). Risk analysis applies to all asset classes.',
            pattern: '^[A-Z]+:[A-Z0-9!]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { 
  breakoutAnalysisTool,
  earningsAnalysisTool,
  newsImpactAnalysisTool,
  portfolioRiskAnalysisTool
};
