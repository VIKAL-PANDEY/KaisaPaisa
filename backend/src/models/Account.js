const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true,
    maxlength: 60
  },
  type: {
    type: String,
    enum: ['Savings', 'Current', 'Cash', 'UPI Wallet', 'Credit Card', 'Other'],
    default: 'Savings'
  },
  initialBalance: {
    type: Number,
    default: 0
  },
  accountNumberMasked: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

accountSchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Account', accountSchema);
