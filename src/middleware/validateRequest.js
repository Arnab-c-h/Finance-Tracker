const { validationResult, body } = require('express-validator');
const AppError = require('../utils/appError');

exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(err => `${err.path}: ${err.msg}`);
    return next(new AppError(`Invalid input data. ${messages.join('. ')}`, 400));
  }
  next();
};

exports.validateCreateTransaction = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['income', 'expense']).withMessage('Type must be either income or expense'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isString().withMessage('Category must be a string')
    .trim(),
  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid ISO8601 date string'),
  body('notes')
    .optional()
    .isString().withMessage('Notes must be a string')
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

exports.validateSignup = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isString().withMessage('Name must be a string')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('passwordConfirm')
    .notEmpty().withMessage('Password confirmation is required'),
  body('role')
    .optional()
    .isIn(['viewer', 'analyst']).withMessage('Role must be either viewer or analyst')
];