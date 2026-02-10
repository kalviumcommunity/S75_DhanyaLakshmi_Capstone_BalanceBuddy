// routes/goalRoutes.js
const express = require('express');
const router = express.Router();
const Goal = require('../model/goalSchema');
const auth = require('../middleware/auth');

// Apply auth middleware to all goal routes
router.use(auth);

// Create new goal (POST /api/goal)
router.post('/goal', async (req, res) => {
  try {
    const { name, target, startingDate, budget, saved, updatedDate } = req.body;

    if (!name || target == null || !startingDate || budget == null) {
      return res.status(400).json({ message: 'Name, target, startingDate and budget are required' });
    }

    const newGoal = new Goal({
      name,
      target,
      startingDate,
      updatedDate: updatedDate || Date.now(),
      budget,
      saved: saved ?? 0,
      userId: req.user.id
    });

    const savedGoal = await newGoal.save();
    res.status(201).json(savedGoal);
  } catch (err) {
    console.error('Error saving goal:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all goals for logged in user (GET /api/goal)
router.get('/goal', async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id }).sort({ updatedDate: -1 });
    res.json(goals);
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update existing goal (PUT /api/goal/:id)
router.put('/goal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, userId: req.user.id }, // ensure ownership
      req.body,
      { new: true }
    );

    if (!updatedGoal) return res.status(404).json({ message: 'Goal not found' });

    res.json(updatedGoal);
  } catch (err) {
    console.error('Error updating goal:', err);
    res.status(500).json({ message: 'Failed to update goal' });
  }
});

// Delete a goal (DELETE /api/goal/:id)
router.delete('/goal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGoal = await Goal.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!deletedGoal) return res.status(404).json({ message: 'Goal not found' });

    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('Error deleting goal:', err);
    res.status(500).json({ message: 'Failed to delete goal' });
  }
});

module.exports = router;
