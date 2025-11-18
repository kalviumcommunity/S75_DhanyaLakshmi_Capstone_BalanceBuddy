const express = require('express');
const dashboardRoutes = express.Router();
const { Budget, Goal, Transaction } = require('../model/dashboard');
const verifyToken = require('../middleware/auth');

// ----------------------
// GET USER BUDGET
// ----------------------
dashboardRoutes.get('/budget', verifyToken, async (req, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.user.id });

    if (!budget) {
      return res.json(null); // new user gets empty dashboard
    }

    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// SAVE/UPDATE USER BUDGET
// ----------------------
dashboardRoutes.post('/budget', verifyToken, async (req, res) => {
  try {
    const { total, expenses } = req.body;
    const userId = req.user.id;
    const remaining = total - expenses;

    let budget = await Budget.findOne({ userId });

    if (budget) {
      budget.total = total;
      budget.expenses = expenses;
      budget.remaining = remaining;
    } else {
      budget = new Budget({ total, expenses, remaining, userId });
    }

    await budget.save();
    res.json(budget);

  } catch (err) {
    res.status(500).json({ error: 'Failed to save budget' });
  }
});

// ----------------------
// GET USER GOALS
// ----------------------
dashboardRoutes.get('/goal', verifyToken, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ----------------------
// GET USER TRANSACTIONS (latest 5)
// ----------------------
dashboardRoutes.get('/transaction', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);

    const txns = await Transaction
      .find({ userId })
      .sort({ date: -1, _id: -1 })
      .limit(limit);

    res.json(txns);

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = dashboardRoutes;
