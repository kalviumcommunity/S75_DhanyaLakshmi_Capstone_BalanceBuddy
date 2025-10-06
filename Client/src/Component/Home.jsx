import React from 'react';
import '../Styles/Home.css'; 
import { useNavigate } from 'react-router-dom';


const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">
          <div className="logo-icon">B</div>
          <span>BalanceBuddy</span>
        </div>
      </header>

      <main className="home-main">
        <div className='divTitle'>
            <h1 className='title'>Balance</h1>
            <h1>Buddy</h1>
        </div>
        
        <p>
          Your personal finance companion to help track expenses, set budgets,
          and achieve your financial goals with ease. Choose the module that fits your needs.
        </p>

        <div className="card-container">
          <div className="card purple" onClick={() => navigate('/family')}>
            <div className="icon">👪</div>
            <h3>Family Budget Tracker</h3>
            <p>Manage your family expenses, set savings goals, and track your financial progress together.</p>
            <button>Get Started →</button>
          </div>

          <div className="card green" onClick={() => navigate('/student')}>
            <div className="icon">🎓</div>
            <h3>Student Budget Tracker</h3>
            <p>Track your daily spending, manage upcoming bills, and build saving habits with fun challenges.</p>
            <button>Get Started →</button>
          </div>
        </div>
      </main>

      <footer className="home-footer">
        BalanceBuddy - Keep your budget in balance
      </footer>
    </div>
  );
};

export default Home;
