const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'category'],
    required: [true, 'Budget period is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: function() { return this.period === 'category'; },
    default: null
  },
  categoryName: {
    type: String,
    default: ''
  },
  limitAmount: {
    type: Number,
    required: [true, 'Budget limit amount is required'],
    min: [1, 'Limit must be at least 1']
  }
}, { timestamps: true });

budgetSchema.index({ userId: 1, period: 1, categoryId: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
