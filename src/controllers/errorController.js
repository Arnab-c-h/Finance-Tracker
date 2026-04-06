const AppError = require('../utils/appError');

const handlePrismaUniqueConstraint = err => {
  return new AppError('Duplicate field value. Please use another value!', 400);
};

const handlePrismaRecordNotFound = err => {
  return new AppError('Record not found', 404);
};

const handlePrismaValidationError = err => {
  return new AppError('Invalid input data', 400);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Standardize response payload format
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // Mask unhandled internal errors in production
    console.error('Unhandled internal error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  // Standardize Prisma errors
  if (error.code === 'P2002') error = handlePrismaUniqueConstraint(error);
  if (error.code === 'P2025') error = handlePrismaRecordNotFound(error);
  if (error.name === 'PrismaClientValidationError') error = handlePrismaValidationError(error);

  // Standardize token errors
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};