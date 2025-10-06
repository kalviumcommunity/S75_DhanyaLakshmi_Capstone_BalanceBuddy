const express = require('express');
const router  = express.Router();
const Goal    = require('../model/goalSchema');

// Create new goal
router.post('/goal', async (req, res) => {
    console.log('POST /api/goals body:', req.body);
    try {
      const { name, target, startingDate, budget, saved, updatedDate } = req.body;
      
      if (!name || !target || !startingDate || !budget || saved == null || !updatedDate) {
        return res.status(400).json({ message: 'All fields are required' });
      }
  
      const newGoal = new Goal({ name, target, startingDate, updatedDate, budget, saved });
      const savedGoal = await newGoal.save();
      
      console.log('New goal saved:', savedGoal);
      res.status(201).json(savedGoal);
    } catch (err) {
      console.error('Error saving goal:', err);
      res.status(500).json({ message: err.message });
    }
  });
  

// Get all goals
router.get('/goal', async (req, res) => {
  try {
    const goals = await Goal.find();
    res.json(goals);
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update existing goal
router.put('/goal/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGoal = await Goal.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(updatedGoal);
  } catch (err) {
    console.error('Error updating goal:', err);
    res.status(500).json({ message: 'Failed to update goal' });
  }
});

// Delete a goal by ID
router.delete('/goal/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedGoal = await Goal.findByIdAndDelete(id);
  
      if (!deletedGoal) {
        return res.status(404).json({ message: 'Goal not found' });
      }
  
      res.json({ message: 'Goal deleted successfully' });
    } catch (err) {
      console.error('Error deleting goal:', err);
      res.status(500).json({ message: 'Failed to delete goal' });
    }
  });

  router.get('/goal', async (req, res) => {
    try {
      const goals = await Goal.find(); // Add filter if you use userID
      res.json(goals);
    } catch (err) {
      res.status(500).json({ message: 'Failed to fetch goals' });
    }
  });
  
  

module.exports = router;
