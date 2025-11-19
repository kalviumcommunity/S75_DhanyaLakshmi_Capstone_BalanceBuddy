import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/addGoalPopup.css';

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
    console.log('Submitting formData:', formData);

    try {
      await axios.post(
        'https://s75-dhanyalakshmi-capstone-balancebuddy.onrender.com/api/goal',
        formData,
        { withCredentials: true }  // IMPORTANT FIX
      );

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
