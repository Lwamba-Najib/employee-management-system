import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import SalaryManager from './SalaryManager';
import AuditLogs from './AuditLogs';
import Login from './Login';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const inputStyle = { padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 14px', background: bg, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' });

function Shell({ role, children }) {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [msg, setMsg] = useState('');

  const openProfile = async () => {
    const res = await fetch(API + '/user', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
    if (res.ok) { setProfile((await res.json()).user); setShowProfile(true); }
  };

  const changePwd = async (e) => {
    e.preventDefault(); setMsg('');
    const res = await fetch(API + '/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({ current_password: pwd.current, password: pwd.next, password_confirmation: pwd.confirm }),
    });
    const d = await res.json();
    if (res.ok) { setMsg('Password changed successfully.'); setPwd({ current: '', next: '', confirm: '' }); setTimeout(() => { setShowPwd(false); setMsg(''); }, 1500); }
    else setMsg(d.message || 'Failed to change password');
  };

  const logout = async () => {
    try { await fetch(API + '/logout', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }); } catch (e) {}
    localStorage.removeItem('authToken'); localStorage.removeItem('userRole');
    window.location.href = '/login';
  };

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin Panel' }] : []),
    { to: '/salary', label: 'Salary' },
    ...(role === 'admin' ? [{ to: '/audit', label: 'Audit Logs' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#eef2f7' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '12px 24px', background: '#1f2937' }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={{ color: location.pathname === l.to ? '#60a5fa' : '#e5e7eb', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>{l.label}</Link>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={openProfile} style={btn('#334155')}>My Profile</button>
          <button onClick={() => setShowPwd(true)} style={btn('#334155')}>Change Password</button>
          <button onClick={logout} style={btn('#dc2626')}>Logout</button>
        </div>
      </nav>

      <div style={{ padding: '24px' }}>{children}</div>

      {showProfile && profile && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '360px' }}>
            <h3 style={{ marginTop: 0 }}>My Profile</h3>
            <p><b>Name:</b> {profile.name}</p>
            {profile.username && <p><b>Username:</b> {profile.username}</p>}
            <p><b>Email:</b> {profile.email}</p>
            {profile.phone && <p><b>Phone:</b> {profile.phone}</p>}
            <p><b>Role:</b> {profile.role}</p>
            <p><b>Status:</b> {profile.status || 'Active'}</p>
            <button onClick={() => setShowProfile(false)} style={btn('#2563eb')}>Close</button>
          </div>
        </div>
      )}

      {showPwd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={changePwd} style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ marginTop: 0 }}>Change Password</h3>
            <input type="password" placeholder="Current password" value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} required style={inputStyle} />
            <input type="password" placeholder="New password (min 8)" value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} required minLength={8} style={inputStyle} />
            <input type="password" placeholder="Confirm new password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} required style={inputStyle} />
            {msg && <p style={{ color: msg.includes('success') ? '#16a34a' : '#dc2626', fontSize: '13px' }}>{msg}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowPwd(false)} style={btn('#64748b')}>Cancel</button>
              <button type="submit" style={btn('#2563eb')}>Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const emptyForm = { first_name: '', last_name: '', username: '', email: '', phone: '', role: 'user', status: 'Active', password: '', password_confirmation: '' };
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // 'create' | user object
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const load = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`${API}/users?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
    if (res.ok) setUsers(await res.json());
  };
  useEffect(() => { load(); }, [search, roleFilter, statusFilter]);

  const openCreate = () => { setForm(emptyForm); setError(''); setModal('create'); };
  const openEdit = (u) => { setForm({ ...emptyForm, first_name: u.first_name || '', last_name: u.last_name || '', username: u.username || '', email: u.email, phone: u.phone || '', role: u.role, status: u.status || 'Active' }); setError(''); setModal(u); };

  const submit = async (e) => {
    e.preventDefault(); setError('');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` };
    const name = `${form.first_name} ${form.last_name}`.trim() || form.username || form.email;
    let res;
    if (modal === 'create') {
      res = await fetch(`${API}/register`, { method: 'POST', headers, body: JSON.stringify({ ...form, name }) });
    } else {
      const body = { first_name: form.first_name, last_name: form.last_name, username: form.username, email: form.email, phone: form.phone, role: form.role, status: form.status };
      if (form.password) { body.password = form.password; body.password_confirmation = form.password_confirmation; }
      res = await fetch(`${API}/users/${modal.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    }
    const d = await res.json();
    if (res.ok) { setModal(null); load(); }
    else setError(d.message || (d.errors ? Object.values(d.errors).flat().join(', ') : 'Failed'));
  };

  const toggleStatus = async (u) => {
    const next = (u.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`${next === 'Inactive' ? 'Deactivate' : 'Activate'} ${u.name || u.email}?`)) return;
    await fetch(`${API}/users/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name || u.email}? This cannot be undone.`)) return;
    await fetch(`${API}/users/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } });
    load();
  };

  const th = { textAlign: 'left', padding: '10px', borderBottom: '2px solid #e2e8f0', fontSize: '13px', color: '#475569' };
  const td = { padding: '10px', borderBottom: '1px solid #e2e8f0', fontSize: '14px' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Admin Panel — User Management</h2>
        <button onClick={openCreate} style={{ ...btn('#1d4ed8'), marginLeft: 'auto' }}>+ Create New User</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input placeholder="Search name, email, username, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, maxWidth: '320px' }} />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '140px' }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, maxWidth: '140px' }}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr><th style={th}>ID</th><th style={th}>Name</th><th style={th}>Username</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Role</th><th style={th}>Status</th><th style={th}>Actions</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={td}>{u.id}</td>
                <td style={td}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || u.name}</td>
                <td style={td}>{u.username || '—'}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.phone || '—'}</td>
                <td style={td}>{u.role}</td>
                <td style={td}>
                  <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', background: (u.status || 'Active') === 'Active' ? '#dcfce7' : '#fee2e2', color: (u.status || 'Active') === 'Active' ? '#166534' : '#991b1b' }}>
                    {u.status || 'Active'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => openEdit(u)} style={{ ...btn('#64748b'), marginRight: '6px' }}>Edit</button>
                  <button onClick={() => toggleStatus(u)} style={{ ...btn((u.status || 'Active') === 'Active' ? '#d97706' : '#16a34a'), marginRight: '6px' }}>
                    {(u.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => remove(u)} style={btn('#dc2626')}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <form onSubmit={submit} style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '420px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{modal === 'create' ? 'Create New User' : 'Edit User'}</h3>
            <input placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} style={inputStyle} />
            <input placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} style={inputStyle} />
            <input placeholder="Username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} style={inputStyle} />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input type="password" placeholder={modal === 'create' ? 'Password (min 8)' : 'New password (leave blank to keep)'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={modal === 'create'} minLength={8} style={inputStyle} />
            <input type="password" placeholder="Confirm password" value={form.password_confirmation} onChange={e => setForm({ ...form, password_confirmation: e.target.value })} required={modal === 'create'} style={inputStyle} />
            {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btn('#64748b')}>Cancel</button>
              <button type="submit" style={btn('#2563eb')}>Save</button>
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
    fetch(API + '/user', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        const r = d.user.role || 'user';
        setRole(r); localStorage.setItem('userRole', r); setAuthed(true);
      })
      .catch(() => { localStorage.removeItem('authToken'); localStorage.removeItem('userRole'); setAuthed(false); });
  }, []);

  const guard = (el) => (authed ? el : <Navigate to="/login" />);
  const adminOnly = (el) => (authed && role === 'admin' ? el : <Navigate to="/dashboard" />);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={guard(<Shell role={role}><Dashboard /></Shell>)} />
        <Route path="/salary" element={guard(<Shell role={role}><SalaryManager /></Shell>)} />
        <Route path="/admin" element={adminOnly(<Shell role={role}><AdminPanel /></Shell>)} />
        <Route path="/audit" element={adminOnly(<Shell role={role}><AuditLogs /></Shell>)} />
        <Route path="*" element={<Navigate to={authed ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
  );
}