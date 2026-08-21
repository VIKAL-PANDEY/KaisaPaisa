const RecurringExpense = require('../models/RecurringExpense');
const Category = require('../models/Category');

// @desc    Get all recurring expenses for user with monthly commitment summary
// @route   GET /api/recurring
const getRecurringExpenses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const items = await RecurringExpense.find({ userId }).sort({ nextDueDate: 1 }).lean();

    let totalMonthlyCommitment = 0;
    items.forEach(item => {
      if (item.isActive) {
        if (item.frequency === 'monthly') totalMonthlyCommitment += item.amount;
        else if (item.frequency === 'yearly') totalMonthlyCommitment += item.amount / 12;
        else if (item.frequency === 'weekly') totalMonthlyCommitment += item.amount * 4.33;
      }
    });

    res.status(200).json({
      success: true,
      totalMonthlyCommitment: Math.round(totalMonthlyCommitment * 100) / 100,
      count: items.length,
      recurringExpenses: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create recurring expense definition
// @route   POST /api/recurring
const createRecurringExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, amount, categoryId, accountId, frequency, nextDueDate } = req.body;

    let categoryName = 'Subscriptions';
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) categoryName = cat.name;
    }

    const item = await RecurringExpense.create({
      userId,
      name,
      amount: parseFloat(amount),
      categoryId,
      categoryName,
      accountId: accountId || null,
      frequency: frequency || 'monthly',
      nextDueDate: new Date(nextDueDate),
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: 'Recurring subscription added',
      recurringExpense: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recurring subscription
// @route   PUT /api/recurring/:id
const updateRecurringExpense = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const item = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription updated',
      recurringExpense: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete recurring subscription
// @route   DELETE /api/recurring/:id
const deleteRecurringExpense = async (req, res, next) => {
  try {
    const item = await RecurringExpense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Subscription not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Subscription deleted'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecurringExpenses,
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense
};
