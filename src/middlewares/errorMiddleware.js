const errorMiddleware = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Lỗi sai định dạng ID của Mongoose
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Resource not found. Invalid: ${err.path}`;
  }

  // Lỗi validation của Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Lỗi trùng lặp Key (Duplicate Key) của MongoDB
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate field value entered`;
  }

  // Trường hợp custom Error thrown từ Database có dính "not found"
  if (err.message && err.message.toLowerCase().includes('not found')) {
    statusCode = 404;
  }

  // Chuẩn hóa format
  res.status(statusCode).json({
    status: 'error',
    message: message
  });
};

module.exports = errorMiddleware;
