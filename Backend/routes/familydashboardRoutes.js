const express = require('express');
const dashboardRoutes = express.Router();
const { Budget, Goal } = require('../Model/dashboard');
const TransactionMain = require('../Model/transaction');
const verifyToken = require('../middleware/auth');

// GET budget
dashboardRoutes.get('/budget', async (req, res) => {
  try {
    const budget = await Budget.findOne(); // shared budget
    if (!budget) {
      // Don't override existing data on frontend with 0s
      return res.status(404).json({ message: 'No budget found' });
    }
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


dashboardRoutes.post('/budget', async (req, res) => {
  try {
    const { total, expenses } = req.body;
    const remaining = total - expenses;

    let budget = await Budget.findOne();
    if (budget) {
      budget.total = total;
      budget.expenses = expenses;
      budget.remaining = remaining;
      await budget.save();
    } else {
      budget = new Budget({ total, expenses, remaining });
      await budget.save();
    }

    console.log('Updated Budget:', budget); // Debug log for success
    res.status(200).json(budget);
  } catch (err) {
    console.error('Error saving budget:', err); // Debug log for error
    res.status(500).json({ error: 'Failed to save budget' });
  }
});


// GET Goals
dashboardRoutes.get('/goal', async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET Transactions (latest 5 for the authenticated user)
dashboardRoutes.get('/transaction', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);
    const txns = await TransactionMain
      .find({ userId })
      .sort({ date: -1, _id: -1 })
      .limit(limit);
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = dashboardRoutes;
