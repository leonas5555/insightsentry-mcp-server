/**
 * Base function to fetch financial data for a specific stock symbol from InsightSentry.
 *
 * @param {Object} args - Arguments for the financial data request.
 * @param {string} args.symbol - The stock symbol to fetch financial data for.
 * @param {Array<string>} [args.sections] - Specific sections to extract (e.g., ['valuation_ratios', 'profitability']).
 * @param {boolean} [args.optimize] - Whether to apply optimization filters.
 * @param {number} [args.quarters_limit] - Limit historical quarterly data to N recent quarters.
 * @returns {Promise<Object>} - The financial data for the specified stock symbol.
 */
const executeFunction = async ({ symbol, sections = null, optimize = false, quarters_limit = 4 }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  try {
    // Construct the URL with the stock symbol
    const url = `${baseUrl}/v2/symbols/${symbol}/financials`;

    // Set up headers for the request
    const headers = {
      'x-rapidapi-key': apiKey
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

    // Parse the response data
    const data = await response.json();
    
    // Apply filtering/optimization if requested
    if (optimize || sections) {
      return optimizeFinancialData(data, { sections, quarters_limit });
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return { error: 'An error occurred while fetching financial data.' };
  }
};

/**
 * Optimize financial data by extracting only essential metrics
 */
const optimizeFinancialData = (rawData, options = {}) => {
  const { sections, quarters_limit = 4 } = options;
  
  if (!rawData?.data) return rawData;
  
  const optimized = {
    code: rawData.code,
    last_update: rawData.last_update,
    data: {}
  };
  
  // Helper function to limit historical arrays
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
  
  // If specific sections requested, extract only those
  if (sections && Array.isArray(sections)) {
    for (const section of sections) {
      if (rawData.data[section]) {
        optimized.data[section] = limitHistoricalData(rawData.data[section]);
      }
    }
  } else {
    // Apply general optimization - keep all sections but limit historical data
    for (const [section, sectionData] of Object.entries(rawData.data)) {
      if (typeof sectionData === 'object' && sectionData !== null) {
        optimized.data[section] = limitHistoricalData(sectionData);
      } else {
        optimized.data[section] = sectionData;
      }
    }
  }
  
  return optimized;
};

/**
 * Extract essential metrics for PEAD strategy
 */
const extractPEADEssentials = (rawData) => {
  if (!rawData?.data) return rawData;
  
  const income = rawData.data.income_statement || {};
  const company = rawData.data.company_info || {};
  
  return {
    symbol: rawData.code,
    last_update: rawData.last_update,
    essentials: {
      // Core earnings data for PEAD
      earnings_per_share_diluted_fq: income.earnings_per_share_diluted_fq,
      earnings_per_share_diluted_fy: income.earnings_per_share_diluted_fy,
      earnings_quarterly: (income.earnings_per_share_diluted_fq_h || []).slice(0, 4),
      
      // Revenue data
      revenue_fq: income.revenue_fq,
      revenue_fy: income.revenue_fy,
      revenue_quarterly: (income.revenue_fq_h || []).slice(0, 4),
      
      // Share count for calculations
      shares_outstanding: income.basic_shares_outstanding_fq,
      
      // Company context
      sector: company.sector,
      market_cap: null // Will be calculated from price * shares
    }
  };
};

/**
 * Extract valuation ratios for risk management
 */
const extractValuationRatios = (rawData) => {
  if (!rawData?.data) return rawData;
  
  const valuation = rawData.data.valuation_ratios || {};
  const profitability = rawData.data.profitability || {};
  const company = rawData.data.company_info || {};
  
  return {
    symbol: rawData.code,
    last_update: rawData.last_update,
    valuation: {
      pe_ratio: valuation.price_earnings,
      pb_ratio: valuation.price_book_ratio,
      price_sales: valuation.price_sales_ratio,
      ev_ebitda: valuation.enterprise_value_ebitda_current,
      
      // Financial health indicators
      roe: profitability.return_on_equity,
      roa: profitability.return_on_assets,
      operating_margin: profitability.operating_margin,
      net_margin: profitability.net_margin,
      
      // Company context
      sector: company.sector,
      industry: company.industry,
      employees: company.number_of_employees
    }
  };
};

/**
 * Extract balance sheet health metrics
 */
const extractBalanceSheetHealth = (rawData) => {
  if (!rawData?.data) return rawData;
  
  const balance = rawData.data.balance_sheet || {};
  const profitability = rawData.data.profitability || {};
  const cashFlow = rawData.data.cash_flow || {};
  
  return {
    symbol: rawData.code,
    last_update: rawData.last_update,
    health: {
      cash_and_equivalents: balance.cash_n_equivalents_fq,
      cash_and_short_term: balance.cash_n_short_term_invest_fq,
      total_debt: balance.total_debt_fq,
      current_ratio: balance.current_ratio_fq,
      debt_to_equity: balance.total_debt_to_equity_fq,
      
      // Profitability metrics
      roe: profitability.return_on_equity_current,
      roa: profitability.return_on_assets_current,
      operating_margin: profitability.operating_margin_current,
      
      // Cash flow
      operating_cf_per_share: cashFlow.operating_cash_flow_per_share,
      free_cf_per_share: profitability.free_cash_flow_per_share_fq
    }
  };
};

/**
 * Tool configuration for fetching complete financial data from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'fetch_financial_data',
      description: 'Fetch financial data for a specific stock symbol from InsightSentry with configurable optimization.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch financial data for.'
          },
          sections: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific sections to extract (e.g., ["valuation_ratios", "profitability"]). If not provided, all sections are returned.'
          },
          optimize: {
            type: 'boolean',
            description: 'Whether to apply optimization filters to reduce data size by limiting historical arrays.',
            default: false
          },
          quarters_limit: {
            type: 'number',
            description: 'Limit historical quarterly data to N recent quarters (default: 4).',
            default: 4
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for PEAD strategy - essential earnings and revenue data only
 * @type {Object}
 */
const peadEssentialsTool = {
  function: async (args) => {
    const rawData = await executeFunction(args);
    return extractPEADEssentials(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_pead_essentials',
      description: 'Fetch essential earnings and revenue data optimized for PEAD (Post-Earnings Announcement Drift) strategy.',
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
 * Tool for valuation screening - key ratios and health metrics
 * @type {Object}
 */
const valuationRatiosTool = {
  function: async (args) => {
    const rawData = await executeFunction(args);
    return extractValuationRatios(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_valuation_ratios',
      description: 'Fetch key valuation ratios and profitability metrics for stock screening and risk assessment.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch valuation ratios for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for balance sheet health assessment
 * @type {Object}
 */
const balanceSheetHealthTool = {
  function: async (args) => {
    const rawData = await executeFunction(args);
    return extractBalanceSheetHealth(rawData);
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_balance_sheet_health',
      description: 'Fetch balance sheet health metrics including debt ratios, cash position, and financial stability indicators.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch balance sheet health data for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

/**
 * Tool for sector and company information
 * @type {Object}
 */
const companyInfoTool = {
  function: async (args) => {
    const rawData = await executeFunction(args);
    const company = rawData?.data?.company_info || {};
    
    return {
      symbol: rawData.code,
      last_update: rawData.last_update,
      company: {
        name: company.business_description?.split('.')[0] || '',
        sector: company.sector,
        industry: company.industry,
        location: company.location,
        country: company.country,
        employees: company.number_of_employees,
        founded: company.founded,
        website: company.web_site_url,
        ceo: company.ceo
      }
    };
  },
  definition: {
    type: 'function',
    function: {
      name: 'fetch_company_info',
      description: 'Fetch basic company information including sector, industry, location, and key corporate details.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to fetch company information for.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { 
  apiTool, 
  peadEssentialsTool, 
  valuationRatiosTool, 
  balanceSheetHealthTool, 
  companyInfoTool 
};