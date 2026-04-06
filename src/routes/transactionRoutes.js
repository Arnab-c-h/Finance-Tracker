const express = require('express');
const transactionController = require('../controllers/transactionController');
const authController = require('../controllers/authController');
const { validateCreateTransaction, validateRequest } = require('../middleware/validateRequest');

const router = express.Router();

// Protect all transaction routes
router.use(authController.protect);

router
  .route('/')
  .get(transactionController.getAllTransactions)
  .post(
    authController.restrictTo('analyst', 'admin'),
    validateCreateTransaction,
    validateRequest,
    transactionController.createTransaction
  );

router.get('/dashboard/summary', transactionController.getDashboardSummary);
router.get('/dashboard/categories', transactionController.getCategoryBreakdown);
router.get('/dashboard/trends', transactionController.getMonthlyTrends);
router.get('/dashboard/recent', transactionController.getRecentActivity);

router
  .route('/:id')
  .get(transactionController.getTransaction)
  .patch(
    authController.restrictTo('analyst', 'admin'),
    transactionController.updateTransaction
  )
  .delete(
    authController.restrictTo('admin'),
    transactionController.deleteTransaction
  );

module.exports = router;