import React, { useState, useEffect } from 'react';
import '../Styles/savingGoals.css';
import '../Styles/addGoalPopup.css';
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
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const fetchGoals = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await axios.get(
        'https://s75-dhanyalakshmi-capstone-balancebuddy-7gi5.onrender.com/api/goal/',
        { timeout: 15000 }
      );
      const parsedGoals = res.data.map(goal => ({
        ...goal,
        budget: Number(goal.budget),
        saved: Number(goal.saved)
      }));
      setGoals(parsedGoals);
    } catch (err) {
      console.error('Error fetching goals:', err);
      const msg = err?.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : (err.response?.data?.message || 'Unable to reach the server. Please try again.');
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 2500);
    return () => clearTimeout(t);
  }, [successMsg]);

  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const totalBudget = goals.reduce((sum, g) => sum + g.budget, 0);
  const overallProgress = totalBudget
    ? ((totalSaved / totalBudget) * 100).toFixed(1)
    : 0;

  const getObjectIdDate = (id) => {
    try {
      if (!id || typeof id !== 'string' || id.length < 8) return null;
      const ts = parseInt(id.substring(0, 8), 16);
      if (Number.isNaN(ts)) return null;
      return new Date(ts * 1000);
    } catch {
      return null;
    }
  };

  const handleAddOrUpdateGoal = async e => {
    e.preventDefault();
    try {
      const goalToSubmit = {
        ...newGoal,
        budget: Number(newGoal.budget),
        saved: Number(newGoal.saved)
      };

      if (isEditing) {
        const res = await axios.put(`https://s75-dhanyalakshmi-capstone-balancebuddy-7gi5.onrender.com/api/goal/${editId}`, goalToSubmit);
        const updatedGoal = {
          ...res.data,
          budget: Number(res.data.budget),
          saved: Number(res.data.saved)
        };
        setGoals(prev => prev.map(g => g._id === editId ? updatedGoal : g));
        // Keep form open with current values after update
        setNewGoal({
          name: updatedGoal.name?.toString() || '',
          target: updatedGoal.target?.toString() || '',
          startingDate: updatedGoal.startingDate ? updatedGoal.startingDate.slice(0,10) : '',
          updatedDate: updatedGoal.updatedDate ? updatedGoal.updatedDate.slice(0,10) : '',
          budget: updatedGoal.budget?.toString() || '',
          saved: updatedGoal.saved?.toString() || ''
        });
        setSuccessMsg('Updated!');
      } else {
        const res = await axios.post('https://s75-dhanyalakshmi-capstone-balancebuddy-7gi5.onrender.com/api/goal', goalToSubmit);
        const newAddedGoal = {
          ...res.data,
          budget: Number(res.data.budget),
          saved: Number(res.data.saved)
        };
        setGoals(prev => [...prev, newAddedGoal]);
        setShowForm(false);
      }

      // Reset form after submit
      if (!isEditing) {
        setNewGoal({ name: '', target: '', startingDate: '', updatedDate: '', budget: '', saved: '' });
      }

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
        await axios.delete(`https://s75-dhanyalakshmi-capstone-balancebuddy-7gi5.onrender.com/api/goal/${id}`);
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
      {successMsg && (
        <div
          style={{
            backgroundColor: '#e6f7ea',
            color: '#237804',
            border: '1px solid #b7eb8f',
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '12px',
            fontWeight: 600
          }}
        >
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fff1f0',
            color: '#a8071a',
            border: '1px solid #ffa39e',
            padding: '8px 12px',
            borderRadius: '8px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{errorMsg}</span>
          <button
            onClick={fetchGoals}
            style={{
              marginLeft: '12px',
              background: '#a8071a',
              color: '#fff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

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

      {loading && <div>Loading...</div>}
      <div className="goal-cards-grid">
        {goals.map(goal => {
          const rawPct = goal.budget ? (Number(goal.saved) / Number(goal.budget)) * 100 : 0;
          const pctLabel = rawPct.toFixed(1);
          const rem = (Number(goal.budget) || 0) - (Number(goal.saved) || 0);

          const idDerived = getObjectIdDate(goal._id);
          const startRaw = goal.startingDate || goal.createdAt || idDerived;
          const startDate = startRaw ? new Date(startRaw) : null;
          const updatedExplicitRaw = goal.updatedDate || null; // only use explicit updatedDate for label
          const updatedExplicitDate = updatedExplicitRaw ? new Date(updatedExplicitRaw) : null;
          const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
          const endForDuration = isValidDate(updatedExplicitDate) ? updatedExplicitDate : new Date();
          const durationDays = isValidDate(startDate)
            ? Math.max(0, Math.ceil((endForDuration - startDate) / (1000 * 60 * 60 * 24)))
            : (goal.target ? Number(goal.target) : 0);
          return (
            <div className="goal-card" key={goal._id}>
              <h5>{goal.name}</h5>
              <small>
                Duration: {durationDays} days | Started: {isValidDate(startDate) ? startDate.toLocaleDateString() : 'N/A'} | Updated: {isValidDate(updatedExplicitDate) ? updatedExplicitDate.toLocaleDateString() : 'N/A'}
              </small>
              <small>
                Budget: ₹{(goal.budget || 0).toLocaleString()} | Saved: ₹{(goal.saved || 0).toLocaleString()}
              </small>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, rawPct)).toFixed(1)}%`,
                    minWidth: rawPct > 0 && rawPct < 1 ? '4px' : undefined
                  }}
                />
              </div>
              <small>{pctLabel}% Completed</small>
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
