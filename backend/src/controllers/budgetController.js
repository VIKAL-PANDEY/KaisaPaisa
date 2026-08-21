const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { calculateBudgetProgress } = require('../services/budgetEngine');

// @desc    Get all budgets for user with real-time dynamic spending calculations
// @route   GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const rawBudgets = await Budget.find({ userId }).lean();

    const calculatedBudgets = await Promise.all(
      rawBudgets.map(budget => calculateBudgetProgress(userId, budget))
    );

    res.status(200).json({
      success: true,
      count: calculatedBudgets.length,
      budgets: calculatedBudgets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update budget
// @route   POST /api/budgets
const createOrUpdateBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period, categoryId, limitAmount } = req.body;

    let categoryName = '';
    if (period === 'category' && categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) categoryName = cat.name;
    }

    const query = {
      userId,
      period,
      categoryId: period === 'category' ? categoryId : null
    };

    const budget = await Budget.findOneAndUpdate(
      query,
      {
        userId,
        period,
        categoryId: period === 'category' ? categoryId : null,
        categoryName,
        limitAmount: parseFloat(limitAmount)
      },
      { new: true, upsert: true, runValidators: true }
    );

    const calculated = await calculateBudgetProgress(userId, budget);

    res.status(200).json({
      success: true,
      message: 'Budget set successfully',
      budget: calculated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget
};
