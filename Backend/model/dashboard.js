const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  total: Number,
  expenses: Number,
  remaining: Number,
}, { collection: 'budgets' });

const GoalSchema = new mongoose.Schema({
  name: String,
  budget: Number,
  saved: Number,
}, { collection: 'goals' });

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
const Goal = mongoose.models.Goal || mongoose.model('Goal', GoalSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

module.exports = { Budget, Goal, Transaction };
