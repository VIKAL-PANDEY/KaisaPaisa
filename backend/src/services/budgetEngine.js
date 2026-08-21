const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Notification = require('../models/Notification');

/**
 * Calculates start and end Date objects for a given period in Asia/Kolkata context
 */
const getDateRangeForPeriod = (period, now = new Date()) => {
  const start = new Date(now);
  const end = new Date(now);

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'weekly') {
    // Current week starting Monday
    const day = start.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diffToMonday);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'monthly' || period === 'category') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    // End of current month
    end.setMonth(start.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

/**
 * Single Source of Truth Budget Calculation Engine
 * On-the-fly computes spent amount from transactions and checks thresholds.
 */
const calculateBudgetProgress = async (userId, budget) => {
  const { start, end } = getDateRangeForPeriod(budget.period);

  const query = {
    userId: userId,
    type: 'expense',
    date: { $gte: start, $lte: end }
  };

  if (budget.period === 'category' && budget.categoryId) {
    query.categoryId = budget.categoryId;
  }

  const result = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, totalSpent: { $sum: '$amount' } } }
  ]);

  const spent = result.length > 0 ? result[0].totalSpent : 0;
  const limit = budget.limitAmount;
  const utilization = limit > 0 ? (spent / limit) * 100 : 0;
  const remaining = Math.max(0, limit - spent);

  let status = 'NORMAL';
  if (utilization >= 100) {
    status = 'EXCEEDED';
  } else if (utilization >= 80) {
    status = 'WARNING';
  }

  // Check notification trigger asynchronously without blocking UI response
  checkBudgetNotification(userId, budget, spent, limit, utilization, status).catch(console.error);

  return {
    _id: budget._id,
    period: budget.period,
    categoryId: budget.categoryId,
    categoryName: budget.categoryName,
    limitAmount: limit,
    spentAmount: Math.round(spent * 100) / 100,
    remainingAmount: Math.round(remaining * 100) / 100,
    utilizationPercentage: Math.round(utilization * 10) / 10,
    status
  };
};

/**
 * Checks and creates threshold notifications (80% warning / 100% exceeded) without duplicating in same period
 */
const checkBudgetNotification = async (userId, budget, spent, limit, utilization, status) => {
  if (status === 'NORMAL') return;

  const monthYearRef = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${budget.period}-${budget.categoryId || 'global'}`;
  
  if (status === 'EXCEEDED') {
    const existing = await Notification.findOne({
      userId,
      type: 'BUDGET_EXCEEDED',
      budgetRef: monthYearRef
    });
    if (!existing) {
      await Notification.create({
        userId,
        title: `Budget Exceeded: ${budget.period.toUpperCase()} ${budget.categoryName || ''}`,
        message: `You have spent ₹${spent.toLocaleString('en-IN')} out of your ₹${limit.toLocaleString('en-IN')} ${budget.period} budget (${Math.round(utilization)}%).`,
        type: 'BUDGET_EXCEEDED',
        budgetRef: monthYearRef
      });
    }
  } else if (status === 'WARNING') {
    const existing = await Notification.findOne({
      userId,
      type: 'BUDGET_WARNING',
      budgetRef: monthYearRef
    });
    if (!existing) {
      await Notification.create({
        userId,
        title: `Budget Warning: ${budget.period.toUpperCase()} ${budget.categoryName || ''}`,
        message: `You have reached ${Math.round(utilization)}% of your ₹${limit.toLocaleString('en-IN')} ${budget.period} budget.`,
        type: 'BUDGET_WARNING',
        budgetRef: monthYearRef
      });
    }
  }
};

module.exports = {
  getDateRangeForPeriod,
  calculateBudgetProgress
};
