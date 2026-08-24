const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const autoSeedIfEmpty = async () => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return;
    }
    console.log('[Database] Empty database detected. Auto-seeding demo data...');

    const Category = require('../models/Category');
    const Account = require('../models/Account');
    const Transaction = require('../models/Transaction');
    const Budget = require('../models/Budget');
    const Debt = require('../models/Debt');
    const SavingsGoal = require('../models/SavingsGoal');
    const RecurringExpense = require('../models/RecurringExpense');

    const demoEmail = 'student@kaisapaisa.com';
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
    categories.forEach(c => (catMap[c.name] = c._id));

    const now = new Date();

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

    await Budget.create([
      { userId: demoUser._id, period: 'monthly', limitAmount: 15000 },
      { userId: demoUser._id, period: 'weekly', limitAmount: 4000 },
      { userId: demoUser._id, period: 'daily', limitAmount: 600 },
      { userId: demoUser._id, period: 'category', categoryId: catMap['Food'], categoryName: 'Food', limitAmount: 5000 }
    ]);

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

    console.log('[Database] Auto-seeding completed successfully!');
  } catch (err) {
    console.warn('[Database] Auto-seeding error:', err.message);
  }
};

let mongoServerInstance = null;
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    // 1. Try connecting to specified MONGODB_URI / MONGO_URI / DATABASE_URL if present
    const externalUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
    if (externalUri && externalUri.trim()) {
      try {
        console.log('[MongoDB] Attempting to connect to configured MongoDB URI...');
        const conn = await mongoose.connect(externalUri.trim(), {
          serverSelectionTimeoutMS: 3500,
          connectTimeoutMS: 4000,
          socketTimeoutMS: 30000,
          maxPoolSize: 10,
          minPoolSize: 1,
          retryWrites: true
        });
        console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
        await autoSeedIfEmpty();
        return conn;
      } catch (error) {
        console.warn(`[MongoDB Atlas Notice] Could not connect to external URI (${error.message}).`);
        console.warn('[MongoDB Atlas Notice] If using MongoDB Atlas, ensure your cluster IP Access List allows connections (e.g. 0.0.0.0/0 in Atlas Network Access).');
        console.warn('[MongoDB] Falling back to high-performance local/in-memory database instance...');
        // Disconnect any stale or half-open connection before fallback
        try {
          await mongoose.disconnect();
        } catch (_) {}
      }
    }

    // 2. Try default local Mongo daemon if available
    try {
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/kaisapaisa', {
        serverSelectionTimeoutMS: 1200,
        connectTimeoutMS: 1500
      });
      console.log(`[MongoDB] Connected to local MongoDB host: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      return conn;
    } catch (err) {
      // Local daemon not running, proceed to memory server
      try {
        await mongoose.disconnect();
      } catch (_) {}
    }

    // 3. Fallback to MongoDB Memory Server instance
    try {
      let MongoMemoryServer;
      try {
        MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
      } catch (e) {
        MongoMemoryServer = require('../../../node_modules/mongodb-memory-server').MongoMemoryServer;
      }

      if (!mongoServerInstance) {
        console.log('[MongoDB] Initializing MongoMemoryServer...');
        mongoServerInstance = await MongoMemoryServer.create();
      }
      const memUri = mongoServerInstance.getUri();
      const conn = await mongoose.connect(memUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      console.log(`[MongoDB] Connected to MongoMemoryServer at ${memUri}`);
      await autoSeedIfEmpty();
      return conn;
    } catch (error) {
      console.error('[MongoDB Critical Error] Failed to initialize database instance:', error.message);
      throw error;
    }
  })();

  try {
    const result = await connectionPromise;
    return result;
  } catch (err) {
    connectionPromise = null;
    throw err;
  }
};

module.exports = connectDB;
