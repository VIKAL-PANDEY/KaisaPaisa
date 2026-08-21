const express = require('express');
const { body } = require('express-validator');
const {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTransactions)
  .post(
    [
      body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
      body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
      body('date').optional().isISO8601().withMessage('Valid date is required'),
      validate
    ],
    createTransaction
  );

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
