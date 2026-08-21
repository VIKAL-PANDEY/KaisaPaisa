const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Subscription/Recurring name is required'],
    trim: true,
    maxlength: 100
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  categoryName: {
    type: String,
    default: 'Subscriptions'
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false
  },
  frequency: {
    type: String,
    enum: ['monthly', 'yearly', 'weekly'],
    default: 'monthly'
  },
  nextDueDate: {
    type: Date,
    required: [true, 'Next payment date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

recurringExpenseSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);
