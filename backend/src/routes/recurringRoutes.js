const express = require('express');
const { body } = require('express-validator');
const { getRecurringExpenses, createRecurringExpense, updateRecurringExpense, deleteRecurringExpense } = require('../controllers/recurringController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getRecurringExpenses)
  .post(
    [
      body('name').notEmpty().withMessage('Name is required'),
      body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
      body('nextDueDate').isISO8601().withMessage('Valid next due date is required'),
      validate
    ],
    createRecurringExpense
  );

router.route('/:id')
  .put(updateRecurringExpense)
  .delete(deleteRecurringExpense);

module.exports = router;
