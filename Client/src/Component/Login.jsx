import React, { useState } from 'react';
import '../Styles/login.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../utils/axiosConfig';



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
        console.log('Attempting to log in with:', { email: formData.email });
        
        // Use the API instance for the login request
        const response = await api.post('/login', {
          mail: formData.email,  // Using 'mail' to match backend field name
          password: formData.password
        });

        console.log('Login successful, response:', response.data);
        
        if (response.data.token) {
          // Store token in localStorage
          localStorage.setItem('authToken', response.data.token);
          
          // Set token in cookies with secure flag if in production
          const isProduction = process.env.NODE_ENV === 'production';
          const secureFlag = isProduction ? '; Secure' : '';
          document.cookie = `token=${response.data.token}; path=/; max-age=${15 * 60 * 60}${secureFlag}`;
          
          console.log('Authentication tokens stored successfully');
          setMessage('Login successful! Redirecting...');
          
          // Redirect after a short delay
          setTimeout(() => navigate('/home'), 1000);
        } else {
          console.warn('Login successful but no token received');
          setMessage('Login successful, but no authentication token received');
        }
      } catch (err) {
        console.error('Login error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          headers: err.response?.headers
        });
        
        const errorMessage = err.response?.data?.message || 
                           err.response?.data?.error || 
                           'Failed to connect to the server. Please try again.';
        setMessage(errorMessage);
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
