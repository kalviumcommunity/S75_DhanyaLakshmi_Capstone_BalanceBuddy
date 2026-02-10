import React from 'react';
import { FaUser, FaPlus } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/sideBar.css'; // Ensure your styles are here

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="sidebar-overlay">
      <div className="sidebar-content">
        {/* Back to Home */}
        <Link to="/home" className="back-link">← Back to Home</Link>

        {/* Navigation Buttons */}
        <button
          className="sidebar-btn pink"
          onClick={() => navigate('/family')}
        >
          Family Budget Dashboard
        </button>

        <button className="sidebar-btn violet">≪ Family Transaction</button>
        <button className="sidebar-btn blue">📈 Saving Goals</button>
        <button className="sidebar-btn green"><FaPlus /> Add New Goals</button>
        <button className="sidebar-btn red"><FaPlus /> Add Income</button>
        <button className="sidebar-btn light-blue"><FaPlus /> Add Expense</button>
        <button className="sidebar-btn light-pink"><FaUser /> Profile</button>
      </div>
    </div>
  );
};

export default Sidebar;
