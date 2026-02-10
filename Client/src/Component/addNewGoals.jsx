import React, { useState } from 'react';
import api from '../utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import '../styles/AddGoalPopup.css';

const AddNewGoal = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    target: '',
    startingDate: '',
    updatedDate: '',
    budget: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Coerce numeric fields and ensure optional fields have sensible defaults
    const payload = {
      name: formData.name,
      target: formData.target !== '' ? Number(formData.target) : null,
      startingDate: formData.startingDate || undefined,
      updatedDate: formData.updatedDate || new Date().toISOString(),
      budget: formData.budget !== '' ? Number(formData.budget) : null,
      saved: 0
    };

    console.log('Submitting goal payload:', payload);

    try {
      await api.post('/goal', payload);
      navigate('/family/goals');
    } catch (err) {
      console.error('Error submitting new goal:', err);
      alert(err.response?.data?.message || 'Unknown error');
    }
  };

  return (
    <div className="add-goal-popup">
      <h3>
        Add New Goals 
        <span className="popup-close" onClick={() => navigate(-1)}>✖</span>
      </h3>

      <form onSubmit={handleSubmit}>
        <label>Name:</label>
        <input name="name" onChange={handleChange} required />

        <label>Target:</label>
        <input name="target" type="tel" onChange={handleChange} required />

        <label>Starting Date:</label>
        <input name="startingDate" type="date" onChange={handleChange} required />

        <label>Updated Date:</label>
        <input name="updatedDate" type="date" onChange={handleChange} required />

        <label>Budget:</label>
        <input name="budget" type="tel" onChange={handleChange} required />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default AddNewGoal;
