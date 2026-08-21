const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for default global categories
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Category type is required']
  },
  icon: {
    type: String,
    default: 'tag'
  },
  color: {
    type: String,
    default: '#A9BDD2'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

categorySchema.index({ userId: 1, name: 1 });

module.exports = mongoose.model('Category', categorySchema);
