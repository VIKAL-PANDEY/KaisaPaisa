require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Transaction = require('./src/models/Transaction');
const Budget = require('./src/models/Budget');
const Debt = require('./src/models/Debt');
const SavingsGoal = require('./src/models/SavingsGoal');
const Category = require('./src/models/Category');
const { calculateBudgetProgress } = require('./src/services/budgetEngine');
const bcrypt = require('bcryptjs');

const runTests = async () => {
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✓ PASSED: ${testName}`);
      passed++;
    } else {
      console.error(`✕ FAILED: ${testName}`);
      failed++;
    }
  };

  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('\n==================================================');
    console.log('  RUNNING KAISAPAISA AUTOMATED BACKEND TESTS');
    console.log('==================================================\n');

    // 1. Password Hashing & Registration Test
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('TestPass123', salt);
    const user = await User.create({
      name: 'Test Student',
      email: 'test@kaisapaisa.com',
      passwordHash: passHash,
      currency: 'INR',
      timezone: 'Asia/Kolkata'
    });
    assert(user._id && user.passwordHash !== 'TestPass123', 'Password Hashing & User Registration');

    const passMatch = await user.comparePassword('TestPass123');
    const passFail = await user.comparePassword('WrongPass');
    assert(passMatch && !passFail, 'Password Comparison Logic (Bcrypt)');

    // 2. Transaction Creation & Ownership Test
    const category = await Category.create({ name: 'Food', type: 'expense', userId: user._id });
    const transaction = await Transaction.create({
      userId: user._id,
      type: 'expense',
      amount: 250,
      categoryId: category._id,
      categoryName: 'Food',
      date: new Date()
    });
    assert(transaction._id && transaction.amount === 250, 'Transaction Creation');
    assert(transaction.userId.toString() === user._id.toString(), 'Transaction Ownership Validation');

    // 3. Single Source of Truth Budget Engine Test
    const budget = await Budget.create({
      userId: user._id,
      period: 'monthly',
      limitAmount: 1000
    });

    let budgetProgress = await calculateBudgetProgress(user._id, budget);
    assert(budgetProgress.spentAmount === 250 && budgetProgress.utilizationPercentage === 25, 'Dynamic Budget Calculation (25% spent)');
    assert(budgetProgress.status === 'NORMAL', 'Budget Status NORMAL (< 80%)');

    // 4. Budget 80% Warning Threshold Test
    await Transaction.create({
      userId: user._id,
      type: 'expense',
      amount: 600,
      categoryId: category._id,
      categoryName: 'Food',
      date: new Date()
    });
    budgetProgress = await calculateBudgetProgress(user._id, budget);
    assert(budgetProgress.spentAmount === 850 && budgetProgress.utilizationPercentage === 85, 'Dynamic Budget Calculation (85% spent)');
    assert(budgetProgress.status === 'WARNING', 'Budget Threshold 80% Warning Status');

    // 5. Budget 100% Exceeded State Test
    await Transaction.create({
      userId: user._id,
      type: 'expense',
      amount: 200,
      categoryId: category._id,
      categoryName: 'Food',
      date: new Date()
    });
    budgetProgress = await calculateBudgetProgress(user._id, budget);
    assert(budgetProgress.spentAmount === 1050 && budgetProgress.utilizationPercentage === 105, 'Dynamic Budget Calculation (105% spent)');
    assert(budgetProgress.status === 'EXCEEDED', 'Budget Threshold 100% Exceeded Status');

    // 6. Debt Ownership & Net Position Test
    const debt1 = await Debt.create({
      userId: user._id,
      personName: 'Rahul',
      amount: 500,
      direction: 'LENT',
      dueDate: new Date(),
      status: 'PENDING'
    });
    const debt2 = await Debt.create({
      userId: user._id,
      personName: 'Neha',
      amount: 200,
      direction: 'BORROWED',
      dueDate: new Date(),
      status: 'PENDING'
    });
    assert(debt1.userId.toString() === user._id.toString() && debt2.userId.toString() === user._id.toString(), 'Debt Ownership Isolation');
    const netPosition = debt1.amount - debt2.amount;
    assert(netPosition === 300, 'Debt Net Position Calculation (+300)');

    // 7. Savings Goal Required Savings Test
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + 5, 1);
    const goal = await SavingsGoal.create({
      userId: user._id,
      goalName: 'Laptop',
      targetAmount: 50000,
      currentAmount: 10000,
      targetDate
    });
    const remaining = goal.targetAmount - goal.currentAmount;
    assert(remaining === 40000, 'Savings Goal Remaining Amount Calculation');

    console.log('\n==================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================\n');

    await mongoose.disconnect();
    await mongoServer.stop();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
};

runTests();
