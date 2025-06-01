/**
 * Base function to retrieve information about a specific symbol from InsightSentry.
 *
 * @param {Object} args - Arguments for the symbol information retrieval.
 * @param {string} args.symbol - The symbol code for which to retrieve information (e.g., 'NASDAQ:AAPL').
 * @param {Array<string>} [args.sections] - Specific sections to extract (e.g., ['trading_context', 'session_info']).
 * @param {boolean} [args.optimize] - Whether to apply optimization filters.
 * @param {boolean} [args.minimal] - Return only essential trading data.
 * @returns {Promise<Object>} - The result of the symbol information retrieval.
 */
const executeFunction = async ({ symbol, sections = null, optimize = false, minimal = false }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  try {
    // Construct the URL with the symbol path variable
    const url = `${baseUrl}/v2/symbols/${encodeURIComponent(symbol)}/info`;

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
    const data = await response.json();
    
    // Apply optimization if requested
    if (optimize || minimal || sections) {
      return optimizeSymbolData(data, { sections, minimal });
    }
    
    return data;
  } catch (error) {
    console.error('Error retrieving symbol information:', error);
    return { error: 'An error occurred while retrieving symbol information.' };
  }
};

/**
 * Tool configuration for retrieving comprehensive symbol information from InsightSentry.
 * Provides raw market data, fundamentals, trading context, and session information.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_symbol_info',
      description: 'Retrieve comprehensive market information about any tradeable symbol including stocks, ETFs, indices, forex, cryptocurrencies, and commodities. Returns real-time market data, fundamentals, trading context, earnings data, and technical indicators.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format. Examples: "NASDAQ:AAPL" (Apple stock), "NYSE:MSFT" (Microsoft), "BINANCE:BTCUSDT" (Bitcoin), "FOREXCOM:EURUSD" (Euro/USD), "COMEX:GC1!" (Gold futures), "CURRENCYCOM:US500" (S&P 500 index). Always include the exchange prefix.',
            pattern: '^[A-Z]+:[A-Z0-9!]+$'
          },
          sections: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['trading_context', 'session_info', 'strategy_context', 'fundamentals', 'extremes']
            },
            description: 'Optional: Specific data sections to retrieve. If omitted, returns all available data. Available sections: trading_context (prices, volume, point values), session_info (market hours), strategy_context (earnings dates), fundamentals (financials, ratios), extremes (all-time highs/lows).'
          },
          optimize: {
            type: 'boolean',
            description: 'Optional: If true, removes options data to reduce payload size. Default: false.'
          },
          minimal: {
            type: 'boolean',
            description: 'Optional: If true, returns only essential trading data (price, volume, session times). Default: false.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Optimize symbol data by extracting only essential metrics
 */
const optimizeSymbolData = (rawData, options = {}) => {
  const { sections, minimal = false } = options;
  
  if (!rawData) return rawData;
  
  // Minimal mode - return only essential trading data
  if (minimal) {
    return {
      code: rawData.code,
      type: rawData.type,
      description: rawData.description,
      currency_code: rawData.currency_code,
      trading_context: {
        average_volume: rawData.average_volume,
        regular_close_price: rawData.regular_close_price,
        prev_close_price: rawData.prev_close_price,
        point_value: rawData.point_value,
        minimum_movement: rawData.minimum_movement
      },
      session_info: {
        open_time: rawData.open_time,
        regular_close_time: rawData.regular_close_time
      },
      strategy_context: {
        earnings_release_next_date: rawData.earnings_release_next_date
      }
    };
  }
  
  // Section-based extraction
  if (sections && Array.isArray(sections)) {
    const optimized = {
      code: rawData.code,
      type: rawData.type,
      description: rawData.description
    };
    
    sections.forEach(section => {
      switch (section) {
        case 'trading_context':
          optimized.trading_context = {
            average_volume: rawData.average_volume,
            regular_close_price: rawData.regular_close_price,
            prev_close_price: rawData.prev_close_price,
            point_value: rawData.point_value,
            minimum_movement: rawData.minimum_movement
          };
          break;
        case 'session_info':
          optimized.session_info = {
            open_time: rawData.open_time,
            regular_close_time: rawData.regular_close_time
          };
          break;
        case 'strategy_context':
          optimized.strategy_context = {
            earnings_release_next_date: rawData.earnings_release_next_date,
            earnings_release_date: rawData.earnings_release_date
          };
          break;
        case 'fundamentals':
          optimized.fundamentals = {
            market_cap: rawData.market_cap,
            total_revenue: rawData.total_revenue,
            earnings_per_share_fq: rawData.earnings_per_share_fq,
            price_earnings_ttm: rawData.price_earnings_ttm,
            dividends_yield: rawData.dividends_yield
          };
          break;
        case 'extremes':
          optimized.extremes = {
            all_time_high: rawData.all_time_high,
            all_time_high_day: rawData.all_time_high_day,
            all_time_low: rawData.all_time_low,
            all_time_low_day: rawData.all_time_low_day
          };
          break;
          optimized.trading_context = {
            average_volume: rawData.average_volume,
            regular_close_price: rawData.regular_close_price,
            prev_close_price: rawData.prev_close_price,
            point_value: rawData.point_value,
            minimum_movement: rawData.minimum_movement
          };
          break;
        case 'session_info':
          optimized.session_info = {
            open_time: rawData.open_time,
            regular_close_time: rawData.regular_close_time
          };
          break;
        case 'strategy_context':
          optimized.strategy_context = {
            earnings_release_next_date: rawData.earnings_release_next_date,
            earnings_release_date: rawData.earnings_release_date
          };
          break;
        case 'fundamentals':
          optimized.fundamentals = {
            market_cap: rawData.market_cap,
            total_revenue: rawData.total_revenue,
            earnings_per_share_fq: rawData.earnings_per_share_fq,
            price_earnings_ttm: rawData.price_earnings_ttm,
            dividends_yield: rawData.dividends_yield
          };
          break;
        case 'extremes':
          optimized.extremes = {
            all_time_high: rawData.all_time_high,
            all_time_high_day: rawData.all_time_high_day,
            all_time_low: rawData.all_time_low,
            all_time_low_day: rawData.all_time_low_day
          };
          break;
      }
    });
    
    return optimized;
  }
  
  // Remove only options data if optimize is true
  const { option_info, ...optimized } = rawData;
  return optimized;
};

