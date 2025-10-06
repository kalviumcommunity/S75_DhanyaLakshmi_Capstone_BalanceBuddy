import React, { useState } from "react";
import "../styles/addTransaction.css";
import axios from "axios";

const AddTransactionForm = ({ onClose, userId, userName, refresh }) => {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    type: "",
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
      ...formData,
      amount: parsedAmount,
      userId,
      addedBy: userName,
    };

    try {
      await axios.post("https://s75-dhanyalakshmi-capstone-balancebuddy-7gi5.onrender.com/api/transactions", dataToSend, {
        withCredentials: true,
      });
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

          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select a category</option>
            <option value="Food">Food</option>
            <option value="Bills">Bills</option>
            <option value="Salary">Salary</option>
            <option value="Lottery">Lottery</option>
            <option value="Shopping">Shopping</option>
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
