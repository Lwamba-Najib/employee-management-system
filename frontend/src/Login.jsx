import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [codesent, setCodeSent] = useState (false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const response = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userRole', data.user?.role || 'user');
        setMessage('Login successful! Redirecting...');
        window.location.hash = '#/dashboard';
        window.location.reload();
      } else {
        setMessage('Error: ' + (data.message || 'Invalid credentials'));
      }
    } catch (error) {
      setMessage('Error connecting to server.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    try {
      const response = await fetch(API + '/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ 
          email: forgotEmail,
          token: resentCode}),
      });

      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setForgotMessage(
          data.reset_code
            ? 'Reset code generated. DEV code: ' + data.reset_code
            : 'Reset code sent to your email! Check your inbox.'
        );
      } else {
        setCodeSent(false);
        setForgotMessage('Error: ' + (data.message || 'Could not send reset code'));
      }
    } catch (error) {
      setCodeSent(false);
      setForgotMessage('Error connecting to server.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');

    if (newPassword !== confirmPassword) {
      setForgotMessage('Error: Passwords do not match');
      return;
    }

    try {
      const response = await fetch(API + '/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          token: resetSent,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setForgotMessage('Password reset successful! You can now log in.');
        setTimeout(() => {
          setShowForgot(false);
          setForgotEmail('');
          setResetCode('');
          setNewPassword('');
          setConfirmPassword('');
          setForgotMessage('');
        }, 3000);
      } else {
        setForgotMessage('Error: ' + (data.message || 'Could not reset password'));
      }
    } catch (error) {
      setForgotMessage('Error connecting to server.');
    }
  };

  const inputStyle = { padding: '10px', fontSize: '16px', border: '1px solid #e2e8f0', borderRadius: '6px' };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
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
        <button type="submit" style={{ padding: '10px', fontSize: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Login
        </button>
      </form>

      <p style={{ marginTop: '15px' }}>
        <button
          onClick={() => setShowForgot(!showForgot)}
          style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {showForgot ? 'Back to Login' : 'Forgot password?'}
        </button>
      </p>

      {message && <p style={{ marginTop: '20px', color: message.startsWith('Error') ? '#dc2626' : '#16a34a' }}>{message}</p>}

      {showForgot && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '8px', textAlign: 'left' }}>
          <h3 style={{ marginTop: 0 }}>Reset Password</h3>
          {!codesent ? (
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
              <button type="submit" style={{ padding: '10px', fontSize: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Send Reset Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '14px', color: '#64748b' }}>Email Address</label>
              <input type="email" value={forgotEmail} disabled style={{ ...inputStyle, background: '#e2e8f0' }} />

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

              <button type="submit" style={{ padding: '10px', fontSize: '16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Reset Password
              </button>
            </form>
          )}
          {forgotMessage && <p style={{ marginTop: '15px', color: forgotMessage.startsWith('Error') ? '#dc2626' : '#16a34a', fontSize: '14px' }}>{forgotMessage}</p>}
        </div>
      )}
    </div>
  );
}

export default Login;