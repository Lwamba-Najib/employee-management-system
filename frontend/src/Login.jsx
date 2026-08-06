import { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Logging in...');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        //SUCCESS: Save the token and reload to show Dashboard
        localStorage.setItem('authToken', data.token);
        setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        //FAILURE: Show the actual error message from the backend
        setMessage('Error: ' + (data.message || 'Invalid credentials'));
      }
    } catch (error) {
      setMessage('Error connecting to server. Is the backend running?');
    }
  };

    return (
        <div style={{ maxwidth: '400px', margin: '50px auto', textAllign: 'center' }}>
            <h2>Employee Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: '10px', fontSize: '16px' }}
                />
                <button type="submit" style={{ padding: '10px', fontSize: '16px' }}>
                    Login
                </button>
            </form>
            {message && <p style={{ marginTop: '20px' }}>{message}</p>}
        </div>
    );
}

export default Login;