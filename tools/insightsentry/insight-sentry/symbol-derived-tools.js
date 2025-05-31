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
        gap_analysis: {
          gap_percent: gapPercent,
          gap_thresholds: {
            large_gap: 5.0,
            medium_gap: 2.0,
            small_gap: 0.5
          },
          gap_classification: classifyGap(gapPercent)
        },
        
        volume_analysis: {
          avg_volume: rawData.average_volume,
          volume_thresholds: {
            very_high: 10000000,
            high: 1000000,
            medium: 100000,
            low: 10000
          },
          volume_classification: classifyVolume(rawData.average_volume)
        },
        
        // Session timing
        market_open: rawData.open_time,
        market_close: rawData.regular_close_time,
        
        // Volatility indicators
        ath_distance: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
        
        // ORB strategy criteria (let LLM decide suitability)
        orb_criteria: {
          min_volume_threshold: 500000,
          min_market_cap_threshold: 1000000000, // $1B
          min_gap_threshold: 0.5, // 0.5%
          actual_volume: rawData.average_volume,
          actual_market_cap: rawData.market_cap,
          actual_gap: gapPercent,
          volume_meets_threshold: rawData.average_volume > 500000,
          market_cap_meets_threshold: rawData.market_cap > 1000000000,
          gap_meets_threshold: !gapPercent || Math.abs(gapPercent) > 0.5
        }
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
        
        // Market context with transparent classifications
        market_context: {
          market_cap: rawData.market_cap,
          market_cap_thresholds: {
            mega_cap: 200000000000,
            large_cap: 10000000000,
            mid_cap: 2000000000,
            small_cap: 300000000
          },
          size_classification: classifyMarketCap(rawData.market_cap),
          
          avg_volume: rawData.average_volume,
          dollar_volume: rawData.average_volume * rawData.regular_close_price,
          liquidity_thresholds: {
            high: 100000000, // $100M daily
            medium: 10000000, // $10M daily
            low: 1000000 // $1M daily
          },
          liquidity_classification: classifyLiquidity(rawData.average_volume, rawData.regular_close_price)
        },
        
        // PEAD strategy criteria (let LLM decide eligibility)
        pead_criteria: {
          min_market_cap_threshold: 2000000000, // $2B
          min_volume_threshold: 1000000,
          max_days_post_earnings: 5,
          actual_market_cap: rawData.market_cap,
          actual_volume: rawData.average_volume,
          actual_days_since_earnings: daysSinceLast,
          market_cap_meets_threshold: rawData.market_cap > 2000000000,
          volume_meets_threshold: rawData.average_volume > 1000000,
          within_drift_window: inPeadWindow
        }
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
        
        // Size and liquidity with transparent thresholds
        market_analysis: {
          market_cap: rawData.market_cap,
          market_cap_thresholds: {
            mega_cap: 200000000000,
            large_cap: 10000000000,
            mid_cap: 2000000000,
            small_cap: 300000000
          },
          size_classification: classifyMarketCap(rawData.market_cap),
          
          avg_volume: rawData.average_volume,
          dollar_volume: rawData.average_volume * rawData.regular_close_price,
          
          // Valuation with transparent classification
          pe_ratio: rawData.price_earnings_ttm,
          pe_thresholds: {
            expensive: 40,
            moderate: 20,
            reasonable: 12
          },
          valuation_classification: classifyPE(rawData.price_earnings_ttm)
        },
        
        // Volatility context
        ath: rawData.all_time_high,
        atl: rawData.all_time_low,
        ath_distance_pct: rawData.all_time_high ? 
          ((rawData.all_time_high - rawData.regular_close_price) / rawData.all_time_high * 100) : null,
        
        // News impact analysis criteria (let LLM assess sensitivity)
        news_impact_factors: {
          market_cap_thresholds: {
            high_sensitivity: 5000000000, // < $5B
            low_sensitivity: 100000000000 // > $100B
          },
          pe_ratio_thresholds: {
            growth_stock: 30 // > 30 PE suggests growth stock
          },
          volume_thresholds: {
            low_liquidity: 500000 // < 500k shares = higher impact
          },
          actual_values: {
            market_cap: rawData.market_cap,
            pe_ratio: rawData.price_earnings_ttm,
            avg_volume: rawData.average_volume
          }
        },
        
        // Sentiment weighting factors (transparent calculation)
        sentiment_weighting_factors: {
          base_weight: 0.4,
          small_cap_bonus: rawData.market_cap < 2000000000 ? 0.4 : 0,
          mid_cap_bonus: rawData.market_cap < 10000000000 && rawData.market_cap >= 2000000000 ? 0.2 : 0,
          low_liquidity_bonus: (rawData.average_volume * 100) < 5000000 ? 0.3 : 0, // Rough dollar volume
          calculated_weight: Math.min(1.0, 0.4 + 
            (rawData.market_cap < 2000000000 ? 0.4 : 0) +
            (rawData.market_cap < 10000000000 && rawData.market_cap >= 2000000000 ? 0.2 : 0) +
            ((rawData.average_volume * 100) < 5000000 ? 0.3 : 0))
        }
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
        
        // Risk assessment criteria (transparent thresholds)
        risk_thresholds: {
          market_cap: {
            low_risk: 50000000000, // > $50B
            medium_risk: 10000000000, // > $10B
            medium_high_risk: 2000000000 // > $2B
          },
          dollar_volume: {
            low_risk: 50000000, // > $50M daily
            medium_risk: 10000000, // > $10M daily
            medium_high_risk: 5000000 // > $5M daily
          }
        },
        
        // Position sizing criteria (show calculation logic)
        position_sizing: {
          base_position_pct: 0.5,
          large_liquid_bonus: rawData.market_cap > 100000000000 && rawData.average_volume > 10000000 ? 4.5 : 0,
          mid_large_bonus: rawData.market_cap > 10000000000 && rawData.average_volume > 1000000 ? 2.5 : 0,
          mid_cap_bonus: rawData.market_cap > 2000000000 && rawData.average_volume > 500000 ? 1.5 : 0,
          calculated_max_position_pct: Math.max(0.5,
            0.5 + 
            (rawData.market_cap > 100000000000 && rawData.average_volume > 10000000 ? 4.5 : 0) +
            (rawData.market_cap > 10000000000 && rawData.average_volume > 1000000 ? 2.5 : 0) +
            (rawData.market_cap > 2000000000 && rawData.average_volume > 500000 ? 1.5 : 0)
          ),
          max_shares_calculation: {
            daily_volume_limit_pct: 5, // 5% of daily volume
            calculated_max_shares: Math.floor((dollarVolume * 0.05) / rawData.regular_close_price)
          }
        },
        
        // Strategy approval criteria (let LLM decide)
        strategy_criteria: {
          orb: {
            min_volume: 500000,
            min_market_cap: 1000000000,
            meets_criteria: rawData.average_volume > 500000 && rawData.market_cap > 1000000000
          },
          pead: {
            min_volume: 1000000,
            min_market_cap: 2000000000,
            meets_criteria: rawData.average_volume > 1000000 && rawData.market_cap > 2000000000
          },
          sentiment: {
            min_dollar_volume: 1000000,
            actual_dollar_volume: dollarVolume,
            meets_criteria: dollarVolume > 1000000
          }
        }
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

// Helper functions for transparent classification (showing thresholds to LLM)
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

function determinePeadStage(daysSinceLast) {
  if (daysSinceLast === null || daysSinceLast < 0) return 'pre_earnings';
  if (daysSinceLast === 0) return 'earnings_day';
  if (daysSinceLast <= 2) return 'early_drift';
  if (daysSinceLast <= 5) return 'late_drift';
  return 'post_window';
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
