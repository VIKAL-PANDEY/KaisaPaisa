const Debt = require('../models/Debt');

// @desc    Get all debt records with net position summary
// @route   GET /api/debts
const getDebts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const debts = await Debt.find({ userId }).sort({ dueDate: 1 }).lean();

    let moneyOwedToMe = 0; // LENT & PENDING/OVERDUE
    let moneyIOwe = 0;     // BORROWED & PENDING/OVERDUE

    const now = new Date();

    const formattedDebts = debts.map(d => {
      let currentStatus = d.status;
      // Auto flag overdue if pending past due date
      if (d.status === 'PENDING' && new Date(d.dueDate) < now) {
        currentStatus = 'OVERDUE';
      }

      if (currentStatus !== 'PAID') {
        if (d.direction === 'LENT') {
          moneyOwedToMe += d.amount;
        } else if (d.direction === 'BORROWED') {
          moneyIOwe += d.amount;
        }
      }

      return {
        ...d,
        status: currentStatus
      };
    });

    const netPosition = moneyOwedToMe - moneyIOwe;

    res.status(200).json({
      success: true,
      summary: {
        moneyOwedToMe: Math.round(moneyOwedToMe * 100) / 100,
        moneyIOwe: Math.round(moneyIOwe * 100) / 100,
        netPosition: Math.round(netPosition * 100) / 100
      },
      count: formattedDebts.length,
      debts: formattedDebts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new debt / lending record
// @route   POST /api/debts
const createDebt = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { personName, amount, direction, dueDate, description } = req.body;

    const debt = await Debt.create({
      userId,
      personName,
      amount: parseFloat(amount),
      direction,
      dueDate: new Date(dueDate),
      description: description || '',
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Record saved successfully',
      debt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update debt status (e.g., mark as PAID)
// @route   PUT /api/debts/:id
const updateDebtStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.body;

    const debt = await Debt.findOneAndUpdate(
      { _id: req.params.id, userId },
      { status },
      { new: true, runValidators: true }
    );

    if (!debt) {
      return res.status(404).json({ success: false, message: 'Record not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      debt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete debt record
// @route   DELETE /api/debts/:id
const deleteDebt = async (req, res, next) => {
  try {
    const debt = await Debt.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!debt) {
      return res.status(404).json({ success: false, message: 'Record not found or unauthorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDebts,
  createDebt,
  updateDebtStatus,
  deleteDebt
};
