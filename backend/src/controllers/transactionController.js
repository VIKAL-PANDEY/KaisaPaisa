const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const Account = require('../models/Account');

// @desc    Get transactions with search, filter, and pagination
// @route   GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      search,
      startDate,
      endDate,
      categoryId,
      accountId,
      type,
      sort = '-date',
      page = 1,
      limit = 20
    } = req.query;

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

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { merchant: searchRegex },
        { description: searchRegex },
        { categoryName: searchRegex }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      transactions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      type,
      amount,
      categoryId,
      categoryName,
      accountId,
      accountName,
      merchant,
      description,
      paymentMethod,
      date,
      isRecurring
    } = req.body;

    let finalCategoryName = categoryName || 'Other';
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) finalCategoryName = cat.name;
    }

    let finalAccountName = accountName || 'Default Account';
    if (accountId) {
      const acc = await Account.findOne({ _id: accountId, userId });
      if (acc) finalAccountName = acc.name;
    }

    const transaction = await Transaction.create({
      userId,
      type,
      amount: parseFloat(amount),
      categoryId,
      categoryName: finalCategoryName,
      accountId: accountId || null,
      accountName: finalAccountName,
      merchant: merchant || '',
      description: description || '',
      paymentMethod: paymentMethod || 'UPI',
      date: date ? new Date(date) : new Date(),
      isRecurring: !!isRecurring
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single transaction by ID
// @route   GET /api/transactions/:id
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or access denied' });
    }
    res.status(200).json({ success: true, transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const transaction = await Transaction.findOne({ _id: req.params.id, userId });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
    }

    const fieldsToUpdate = ['type', 'amount', 'categoryId', 'categoryName', 'accountId', 'accountName', 'merchant', 'description', 'paymentMethod', 'date', 'isRecurring'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        transaction[field] = req.body[field];
      }
    });

    if (req.body.amount) transaction.amount = parseFloat(req.body.amount);
    if (req.body.date) transaction.date = new Date(req.body.date);

    await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction
};
