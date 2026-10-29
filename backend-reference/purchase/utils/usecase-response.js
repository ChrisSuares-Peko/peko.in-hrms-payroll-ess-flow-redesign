class UsecaseResponse {
    static success(data, message = 'Success') {
      return {
        success: true,
        message,
        data,
      };
    }
  
    static error(error, statusCode = 500) {
      return {
        success: false,
        message: error?.message || 'An unexpected error occurred',
        statusCode,
        error,
      };
    }
  }
  
  module.exports = UsecaseResponse;
  