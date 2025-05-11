/**
 * Function to retrieve the latest OHLCV time-series data for a given symbol from InsightSentry.
 *
 * @param {Object} args - Arguments for the request.
 * @param {string} args.symbol - The symbol code for which to retrieve the time-series data.
 * @param {string} [args.bar_type='second'] - The type of bar (e.g., second, minute, hour, day, week, month).
 * @param {number} [args.bar_interval=1] - The interval of the bar.
 * @param {boolean} [args.extended=true] - Whether to include extended hours data.
 * @param {boolean} [args.dadj=false] - Whether to adjust for dividends.
 * @param {boolean} [args.badj=true] - Whether to apply back-adjustment for continuous futures contracts.
 * @returns {Promise<Object>} - The latest series data for the specified symbol.
 */
const executeFunction = async ({ symbol, bar_type = 'day', bar_interval = 1, extended = false, dadj = false, badj = false }) => {
  const baseUrl = process.env.INSIGHTSENTRY_BASE_URL;
  const apiKey = process.env.INSIGHTSENTRY_API_KEY;
  try {
    // Construct the URL with query parameters
    const url = new URL(`${baseUrl}/v2/symbols/${symbol}/series`);
    url.searchParams.append('bar_type', bar_type);
    url.searchParams.append('bar_interval', bar_interval.toString());
    url.searchParams.append('extended', extended.toString());
    url.searchParams.append('dadj', dadj.toString());
    url.searchParams.append('badj', badj.toString());

    // Set up headers for the request
    const headers = {
      'X-RapidAPI-Key': apiKey
    };

    // Perform the fetch request
    const response = await fetch(url.toString(), {
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
    return data;
  } catch (error) {
    console.error('Error retrieving OHLCV time-series data:', error);
    return { error: 'An error occurred while retrieving OHLCV time-series data.' };
  }
};

/**
 * Tool configuration for retrieving OHLCV time-series data from InsightSentry.
 * @type {Object}
 */
const apiTool = {
  function: executeFunction,
  definition: {
    type: 'function',
    function: {
      name: 'get_ohlcv_time_series',
      description: 'Retrieve the latest OHLCV time-series data for a given symbol.',
      parameters: {
        type: 'object',
        properties: {
          symbol: {
            type: 'string',
            description: 'The symbol code for which to retrieve the time-series data.'
          },
          bar_type: {
            type: 'string',
            enum: ['second', 'minute', 'hour', 'day', 'week', 'month'],
            description: 'The type of bar.'
          },
          bar_interval: {
            type: 'integer',
            description: 'The interval of the bar.'
          },
          extended: {
            type: 'boolean',
            description: 'Whether to include extended hours data.'
          },
          dadj: {
            type: 'boolean',
            description: 'Whether to adjust for dividends.'
          },
          badj: {
            type: 'boolean',
            description: 'Whether to apply back-adjustment for continuous futures contracts.'
          }
        },
        required: ['symbol']
      }
    }
  }
};

export { apiTool };