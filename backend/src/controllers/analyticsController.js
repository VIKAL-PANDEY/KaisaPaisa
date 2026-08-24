const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Account = require('../models/Account');
const { calculateBudgetProgress } = require('../services/budgetEngine');
const { generateFinancialInsights } = require('../services/insightEngine');

const getUserMatchCondition = (userId) => {
  if (mongoose.Types.ObjectId.isValid(userId)) {
    return { $in: [new mongoose.Types.ObjectId(userId), userId] };
  }
  return userId;
};

// @desc    Get complete dashboard overview & financial summary
// @route   GET /api/analytics/dashboard
const getDashboardOverview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userMatch = getUserMatchCondition(userId);
    const now = new Date();
    
    // Month bounds
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Prev month bounds
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Current Month Totals
    const currentTotals = await Transaction.aggregate([
      { $match: { userId: userMatch, date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    currentTotals.forEach(t => {
      if (t._id === 'income') monthlyIncome = t.total;
      if (t._id === 'expense') monthlyExpenses = t.total;
    });

    // 2. Previous Month Totals for Trends
    const prevTotals = await Transaction.aggregate([
      { $match: { userId: userMatch, date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    let prevMonthlyIncome = 0;
    let prevMonthlyExpenses = 0;
    prevTotals.forEach(t => {
      if (t._id === 'income') prevMonthlyIncome = t.total;
      if (t._id === 'expense') prevMonthlyExpenses = t.total;
    });

    // Net Savings & Savings Rate Calculation: ((Income - Expenses) / Income) * 100
    const netSavings = monthlyIncome - monthlyExpenses;
    let savingsRate = 0;
    if (monthlyIncome > 0) {
      savingsRate = Math.max(0, Math.min(100, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100));
    }

    // Total Balance across accounts
    const accounts = await Account.find({ userId });
    let totalInitialBalance = accounts.reduce((acc, a) => acc + (a.initialBalance || 0), 0);

    const allTimeTotals = await Transaction.aggregate([
      { $match: { userId: userMatch } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    let allTimeIncome = 0;
    let allTimeExpense = 0;
    allTimeTotals.forEach(t => {
      if (t._id === 'income') allTimeIncome = t.total;
      if (t._id === 'expense') allTimeExpense = t.total;
    });

    const totalBalance = totalInitialBalance + allTimeIncome - allTimeExpense;

    // Category Breakdown for current month
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { userId: userMatch, type: 'expense', date: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: '$categoryName', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);

    const formattedCategoryBreakdown = categoryBreakdown.map(c => ({
      category: c._id || 'Other',
      amount: Math.round(c.total * 100) / 100,
      percentage: monthlyExpenses > 0 ? Math.round((c.total / monthlyExpenses) * 1000) / 10 : 0
    }));

    // Recent 5 Transactions
    const recentTransactions = await Transaction.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .lean();

    // Active Budgets calculated on the fly
    const rawBudgets = await Budget.find({ userId }).lean();
    const activeBudgets = await Promise.all(
      rawBudgets.map(b => calculateBudgetProgress(userId, b))
    );

    // Rule-based insights
    const insights = await generateFinancialInsights(userId);

    res.status(200).json({
      success: true,
      summary: {
        totalBalance: Math.round(totalBalance * 100) / 100,
        monthlyIncome: Math.round(monthlyIncome * 100) / 100,
        monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        savingsRate: Math.round(savingsRate * 10) / 10,
        incomeTrendPct: prevMonthlyIncome > 0 ? Math.round(((monthlyIncome - prevMonthlyIncome) / prevMonthlyIncome) * 100) : 0,
        expenseTrendPct: prevMonthlyExpenses > 0 ? Math.round(((monthlyExpenses - prevMonthlyExpenses) / prevMonthlyExpenses) * 100) : 0
      },
      categoryBreakdown: formattedCategoryBreakdown,
      recentTransactions,
      activeBudgets,
      insights
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Income vs Expenses Trend Chart Data (Last 6 Months)
// @route   GET /api/analytics/trends
const getTrends = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userMatch = getUserMatchCondition(userId);
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const monthTotals = await Transaction.aggregate([
        { $match: { userId: userMatch, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);

      let income = 0;
      let expense = 0;
      monthTotals.forEach(t => {
        if (t._id === 'income') income = t.total;
        if (t._id === 'expense') expense = t.total;
      });

      months.push({
        month: label,
        income: Math.round(income * 100) / 100,
        expense: Math.round(expense * 100) / 100,
        savings: Math.round((income - expense) * 100) / 100
      });
    }

    res.status(200).json({
      success: true,
      trends: months
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Calendar View Transactions Grouped by Date (Asia/Kolkata timezone support)
// @route   GET /api/analytics/calendar
const getCalendarData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { year, month } = req.query;

    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const targetMonth = parseInt(month, 10) - 1 || new Date().getMonth();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 }).lean();

    // Group by YYYY-MM-DD
    const dateMap = {};

    transactions.forEach(t => {
      const d = new Date(t.date);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          date: dateKey,
          incomeTotal: 0,
          expenseTotal: 0,
          transactions: []
        };
      }

      if (t.type === 'income') dateMap[dateKey].incomeTotal += t.amount;
      if (t.type === 'expense') dateMap[dateKey].expenseTotal += t.amount;

      dateMap[dateKey].transactions.push({
        id: t._id,
        merchant: t.merchant || t.categoryName,
        category: t.categoryName,
        type: t.type,
        amount: t.amount,
        paymentMethod: t.paymentMethod
      });
    });

    res.status(200).json({
      success: true,
      year: targetYear,
      month: targetMonth + 1,
      calendar: Object.values(dateMap)
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getTrends,
  getCalendarData
};
