const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  passwordHash: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatarUrl: {
    type: String,
    trim: true,
    default: ''
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true
  },
  currencySymbol: {
    type: String,
    default: '₹',
    trim: true
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
    trim: true
  },
  notificationPreferences: {
    budget80Warning: { type: Boolean, default: true },
    budget100Exceeded: { type: Boolean, default: true },
    debtReminders: { type: Boolean, default: true },
    recurringReminders: { type: Boolean, default: true }
  }
}, { timestamps: true });

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
