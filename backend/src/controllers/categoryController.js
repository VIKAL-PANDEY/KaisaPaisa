const Category = require('../models/Category');

const DEFAULT_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: 'utensils', color: '#E8B7A6', isDefault: true },
  { name: 'Transport', type: 'expense', icon: 'bus', color: '#A9BDD2', isDefault: true },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#C3B8D8', isDefault: true },
  { name: 'Bills', type: 'expense', icon: 'receipt', color: '#E7D99B', isDefault: true },
  { name: 'Entertainment', type: 'expense', icon: 'film', color: '#A8C3B0', isDefault: true },
  { name: 'Education', type: 'expense', icon: 'book', color: '#A9BDD2', isDefault: true },
  { name: 'Health', type: 'expense', icon: 'activity', color: '#E8B7A6', isDefault: true },
  { name: 'Subscriptions', type: 'expense', icon: 'credit-card', color: '#C3B8D8', isDefault: true },
  { name: 'Other', type: 'expense', icon: 'more-horizontal', color: '#69716C', isDefault: true },
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#A8C3B0', isDefault: true },
  { name: 'Pocket Money', type: 'income', icon: 'wallet', color: '#E7D99B', isDefault: true },
  { name: 'Scholarship', type: 'income', icon: 'award', color: '#A9BDD2', isDefault: true },
  { name: 'Freelancing', type: 'income', icon: 'laptop', color: '#C3B8D8', isDefault: true },
  { name: 'Part-time Income', type: 'income', icon: 'clock', color: '#A8C3B0', isDefault: true },
  { name: 'Other Income', type: 'income', icon: 'dollar-sign', color: '#69716C', isDefault: true }
];

// @desc    Get categories (default global + user custom)
// @route   GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userCategories = await Category.find({
      $or: [{ userId: null }, { userId }]
    }).lean();

    if (userCategories.length === 0) {
      return res.status(200).json({
        success: true,
        categories: DEFAULT_CATEGORIES
      });
    }

    res.status(200).json({
      success: true,
      count: userCategories.length,
      categories: userCategories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create custom category for user
// @route   POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type, icon, color } = req.body;

    const category = await Category.create({
      userId,
      name,
      type: type || 'expense',
      icon: icon || 'tag',
      color: color || '#A9BDD2',
      isDefault: false
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  DEFAULT_CATEGORIES
};
