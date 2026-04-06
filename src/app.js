const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const transactionRouter = require('./routes/transactionRoutes');

const app = express();

// Main middleware stack

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API in prod
if (process.env.NODE_ENV?.trim() === 'production') {
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
  });
  app.use('/api', limiter);
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Application routes
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/transactions', transactionRouter);

// Handle unhandled routes
app.all('/{*path}', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Catch-all error handler
app.use(globalErrorHandler);

module.exports = app;