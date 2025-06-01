/**
 * Derived session information tools optimized for specific trading strategies
 * These tools extract and transform data from the base session-information tool
 */

// Import the base execution function
const executeFunction = async ({ symbol }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  try {
    const url = `${baseUrl}/v2/symbols/${symbol}/session`;
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': apiKey
    };

    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }

    return await response.json();
  } catch (error) {
    console.error('Error retrieving session information:', error);
    return { error: 'An error occurred while retrieving session information.' };
  }
};

/**
 * Real-time market status tool for immediate trading decisions
 * Used by: All trading agents for market open/close status
 */
const marketStatusTool = {
  function: async ({ symbol, timestamp = null }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData || rawData.error) {
      return { error: 'Failed to retrieve session data' };
    }

    const currentTime = timestamp ? new Date(timestamp) : new Date();
    
    return {
      symbol: rawData.code,
      timestamp: currentTime.toISOString(),
      market_status: {
        timezone: rawData.timezone,
        regular_session: rawData.regular_session,
        extended_session: rawData.extended_session,
        holidays: rawData.holidays || [],
        details: rawData.details || []
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'get_market_status',
      description: 'Get real-time market status including open/close state, current session, and next trading times.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to check market status for.'
          },
          timestamp: {
            type: 'string',
            description: 'Optional ISO timestamp to check status at specific time (default: current time).'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Trading session calendar tool for planning and scheduling
 * Used by: Supervisor for strategy scheduling, all agents for timing decisions
 */
const tradingCalendarTool = {
  function: async ({ symbol, start_date = null, end_date = null, days_ahead = 7 }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData || rawData.error) {
      return { error: 'Failed to retrieve session data' };
    }

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + (days_ahead * 24 * 60 * 60 * 1000));
    
    return {
      symbol: rawData.code,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      session_data: {
        timezone: rawData.timezone,
        regular_session: rawData.regular_session,
        extended_session: rawData.extended_session,
        holidays: rawData.holidays || [],
        details: rawData.details || []
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'get_trading_calendar',
      description: 'Get trading calendar with market days, holidays, and session hours for planning strategies.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to get trading calendar for.'
          },
          start_date: {
            type: 'string',
            description: 'Start date in YYYY-MM-DD format (default: today).'
          },
          end_date: {
            type: 'string',
            description: 'End date in YYYY-MM-DD format (default: 7 days from start).'
          },
          days_ahead: {
            type: 'number',
            description: 'Number of days ahead to include if end_date not specified (default: 7).'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Session-aware execution tool for optimal order timing
 * Used by: All trading agents for order placement timing
 */
const executionTimingTool = {
  function: async ({ symbol, strategy_type = 'general' }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData || rawData.error) {
      return { error: 'Failed to retrieve session data' };
    }

    const currentTime = new Date();
    
    return {
      symbol: rawData.code,
      strategy_type,
      execution_timing: {
        timezone: rawData.timezone,
        regular_session: rawData.regular_session,
        extended_session: rawData.extended_session,
        current_time: currentTime.toISOString()
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'get_execution_timing',
      description: 'Get session-aware execution timing recommendations for optimal order placement.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to get execution timing for.'
          },
          strategy_type: {
            type: 'string',
            description: 'Trading strategy type: general, momentum, mean_reversion, earnings, sentiment (default: general).',
            enum: ['general', 'momentum', 'mean_reversion', 'earnings', 'sentiment']
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Risk management session tool for raw session data
 * Used by: Supervisor and risk management for session-based analysis
 */
const riskSessionTool = {
  function: async ({ symbol, position_size = null, strategy = 'general' }) => {
    const rawData = await executeFunction({ symbol });
    
    if (!rawData || rawData.error) {
      return { error: 'Failed to retrieve session data' };
    }

    const currentTime = new Date();
    
    return {
      symbol: rawData.code,
      strategy,
      timestamp: currentTime.toISOString(),
      session_data: {
        timezone: rawData.timezone,
        regular_session: rawData.regular_session,
        extended_session: rawData.extended_session,
        holidays: rawData.holidays || [],
        details: rawData.details || []
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'get_session_risk_data',
      description: 'Get raw session data for risk assessment and position sizing analysis.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to get session data for.'
          },
          position_size: {
            type: 'number',
            description: 'Proposed position size for context (optional).'
          },
          strategy: {
            type: 'string',
            description: 'Trading strategy for context (default: general).'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export {
  marketStatusTool,
  tradingCalendarTool,
  executionTimingTool,
  riskSessionTool
};
