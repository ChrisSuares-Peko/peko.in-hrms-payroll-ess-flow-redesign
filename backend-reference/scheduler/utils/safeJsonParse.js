const { customLog } = require('./loggerHelper');

/**
 * Safely parse JSON with fallback
 * @param {string} jsonString - String to parse
 * @param {*} defaultValue - Default value if parsing fails (default: {})
 * @param {string} context - Context for logging (optional)
 * @returns {*} Parsed object or default value
 */
const safeJsonParse = (jsonString, defaultValue = {}, context = '') => {
  // Handle null, undefined, or empty string
  if (!jsonString || jsonString === '') {
    return defaultValue;
  }

  // If already an object, return it
  if (typeof jsonString === 'object') {
    return jsonString;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    customLog(null, "error", {
      message: `Failed to parse JSON${context ? ` in ${context}` : ''}`,
      error: error.message,
      jsonString: typeof jsonString === 'string' ? jsonString.substring(0, 100) : jsonString
    });
    return defaultValue;
  }
};

/**
 * Safely stringify with error handling
 * @param {*} data - Data to stringify
 * @param {string} defaultValue - Default value if stringify fails (default: '{}')
 * @param {string} context - Context for logging (optional)
 * @returns {string} JSON string or default value
 */
const safeJsonStringify = (data, defaultValue = '{}', context = '') => {
  if (data === null || data === undefined) {
    return defaultValue;
  }

  try {
    return JSON.stringify(data);
  } catch (error) {
    customLog(null, "error", {
      message: `Failed to stringify JSON${context ? ` in ${context}` : ''}`,
      error: error.message
    });
    return defaultValue;
  }
};

module.exports = {
  safeJsonParse,
  safeJsonStringify
};
