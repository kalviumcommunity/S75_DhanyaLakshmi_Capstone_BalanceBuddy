/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../utils/axiosConfig";
import "../styles/transaction.css";

export default function Transaction() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [mode, setMode] = useState("manual");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    amount: "",
    date: "",
  });
  const [error, setError] = useState(null);

  // Helpers
  const formatINR = (num) => {
    const n = Number(num) || 0;
    return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateTime = (d, t) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      // If separate time provided, rely on dt only, as backend already stores MSK
      return dt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return String(d);
    }
  };

  const inferChannel = (desc = "") => {
    const d = desc.toLowerCase();
    if (d.includes("upi")) return "UPI";
    if (d.includes("neft")) return "NEFT";
    if (d.includes("imps")) return "IMPS";
    if (d.includes("pos") || d.includes("card")) return "Card";
    if (d.includes("atm")) return "ATM";
    if (d.includes("interest")) return "Interest";
    if (d.includes("salary")) return "Salary";
    return "";
  };

  const isNoisyParty = (s = "") => {
    const x = s.trim();
    if (!x) return true;
    // Too short after removing spaces and punctuation
    const alnum = x.replace(/[^A-Za-z0-9]/g, "");
    if (alnum.length <= 3) return true;
    // Common statement artifacts
    const noisePatterns = [
      /^b\s*\/?\s*f\b/i,        // B/F, B F
      /^b\s*in$/i,                // B IN
      /^bal\.?\s*(in|out)?$/i,   // BAL, BAL IN/OUT
      /^opening$/i,
      /^closing$/i,
      /^transfer$/i,
      /^cash$/i,
    ];
    return noisePatterns.some((rx) => rx.test(x));
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      console.log("Fetching transactions...");
      const res = await api.get("/transactions");
      console.log("Transactions received:", res.data);
      setTransactions(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to fetch transactions. Please make sure you're logged in.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form data change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'category' ? value.toLowerCase() : value,
    }));
    console.log(formData)
  };

  // Submit manual transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/transactions", formData);
      alert("Transaction added successfully!");
      setFormData({
        title: "",
        description: "",
        type: "",
        category: "",
        amount: "",
        date: "",
      });
      fetchTransactions();
    } catch (err) {
      console.error("Transaction submission error:", err);
      setError(err.response?.data?.message || "Failed to add transaction!");
    } finally {
      setLoading(false);
    }
  };

  // Upload PDF
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a PDF file");

    setLoading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("password", password);

    try {
      console.log("Uploading PDF...");
      await api.post(
        "/transactions/upload",
        formDataObj,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      alert("PDF uploaded successfully!");
      setFile(null);
      setPassword("");
      fetchTransactions();
    } catch (err) {
      console.error("PDF Processing Error:", err);
      console.error("Error response:", err.response?.data);
      setError(err.response?.data?.message || "Failed to process PDF. Please make sure you're logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Calculate totals
  const txns = Array.isArray(transactions) ? transactions : [];
  const totalIncome = txns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = txns
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  if (error) {
    return (
      <div style={{ color: "red", padding: "2rem" }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="transaction-container">
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      
      {loading && (
        <div style={{ padding: "1rem", backgroundColor: "#f0f8ff", border: "1px solid #ccc", borderRadius: "4px", marginBottom: "1rem" }}>
          <p>Loading...</p>
        </div>
      )}
      
      {/* Debug Info */}
      <div style={{ padding: "1rem", backgroundColor: "#f9f9f9", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9em" }}>
        <p><strong>Debug Info:</strong></p>
        <p>Transactions count: {transactions.length}</p>
        <p>Total Income: ₹{totalIncome}</p>
        <p>Total Expenses: ₹{totalExpense}</p>
        <p>Balance: ₹{balance}</p>
      </div>

      {/* Mode Switch */}
      <div className="tabs mb-4">
        <button
          className={mode === "manual" ? "active" : ""}
          onClick={() => setMode("manual")}
        >
          Manual Entry
        </button>
        <button
          className={mode === "pdf" ? "active" : ""}
          onClick={() => setMode("pdf")}
        >
          Upload PDF
        </button>
      </div>

      {/* Manual Entry Section */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="tx-form-card">
          <div className="tx-form-grid">
            <div>
              <label className="tx-label" htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                name="title"
                placeholder="e.g., Dinner, Salary, Groceries"
                value={formData.title}
                onChange={handleChange}
                className="tx-input"
                required
              />
            </div>
            <div>
              <label className="tx-label" htmlFor="type">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="tx-select"
                required
              >
                <option value="">Select type</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="tx-label" htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="tx-select"
                required
              >
                <option value="">Select category</option>
                <option value="food">Food</option>
                <option value="bills">Bills</option>
                <option value="salary">Salary</option>
                <option value="shopping">Shopping</option>
                <option value="transportation">Transportation</option>
                <option value="entertainment">Entertainment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="tx-label" htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                name="amount"
                placeholder="Amount"
                value={formData.amount}
                onChange={handleChange}
                className="tx-number"
                required
              />
            </div>
            <div>
              <label className="tx-label" htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                name="date"
                placeholder="Date"
                value={formData.date}
                onChange={handleChange}
                className="tx-date"
                required
              />
            </div>
            <div className="full">
              <label className="tx-label" htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Optional notes"
                value={formData.description}
                onChange={handleChange}
                className="tx-textarea"
                rows="6"
              />
            </div>
          </div>
          <div className="tx-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? "Adding..." : "Add Transaction"}
            </button>
          </div>
        </form>
      )}

      {/* PDF Upload Section */}
      {mode === "pdf" && (
        <form onSubmit={handleUpload} className="tx-form-card">
          <div className="tx-form-grid">
            <div className="full">
              <label className="tx-label" htmlFor="pdfFile">Bank Statement (PDF)</label>
              <input
                id="pdfFile"
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="tx-file"
              />
            </div>
            <div>
              <label className="tx-label" htmlFor="pdfPwd">PDF Password (optional)</label>
              <input
                id="pdfPwd"
                type="password"
                placeholder="Enter PDF password (if required)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tx-password"
              />
            </div>
          </div>
          <div className="tx-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? "Uploading PDF..." : "Upload PDF"}
            </button>
          </div>
        </form>
      )}

      {/* Summary Section */}
      <div className="summary mb-6">
        <div className="card income">
          <p>Total Income</p>
          <p>₹{totalIncome}</p>
        </div>
        <div className="card expense">
          <p>Total Expenses</p>
          <p>₹{totalExpense}</p>
        </div>
        <div className="card balance">
          <p>Balance</p>
          <p>₹{balance}</p>
        </div>
      </div>

      

      {/* All Transactions */}
      <h2 className="text-xl font-semibold mt-6">All Transactions</h2>
      {transactions.length === 0 ? (
        <div className="no-transactions" style={{ padding: "2rem", textAlign: "center", backgroundColor: "#f9f9f9", borderRadius: "8px", margin: "1rem 0" }}>
          <p style={{ fontSize: "1.1rem", color: "#666" }}>No transactions found. Add a transaction to get started!</p>
        </div>
      ) : (
        <ul className="transaction-list">
          {transactions.map((t) => {
            const isExpense = t.type === "expense";
            const isIncome = t.type === "income";
            return (
              <li
                key={t._id}
                className={isExpense ? "expense" : "income"}
              >
                <div>
                  <span className="title">{t.title}</span>
                  <div className="details">
                    {t.date ? new Date(t.date).toLocaleDateString() : ""}{" "}
                    {t.time ? t.time : ""} | {t.category}
                  </div>
                  <div className="added-by">Added by: {t.addedBy}</div>
                </div>
                <span
                  className="amount"
                  style={{
                    color: isIncome ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {isIncome ? "+" : "-"}₹{t.amount}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}






