const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  personName: {
    type: String,
    required: [true, 'Person name is required'],
    trim: true,
    maxlength: 100
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  direction: {
    type: String,
    enum: ['LENT', 'BORROWED'],
    required: [true, 'Direction (LENT or BORROWED) is required']
  },
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  description: {
    type: String,
    trim: true,
    default: '',
    maxlength: 250
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'OVERDUE'],
    default: 'PENDING'
  }
}, { timestamps: true });

debtSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Debt', debtSchema);
