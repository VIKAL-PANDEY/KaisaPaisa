const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  type: {
    type: String,
    enum: ['BUDGET_WARNING', 'BUDGET_EXCEEDED', 'DEBT_REMINDER', 'RECURRING_REMINDER', 'SAVINGS_MILESTONE', 'SYSTEM'],
    default: 'SYSTEM'
  },
  budgetRef: {
    type: String,
    default: '' // Period or Category reference to prevent duplicate triggers in same period
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
