const express = require('express');
const { body } = require('express-validator');
const { getDebts, createDebt, updateDebtStatus, deleteDebt } = require('../controllers/debtController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDebts)
  .post(
    [
      body('personName').notEmpty().withMessage('Person name is required'),
      body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
      body('direction').isIn(['LENT', 'BORROWED']).withMessage('Direction must be LENT or BORROWED'),
      body('dueDate').isISO8601().withMessage('Valid due date is required'),
      validate
    ],
    createDebt
  );

router.put('/:id/status', updateDebtStatus);
router.delete('/:id', deleteDebt);

module.exports = router;
