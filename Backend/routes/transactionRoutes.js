const express = require("express");
const Transaction = require("../model/transaction");
const verifyToken = require('../middleware/auth');

const transactionRoute = express.Router();

transactionRoute.get("/:userId", verifyToken, async (req, res) => {

   const { userId } = req.params;


  if (req.user.id !== userId) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const transactions = await Transaction.find({ userId }).sort({ date: -1 });
    res.json(transactions);
  }
   catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ message: "Server error" });
  }
});



transactionRoute.post("/", async (req, res) => {
  const {
    title,
    type,
    category,
    amount,
    description,
    userId,
    addedBy,
    date,
  } = req.body;

  try {
    const newTransaction = new Transaction({
      title,
      type,
      category,
      amount,
      description,
      userId,
      addedBy,
      date,
    });

    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error("Error saving transaction:", err);
    res.status(400).json({ message: err.message });
  }
});



transactionRoute.delete("/:id", async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = transactionRoute;
