const express = require('express');
const { body } = require('express-validator');
const { getBudgets, createOrUpdateBudget, deleteBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getBudgets)
  .post(
    [
      body('period').isIn(['daily', 'weekly', 'monthly', 'category']).withMessage('Invalid budget period'),
      body('limitAmount').isFloat({ gt: 0 }).withMessage('Limit amount must be greater than 0'),
      validate
    ],
    createOrUpdateBudget
  );

router.delete('/:id', deleteBudget);

module.exports = router;
