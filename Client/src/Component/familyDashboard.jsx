/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/axiosConfig';
import Sidebar from './SideBar';
import '../styles/FamilyDashboard.css';
import '../styles/Sidebar.css';

const FamilyDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [budgetData, setBudgetData] = useState({ total: 0, expenses: 0, remaining: 0 });
  const [formData, setFormData] = useState({ total: 0, expenses: 0 });
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);

  useEffect(() => {
    const token = document.cookie.split(';').find(c => c.trim().startsWith('token='));
    if (!token) {
      navigate('/family', { replace: true });
      console.log(localStorage.getItem("token"))
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const [budgetRes, goalsRes, txnsRes] = await Promise.all([
        api.get('/dashboard/budget'),
        api.get('/dashboard/goal'),
        api.get('/dashboard/transaction?limit=4'),
      ]);

      const { total, expenses } = budgetRes.data || { total: 0, expenses: 0 };
      setBudgetData({ total, expenses, remaining: total - expenses });
      setFormData({ total, expenses });
      setSavingsGoals(goalsRes.data);
      const txns = Array.isArray(txnsRes.data) ? txnsRes.data.slice(0,4) : [];
      setRecentTxns(txns);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setBudgetData({ total: 0, expenses: 0, remaining: 0 });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    try {
      const res = await api.post('/dashboard/budget', formData);
      const { total, expenses } = res.data;
      setBudgetData({ total, expenses, remaining: total - expenses });
      alert("Budget updated successfully!");
      setShowBudgetForm(false);
    } catch (err) {
      console.error('Error saving budget:', err);
      alert("Failed to update budget.");
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="main-layout">
      {sidebarOpen && <Sidebar />}
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="fb-container">
        <header className="fb-header">
          <button className="fb-menu-btn" onClick={() => setSidebarOpen(prev => !prev)}>
            <FaBars />
          </button>
          <h1>Family Budget Dashboard</h1>
        </header>

        <button className="toggle-budget-btn" onClick={() => setShowBudgetForm(prev => !prev)}>
          {showBudgetForm ? "Close Budget Form" : "Update Budget"}
        </button>

        {showBudgetForm && (
          <section className="budget-form">
            <h3>Update Budget</h3>
            <input
              type="tel"
              name="total"
              placeholder="Total Budget"
              value={formData.total}
              onChange={handleChange}
            />
            <input
              type="tel"
              name="expenses"
              placeholder="Total Expenses"
              value={formData.expenses}
              onChange={handleChange}
            />
            <input
              type="tel"
              value={(formData.total - formData.expenses).toFixed(2)}
              placeholder="Remaining"
              disabled
            />
            <button onClick={handleSave}>Save Budget</button>
          </section>
        )}

        <section className="fb-summary">
          <div className="card">
            <small>Total Budget</small>
            <h2>₹{budgetData.total.toFixed(2)}</h2>
            <small>Monthly budget</small>
          </div>
          <div className="card">
            <small>Total Expenses</small>
            <h2 className="text-red">₹{budgetData.expenses.toFixed(2)}</h2>
            <small>Monthly expenses</small>
          </div>
          <div className="card">
            <small>Remaining Budget</small>
            <h2 className="text-green">₹{budgetData.remaining.toFixed(2)}</h2>
            <small>Left to spend this month</small>
          </div>
        </section>

        {/* FIXED LAYOUT STARTS HERE */}
        <section className="fb-main">
          {/* LEFT SIDE */}
          <div className="fb-left">
            {/* <div className="chart-card"> */}
              {/* <h3>Expense Breakdown</h3> */}
              {/* Placeholder for future pie chart */}
            {/* </div> */}

            <div className="txns-card">
              <div className="txns-header">
                <h3>Recent Transactions</h3>
                <button onClick={() => navigate('/family/transactions')}>View All →</button>
              </div>
              <ul>
                {recentTxns.map((txn, idx) => (
                  <li key={idx}>
                    <div>
                      <strong>{txn.title || 'No Description'}</strong><br />
                      <span>{txn.category || 'Uncategorized'} · {new Date(txn.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                    <div className={txn.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                      {txn.type === 'income' ? '+' : '-'}₹{txn.amount}
                    </div>
                  </li>
                ))}
              </ul>

            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="fb-right">
            <div className="goals-header">
              <h3>💰Savings Goals</h3>
              <button className="view-all-btn" onClick={() => navigate('/family/goals')}>View All →</button>
            </div>

            <ul className="goal-list">
              {savingsGoals.map((goal, idx) => {
                const percentage = ((goal.saved / goal.budget) * 100).toFixed(1);
                return (
                  <li key={idx} className="goal-item">
                    <div className="goal-header">
                      <strong>{goal.name}</strong>
                      <span>{percentage}%</span>
                    </div>
                    <div className="progress-bar-background">
                      <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <div className="goal-footer">
                      <span>Saved: ₹{goal.saved}</span>
                      <span>Goal: ₹{goal.budget}</span>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button className="add-goal-btn" onClick={() => navigate('/family/goals/new')}>+ Add New Goal</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FamilyDashboard;
