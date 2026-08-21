const SavingsGoal = require('../models/SavingsGoal');

// @desc    Get all savings goals with progress and required monthly savings
// @route   GET /api/goals
const getGoals = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rawGoals = await SavingsGoal.find({ userId }).lean();
    const now = new Date();

    const goals = rawGoals.map(g => {
      const target = g.targetAmount || 1;
      const current = g.currentAmount || 0;
      const remaining = Math.max(0, target - current);
      const progress = Math.min(100, Math.round((current / target) * 1000) / 10);

      // Months left until target date
      const targetDate = new Date(g.targetDate);
      const monthsLeft = (targetDate.getFullYear() - now.getFullYear()) * 12 + (targetDate.getMonth() - now.getMonth());
      const effectiveMonths = Math.max(1, monthsLeft);

      const requiredMonthly = remaining > 0 ? Math.ceil(remaining / effectiveMonths) : 0;

      return {
        ...g,
        remainingAmount: remaining,
        progressPercentage: progress,
        requiredMonthlySavings: requiredMonthly,
        monthsRemaining: Math.max(0, monthsLeft)
      };
    });

    res.status(200).json({
      success: true,
      count: goals.length,
      goals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create savings goal
// @route   POST /api/goals
const createGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { goalName, targetAmount, currentAmount, targetDate, description, icon } = req.body;

    const goal = await SavingsGoal.create({
      userId,
      goalName,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: new Date(targetDate),
      description: description || '',
      icon: icon || 'target'
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update goal or add savings progress
// @route   PUT /api/goals/:id
const updateGoal = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Savings goal updated',
      goal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Savings goal deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal
};
