const mongoose = require('mongoose');
// const axios = require('axios');

const transactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Unnamed Transaction",
  },
  description: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    enum: ["income", "expense"],  // ✅ Only allows "income" or "expense"
    required: true,
  },
  category: {
    type: String,
    default: "General",
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,   // ✅ If no date provided, it stores current time
  },
  time: {
    type: String,
    default: function() {
      return new Date().toLocaleTimeString();
    }
  },
  addedBy: {
    type: String,
    required: true,      // ✅ Person who added the transaction
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",         // ✅ Links the transaction to a User in your User schema
    required: true,
  },
  // ✅ Optional account/statement holder name extracted from PDF
  holderName: {
    type: String,
    required: false,
  },
  // ✅ Counterparty extracted from description (receiver/sender)
  counterparty: {
    type: String,
    required: false,
  },
  // ✅ New field for uploaded file
  file: {
    type: String,        // will store file path or URL
    required: false,
  }
});



module.exports = mongoose.model('Transaction', transactionSchema);
