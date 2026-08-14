import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Forgot password flow
  const [showResetForm, setShowResetForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', data.user?.role || 'user');
        setMessage('Login successful! Redirecting...');
        window.location.hash = '#/dashboard';
        window.location.reload();
      } else {
        setMessage(`Error: ${data.message || 'Invalid credentials'}`);
      }
    } catch (err) {
      setMessage('Error connecting to server.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');

    try {
      const res = await fetch(`${API}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (res.ok) {
        setCodeSent(true);
        if (data.reset_code) {
          setResetMessage(`Reset code: ${data.reset_code}`);
        } else {
          setResetMessage('Reset code sent to your email.');
        }
      } else {
        setCodeSent(false);
        setResetMessage(`Error: ${data.message || 'Could not send reset code'}`);
      }
    } catch (err) {
      setCodeSent(false);
      setResetMessage('Error connecting to server.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');

    if (newPassword !== confirmPassword) {
      setResetMessage('Error: Passwords do not match');
      return;
    }

    try {
      const res = await fetch(`${API}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail,
          token: resetCode,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResetMessage('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowResetForm(false);
          setForgotEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setResetMessage('');
        }, 3000);
      } else {
        setResetMessage(`Error: ${data.message || 'Could not reset password'}`);
      }
    } catch (err) {
      setResetMessage('Error connecting to server.');
    }
  };

  const inputStyle = {
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    width: '100%',
  };

  const buttonStyle = {
    padding: '10px',
    fontSize: '16px',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      textAlign: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h2>Employee Login</h2>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>
          Login
        </button>
      </form>

      <p style={{ marginTop: '15px' }}>
        <button
          onClick={() => setShowResetForm(!showResetForm)}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {showResetForm ? 'Back to Login' : 'Forgot password?'}
        </button>
      </p>

      {message && (
        <p style={{
          marginTop: '20px',
          color: message.startsWith('Error') ? '#dc2626' : '#16a34a',
        }}>
          {message}
        </p>
      )}

      {showResetForm && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: '#f8fafc',
          borderRadius: '8px',
          textAlign: 'left',
        }}>
          <h3 style={{ marginTop: 0 }}>Reset Password</h3>

          {!codeSent ? (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '14px', color: '#64748b' }}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                style={inputStyle}
              />
              <button type="submit" style={buttonStyle}>
                Send Reset Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '14px', color: '#64748b' }}>Email Address</label>
              <input
                type="email"
                value={forgotEmail}
                disabled
                style={{ ...inputStyle, background: '#e2e8f0' }}
              />

              <label style={{ fontSize: '14px', color: '#64748b' }}>Reset Code (6 digits)</label>
              <input
                type="text"
                placeholder="123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                maxLength={6}
                style={inputStyle}
              />

              <label style={{ fontSize: '14px', color: '#64748b' }}>New Password</label>
              <input
                type="password"
                placeholder="Min 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                style={inputStyle}
              />

              <label style={{ fontSize: '14px', color: '#64748b' }}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
              />

              <button type="submit" style={buttonStyle}>
                Reset Password
              </button>
            </form>
          )}

          {resetMessage && (
            <p style={{
              marginTop: '15px',
              color: resetMessage.startsWith('Error') ? '#dc2626' : '#16a34a',
              fontSize: '14px',
            }}>
              {resetMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Login;