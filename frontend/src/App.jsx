import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import SalaryManager from './SalaryManager';
import AuditLogs from './AuditLogs';

const API = 'http://127.0.0.1:8000/api';

function Layout({ current, children, role }) {
  const link = (active) => ({ color: active ? '#2563eb' : '#64748b', fontWeight: active ? '600' : '400', textDecoration: 'none' });
  return (
    <div style={{ backgroundColor: '#f4f7fa', minHeight: '100vh' }}>
      <nav style={{ padding: '15px 30px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px' }}>
        <Link to="/dashboard" style={link(current === 'dashboard')}>Dashboard</Link>
        {role === 'admin' && <Link to="/admin" style={link(current === 'admin')}>Admin Panel</Link>}
        <Link to="/salary" style={link(current === 'salary')}>Salary</Link>
        {role === 'admin' && <Link to="/audit-logs" style={link(current === 'audit')}>Audit Logs</Link>}
      </nav>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const token = localStorage.getItem('authToken');

  const fetchUsers = async () => {
    try {
      const res = await fetch(API + '/users', {
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : (data.data || data.users || []));
      } else {
        console.error('Could not load users, status:', res.status);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role || 'user' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = editingId !== null;
    try {
      const body = isEdit
        ? { name: formData.name, email: formData.email, role: formData.role, ...(formData.password ? { password: formData.password } : {}) }
        : { ...formData, password_confirmation: formData.password };

      const res = await fetch(API + (isEdit ? '/users/' + editingId : '/register'), {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      if (res.ok) {
        alert(isEdit ? 'User updated successfully!' : 'User created successfully!');
        setShowModal(false);
        fetchUsers();
      } else {
        try { alert('Error: ' + (JSON.parse(text).message || 'Request failed')); }
        catch (e2) { console.error(text); alert('Server error — check console.'); }
      }
    } catch (error) {
      alert('Error connecting to server.');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm('Delete ' + user.name + ' (' + user.email + ')?')) return;
    try {
      const res = await fetch(API + '/users/' + user.id, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      });
      if (res.ok) { alert('User deleted.'); fetchUsers(); }
      else alert('Delete failed (HTTP ' + res.status + ')');
    } catch (error) { alert('Error connecting to server.'); }
  };

  const filteredUsers = users.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Panel - User Management</h1>
        <button onClick={openCreate} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Create New User</button>
      </div>

      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '10px 12px', width: '300px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <tr>
            <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
            <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px' }}>{user.id}</td>
              <td style={{ padding: '12px' }}>{user.name}</td>
              <td style={{ padding: '12px' }}>{user.email}</td>
              <td><span style={{ background: user.role === 'admin' ? '#fef3c7' : '#eff6ff', color: user.role === 'admin' ? '#d97706' : '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>{user.role || 'user'}</span></td>
              <td>
                <button onClick={() => openEdit(user)} style={{ marginRight: '10px', padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(user)} style={{ padding: '4px 8px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#ffffff', padding: '30px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0, color: '#1e293b' }}>{editingId ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input name="name" placeholder="Name" value={formData.name} onChange={handleChange} required style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input name="password" type="password" placeholder={editingId ? 'New password (leave blank to keep current)' : 'Password'} value={formData.password} onChange={handleChange} required={!editingId} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <select name="role" value={formData.role} onChange={handleChange} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{editingId ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const isLoggedIn = !!localStorage.getItem('authToken');
  const [role, setRole] = useState(localStorage.getItem('userRole') || '');

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    if (!t) return;
    fetch(API + '/user', {
      headers: { Authorization: 'Bearer ' + t, Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.user) {
          localStorage.setItem('userRole', d.user.role || 'user');
          setRole(d.user.role || 'user');
        }
      })
      .catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={isLoggedIn ? <Layout current="dashboard" role={role}><Dashboard /></Layout> : <Navigate to="/" />} />
        <Route path="/admin" element={!isLoggedIn ? <Navigate to="/" /> : role === 'user' ? <Navigate to="/dashboard" /> : <Layout current="admin" role={role}><AdminPanel /></Layout>} />
        <Route path="/salary" element={isLoggedIn ? <Layout current="salary" role={role}><SalaryManager /></Layout> : <Navigate to="/" />} />
        <Route path="/audit-logs" element={!isLoggedIn ? <Navigate to="/" /> : role === 'user' ? <Navigate to="/dashboard" /> : <Layout current="audit" role={role}><AuditLogs /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;