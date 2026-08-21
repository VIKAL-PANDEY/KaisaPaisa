const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { calculateBudgetProgress } = require('./budgetEngine');

/**
 * Deterministic Rule-Based Financial Insights Engine (MVP - NO AI)
 */
const generateFinancialInsights = async (userId) => {
  const insights = [];
  const now = new Date();
  
  // Current month bounds
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Previous month bounds
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // 1. Current Month Expenses & Income Totals
  const currentTotals = await Transaction.aggregate([
    { $match: { userId, date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } }
  ]);

  let currentIncome = 0;
  let currentExpense = 0;
  currentTotals.forEach(t => {
    if (t._id === 'income') currentIncome = t.total;
    if (t._id === 'expense') currentExpense = t.total;
  });

  // Previous Month Expenses
  const prevTotals = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const prevExpense = prevTotals.length > 0 ? prevTotals[0].total : 0;

  // Insight 1: Month over Month comparison
  if (prevExpense > 0 && currentExpense > 0) {
    const diffPct = Math.round(((currentExpense - prevExpense) / prevExpense) * 100);
    if (diffPct < 0) {
      insights.push({
        id: 'mom_decrease',
        type: 'positive',
        title: 'Spending Reduced',
        message: `Your spending is ${Math.abs(diffPct)}% lower than last month. Keep up the great control!`
      });
    } else if (diffPct > 0) {
      insights.push({
        id: 'mom_increase',
        type: 'warning',
        title: 'Higher Expenses',
        message: `Your spending is ${diffPct}% higher compared to the same period last month.`
      });
    }
  }

  // Insight 2: Subscriptions total
  const subTotals = await Transaction.aggregate([
    { 
      $match: { 
        userId, 
        type: 'expense', 
        date: { $gte: currentMonthStart, $lte: currentMonthEnd },
        categoryName: { $regex: /subscription/i }
      } 
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  if (subTotals.length > 0 && subTotals[0].total > 0) {
    insights.push({
      id: 'subscriptions_cost',
      type: 'info',
      title: 'Subscription Spending',
      message: `Your subscriptions cost ₹${subTotals[0].total.toLocaleString('en-IN')} this month.`
    });
  }

  // Insight 3: Top spending category increase
  const categorySpending = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: currentMonthStart, $lte: currentMonthEnd } } },
    { $group: { _id: '$categoryName', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
    { $limit: 1 }
  ]);
  if (categorySpending.length > 0) {
    const topCat = categorySpending[0]._id || 'Food';
    const topAmt = categorySpending[0].total;
    insights.push({
      id: 'top_category',
      type: 'info',
      title: 'Top Expense Category',
      message: `${topCat} is your highest spending category this month at ₹${topAmt.toLocaleString('en-IN')}.`
    });
  }

  // Insight 4: Savings Projection
  const netSavings = currentIncome - currentExpense;
  if (currentIncome > 0 && netSavings > 0) {
    insights.push({
      id: 'savings_track',
      type: 'positive',
      title: 'Savings Progress',
      message: `You are currently on track to save ₹${netSavings.toLocaleString('en-IN')} this month.`
    });
  }

  // Insight 5: Budget Warning insight
  const budgets = await Budget.find({ userId });
  for (const b of budgets) {
    const prog = await calculateBudgetProgress(userId, b);
    if (prog.utilizationPercentage >= 80) {
      insights.push({
        id: `budget_alert_${b._id}`,
        type: prog.utilizationPercentage >= 100 ? 'negative' : 'warning',
        title: `Budget ${prog.status}`,
        message: `You have used ${prog.utilizationPercentage}% of your ${b.categoryName ? b.categoryName + ' ' : ''}${b.period} budget.`
      });
      break; // Max 1 budget insight to prevent clutter
    }
  }

  // Default welcome insight if no transactions exist yet
  if (insights.length === 0) {
    insights.push({
      id: 'getting_started',
      type: 'info',
      title: 'Welcome to KaisaPaisa',
      message: 'Start adding your daily income and expenses to unlock real-time financial analytics and personalized insights!'
    });
  }

  return insights;
};

module.exports = { generateFinancialInsights };
