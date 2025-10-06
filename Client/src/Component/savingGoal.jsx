import React, { useState, useEffect } from 'react';
import '../styles/savingGoals.css';
import '../styles/addGoalPopup.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';

const SavingGoals = () => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
    startingDate: '',
    updatedDate: '',
    budget: '',
    saved: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/goal/')
      .then(res => {
        const parsedGoals = res.data.map(goal => ({
          ...goal,
          budget: Number(goal.budget),
          saved: Number(goal.saved)
        }));
        setGoals(parsedGoals);
      })
      .catch(err => console.error('Error fetching goals:', err));
  }, []);

  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const totalBudget = goals.reduce((sum, g) => sum + g.budget, 0);
  const overallProgress = totalBudget
    ? ((totalSaved / totalBudget) * 100).toFixed(1)
    : 0;

  const handleAddOrUpdateGoal = async e => {
    e.preventDefault();
    try {
      const goalToSubmit = {
        ...newGoal,
        budget: Number(newGoal.budget),
        saved: Number(newGoal.saved)
      };

      if (isEditing) {
        const res = await axios.put(`http://localhost:5000/api/goal/${editId}`, goalToSubmit);
        const updatedGoal = {
          ...res.data,
          budget: Number(res.data.budget),
          saved: Number(res.data.saved)
        };
        setGoals(prev => prev.map(g => g._id === editId ? updatedGoal : g));
        setShowForm(false);
        setIsEditing(false);
        setEditId(null);
      } else {
        const res = await axios.post('http://localhost:5000/api/goal', goalToSubmit);
        const newAddedGoal = {
          ...res.data,
          budget: Number(res.data.budget),
          saved: Number(res.data.saved)
        };
        setGoals(prev => [...prev, newAddedGoal]);
        setShowForm(false);
      }

      // Reset form after submit
      setNewGoal({ name: '', target: '', startingDate: '', updatedDate: '', budget: '', saved: '' });

    } catch (err) {
      console.error('Error saving goal:', err);
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleEdit = (goal) => {
    setNewGoal({
      name: goal.name || '',
      target: goal.target?.toString() || '',
      startingDate: goal.startingDate ? goal.startingDate.slice(0, 10) : '',
      updatedDate: goal.updatedDate ? goal.updatedDate.slice(0, 10) : '',
      budget: goal.budget?.toString() || '',
      saved: goal.saved?.toString() || ''
    });
    setIsEditing(true);
    setEditId(goal._id);
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await axios.delete(`http://localhost:5000/api/goal/${id}`);
        setGoals(prev => prev.filter(g => g._id !== id));
      } catch (err) {
        console.error('Error deleting goal:', err);
        alert('Failed to delete goal');
      }
    }
  };

  return (
    <div className="saving-goals-container">
      <header className="saving-header">
        <h2
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}
          onClick={() => navigate('/family')}
        >
          <FaArrowLeft /> Saving Goals
        </h2>
      </header>

      <div className="overall-progress-card">
        <div className="progress-info">
          <h4>🏆 Overall Saving Progress</h4>
          <span>₹{totalSaved.toLocaleString()} / ₹{totalBudget.toLocaleString()}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
        </div>
        <small>{overallProgress}% of your total budgets</small>
      </div>

      <button
        className="add-goal-button"
        onClick={() => {
          setShowForm(true);
          setIsEditing(false);
          setNewGoal({ name: '', target: '', startingDate: '', updatedDate: '', budget: '', saved: '' });
        }}
      >
        + Add New Goals
      </button>

      <div className="goal-cards-grid">
        {goals.map(goal => {
          const pct = goal.budget ? Math.round((goal.saved / goal.budget) * 100) : 0;
          const rem = goal.budget - goal.saved;
          return (
            <div className="goal-card" key={goal._id}>
              <h5>{goal.name}</h5>
              <small>
                Duration: {goal.target} days | Started Date: {goal.startingDate ? new Date(goal.startingDate).toLocaleDateString() : 'N/A'}
              </small>
              <small>
                Budget: ₹{goal.budget.toLocaleString()} | Saved: ₹{goal.saved.toLocaleString()}
              </small>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <small>{pct}% Completed</small>
              <small>Remaining: ₹{rem.toLocaleString()}</small>

              <div className="goal-actions">
                <button className="update-btn" onClick={() => handleEdit(goal)}>Update</button>
                <button className="delete-btn" onClick={() => handleDelete(goal._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="add-goal-popup">
          <div className="form-content">
            <button
              className="close-btn"
              onClick={() => {
                setShowForm(false);
                setIsEditing(false);
                setEditId(null);
                setNewGoal({ name: '', target: '', startingDate: '', updatedDate: '', budget: '', saved: '' });
              }}
            >
              ✕
            </button>
            <h3>{isEditing ? 'Edit Goal' : 'Add New Goal'}</h3>
            <form onSubmit={handleAddOrUpdateGoal}>
              <label>Name:</label>
              <input
                type="text"
                value={newGoal.name}
                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                required
              />

              <label>Target (days):</label>
              <input
                type="number"
                value={newGoal.target}
                onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
                required
              />

              <label>Starting Date:</label>
              <input
                type="date"
                value={newGoal.startingDate}
                onChange={e => setNewGoal({ ...newGoal, startingDate: e.target.value })}
                required
              />

              <label>Updated Date:</label>
              <input
                type="date"
                value={newGoal.updatedDate}
                onChange={e => setNewGoal({ ...newGoal, updatedDate: e.target.value })}
                required
              />

              <label>Budget (₹):</label>
              <input
                type="number"
                value={newGoal.budget}
                onChange={e => setNewGoal({ ...newGoal, budget: e.target.value })}
                required
              />

              <label>Saved (₹):</label>
              <input
                type="number"
                value={newGoal.saved}
                onChange={e => setNewGoal({ ...newGoal, saved: e.target.value })}
              />

              <button type="submit" className="submit-btn">
                {isEditing ? 'Update Goal' : 'Add Goal'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavingGoals;
