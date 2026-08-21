const mongoose = require('mongoose');

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  goalName: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: 100
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [1, 'Target amount must be at least 1']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current saved amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 250
  },
  icon: {
    type: String,
    default: 'target'
  }
}, { timestamps: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);


