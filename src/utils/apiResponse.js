class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json(new ApiResponse(statusCode, data, message));
};

const sendError = (res, message = 'Error', statusCode = 400, error = null) => {
  return res.status(statusCode).json({
    statusCode,
    data: null,
    message,
    success: false,
    ...(process.env.NODE_ENV === 'development' && error && { error: error.message }),
  });
};

module.exports = { ApiResponse, sendSuccess, sendError };
