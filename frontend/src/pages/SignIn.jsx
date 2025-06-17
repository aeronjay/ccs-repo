import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/SignIn.css';

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual API call
      console.log('Sign in attempt:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For now, just redirect based on email (you'll replace this with actual authentication)
      if (formData.email.includes('admin')) {
        // Admin user
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userEmail', formData.email);
        navigate('/admin-dashboard');
      } else {
        // Regular user
        localStorage.setItem('userRole', 'user');
        localStorage.setItem('userEmail', formData.email);
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h1>CCS Research</h1>
          <h2>Sign in to your account</h2>
          <p>Welcome back! Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-options">
            <label className="checkbox-container">
              <input type="checkbox" />
              <span className="checkmark"></span>
              Remember me
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            className="signin-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account? 
            <Link to="/register" className="register-link"> Create one here</Link>
          </p>
        </div>

        <div className="back-to-home">
          <Link to="/" className="back-link">← Back to Research Repository</Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
