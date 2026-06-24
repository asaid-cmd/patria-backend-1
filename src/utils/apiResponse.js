/**
 * API Response helpers — ERB-compatible flat JSON format.
 *
 * sendSuccess: returns the data object directly (no wrapper).
 *   If data is null/undefined and message is provided, returns { message }.
 * sendError: returns { message } with the appropriate HTTP status.
 */

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  if (data === null || data === undefined) {
    return res.status(statusCode).json({ message });
  }
  return res.status(statusCode).json(data);
};

const sendError = (res, message = 'Error', statusCode = 400, error = null) => {
  return res.status(statusCode).json({ message });
};

// Legacy class — kept for any code that imports ApiResponse directly
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data       = data;
    this.message    = message;
    this.success    = statusCode < 400;
  }
}

module.exports = { ApiResponse, sendSuccess, sendError };
