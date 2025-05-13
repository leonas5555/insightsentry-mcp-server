import { apiTool } from '../session-infomation';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('get_session_information', () => {
  const mockSymbol = 'AAPL';
  const mockRequest = { symbol: mockSymbol };
  const mockResponse = {
    code: 'AAPL',
    holidays: ['2025-01-01', '2025-12-25'],
    start_hour: '09:30',
    end_hour: '16:00',
    details: [
      {
        session_correction: [],
        session: 'regular',
        description: 'Regular trading session'
      }
    ],
    currency_code: 'USD',
    description: 'Apple Inc. Equity',
    type: 'equity',
    timezone: 'America/New_York',
    last_update: 1715600000,
    tick_size: '0.01',
    price_scale: 2,
    point_value: 1,
    minimum_movement: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.INSIGHTSENTRY_BASE_URL = 'https://mock-base-url.com';
    process.env.INSIGHTSENTRY_API_KEY = 'mock-api-key';
  });

  it('should return session information for a valid symbol', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });
    const result = await apiTool.function(mockRequest);
    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://mock-base-url.com/v2/symbols/AAPL/session',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': 'mock-api-key'
        })
      })
    );
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Not found' })
    });
    const result = await apiTool.function(mockRequest);
    expect(result).toHaveProperty('error');
    expect(result.error).toMatch(/error/i);
  });

  it('should handle fetch exceptions gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    const result = await apiTool.function(mockRequest);
    expect(result).toHaveProperty('error');
    expect(result.error).toMatch(/error/i);
  });
});
