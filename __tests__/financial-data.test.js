/**
 * Unit tests for financial-data.js
 */
import { jest } from '@jest/globals';
import { apiTool } from '../tools/insightsentry/insight-sentry/financial-data.js';

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  jest.resetModules();
  process.env = { 
    ...originalEnv,
    INSIGHTSENTRY_BASE_URL: 'https://api.insightsentry.com',
    INSIGHTSENTRY_API_KEY: 'test-api-key'
  };
});

afterEach(() => {
  process.env = originalEnv;
  jest.clearAllMocks();
});

// Mock fetch API
global.fetch = jest.fn();

describe('Financial Data API Tool', () => {
  it('should export an API tool with the expected structure', () => {
    expect(apiTool).toBeDefined();
    expect(apiTool.function).toBeDefined();
    expect(apiTool.definition).toBeDefined();
    expect(apiTool.definition.type).toBe('function');
    expect(apiTool.definition.function.name).toBe('fetch_financial_data');
  });

  it('should successfully fetch financial data for a valid symbol', async () => {
    // Mock successful API response
    const mockResponseData = {
      code: 'AAPL',
      last_update: 1621234567,
      data: {
        company_info: {
          business_description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
          sector: 'Technology',
          industry: 'Consumer Electronics',
          location: 'Cupertino, California',
          web_site_url: 'https://www.apple.com',
          ceo: 'Tim Cook',
          number_of_employees: 147000,
          number_of_employees_fy: 147000,
          number_of_shareholders: 0,
          number_of_shareholders_fy: 0,
          founded: 1976,
          currency: 'USD',
          country: 'United States',
          region: 'North America',
          country_code_fund: 'US'
        },
        valuation_ratios: {
          price_earnings: 28.82,
          price_earnings_fy: 28.82,
          price_book_ratio: 46.12,
          // Additional valuation ratios would be here...
        },
        profitability: {
          gross_margin: 0.41,
          operating_margin: 0.31,
          net_margin: 0.25,
          // Additional profitability metrics would be here...
        },
        balance_sheet: {
          cash_n_equivalents_fy: 62639000000,
          total_assets_fy: 323888000000,
          total_debt_fy: 119726000000,
          // Additional balance sheet data would be here...
        },
        cash_flow: {
          cash_f_operating_activities_fy: 104038000000,
          free_cash_flow_fy: 92953000000,
          // Additional cash flow data would be here...
        },
        income_statement: {
          revenue_fy: 365817000000,
          net_income_fy: 94680000000,
          // Additional income statement data would be here...
        }
      }
    };

    // Set up the mock response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponseData
    });

    // Call the function
    const result = await apiTool.function({ symbol: 'AAPL' });

    // Check that fetch was called with the correct parameters
    expect(fetch).toHaveBeenCalledWith(
      'https://api.insightsentry.com/v2/symbols/AAPL/financials',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'test-api-key'
        }
      }
    );

    // Verify the result
    expect(result).toEqual(mockResponseData);
    
    // Validate response schema
    expectValidResponseSchema(result);
  });

  it('should handle API error responses properly', async () => {
    // Mock error response
    const errorData = { 
      error: 'Symbol not found',
      code: 404
    };
    
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => errorData
    });

    // Call the function
    const result = await apiTool.function({ symbol: 'INVALID' });

    // Check that fetch was called with the correct parameters
    expect(fetch).toHaveBeenCalledWith(
      'https://api.insightsentry.com/v2/symbols/INVALID/financials',
      {
        method: 'GET',
        headers: {
          'x-rapidapi-key': 'test-api-key'
        }
      }
    );

    // Verify the error response
    expect(result).toEqual({ error: 'An error occurred while fetching financial data.' });
  });

  it('should handle fetch exceptions properly', async () => {
    // Mock a network error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    // Call the function
    const result = await apiTool.function({ symbol: 'AAPL' });

    // Verify the error response
    expect(result).toEqual({ error: 'An error occurred while fetching financial data.' });
  });
});

/**
 * Helper function to validate the response schema according to the specified schema
 */
