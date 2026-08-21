require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Account = require('./src/models/Account');
const Transaction = require('./src/models/Transaction');
const Budget = require('./src/models/Budget');
const Debt = require('./src/models/Debt');
const SavingsGoal = require('./src/models/SavingsGoal');
const RecurringExpense = require('./src/models/RecurringExpense');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaisapaisa');
    console.log('Connected to MongoDB for seeding...');

    // Clear test demo user data if exists
    const demoEmail = 'student@kaisapaisa.com';
    const existingUser = await User.findOne({ email: demoEmail });
    if (existingUser) {
      await User.deleteOne({ _id: existingUser._id });
      await Transaction.deleteMany({ userId: existingUser._id });
      await Budget.deleteMany({ userId: existingUser._id });
      await Account.deleteMany({ userId: existingUser._id });
      await Debt.deleteMany({ userId: existingUser._id });
      await SavingsGoal.deleteMany({ userId: existingUser._id });
      await RecurringExpense.deleteMany({ userId: existingUser._id });
      console.log('Cleared previous demo user data.');
    }

    // Create demo user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123', salt);

    const demoUser = await User.create({
      name: 'Vikal Pandey',
      email: demoEmail,
      passwordHash,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata'
    });

    console.log(`Created demo user: ${demoEmail} / Password123`);

    // Create Accounts
    const hdfcAcc = await Account.create({
      userId: demoUser._id,
      name: 'HDFC Bank',
      type: 'Savings',
      initialBalance: 25000,
      accountNumberMasked: '•••• 4821'
    });

    const upiAcc = await Account.create({
      userId: demoUser._id,
      name: 'UPI Wallet',
      type: 'UPI Wallet',
      initialBalance: 5000
    });

    // Create default categories
    const categories = await Category.create([
      { userId: demoUser._id, name: 'Food', type: 'expense', icon: 'utensils', color: '#E8B7A6' },
      { userId: demoUser._id, name: 'Transport', type: 'expense', icon: 'bus', color: '#A9BDD2' },
      { userId: demoUser._id, name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#C3B8D8' },
      { userId: demoUser._id, name: 'Bills', type: 'expense', icon: 'receipt', color: '#E7D99B' },
      { userId: demoUser._id, name: 'Entertainment', type: 'expense', icon: 'film', color: '#A8C3B0' },
      { userId: demoUser._id, name: 'Subscriptions', type: 'expense', icon: 'credit-card', color: '#C3B8D8' },
      { userId: demoUser._id, name: 'Scholarship', type: 'income', icon: 'award', color: '#A8C3B0' },
      { userId: demoUser._id, name: 'Pocket Money', type: 'income', icon: 'wallet', color: '#E7D99B' }
    ]);

    const catMap = {};
    categories.forEach(c => catMap[c.name] = c._id);

    const now = new Date();

    // Sample Transactions
    await Transaction.create([
      {
        userId: demoUser._id,
        type: 'income',
        amount: 18000,
        categoryId: catMap['Pocket Money'],
        categoryName: 'Pocket Money',
        accountId: hdfcAcc._id,
        accountName: 'HDFC Bank',
        merchant: 'Parent Transfer',
        description: 'Monthly pocket money allowance',
        paymentMethod: 'UPI',
        date: new Date(now.getFullYear(), now.getMonth(), 1)
      },
      {
        userId: demoUser._id,
        type: 'expense',
        amount: 4200,
        categoryId: catMap['Food'],
        categoryName: 'Food',
        accountId: upiAcc._id,
        accountName: 'UPI Wallet',
        merchant: 'Campus Mess & Swiggy',
        description: 'Monthly mess fee and snacks',
        paymentMethod: 'UPI',
        date: new Date(now.getFullYear(), now.getMonth(), 5)
      },
      {
        userId: demoUser._id,
        type: 'expense',
        amount: 1800,
        categoryId: catMap['Transport'],
        categoryName: 'Transport',
        accountId: upiAcc._id,
        accountName: 'UPI Wallet',
        merchant: 'Metro Pass & Auto',
        description: 'Daily travel pass',
        paymentMethod: 'UPI',
        date: new Date(now.getFullYear(), now.getMonth(), 8)
      },
      {
        userId: demoUser._id,
        type: 'expense',
        amount: 2400,
        categoryId: catMap['Shopping'],
        categoryName: 'Shopping',
        accountId: hdfcAcc._id,
        accountName: 'HDFC Bank',
        merchant: 'Myntra',
        description: 'College winter hoodie',
        paymentMethod: 'Debit Card',
        date: new Date(now.getFullYear(), now.getMonth(), 12)
      },
      {
        userId: demoUser._id,
        type: 'expense',
        amount: 649,
        categoryId: catMap['Subscriptions'],
        categoryName: 'Subscriptions',
        accountId: hdfcAcc._id,
        accountName: 'HDFC Bank',
        merchant: 'Netflix India',
        description: 'Monthly HD plan',
        paymentMethod: 'Debit Card',
        date: new Date(now.getFullYear(), now.getMonth(), 15),
        isRecurring: true
      }
    ]);

    // Sample Budgets
    await Budget.create([
      { userId: demoUser._id, period: 'monthly', limitAmount: 15000 },
      { userId: demoUser._id, period: 'weekly', limitAmount: 4000 },
      { userId: demoUser._id, period: 'daily', limitAmount: 600 },
      { userId: demoUser._id, period: 'category', categoryId: catMap['Food'], categoryName: 'Food', limitAmount: 5000 }
    ]);

    // Sample Debts
    await Debt.create([
      {
        userId: demoUser._id,
        personName: 'Rahul Verma',
        amount: 750,
        direction: 'LENT',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 28),
        description: 'Canteen lunch bill split',
        status: 'PENDING'
      },
      {
        userId: demoUser._id,
        personName: 'Neha Sharma',
        amount: 500,
        direction: 'BORROWED',
        dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 20),
        description: 'Printout & assignment binding',
        status: 'OVERDUE'
      }
    ]);

    // Sample Savings Goals
    await SavingsGoal.create([
      {
        userId: demoUser._id,
        goalName: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 4500,
        targetDate: new Date(now.getFullYear(), 11, 31),
        description: 'Safety cushion for unexpected expenses',
        icon: 'shield'
      },
      {
        userId: demoUser._id,
        goalName: 'New Laptop',
        targetAmount: 60000,
        currentAmount: 15000,
        targetDate: new Date(now.getFullYear() + 1, 5, 30),
        description: 'MacBook Pro for development work',
        icon: 'laptop'
      }
    ]);

    // Sample Recurring Expenses
    await RecurringExpense.create([
      {
        userId: demoUser._id,
        name: 'Spotify Premium',
        amount: 119,
        categoryId: catMap['Subscriptions'],
        categoryName: 'Subscriptions',
        accountId: hdfcAcc._id,
        frequency: 'monthly',
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        isActive: true
      },
      {
        userId: demoUser._id,
        name: 'Gym Membership',
        amount: 1500,
        categoryId: catMap['Subscriptions'],
        categoryName: 'Subscriptions',
        accountId: hdfcAcc._id,
        frequency: 'monthly',
        nextDueDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        isActive: true
      }
    ]);

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
