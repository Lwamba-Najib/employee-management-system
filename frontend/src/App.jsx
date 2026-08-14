import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import SalaryManager from './SalaryManager';
import AuditLogs from './AuditLogs';
import AdminPanel from './AdminPanel';
import Login from './Login';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const inputStyle = {
  padding: '8px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '14px',
  width: '100%',
  boxSizing: 'border-box',
};

const btn = (bg) => ({
  padding: '8px 14px',
  background: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
});

function Shell({ role, children }) {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState('');

  const openProfile = async () => {
    const res = await fetch(`${API}/user`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
    });
    if (res.ok) {
      setProfile((await res.json()).user);
      setShowProfile(true);
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setMsg('');

    const res = await fetch(`${API}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        current_password: pwd.current,
        password: pwd.next,
        password_confirmation: pwd.confirm,
      }),
    });

    const d = await res.json();

    if (res.ok) {
      setMsg('Password changed successfully.');
      setPwd({ current: '', next: '', confirm: '' });
      setTimeout(() => {
        setShowPwd(false);
        setMsg('');
      }, 1500);
    } else {
      setMsg(d.message || 'Failed to change password');
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
    } catch (e) {
      // Ignore logout errors
    }
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin Panel' }] : []),
    { to: '/salary', label: 'Salary' },
    ...(role === 'admin' ? [{ to: '/audit', label: 'Audit Logs' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f7' }}>
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          padding: '12px 24px',
          background: '#1f2937',
        }}
      >
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              color: location.pathname === l.to ? '#60a5fa' : '#e5e7eb',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {l.label}
          </Link>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={openProfile} style={btn('#334155')}>
            My Profile
          </button>
          <button onClick={() => setShowPwd(true)} style={btn('#334155')}>
            Change Password
          </button>
          <button onClick={logout} style={btn('#dc2626')}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>{children}</div>

      {showProfile && profile && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '360px' }}>
            <h3 style={{ marginTop: 0 }}>My Profile</h3>
            <p>
              <b>Name:</b> {profile.name}
            </p>
            {profile.username && (
              <p>
                <b>Username:</b> {profile.username}
              </p>
            )}
            <p>
              <b>Email:</b> {profile.email}
            </p>
            {profile.phone && (
              <p>
                <b>Phone:</b> {profile.phone}
              </p>
            )}
            <p>
              <b>Role:</b> {profile.role}
            </p>
            <p>
              <b>Status:</b> {profile.status || 'Active'}
            </p>
            <button onClick={() => setShowProfile(false)} style={btn('#2563eb')}>
              Close
            </button>
          </div>
        </div>
      )}

      {showPwd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <form
            onSubmit={changePwd}
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '24px',
              width: '360px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <h3 style={{ marginTop: 0 }}>Change Password</h3>
            <input
              type="password"
              placeholder="Current password"
              value={pwd.current}
              onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="New password (min 8)"
              value={pwd.next}
              onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              required
              minLength={8}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              required
              style={inputStyle}
            />
            {msg && (
              <p style={{ color: msg.includes('success') ? '#16a34a' : '#dc2626', fontSize: '13px' }}>
                {msg}
              </p>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPwd(false)} style={btn('#64748b')}>
                Cancel
              </button>
              <button type="submit" style={btn('#2563eb')}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole') || null);
  const [authed, setAuthed] = useState(!!localStorage.getItem('authToken'));

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    fetch(`${API}/user`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const r = d.user.role || 'user';
        setRole(r);
        localStorage.setItem('userRole', r);
        setAuthed(true);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        setAuthed(false);
      });
  }, []);

  const guard = (el) => (localStorage.getItem('authToken') ? el : <Navigate to="/login" />);
  const adminOnly = (el) =>
    localStorage.getItem('authToken') && localStorage.getItem('userRole') === 'admin' ? (
      el
    ) : (
      <Navigate to="/dashboard" />
    );

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={guard(
            <Shell role={role}>
              <Dashboard />
            </Shell>,
          )}
        />
        <Route
          path="/salary"
          element={guard(
            <Shell role={role}>
              <SalaryManager />
            </Shell>,
          )}
        />
        <Route
          path="/admin"
          element={adminOnly(
            <Shell role={role}>
              <AdminPanel />
            </Shell>,
          )}
        />
        <Route
          path="/audit"
          element={adminOnly(
            <Shell role={role}>
              <AuditLogs />
            </Shell>,
          )}
        />
        <Route
          path="*"
          element={<Navigate to={localStorage.getItem('authToken') ? '/dashboard' : '/login'} />}
        />
      </Routes>
    </HashRouter>
  );
}