const mongoose = require('mongoose');

// ----- BUDGET SCHEMA -----
const BudgetSchema = new mongoose.Schema({
  total: Number,
  expenses: Number,
  remaining: Number,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { collection: 'budgets' });

// ----- REUSE GOAL MODEL -----
const Goal = require('./goalSchema');

// ----- TRANSACTION SCHEMA -----
const TransactionSchema = new mongoose.Schema({
  title: String,
  category: String,
  amount: Number,
  date: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { collection: 'transactions' });

const Budget = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

module.exports = { Budget, Goal, Transaction };
