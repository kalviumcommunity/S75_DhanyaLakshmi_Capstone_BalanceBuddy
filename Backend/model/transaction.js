const mongoose = require("mongoose");

// Check if model exists
if (mongoose.models.Transaction) {
  module.exports = mongoose.model('Transaction');
} else {
  const transactionSchema = new mongoose.Schema(
    {
      title: { 
        type: String, 
        required: [true, 'Title is required'] 
      },
      description: { 
        type: String, 
        required: [true, 'Description is required'] 
      },
      amount: { 
        type: Number, 
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
      },
      category: { 
        type: String, 
        required: [true, 'Category is required'],
        enum: ['food', 'bills', 'salary', 'shopping', 'transportation', 'entertainment', 'other']
      },
      type: { 
        type: String, 
        required: [true, 'Transaction type is required'],
        enum: ['income', 'expense']
      },
      date: { 
        type: Date, 
        default: Date.now,
        required: [true, 'Date is required']
      },
      userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: [true, 'User ID is required']
      },
      addedBy: { 
        type: String, 
        required: [true, 'Added by field is required']
      }
    },
    { 
      timestamps: true,
      toJSON: { virtuals: true },
      toObject: { virtuals: true }
    }
  );

  // Indexes for better query performance
  transactionSchema.index({ userId: 1, date: -1 });
  transactionSchema.index({ userId: 1, type: 1 });

  // Create and export the model
  const Transaction = mongoose.model('Transaction', transactionSchema);
  module.exports = Transaction;
}
