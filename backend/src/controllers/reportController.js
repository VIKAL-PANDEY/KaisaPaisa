const Transaction = require('../models/Transaction');

// @desc    Generate financial report based on custom filters
// @route   GET /api/reports
const generateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, categoryId, accountId, type } = req.query;

    const query = { userId };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (accountId) {
      query.accountId = accountId;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).lean();

    let totalIncome = 0;
    let totalExpenses = 0;

    const categoryMap = {};

    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') {
        totalExpenses += t.amount;
        const cat = t.categoryName || 'Other';
        categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
      }
    });

    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.min(100, ((totalIncome - totalExpenses) / totalIncome) * 100)) : 0;

    const topCategories = Object.keys(categoryMap)
      .map(cat => ({
        category: cat,
        amount: categoryMap[cat],
        percentage: totalExpenses > 0 ? Math.round((categoryMap[cat] / totalExpenses) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    res.status(200).json({
      success: true,
      report: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netCashFlow: Math.round(netCashFlow * 100) / 100,
        savingsRate: Math.round(savingsRate * 10) / 10,
        transactionCount: transactions.length,
        topCategories,
        transactions
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { generateReport };
