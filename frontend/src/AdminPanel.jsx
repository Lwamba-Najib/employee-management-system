import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const emptyForm = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'Active',
  password: '',
  password_confirmation: '',
};

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

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null); // 'create' or the user being edited
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('authToken')}`,
  };

  const load = async () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`${API}/users?${params}`, {
      headers: { Authorization: authHeaders.Authorization },
    });

    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => {
    load();
  }, [search, roleFilter, statusFilter]);

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setModal('create');
  };

  const openEdit = (u) => {
    setForm({
      ...emptyForm,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      username: u.username || '',
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      status: u.status || 'Active',
    });
    setError('');
    setModal(u);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const name = `${form.first_name} ${form.last_name}`.trim() || form.username || form.email;
    let res;

    if (modal === 'create') {
      res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...form, name }),
      });
    } else {
      const body = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
      };

      if (form.password) {
        body.password = form.password;
        body.password_confirmation = form.password_confirmation;
      }

      res = await fetch(`${API}/users/${modal.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(body),
      });
    }

    const d = await res.json();

    if (res.ok) {
      setModal(null);
      load();
    } else {
      setError(d.message || (d.errors ? Object.values(d.errors).flat().join(', ') : 'Failed'));
    }
  };

  const toggleStatus = async (u) => {
    const next = (u.status || 'Active') === 'Active' ? 'Inactive' : 'Active';
    if (!confirm(`${next === 'Inactive' ? 'Deactivate' : 'Activate'} ${u.name || u.email}?`)) return;

    await fetch(`${API}/users/${u.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ status: next }),
    });

    load();
  };

  const remove = async (u) => {
    if (!confirm(`Delete ${u.name || u.email}? This cannot be undone.`)) return;

    await fetch(`${API}/users/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: authHeaders.Authorization },
    });

    load();
  };

  const th = {
    textAlign: 'left',
    padding: '10px',
    borderBottom: '2px solid #e2e8f0',
    fontSize: '13px',
    color: '#475569',
  };

  const td = {
    padding: '10px',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '14px',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Admin Panel — User Management</h2>
        <button onClick={openCreate} style={{ ...btn('#1d4ed8'), marginLeft: 'auto' }}>
          + Create New User
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          placeholder="Search name, email, username, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, maxWidth: '320px' }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '140px' }}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '140px' }}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Name</th>
              <th style={th}>Username</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Role</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={td}>{u.id}</td>
                <td style={td}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || u.name}</td>
                <td style={td}>{u.username || '—'}</td>
                <td style={td}>{u.email}</td>
                <td style={td}>{u.phone || '—'}</td>
                <td style={td}>{u.role}</td>
                <td style={td}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: (u.status || 'Active') === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: (u.status || 'Active') === 'Active' ? '#166534' : '#991b1b',
                    }}
                  >
                    {u.status || 'Active'}
                  </span>
                </td>
                <td style={td}>
                  <button onClick={() => openEdit(u)} style={{ ...btn('#64748b'), marginRight: '6px' }}>
                    Edit
                  </button>
                  <button
                    onClick={() => toggleStatus(u)}
                    style={{
                      ...btn((u.status || 'Active') === 'Active' ? '#d97706' : '#16a34a'),
                      marginRight: '6px',
                    }}
                  >
                    {(u.status || 'Active') === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => remove(u)} style={btn('#dc2626')}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="8" style={{ ...td, textAlign: 'center', color: '#64748b' }}>
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
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
            onSubmit={submit}
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '24px',
              width: '420px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3 style={{ marginTop: 0 }}>{modal === 'create' ? 'Create New User' : 'Edit User'}</h3>
            <input
              placeholder="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={inputStyle}
            />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={inputStyle}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <input
              type="password"
              placeholder={modal === 'create' ? 'Password (min 8)' : 'New password (leave blank to keep)'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={modal === 'create'}
              minLength={8}
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              required={modal === 'create'}
              style={inputStyle}
            />
            {error && <p style={{ color: '#dc2626', fontSize: '13px' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setModal(null)} style={btn('#64748b')}>
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

export default AdminPanel;