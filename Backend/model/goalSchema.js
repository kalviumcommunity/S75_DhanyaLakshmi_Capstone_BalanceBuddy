const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  target: {
    type: Number,
    required: true,
    min: 0
  },
  saved: {
    type: Number,
    default: 0,
    min: 0
  },
  startingDate: {
    type: Date,
    required: true
  },
  updatedDate: {
    type: Date,
    default: Date.now
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const Goal = mongoose.models.Goal || mongoose.model('Goal', goalSchema);
module.exports = Goal;

