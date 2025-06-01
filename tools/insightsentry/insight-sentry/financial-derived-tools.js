/**
 * Derived financial data tools optimized for specific trading strategies
 * These tools extract and transform data from the base financial-data tool
 */

// Import the base execution function
const executeFunction = async (args) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  try {
    const url = `${baseUrl}/v2/symbols/${args.symbol}/financials`;
    const headers = { 'x-rapidapi-key': apiKey };
    
    const response = await fetch(url, { method: 'GET', headers });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData);
    }
    
    const data = await response.json();
    
    // Apply basic optimization if requested
    if (args.optimize || args.quarters_limit) {
      return optimizeFinancialData(data, args);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return { error: 'An error occurred while fetching financial data.' };
  }
};

const optimizeFinancialData = (rawData, options = {}) => {
  const { quarters_limit = 4 } = options;
  
  if (!rawData?.data) return rawData;
  
  const optimized = {
    code: rawData.code,
    last_update: rawData.last_update,
    data: {}
  };
  
  const limitHistoricalData = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.endsWith('_fq_h') && Array.isArray(value)) {
        result[key] = value.slice(0, quarters_limit);
      } else if (key.endsWith('_fy_h') && Array.isArray(value)) {
        result[key] = value.slice(0, Math.ceil(quarters_limit / 4));
      } else {
        result[key] = value;
      }
    }
    return result;
  };
  
  for (const [section, sectionData] of Object.entries(rawData.data)) {
    if (typeof sectionData === 'object' && sectionData !== null) {
      optimized.data[section] = limitHistoricalData(sectionData);
    } else {
      optimized.data[section] = sectionData;
    }
  }
  
  return optimized;
};

/**
 * Strategy-specific tool for market cap filtering and basic screening
 * Used by: Supervisor for position sizing, PEAD for market cap filters
 */
