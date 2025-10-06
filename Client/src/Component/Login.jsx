import React, { useState } from 'react';
import '../styles/login.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const validate = () => {
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    return errors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    setMessage('');

    if (Object.keys(validationErrors).length === 0) {
      try {
        const res = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
            
          },
          credentials: 'include', // Important for cookies
          body: JSON.stringify({
            mail: formData.email,
            password: formData.password
          })
        });

        if (res.ok) {
          const data = await res.json();
          console.log(data)
          setMessage('Login successful!');
          // redirect or do something on login
          navigate('/home')
        } else {
          const errData = await res.json();
          setMessage(errData.mess || 'Login failed');
        }
      } catch (err) {
        setMessage('Network error');
        console.error(err);
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Welcome Back</h2>
        <p>We've missed you buddy</p>

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span className="error">{errors.email}</span>}

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <span className="error">{errors.password}</span>}

        <button type="submit">Log In</button>

        <div className="or-divider">
          <hr />
          <span>or</span>
          <hr />
        </div>

        <p className='nextLine'>
          Don't have an account? <Link to="/">Sign Up</Link>
        </p>

        <p className={`message ${message.includes('successful') ? 'success' : 'error'}`}>{message}</p>

      </form>

      
    </div>
  );
};

export default Login;
