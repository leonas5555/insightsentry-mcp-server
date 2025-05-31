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
 * Tool configuration for retrieving symbol information from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_symbol_info',
      description: 'Retrieve information about a specific symbol from InsightSentry.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The symbol code for which to retrieve information (e.g., "NASDAQ:AAPL").'
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
 * Extract trading essentials for ORB and intraday strategies
 */
const extractTradingEssentials = (rawData) => {
  if (!rawData) return rawData;
  
  return {
    symbol: rawData.code,
    trading: {
      exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
      currency: rawData.currency_code,
      type: rawData.type,
      average_volume: rawData.average_volume,
      current_price: rawData.regular_close_price,
      prev_close: rawData.prev_close_price,
      gap_percent: rawData.prev_close_price ? 
        ((rawData.regular_close_price - rawData.prev_close_price) / rawData.prev_close_price * 100) : null,
      
      // Trading mechanics
      point_value: rawData.point_value,
      min_movement: rawData.minimum_movement,
      
      // Session timing
      market_open: rawData.open_time,
      market_close: rawData.regular_close_time
    }
  };
};

/**
 * Extract earnings timing for PEAD strategy
 */
const extractEarningsTiming = (rawData) => {
  if (!rawData) return rawData;
  
  const nextEarnings = rawData.earnings_release_next_date;
  const lastEarnings = rawData.earnings_release_date;
  
  return {
    symbol: rawData.code,
    earnings: {
      next_announcement: nextEarnings,
      last_announcement: lastEarnings,
      days_to_next: nextEarnings ? Math.ceil((nextEarnings * 1000 - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      days_since_last: lastEarnings ? Math.ceil((Date.now() - lastEarnings * 1000) / (1000 * 60 * 60 * 24)) : null,
      
      // PEAD window calculations
      in_pead_window: lastEarnings ? 
        (Date.now() - lastEarnings * 1000) < (5 * 24 * 60 * 60 * 1000) : false, // 5 days post-earnings
      pead_window_remaining: lastEarnings ? 
        Math.max(0, 5 - Math.ceil((Date.now() - lastEarnings * 1000) / (1000 * 60 * 60 * 24))) : 0
    }
  };
};

/**
 * Extract sentiment context for news analysis
 */
const extractSentimentContext = (rawData) => {
  if (!rawData) return rawData;
  
  return {
    symbol: rawData.code,
    context: {
      description: rawData.description,
      exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
      currency: rawData.currency_code,
      
      // Size indicators
      market_cap: rawData.market_cap,
      avg_volume: rawData.average_volume,
      size_tier: classifyMarketCap(rawData.market_cap),
      
      // Valuation context
      current_price: rawData.regular_close_price,
      pe_ratio: rawData.price_earnings_ttm,
      valuation_tier: classifyPE(rawData.price_earnings_ttm),
      
      // Volatility indicators
      ath: rawData.all_time_high,
      distance_from_ath: rawData.all_time_high ? 
        ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null
    }
  };
};

/**
 * Extract risk management data for supervisor
 */
const extractRiskManagement = (rawData) => {
  if (!rawData) return rawData;
  
  return {
    symbol: rawData.code,
    risk: {
      market_cap: rawData.market_cap,
      avg_volume: rawData.average_volume,
      current_price: rawData.regular_close_price,
      
      // Liquidity assessment
      liquidity_tier: classifyLiquidity(rawData.average_volume, rawData.regular_close_price),
      
      // Volatility indicators
      price_range: {
        ath: rawData.all_time_high,
        atl: rawData.all_time_low,
        ath_date: rawData.all_time_high_day,
        atl_date: rawData.all_time_low_day
      },
      
      // Position sizing hints
      suggested_max_position_pct: calculateMaxPositionSize(rawData.market_cap, rawData.average_volume),
      
      // Trading constraints
      point_value: rawData.point_value,
      min_movement: rawData.minimum_movement
    }
  };
};

// Helper functions
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

function calculateMaxPositionSize(marketCap, avgVolume) {
  if (!marketCap || !avgVolume) return 0.5;
  
  // Conservative position sizing based on liquidity
  if (marketCap > 100000000000 && avgVolume > 10000000) return 5.0;  // Large, liquid
  if (marketCap > 10000000000 && avgVolume > 1000000) return 3.0;    // Mid-large
  if (marketCap > 2000000000 && avgVolume > 500000) return 2.0;      // Mid cap
  return 1.0; // Small/illiquid
}

export { 
  apiTool,
  orbEssentialsTool,
  peadEssentialsTool,
  sentimentEssentialsTool,
  riskManagementTool,
  sessionInfoTool,
  optimizeSymbolData,
  extractTradingEssentials,
  extractEarningsTiming,
  extractSentimentContext,
  extractRiskManagement
};

/**
 * Tool for ORB strategy - trading essentials only
 * @type {Object}
 */
const orbEssentialsTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['trading_context', 'session_info'] });
    return extractTradingEssentials(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_orb_essentials',
      description: 'Fetch essential trading data optimized for ORB (Opening Range Breakout) strategy.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch ORB-essential data for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for PEAD strategy - earnings timing context
 * @type {Object}
 */
const peadEssentialsTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['strategy_context', 'fundamentals'] });
    return extractEarningsTiming(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_pead_essentials',
      description: 'Fetch earnings timing data optimized for PEAD (Post-Earnings Announcement Drift) strategy.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch PEAD-essential data for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for sentiment strategy - news analysis context
 * @type {Object}
 */
const sentimentEssentialsTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['fundamentals', 'extremes'] });
    return extractSentimentContext(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_sentiment_essentials',
      description: 'Fetch sentiment analysis context for news-based trading strategies.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch sentiment context for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for supervisor risk management
 * @type {Object}
 */
const riskManagementTool = {
  function: async (args) => {
    const rawData = await executeFunction({ ...args, sections: ['trading_context', 'fundamentals', 'extremes'] });
    return extractRiskManagement(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_risk_management_data',
      description: 'Fetch risk management data for position sizing and trading constraints.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch risk management data for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for session information - market timing
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
      session: {
        market_open: rawData.open_time,
        market_close: rawData.regular_close_time,
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        currency: rawData.currency_code,
        type: rawData.type
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_session_info',
      description: 'Fetch market session information for trading timing and schedule management.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch session information for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};