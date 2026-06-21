import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [tokenError, setTokenError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setEmailSent(true); // Token input box show करा
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    const trimmedToken = resetToken.trim();
    if (!trimmedToken) {
      setTokenError('Please enter the token from your email.');
      return;
    }
    // Token घेऊन reset password page वर navigate करा
    navigate(`/reset-password/${trimmedToken}`);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your email to receive a reset token</p>

        {!emailSent ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="error-msg">⚠ {error}</div>}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? '⏳ Sending...' : 'Send Reset Token'}
            </button>
          </form>
        ) : (
          <div>
            {/* Success message */}
            <div style={{
              color: '#155724',
              marginBottom: '20px',
              fontSize: '14px',
              background: '#d4edda',
              padding: '12px 14px',
              borderRadius: '8px',
              border: '1px solid #c3e6cb'
            }}>
              ✅ {message} — आपल्या email मध्ये <strong>Reset Token</strong> पाठवला आहे.
            </div>

            {/* Token input */}
            <div style={{
              background: 'rgba(108, 99, 255, 0.08)',
              border: '1px dashed #6c63ff',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <p style={{ fontSize: '13px', color: '#a78bfa', marginBottom: '10px', fontWeight: '600' }}>
                📧 Email मधून Token Copy करा आणि इथे Paste करा:
              </p>
              <form onSubmit={handleTokenSubmit}>
                {tokenError && (
                  <div className="error-msg" style={{ marginBottom: '8px' }}>⚠ {tokenError}</div>
                )}
                <input
                  className="form-input"
                  type="text"
                  value={resetToken}
                  onChange={(e) => { setResetToken(e.target.value); setTokenError(''); }}
                  placeholder="Email मधील token येथे paste करा..."
                  style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '10px' }}
                />
                <button type="submit" className="btn btn-primary btn-full">
                  🔐 Reset Password वर जा
                </button>
              </form>
            </div>

            <p style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}>
              Email नाही मिळाला?{' '}
              <button
                onClick={() => setEmailSent(false)}
                style={{ background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}
              >
                पुन्हा पाठवा
              </button>
            </p>
          </div>
        )}

        <p className="auth-footer">
          Remembered your password?{' '}
          <Link to="/login" className="auth-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
