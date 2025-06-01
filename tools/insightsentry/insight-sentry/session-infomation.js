/**
 * Base session information data optimization
 * Reduces data size and adds computed fields for better performance
 */
const optimizeSessionData = (rawData, options = {}) => {
  const { include_historical_holidays = false, timezone_convert = null } = options;
  
  if (!rawData || rawData.error) {
    return rawData;
  }
  
  const optimized = {
    code: rawData.code,
    last_update: rawData.last_update,
    timezone: rawData.timezone,
    currency_code: rawData.currency_code,
    description: rawData.description,
    type: rawData.type
  };
  
  // Filter holidays if not needed historically
  if (include_historical_holidays) {
    optimized.holidays = rawData.holidays;
  } else {
    // Only include future holidays and recent past (1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const cutoffDate = oneYearAgo.toISOString().slice(0, 10).replace(/-/g, '');
    
    optimized.holidays = (rawData.holidays || []).filter(date => date >= cutoffDate);
  }
  
  // Add computed session information
  optimized.sessions = {
    start_hour: rawData.start_hour,
    end_hour: rawData.end_hour,
    details: rawData.details,
    // Add quick lookup maps
    holiday_set: new Set(optimized.holidays),
    shortened_dates: extractShortenedDates(rawData.details)
  };
  
  // Add trading mechanics
  optimized.trading_info = {
    tick_size: rawData.tick_size,
    price_scale: rawData.price_scale,
    point_value: rawData.point_value,
    minimum_movement: rawData.minimum_movement
  };
  
  return optimized;
};

/**
 * Function to retrieve session information for a specific stock symbol.
 *
 * @param {Object} args - Arguments for the session information request.
 * @param {string} args.symbol - The stock symbol to retrieve session information for.
 * @param {boolean} args.optimize - Whether to optimize the response data (default: false).
 * @param {boolean} args.include_historical_holidays - Include all historical holidays (default: false).
 * @param {string} args.timezone_convert - Convert times to specified timezone (default: null).
 * @returns {Promise<Object>} - The session information for the specified stock symbol.
 */
const executeFunction = async ({ symbol, optimize = false, include_historical_holidays = false, timezone_convert = null }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  
  try {
    // Construct the URL with the symbol path variable
    const url = `${baseUrl}/v2/symbols/${symbol}/session`;

    // Set up headers for the request
    const headers = {
      'Content-Type': 'application/json',
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

    // Parse the response data
    const data = await response.json();
    
    // Apply optimization if requested
    if (optimize) {
      return optimizeSessionData(data, { 
        include_historical_holidays, 
        timezone_convert 
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error retrieving session information:', error);
    return { error: 'An error occurred while retrieving session information.' };
  }
};

/**
 * Tool configuration for retrieving session information for a stock symbol.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_session_information',
      description: 'Retrieve session information for a specific stock symbol with optimization options.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The stock symbol to retrieve session information for.'
          },
          optimize: {
            type: 'boolean',
            description: 'Whether to optimize the response data for better performance (default: false).'
          },
          include_historical_holidays: {
            type: 'boolean',
            description: 'Include all historical holidays or just recent/future ones (default: false).'
          },
          timezone_convert: {
            type: 'string',
            description: 'Convert session times to specified timezone (default: null, uses market timezone).'
          }
        },
        required: ['symbol']
      }
    }
  }
};

// Helper functions
function extractShortenedDates(sessionDetails) {
  const shortenedDates = new Set();
  
  if (!sessionDetails) return shortenedDates;
  
  for (const detail of sessionDetails) {
    if (detail.session_correction) {
      for (const correction of detail.session_correction) {
        if (correction.dates) {
          correction.dates.forEach(date => shortenedDates.add(date));
        }
      }
    }
  }
  
  return shortenedDates;
}

export { apiTool, optimizeSessionData, extractShortenedDates };