const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../Model/transaction");
const auth = require("../middleware/auth");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Create a new transaction
router.post("/", async (req, res) => {
  try {
    const { title, amount, category, type, date, description } = req.body;
    const allowedCategories = ['food', 'bills', 'salary', 'shopping', 'transportation', 'entertainment', 'other'];
    const catRaw = typeof category === 'string' ? category.toLowerCase() : '';
    const cat = allowedCategories.includes(catRaw) ? catRaw : 'other';
    
    // Validate required fields
    if (!title || !amount || !category || !type) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['title', 'amount', 'category', 'type']
      });
    }

    // Create transaction
    const transaction = new Transaction({
      title,
      description: description || title,
      amount: parseFloat(amount),
      category: cat,
      type: type.toLowerCase(),
      date: date ? new Date(date) : new Date(),
      userId: req.user.id,
      addedBy: req.user.name || 'System'
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: transaction
    });
    
  } catch (error) {
    console.error('Transaction creation error:', error);
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get all transactions for the logged-in user
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ date: -1 });
      
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get a single transaction
router.get("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update a transaction
router.put("/:id", async (req, res) => {
  try {
    const { title, amount, category, type, date, description } = req.body;
    const allowedCategories = ['food', 'bills', 'salary', 'shopping', 'transportation', 'entertainment', 'other'];
    const catRaw = typeof category === 'string' ? category.toLowerCase() : '';
    const cat = allowedCategories.includes(catRaw) ? catRaw : 'other';
    
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        $set: {
          title,
          description: description || title,
          amount: parseFloat(amount),
          category: cat,
          type: type.toLowerCase(),
          date: date ? new Date(date) : new Date()
        }
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });
    
  } catch (error) {
    console.error('Transaction update error:', error);
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete a transaction
router.delete("/:id", async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete(
      { _id: req.params.id, userId: req.user.id }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
    
  } catch (error) {
    console.error('Transaction deletion error:', error);
    if (error?.name === 'ValidationError') {
      const details = Object.values(error.errors || {}).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: details,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Upload bank statement PDF and attempt to process (basic stub)
const upload = multer({ dest: "uploads/" });
router.post("/upload", upload.single("file"), async (req, res) => {
  const fileObj = req.file;
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : null;
  if (!fileObj) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  let pdfBuffer = null;
  try {
    pdfBuffer = fs.readFileSync(fileObj.path);
    // Try to parse to validate password/file; ignore extracted text for now
    try {
      await pdfParse(pdfBuffer, password ? { password } : {});
    } catch (e) {
      // Fallback: try empty password if one was provided and failed
      if (password) {
        try { await pdfParse(pdfBuffer, {}); } catch (e2) {}
      }
    }
    return res.status(201).json({ message: "PDF uploaded successfully", count: 0 });
  } catch (err) {
    console.error("PDF upload error:", err);
    return res.status(500).json({ message: "Failed to process PDF", error: err.message });
  } finally {
    try { if (fileObj?.path && fs.existsSync(fileObj.path)) fs.unlinkSync(fileObj.path); } catch {}
  }
});

module.exports = router;
