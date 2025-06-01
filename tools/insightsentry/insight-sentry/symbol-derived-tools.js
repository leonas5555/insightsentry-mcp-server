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
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      orb_context: {
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        point_value: rawData.point_value,
        min_movement: rawData.minimum_movement,
        currency: rawData.currency_code,
        current_price: rawData.regular_close_price,
        prev_close: rawData.prev_close_price,
        avg_volume: rawData.average_volume,
        market_cap: rawData.market_cap,
        market_open: rawData.open_time,
        market_close: rawData.regular_close_time,
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low
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
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      pead_timing: {
        next_earnings: nextEarnings,
        last_earnings: lastEarnings,
        market_cap: rawData.market_cap,
        avg_volume: rawData.average_volume,
        current_price: rawData.regular_close_price
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
        description: rawData.description,
        exchange: rawData.code?.split(':')[0] || 'UNKNOWN',
        currency: rawData.currency_code,
        market_cap: rawData.market_cap,
        avg_volume: rawData.average_volume,
        current_price: rawData.regular_close_price,
        pe_ratio: rawData.price_earnings_ttm,
        all_time_high: rawData.all_time_high,
        all_time_low: rawData.all_time_low
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
    
    return {
      symbol: rawData.code,
      last_update: new Date().toISOString(),
      risk_assessment: {
        market_cap: rawData.market_cap,
        current_price: rawData.regular_close_price,
        avg_volume: rawData.average_volume
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

export { 
  orbTradingContextTool,
  peadTimingTool,
  sentimentNewsContextTool,
  supervisorRiskTool
};
