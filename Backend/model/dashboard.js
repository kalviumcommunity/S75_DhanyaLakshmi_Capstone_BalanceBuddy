const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  total: Number,
  expenses: Number,
  remaining: Number,
}, { collection: 'budgets' });

// Reuse the main Goal model to ensure consistent schema (with dates, etc.)
const Goal = require('./goalSchema');

const TransactionSchema = new mongoose.Schema({
  title: String,
  category: String,
  amount: Number,
  date: {
    type: Date,
    default: Date.now,
  },
}, { collection: 'transactions' });

// Check if the models already exist to prevent overwriting
const Budget = mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

module.exports = { Budget, Goal, Transaction };
