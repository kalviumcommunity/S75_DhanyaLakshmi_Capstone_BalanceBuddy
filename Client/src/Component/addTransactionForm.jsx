/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import "../styles/addTransactionForm.css";
import axios from "axios";
import api from "../utils/axiosConfig";

const AddTransactionForm = ({ onClose, userId, userName, refresh }) => {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
    type: "expense", // Default to expense
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !userName) {
      alert("User information is not loaded yet. Please try again.");
      return;
    }

    const parsedAmount = parseFloat(formData.amount);
    if (Number.isNaN(parsedAmount)) {
      alert("Please enter a valid number for amount.");
      return;
    }

    const dataToSend = {
      title: formData.title, // Will be used as description in the backend
      description: formData.title, // Using title as description
      amount: parsedAmount,
      category: formData.category,
      type: formData.type,
      date: formData.date,
    };

    try {
      await api.post("/transactions", dataToSend);
      alert("Transaction Added");
      refresh();
      onClose();
    } catch (err) {
      console.error("Error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Failed to add transaction.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="transaction-modal">
        <div className="header">
          <h2>New Transaction</h2>
          <span className="close" onClick={onClose}>X</span>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Description</label>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Rent, Salary, etc..."
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            id="amount"
            name="amount"
            placeholder="₹"
            value={formData.amount}
            onChange={handleChange}
            required
          />

          <label>Transaction Type</label>
          <div className="transaction-type">
            <label>
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
                required
              />
              <span>Expense</span>
            </label>
            <label>
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === 'income'}
                onChange={handleChange}
              />
              <span>Income</span>
            </label>
          </div>

          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="food">Food</option>
            <option value="bills">Bills</option>
            <option value="salary">Salary</option>
            <option value="shopping">Shopping</option>
            <option value="transportation">Transportation</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>

          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            required
          >
            <option value="">Select</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <div className="button-group">
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="add">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionForm;
