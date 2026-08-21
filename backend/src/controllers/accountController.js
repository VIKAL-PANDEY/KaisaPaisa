const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

// @desc    Get all accounts for user with dynamic current balance
// @route   GET /api/accounts
const getAccounts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accounts = await Account.find({ userId }).lean();

    // Calculate current running balance for each account based on transactions
    const accountsWithBalance = await Promise.all(accounts.map(async (acc) => {
      const totals = await Transaction.aggregate([
        { $match: { userId, accountId: acc._id } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);

      let income = 0;
      let expense = 0;
      totals.forEach(t => {
        if (t._id === 'income') income = t.total;
        if (t._id === 'expense') expense = t.total;
      });

      const currentBalance = (acc.initialBalance || 0) + income - expense;

      return {
        ...acc,
        currentBalance: Math.round(currentBalance * 100) / 100
      };
    }));

    res.status(200).json({
      success: true,
      count: accountsWithBalance.length,
      accounts: accountsWithBalance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new account
// @route   POST /api/accounts
const createAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, type, initialBalance, accountNumberMasked } = req.body;

    const account = await Account.create({
      userId,
      name,
      type: type || 'Savings',
      initialBalance: parseFloat(initialBalance) || 0,
      accountNumberMasked: accountNumberMasked || ''
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      account: {
        ...account.toObject(),
        currentBalance: account.initialBalance
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update account
// @route   PUT /api/accounts/:id
const updateAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete account
// @route   DELETE /api/accounts/:id
const deleteAccount = async (req, res, next) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount
};
