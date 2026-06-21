import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-msg">⚠ {error}</div>}
          {message && <div style={{ color: 'green', marginBottom: '10px', fontSize: '14px', background: '#d4edda', padding: '10px', borderRadius: '4px' }}>{message}</div>}

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? '⏳ Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
