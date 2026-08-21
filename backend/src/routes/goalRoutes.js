const express = require('express');
const { body } = require('express-validator');
const { getGoals, createGoal, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGoals)
  .post(
    [
      body('goalName').notEmpty().withMessage('Goal name is required'),
      body('targetAmount').isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
      body('targetDate').isISO8601().withMessage('Valid target date is required'),
      validate
    ],
    createGoal
  );

router.route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

module.exports = router;