/**
 * Extract trading essentials for intraday and breakout strategies
 * Returns raw trading data without strategy-specific calculations
 */
const extractTradingEssentials = (rawData) => {
  if (!rawData) return rawData;
  
  return {
    symbol: rawData.code,
    last_update: new Date().toISOString(),
    trading_data: {
      exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
      currency: rawData.currency_code,
      type: rawData.type,
      average_volume: rawData.average_volume,
      current_price: rawData.regular_close_price,
      prev_close: rawData.prev_close_price,
      price_change: rawData.regular_close_price && rawData.prev_close_price ? 
        rawData.regular_close_price - rawData.prev_close_price : null,
      price_change_percent: rawData.prev_close_price ? 
        ((rawData.regular_close_price - rawData.prev_close_price) / rawData.prev_close_price * 100) : null,
      point_value: rawData.point_value,
      min_movement: rawData.minimum_movement,
      market_open: rawData.open_time,
      market_close: rawData.regular_close_time
    }
  };
};

/**
 * Extract earnings timing data for earnings-based strategies
 * Returns raw earnings dates without strategy-specific window calculations
 */
const extractEarningsTiming = (rawData) => {
  if (!rawData) return rawData;
  
  const nextEarnings = rawData.earnings_release_next_date;
  const lastEarnings = rawData.earnings_release_date;
  
  return {
    symbol: rawData.code,
    last_update: new Date().toISOString(),
    earnings_data: {
      next_earnings_date: nextEarnings,
      last_earnings_date: lastEarnings,
      market_cap: rawData.market_cap,
      avg_volume: rawData.average_volume,
      current_price: rawData.regular_close_price,
      // Let LLM calculate time windows based on strategy needs
      days_to_next: nextEarnings ? Math.ceil((nextEarnings * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      days_since_last: lastEarnings ? Math.ceil((Date.now() - lastEarnings * 1000) / (1000 * 60 * 60 * 24)) : null
    }
  };
};

/**
 * Extract fundamental context for news and sentiment analysis
 * Returns raw fundamental data without predefined classifications
 */
const extractSentimentContext = (rawData) => {
  if (!rawData) return rawData;
  
  return {
    symbol: rawData.code,
    last_update: new Date().toISOString(),
    fundamental_data: {
      description: rawData.description,
      exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
      currency: rawData.currency_code,
      market_cap: rawData.market_cap,
      avg_volume: rawData.average_volume,
      current_price: rawData.regular_close_price,
      pe_ratio: rawData.price_earnings_ttm,
      all_time_high: rawData.all_time_high,
      all_time_low: rawData.all_time_low,
      // Raw percentage calculation for LLM to interpret
      distance_from_ath_percent: rawData.all_time_high ? 
        ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
      distance_from_atl_percent: rawData.all_time_low ? 
        ((rawData.regular_close_price - rawData.all_time_low) / rawData.all_time_low * 100) : null
    }
  };
};

/**
 * Extract risk assessment data for position sizing and constraints
 * Returns raw data for LLM to calculate risk parameters based on strategy
 */
const extractRiskManagement = (rawData) => {
  if (!rawData) return rawData;
  
  return {
    symbol: rawData.code,
    last_update: new Date().toISOString(),
    risk_data: {
      market_cap: rawData.market_cap,
      avg_volume: rawData.average_volume,
      current_price: rawData.regular_close_price,
      daily_dollar_volume: rawData.average_volume && rawData.regular_close_price ? 
        rawData.average_volume * rawData.regular_close_price : null,
      price_extremes: {
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low,
        ath_date: rawData.all_time_high_day,
        atl_date: rawData.all_time_low_day
      },
      trading_mechanics: {
        point_value: rawData.point_value,
        min_movement: rawData.minimum_movement
      }
    }
  };
};

export { 
  apiTool,
  tradingEssentialsTool,
  earningsTimingTool,
  fundamentalContextTool,
  riskAssessmentTool,
  sessionInfoTool,
  optimizeSymbolData,
  extractTradingEssentials,
  extractEarningsTiming,
  extractSentimentContext,
  extractRiskManagement
};

/**
 * Tool for retrieving essential trading data for intraday and breakout strategies
 * @type {Object}
 */
const tradingEssentialsTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['trading_context', 'session_info'] });
    return extractTradingEssentials(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_trading_essentials',
      description: 'Retrieve essential trading data including current price, volume, price changes, trading mechanics, and market session information. Optimized for intraday trading, breakout strategies, and opening range analysis. Returns raw price and volume data without predefined strategy calculations.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format. Examples: "NASDAQ:AAPL", "NYSE:TSLA", "BINANCE:BTCUSDT". Always include exchange prefix.',
            pattern: '^[A-Z]+:[A-Z0-9!]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for retrieving earnings timing data for earnings-based strategies
 * @type {Object}
 */
const earningsTimingTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['strategy_context', 'fundamentals'] });
    return extractEarningsTiming(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_earnings_timing',
      description: 'Retrieve earnings announcement dates and timing data for earnings-based trading strategies. Includes next and previous earnings dates, market cap, and volume context. Useful for Post-Earnings Announcement Drift (PEAD), earnings momentum, and pre-earnings positioning strategies.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for stocks with earnings data. Examples: "NASDAQ:AAPL", "NYSE:MSFT", "NASDAQ:GOOGL". Must be a stock symbol, not applicable to forex, crypto, or commodities.',
            pattern: '^[A-Z]+:[A-Z0-9]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for retrieving fundamental context for news and sentiment analysis
 * @type {Object}
 */
const fundamentalContextTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['fundamentals', 'extremes'] });
    return extractSentimentContext(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_fundamental_context',
      description: 'Retrieve fundamental data and valuation context for news sentiment analysis and impact assessment. Includes market cap, P/E ratio, price extremes, and company description. Essential for evaluating how news might affect stock price based on company size, valuation, and current price positioning.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for stocks or ETFs with fundamental data. Examples: "NASDAQ:AAPL", "NYSE:JPM", "NASDAQ:QQQ". Primarily for stocks and equity ETFs.',
            pattern: '^[A-Z]+:[A-Z0-9]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for retrieving risk assessment data for position sizing and constraints
 * @type {Object}
 */
const riskAssessmentTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['trading_context', 'fundamentals', 'extremes'] });
    return extractRiskManagement(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_risk_assessment',
      description: 'Retrieve risk assessment data for position sizing, liquidity analysis, and trading constraints. Includes market cap, volume, price extremes, and trading mechanics. Essential for calculating position sizes, assessing liquidity, and understanding price volatility ranges across any tradeable instrument.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for any tradeable instrument. Examples: "NASDAQ:AAPL" (stock), "BINANCE:BTCUSDT" (crypto), "FOREXCOM:EURUSD" (forex), "COMEX:GC1!" (futures). Risk assessment applies to all asset classes.',
            pattern: '^[A-Z]+:[A-Z0-9!]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for retrieving market session information and trading schedules
 * @type {Object}
 */
const sessionInfoTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['session_info'] });
    
    if (!rawData?.code) {
      return { error: 'Failed to fetch symbol data' };
    }
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      session_data: {
        market_open: rawData.open_time,
        market_close: rawData.regular_close_time,
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        currency: rawData.currency_code,
        instrument_type: rawData.type
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_session_info',
      description: 'Retrieve market session information including trading hours, exchange details, and scheduling data. Essential for timing trades, understanding market availability, and coordinating strategy execution across different time zones and markets.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Symbol code in EXCHANGE:TICKER format for any tradeable instrument. Examples: "NASDAQ:AAPL" (US stock market hours), "BINANCE:BTCUSDT" (24/7 crypto), "FOREXCOM:EURUSD" (forex hours), "LSE:TSLA" (London hours). Different exchanges have different session times.',
            pattern: '^[A-Z]+:[A-Z0-9!]+$'
          }
        },
        required: ['symbol']
      }
    }
  }
};