function expectValidResponseSchema(response) {
  // Check top-level structure
  expect(response).toHaveProperty('code');
  expect(response).toHaveProperty('last_update');
  expect(response).toHaveProperty('data');
  
  expect(typeof response.code).toBe('string');
  expect(typeof response.last_update).toBe('number');
  
  const { data } = response;
  
  // Validate company_info
  expect(data).toHaveProperty('company_info');
  const company_info = data.company_info;
  
  if (company_info.business_description) expect(typeof company_info.business_description).toBe('string');
  if (company_info.sector) expect(typeof company_info.sector).toBe('string');
  if (company_info.industry) expect(typeof company_info.industry).toBe('string');
  if (company_info.location) expect(typeof company_info.location).toBe('string');
  if (company_info.web_site_url) expect(typeof company_info.web_site_url).toBe('string');
  if (company_info.ceo) expect(typeof company_info.ceo).toBe('string');
  if (company_info.number_of_employees) expect(typeof company_info.number_of_employees).toBe('number');
  if (company_info.number_of_employees_fy) expect(typeof company_info.number_of_employees_fy).toBe('number');
  if (company_info.number_of_shareholders) expect(typeof company_info.number_of_shareholders).toBe('number');
  if (company_info.number_of_shareholders_fy) expect(typeof company_info.number_of_shareholders_fy).toBe('number');
  if (company_info.founded) expect(typeof company_info.founded).toBe('number');
  if (company_info.currency) expect(typeof company_info.currency).toBe('string');
  if (company_info.country) expect(typeof company_info.country).toBe('string');
  if (company_info.region) expect(typeof company_info.region).toBe('string');
  if (company_info.country_code_fund) expect(typeof company_info.country_code_fund).toBe('string');
  
  // Validate valuation_ratios
  expect(data).toHaveProperty('valuation_ratios');
  const valuation_ratios = data.valuation_ratios;
  
  // Test for presence and type of each field in valuation_ratios
  const numberFields = [
    'price_earnings', 'price_earnings_fy', 'price_earnings_fq', 
    'price_annual_book', 'price_book_ratio', 'price_book_current', 'price_book_fy', 'price_book_fq',
    'price_annual_sales', 'price_sales_ratio', 'price_sales_current', 'price_sales_fy', 'price_sales_fq',
    'price_cash_flow_current', 'price_cash_flow_fy', 'price_cash_flow_fq',
    'price_free_cash_flow_current', 'price_free_cash_flow_ttm',
    'enterprise_value_ebitda_current', 'enterprise_value_ebitda_fy', 'enterprise_value_ebitda_fq', 'enterprise_value_ebitda_ttm',
    'revenue_per_share_fy', 'revenue_per_share_ttm',
    'book_per_share_fy', 'book_per_share_fq',
    'book_tangible_per_share_fy', 'book_tangible_per_share_fq',
    'free_cash_flow_per_share_fy', 'free_cash_flow_per_share_fq',
    'revenue_per_employee', 'revenue_per_employee_fy',
    'net_income_per_employee_fy', 'research_and_dev_per_employee_fy',
    'oper_income_per_employee_fy', 'free_cash_flow_per_employee_fy',
    'total_debt_per_employee_fy', 'total_assets_per_employee_fy'
  ];
  
  numberFields.forEach(field => {
    if (valuation_ratios[field] !== undefined) {
      expect(typeof valuation_ratios[field]).toBe('number');
    }
  });
  
  // Check array fields
  const arrayFields = [
    'price_earnings_fy_h', 'price_earnings_fq_h', 
    'price_book_fy_h', 'price_book_fq_h',
    'price_sales_fy_h', 'price_sales_fq_h',
    'price_cash_flow_fy_h', 'price_cash_flow_fq_h',
    'enterprise_value_ebitda_fy_h', 'enterprise_value_ebitda_fq_h',
    'book_value_per_share_fy_h', 'book_value_per_share_fq_h',
    'free_cash_flow_per_share_fy_h', 'free_cash_flow_per_share_fq_h'
  ];
  
  arrayFields.forEach(field => {
    if (valuation_ratios[field] !== undefined) {
      expect(Array.isArray(valuation_ratios[field])).toBe(true);
      // Check array items are numbers, if any exist
      if (valuation_ratios[field].length > 0) {
        expect(typeof valuation_ratios[field][0]).toBe('number');
      }
    }
  });
  
  // Validate profitability
  expect(data).toHaveProperty('profitability');
  const profitability = data.profitability;
  
  // Validate number fields in profitability
  const profitabilityNumberFields = [
    'gross_margin', 'gross_margin_current', 'gross_margin_fy', 'gross_margin_fq', 'gross_margin_ttm',
    'operating_margin', 'operating_margin_current', 'operating_margin_fy', 'operating_margin_fq', 'operating_margin_ttm',
    'pre_tax_margin', 'pre_tax_margin_current', 'pre_tax_margin_fy', 'pre_tax_margin_fq', 'pre_tax_margin_ttm',
    'net_margin', 'net_margin_current', 'net_margin_fy', 'net_margin_fq', 'net_margin_ttm',
    'after_tax_margin',
    'return_on_assets', 'return_on_assets_current', 'return_on_assets_fy', 'return_on_assets_fq',
    'return_on_equity', 'return_on_equity_current', 'return_on_equity_fy', 'return_on_equity_fq',
    'return_on_invested_capital', 'return_on_invested_capital_current', 'return_on_invested_capital_fy', 'return_on_invested_capital_fq',
    'return_on_tang_equity_fy', 'return_on_tang_equity_fq',
    'return_on_total_capital_fy', 'return_on_total_capital_fq',
    'return_of_invested_capital_percent_ttm',
    'return_on_capital_employed_fy', 'return_on_capital_employed_fq',
    'ebitda_margin_current', 'ebitda_margin_fy', 'ebitda_margin_fq',
    'ebitda_per_employee_fy'
  ];
  
  profitabilityNumberFields.forEach(field => {
    if (profitability[field] !== undefined) {
      expect(typeof profitability[field]).toBe('number');
    }
  });
  
  // Validate array fields in profitability
  const profitabilityArrayFields = [
    'gross_margin_fy_h', 'gross_margin_fq_h',
    'operating_margin_fy_h', 'operating_margin_fq_h',
    'pre_tax_margin_fy_h', 'pre_tax_margin_fq_h',
    'net_margin_fy_h', 'net_margin_fq_h',
    'return_on_assets_fy_h', 'return_on_assets_fq_h',
    'return_on_equity_fy_h', 'return_on_equity_fq_h',
    'return_on_invested_capital_fy_h', 'return_on_invested_capital_fq_h',
    'ebitda_margin_fy_h', 'ebitda_margin_fq_h'
  ];
  
  profitabilityArrayFields.forEach(field => {
    if (profitability[field] !== undefined) {
      expect(Array.isArray(profitability[field])).toBe(true);
      if (profitability[field].length > 0) {
        expect(typeof profitability[field][0]).toBe('number');
      }
    }
  });
  
  // Validate balance_sheet
  expect(data).toHaveProperty('balance_sheet');
  const balance_sheet = data.balance_sheet;
  
  // Sample validation for key balance sheet items (there are too many to list individually)
  const balanceSheetIntegerFields = [
    'cash_n_equivalents_fy', 'cash_n_equivalents_fq', 
    'cash_n_short_term_invest_fy', 'cash_n_short_term_invest_fq',
    'short_term_invest_fy', 'short_term_invest_fq',
    'accounts_receivables_gross_fy', 'accounts_receivables_net_fy', 'accounts_receivables_net_fq',
    'total_receivables_net_fy', 'total_receivables_net_fq',
    'total_inventory_fy', 'total_inventory_fq',
    'total_current_assets_fy', 'total_current_assets_fq',
    'ppe_total_gross_fy', 'ppe_total_gross_fq',
    'accum_deprec_total_fy', 'accum_deprec_total_fq',
    'ppe_total_net_fy', 'ppe_total_net_fq',
    'total_non_current_assets_fy', 'total_non_current_assets_fq',
    'total_assets_fy', 'total_assets_fq',
    'short_term_debt_fy', 'short_term_debt_fq',
    'accounts_payable_fy', 'accounts_payable_fq',
    'total_current_liabilities_fy', 'total_current_liabilities_fq',
    'long_term_debt_fy', 'long_term_debt_fq',
    'total_non_current_liabilities_fy', 'total_non_current_liabilities_fq',
    'total_liabilities_fy', 'total_liabilities_fq',
    'shrhldrs_equity_fy', 'shrhldrs_equity_fq',
    'total_liabilities_shrhldrs_equity_fy', 'total_liabilities_shrhldrs_equity_fq',
    'total_debt_fy', 'total_debt_fq',
    'working_capital_fy', 'working_capital_fq',
    'net_debt_fy', 'net_debt_fq',
    'invested_capital_fy', 'invested_capital_fq'
  ];
  
  balanceSheetIntegerFields.forEach(field => {
    if (balance_sheet[field] !== undefined) {
      expect(typeof balance_sheet[field]).toBe('number');
    }
  });
  
  // Validate ratio fields in balance sheet
  const balanceSheetRatioFields = [
    'debt_to_asset_current', 'debt_to_asset_fy', 'debt_to_asset_fq',
    'debt_to_equity_current', 'debt_to_equity_fy', 'debt_to_equity_fq',
    'long_term_debt_to_assets_current', 'long_term_debt_to_assets_fy', 'long_term_debt_to_assets_fq',
    'long_term_debt_to_equity_current', 'long_term_debt_to_equity_fy', 'long_term_debt_to_equity_fq',
    'total_debt_to_capital_fy', 'total_debt_to_capital_fq',
    'current_ratio', 'current_ratio_current', 'current_ratio_fy', 'current_ratio_fq',
    'quick_ratio', 'quick_ratio_current', 'quick_ratio_fy', 'quick_ratio_fq',
    'invent_turnover_current', 'invent_turnover_fy', 'invent_turnover_fq',
    'receivables_turnover_fy', 'receivables_turnover_fq',
    'asset_turnover_current', 'asset_turnover_fy', 'asset_turnover_fq',
    'fixed_assets_turnover_fy', 'fixed_assets_turnover_fq',
    'total_assets_to_equity_fy', 'total_assets_to_equity_fq'
  ];
  
  balanceSheetRatioFields.forEach(field => {
    if (balance_sheet[field] !== undefined) {
      expect(typeof balance_sheet[field]).toBe('number');
    }
  });
  
  // Sample check for array fields in balance sheet
  const balanceSheetArrayFields = [
    'cash_n_equivalents_fy_h', 'cash_n_equivalents_fq_h',
    'cash_n_short_term_invest_fy_h', 'cash_n_short_term_invest_fq_h',
    'accounts_receivables_gross_fy_h', 'accounts_receivables_net_fy_h', 'accounts_receivables_net_fq_h',
    'total_receivables_net_fy_h', 'total_receivables_net_fq_h',
    'total_inventory_fy_h', 'total_inventory_fq_h',
    'total_current_assets_fy_h', 'total_current_assets_fq_h',
    'total_assets_h', 'total_debt_h',
    'debt_to_asset_fy_h', 'debt_to_asset_fq_h',
    'debt_to_equity_fy_h', 'debt_to_equity_fq_h',
    'current_ratio_fy_h', 'current_ratio_fq_h',
    'quick_ratio_fy_h', 'quick_ratio_fq_h'
  ];
  
  balanceSheetArrayFields.forEach(field => {
    if (balance_sheet[field] !== undefined) {
      expect(Array.isArray(balance_sheet[field])).toBe(true);
    }
  });
  
  // Validate cash_flow
  expect(data).toHaveProperty('cash_flow');
  const cash_flow = data.cash_flow;
  
  // Sample validation for key cash flow items
  const cashFlowIntegerFields = [
    'net_income_starting_line_fy', 'net_income_starting_line_fq',
    'dep_amort_exp_income_s_fy', 'dep_amort_exp_income_s_fq', 'dep_amort_exp_income_s_ttm',
    'non_cash_items_fy', 'non_cash_items_fq', 'non_cash_items_ttm',
    'cash_flow_deprecation_n_amortization_fy', 'cash_flow_deprecation_n_amortization_fq', 'cash_flow_deprecation_n_amortization_ttm',
    'change_in_accounts_receivable_fy', 'change_in_accounts_receivable_fq', 'change_in_accounts_receivable_ttm',
    'change_in_inventories_fy', 'change_in_inventories_fq', 'change_in_inventories_ttm',
    'change_in_accounts_payable_fy', 'change_in_accounts_payable_fq', 'change_in_accounts_payable_ttm',
    'change_in_other_assets_fy', 'change_in_other_assets_fq', 'change_in_other_assets_ttm',
    'changes_in_working_capital_fy', 'changes_in_working_capital_fq', 'changes_in_working_capital_ttm',
    'cash_flow_deferred_taxes_fy', 'cash_flow_deferred_taxes_fq', 'cash_flow_deferred_taxes_ttm',
    'funds_f_operations_fy', 'funds_f_operations_fq', 'funds_f_operations_ttm',
    'cash_f_operating_activities_fy', 'cash_f_operating_activities_fq', 'cash_f_operating_activities_ttm',
    'capital_expenditures_fy', 'capital_expenditures_fq', 'capital_expenditures_ttm',
    'free_cash_flow_fy', 'free_cash_flow_fq', 'free_cash_flow_ttm'
  ];
  
  cashFlowIntegerFields.forEach(field => {
    if (cash_flow[field] !== undefined) {
      expect(typeof cash_flow[field]).toBe('number');
    }
  });
  
  // Check array fields in cash flow
  const cashFlowArrayFields = [
    'net_income_starting_line_fy_h', 'net_income_starting_line_fq_h',
    'dep_amort_exp_income_s_fy_h', 'dep_amort_exp_income_s_fq_h',
    'non_cash_items_fy_h', 'non_cash_items_fq_h',
    'cash_flow_deprecation_n_amortization_fy_h', 'cash_flow_deprecation_n_amortization_fq_h',
    'free_cash_flow_fy_h', 'free_cash_flow_fq_h'
  ];
  
  cashFlowArrayFields.forEach(field => {
    if (cash_flow[field] !== undefined) {
      expect(Array.isArray(cash_flow[field])).toBe(true);
    }
  });
  
  // Validate operating_cash_flow_per_share if it exists
  if (cash_flow.operating_cash_flow_per_share !== undefined) {
    expect(typeof cash_flow.operating_cash_flow_per_share).toBe('number');
  }
  
  // Validate income_statement
  expect(data).toHaveProperty('income_statement');
  const income_statement = data.income_statement;
  
  // Sample validation for key income statement items
  const incomeStatementIntegerFields = [
    'revenue_fy', 'revenue_fq',
    'cost_of_goods_fy', 'cost_of_goods_fq', 'cost_of_goods_ttm',
    'gross_profit_fy', 'gross_profit_fq', 'gross_profit_ttm',
    'research_and_dev_fy', 'research_and_dev_fq', 'research_and_dev_ttm',
    'sell_gen_admin_exp_total_fy', 'sell_gen_admin_exp_total_fq', 'sell_gen_admin_exp_total_ttm',
    'operating_expenses_fy', 'operating_expenses_fq', 'operating_expenses_ttm',
    'oper_income_fy', 'oper_income_fq', 'oper_income_ttm',
    'pretax_income_fy', 'pretax_income_fq', 'pretax_income_ttm',
    'income_tax_fy', 'income_tax_fq', 'income_tax_ttm',
    'net_income_fy', 'net_income_fq', 'net_income_ttm'
  ];
  
  incomeStatementIntegerFields.forEach(field => {
    if (income_statement[field] !== undefined) {
      expect(typeof income_statement[field]).toBe('number');
    }
  });
  
  // Check array fields in income statement
  const incomeStatementArrayFields = [
    'revenue_fy_h', 'revenue_fq_h',
    'cost_of_goods_fy_h', 'cost_of_goods_fq_h',
    'gross_profit_fy_h', 'gross_profit_fq_h', 'gross_profit_ttm_h',
    'oper_income_fy_h', 'oper_income_fq_h',
    'net_income_fy_h', 'net_income_fq_h', 'net_income_ttm_h'
  ];
  
  incomeStatementArrayFields.forEach(field => {
    if (income_statement[field] !== undefined) {
      expect(Array.isArray(income_statement[field])).toBe(true);
    }
  });
}
