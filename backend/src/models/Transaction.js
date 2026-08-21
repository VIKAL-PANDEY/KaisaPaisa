const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true
  },
  categoryName: {
    type: String,
    trim: true,
    default: 'Other'
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: false,
    index: true
  },
  accountName: {
    type: String,
    trim: true,
    default: 'Default Account'
  },
  merchant: {
    type: String,
    trim: true,
    default: '',
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 250
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Debit Card', 'Credit Card', 'Net Banking', 'Cash', 'Other'],
    default: 'UPI'
  },
  date: {
    type: Date,
    required: [true, 'Transaction date is required'],
    default: Date.now,
    index: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1 });
transactionSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
