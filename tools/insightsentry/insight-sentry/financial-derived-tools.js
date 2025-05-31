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
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol, optimize: true, quarters_limit: 1 });
    
    if (!rawData?.data) return rawData;
    
    const income = rawData.data.income_statement || {};
    const company = rawData.data.company_info || {};
    const valuation = rawData.data.valuation_ratios || {};
    
    // Calculate approximate market cap from shares outstanding
    const sharesOutstanding = income.basic_shares_outstanding_fq || income.basic_shares_outstanding_fy;
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      screening: {
        shares_outstanding: sharesOutstanding,
        estimated_market_cap: null, // Will be calculated with current price
        sector: company.sector,
        industry: company.industry,
        employees: company.number_of_employees,
        
        // Quick screening ratios
        pe_ratio: valuation.price_earnings,
        pb_ratio: valuation.price_book_ratio,
        
        // Earnings for trend analysis
        latest_eps: income.earnings_per_share_diluted_fq,
        annual_eps: income.earnings_per_share_diluted_fy,
        
        // Basic size classification
        size_category: classifyCompanySize(company.number_of_employees, sharesOutstanding)
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_market_cap_screening',
      description: 'Fetch market capitalization and basic screening data for position sizing and strategy eligibility.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch market cap screening data for.'
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
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol, optimize: true, quarters_limit: 8 });
    
    if (!rawData?.data) return rawData;
    
    const income = rawData.data.income_statement || {};
    const company = rawData.data.company_info || {};
    
    // Get recent quarterly data
    const epsQuarterly = (income.earnings_per_share_diluted_fq_h || []).slice(0, 8);
    const revenueQuarterly = (income.revenue_fq_h || []).slice(0, 8);
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      earnings_analysis: {
        // Most recent quarter
        latest_eps: income.earnings_per_share_diluted_fq,
        latest_revenue: income.revenue_fq,
        
        // Historical for trend analysis
        eps_quarterly_history: epsQuarterly,
        revenue_quarterly_history: revenueQuarterly,
        
        // Year-over-year growth
        eps_yoy_growth: calculateYoYGrowth(epsQuarterly),
        revenue_yoy_growth: calculateYoYGrowth(revenueQuarterly),
        
        // Sequential growth (QoQ)
        eps_qoq_growth: calculateQoQGrowth(epsQuarterly),
        revenue_qoq_growth: calculateQoQGrowth(revenueQuarterly),
        
        // Context
        sector: company.sector,
        market_cap_estimate: null // To be filled with price data
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_earnings_surprise_data',
      description: 'Fetch earnings and revenue data optimized for PEAD strategy earnings surprise analysis.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch earnings surprise data for.'
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
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ symbol, optimize: true, quarters_limit: 4 });
    
    if (!rawData?.data) return rawData;
    
    const balance = rawData.data.balance_sheet || {};
    const profitability = rawData.data.profitability || {};
    const income = rawData.data.income_statement || {};
    const company = rawData.data.company_info || {};
    
    // Calculate financial health flags
    const flags = {
      high_debt: (balance.total_debt_to_equity_fq || 0) > 2.0,
      low_liquidity: (balance.current_ratio_fq || 0) < 1.0,
      negative_margins: (profitability.operating_margin_current || 0) < 0,
      declining_revenue: checkRevenueDecline(income.revenue_fq_h || []),
      high_valuation: (profitability.price_earnings || 0) > 50,
      low_roe: (profitability.return_on_equity_current || 0) < 0.1
    };
    
    const flagCount = Object.values(flags).filter(Boolean).length;
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      health_assessment: {
        flags,
        total_red_flags: flagCount,
        risk_level: classifyRiskLevel(flagCount),
        
        // Key metrics for context
        debt_to_equity: balance.total_debt_to_equity_fq,
        current_ratio: balance.current_ratio_fq,
        operating_margin: profitability.operating_margin_current,
        pe_ratio: profitability.price_earnings,
        roe: profitability.return_on_equity_current,
        
        // Company context
        sector: company.sector,
        size: company.number_of_employees
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_financial_health_flags',
      description: 'Fetch financial health assessment with red flags for risk management and stock screening.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to assess financial health flags for.'
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
  function: async ({ symbol }) => {
    const rawData = await executeFunction({ 
      symbol, 
      sections: ['company_info', 'valuation_ratios'],
      optimize: true,
      quarters_limit: 1
    });
    
    if (!rawData?.data) return rawData;
    
    const company = rawData.data.company_info || {};
    const valuation = rawData.data.valuation_ratios || {};
    
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
        
        // Classification for sentiment weighting
        valuation_tier: classifyValuationTier(valuation),
        size_tier: classifyCompanySize(company.number_of_employees)
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_sentiment_context',
      description: 'Fetch minimal company and valuation context for sentiment analysis strategy.',
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

// Helper functions
function classifyCompanySize(employees, sharesOutstanding = null) {
  if (employees > 100000) return 'mega_cap';
  if (employees > 10000) return 'large_cap';
  if (employees > 1000) return 'mid_cap';
  return 'small_cap';
}

function classifyValuationTier(valuation) {
  const pe = valuation.price_earnings || 0;
  if (pe > 40) return 'expensive';
  if (pe > 20) return 'moderate';
  if (pe > 10) return 'cheap';
  return 'value';
}

function classifyRiskLevel(flagCount) {
  if (flagCount >= 4) return 'high';
  if (flagCount >= 2) return 'medium';
  return 'low';
}

function calculateYoYGrowth(quarterly) {
  if (quarterly.length < 4) return null;
  const current = quarterly[0];
  const yearAgo = quarterly[4];
  if (!current || !yearAgo || yearAgo === 0) return null;
  return (current - yearAgo) / Math.abs(yearAgo);
}

function calculateQoQGrowth(quarterly) {
  if (quarterly.length < 2) return null;
  const current = quarterly[0];
  const previous = quarterly[1];
  if (!current || !previous || previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}

function checkRevenueDecline(revenueHistory) {
  if (revenueHistory.length < 3) return false;
  // Check if revenue declined in 2 of last 3 quarters
  let declines = 0;
  for (let i = 0; i < 2; i++) {
    if (revenueHistory[i] < revenueHistory[i + 1]) declines++;
  }
  return declines >= 2;
}

export { 
  marketCapScreeningTool,
  earningsSurpriseTool,
  financialHealthFlagsTool,
  sentimentContextTool
};