const marketCapScreeningTool = {
  function: async ({ symbol, include_valuation_context = true, position_sizing_focus = false }) => {
    const rawData = await executeFunction({ 
      symbol, 
      optimize: true, 
      quarters_limit: include_valuation_context ? 4 : 1 
    });
    
    if (!rawData?.data) return rawData;
    
    const income = rawData.data.income_statement || {};
    const company = rawData.data.company_info || {};
    const valuation = rawData.data.valuation_ratios || {};
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      screening: {
        shares_outstanding: income.basic_shares_outstanding_fq || income.basic_shares_outstanding_fy,
        sector: company.sector,
        industry: company.industry,
        employees: company.number_of_employees,
        
        // Valuation ratios (raw data for agent analysis)
        pe_ratio: valuation.price_earnings,
        pb_ratio: valuation.price_book_ratio,
        
        // Earnings data (raw for agent analysis)
        latest_eps: income.earnings_per_share_diluted_fq,
        annual_eps: income.earnings_per_share_diluted_fy,
        
        // Additional context if requested
        ...(include_valuation_context && {
          revenue_trends: (income.revenue_fq_h || []).slice(0, 4),
          eps_trends: (income.earnings_per_share_diluted_fq_h || []).slice(0, 4)
        })
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_market_cap_screening',
      description: 'Specialized screening tool for position sizing and market cap-based strategy filtering. Returns share count, valuation ratios, and sector classification. Use this when you need to determine position sizes, filter stocks by market cap tiers, or assess strategy eligibility based on company size.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol with exchange prefix for market cap screening (e.g., "NASDAQ:AAPL"). Best for liquid, established companies with clear share count data.',
            pattern: '^[A-Z]+:[A-Z]{1,5}$'
          },
          include_valuation_context: {
            type: 'boolean',
            description: 'Include recent earnings and revenue trends for additional screening context.',
            default: true
          },
          position_sizing_focus: {
            type: 'boolean',
            description: 'Optimize response for position sizing calculations by emphasizing share count accuracy.',
            default: false
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool optimized for earnings surprise calculations
 * Used by: PEAD strategy for post-earnings drift analysis
 */
const earningsSurpriseTool = {
  function: async ({ symbol, historical_quarters = 8, include_revenue_analysis = true }) => {
    const rawData = await executeFunction({ 
      symbol, 
      optimize: true, 
      quarters_limit: Math.max(historical_quarters, 8) 
    });
    
    if (!rawData?.data) return rawData;
    
    const income = rawData.data.income_statement || {};
    const company = rawData.data.company_info || {};
    
    // Get recent quarterly data
    const epsQuarterly = (income.earnings_per_share_diluted_fq_h || []).slice(0, historical_quarters);
    const revenueQuarterly = include_revenue_analysis ? (income.revenue_fq_h || []).slice(0, historical_quarters) : [];
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      earnings_analysis: {
        // Most recent quarter
        latest_eps: income.earnings_per_share_diluted_fq,
        latest_revenue: income.revenue_fq,
        
        // Historical for trend analysis (raw data for agent to analyze)
        eps_quarterly_history: epsQuarterly,
        ...(include_revenue_analysis && { revenue_quarterly_history: revenueQuarterly }),
        
        // Context
        sector: company.sector,
        shares_outstanding: income.basic_shares_outstanding_fq,
        market_cap_estimate: null // To be filled with price data
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_earnings_surprise_data',
      description: 'Specialized tool for Post-Earnings Announcement Drift (PEAD) analysis focusing on earnings surprise detection. Returns detailed quarterly EPS history, revenue trends, and sector context. Use this specifically when analyzing stocks after earnings announcements to identify surprise patterns and momentum opportunities.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol with exchange prefix for earnings surprise analysis (e.g., "NASDAQ:NVDA"). Most effective for companies with consistent quarterly reporting and analyst coverage.',
            pattern: '^[A-Z]+:[A-Z]{1,5}$'
          },
          historical_quarters: {
            type: 'number',
            description: 'Number of historical quarters to analyze for earnings patterns (4-20). More quarters provide better trend analysis but slower response.',
            default: 8,
            minimum: 4,
            maximum: 20
          },
          include_revenue_analysis: {
            type: 'boolean',
            description: 'Include revenue surprise analysis alongside earnings. Useful for comprehensive surprise assessment.',
            default: true
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for financial health red flags
 * Used by: Supervisor for risk management, all strategies for screening
 */
const financialHealthFlagsTool = {
  function: async ({ symbol, focus_on_debt = true, liquidity_emphasis = false, quarters_for_trends = 4 }) => {
    const rawData = await executeFunction({ 
      symbol, 
      optimize: true, 
      quarters_limit: Math.max(quarters_for_trends, 4) 
    });
    
    if (!rawData?.data) return rawData;
    
    const balance = rawData.data.balance_sheet || {};
    const profitability = rawData.data.profitability || {};
    const income = rawData.data.income_statement || {};
    const company = rawData.data.company_info || {};
    const cashFlow = rawData.data.cash_flow || {};
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      health_metrics: {
        // Core financial health indicators
        debt_to_equity: balance.total_debt_to_equity_fq,
        current_ratio: balance.current_ratio_fq,
        operating_margin: profitability.operating_margin_current,
        pe_ratio: profitability.price_earnings,
        roe: profitability.return_on_equity_current,
        
        // Additional debt and liquidity metrics if requested
        ...(focus_on_debt && {
          total_debt: balance.total_debt_fq,
          cash_and_equivalents: balance.cash_n_equivalents_fq,
          interest_coverage: profitability.interest_coverage_ratio
        }),
        
        ...(liquidity_emphasis && {
          cash_and_short_term: balance.cash_n_short_term_invest_fq,
          working_capital: balance.working_capital_fq,
          operating_cash_flow: cashFlow.operating_cash_flow_per_share
        }),
        
        // Revenue trends for deterioration detection
        revenue_quarterly_history: (income.revenue_fq_h || []).slice(0, quarters_for_trends),
        
        // Company context
        sector: company.sector,
        employees: company.number_of_employees
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_financial_health_flags',
      description: 'Comprehensive financial health assessment tool for risk management and red flag detection. Returns debt ratios, liquidity metrics, profitability trends, and cash flow indicators. Use this before making investments to identify potential financial distress, bankruptcy risk, or deteriorating business conditions.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol with exchange prefix for financial health assessment (e.g., "NYSE:F", "NYSE:GE"). Most useful for mature companies, cyclical businesses, or stocks with recent performance concerns.',
            pattern: '^[A-Z]+:[A-Z]{1,5}$'
          },
          focus_on_debt: {
            type: 'boolean',
            description: 'Include detailed debt analysis including interest coverage and debt composition.',
            default: true
          },
          liquidity_emphasis: {
            type: 'boolean',
            description: 'Emphasize short-term liquidity and working capital analysis for immediate financial stress assessment.',
            default: false
          },
          quarters_for_trends: {
            type: 'number',
            description: 'Number of quarters to analyze for deteriorating trends (2-8). More quarters show longer-term patterns.',
            default: 4,
            minimum: 2,
            maximum: 8
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Minimal tool for sentiment strategy context
 * Used by: SentimentAgent for valuation context with news
 */
const sentimentContextTool = {
  function: async ({ symbol, include_size_metrics = false, detailed_valuation = false }) => {
    const rawData = await executeFunction({ 
      symbol, 
      sections: ['company_info', 'valuation_ratios', ...(include_size_metrics ? ['income_statement'] : [])],
      optimize: true,
      quarters_limit: 1
    });
    
    if (!rawData?.data) return rawData;
    
    const company = rawData.data.company_info || {};
    const valuation = rawData.data.valuation_ratios || {};
    const income = rawData.data.income_statement || {};
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      sentiment_context: {
        sector: company.sector,
        industry: company.industry,
        employees: company.number_of_employees,
        
        // Valuation context for sentiment interpretation
        pe_ratio: valuation.price_earnings,
        pb_ratio: valuation.price_book_ratio,
        price_sales: valuation.price_sales_ratio,
        
        // Optional size and momentum context
        ...(include_size_metrics && {
          shares_outstanding: income.basic_shares_outstanding_fq,
          latest_eps: income.earnings_per_share_diluted_fq
        }),
        
        ...(detailed_valuation && {
          ev_ebitda: valuation.enterprise_value_ebitda_current,
          price_cash_flow: valuation.price_cash_flow_ratio
        })
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_sentiment_context',
      description: 'Lightweight tool providing company and valuation context for sentiment-driven trading strategies. Returns sector classification, key valuation ratios, and company size metrics. Use this when analyzing news sentiment impact on stock prices or combining fundamental context with sentiment signals.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'Stock ticker symbol with exchange prefix for sentiment context (e.g., "NASDAQ:TSLA", "NASDAQ:AAPL"). Most effective for widely-covered stocks with active news flow and analyst coverage.',
            pattern: '^[A-Z]+:[A-Z]{1,5}$'
          },
          include_size_metrics: {
            type: 'boolean',
            description: 'Include market cap indicators (shares outstanding, EPS) for size-based sentiment analysis.',
            default: false
          },
          detailed_valuation: {
            type: 'boolean',
            description: 'Include additional valuation ratios (EV/EBITDA, P/CF) for comprehensive sentiment context.',
            default: false
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { 
  marketCapScreeningTool,
  earningsSurpriseTool,
  financialHealthFlagsTool,
  sentimentContextTool
};
