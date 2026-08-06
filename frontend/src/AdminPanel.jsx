import { useState, useEffect } from 'react';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Track which user is being edited
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  });

  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://localhost:8000/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Open Modal for Creating
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '', email: '', password: '', password_confirmation: '', role: 'user'
    });
    setShowModal(true);
  };

  // Open Modal for Editing
  const openEditModal = (user) => {
    setEditingUser(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password is empty for edit
      password_confirmation: '',
      role: user.role || 'user'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    
    // Determine URL and Method based on whether we are editing or creating
    const url = editingUser 
      ? `http://localhost:8000/api/users/${editingUser}` 
      : 'http://localhost:8000/api/register';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingUser ? 'User updated successfully!' : 'User created successfully!');
        setFormData({ name: '', email: '', password: '', password_confirmation: '', role: 'user' });
        setShowModal(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert('Error: ' + JSON.stringify(errorData.errors || errorData.message));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to server.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:8000/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setUsers(users.filter(user => user.id !== id));
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server.');
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Admin Panel - User Management</h1>
      <p>Manage system users here.</p>
      
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={openCreateModal} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          + Create New User
        </button>
        <input 
          type="text" 
          placeholder="Search users..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px 12px', width: '250px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }}
        />
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #555', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Name</th>
              <th style={{ padding: '10px' }}>Email</th>
              <th style={{ padding: '10px' }}>Role</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #444' }}>
                <td style={{ padding: '10px' }}>{user.id}</td>
                <td style={{ padding: '10px' }}>{user.name}</td>
                <td style={{ padding: '10px' }}>{user.email}</td>
                <td style={{ padding: '10px' }}>{user.role || 'user'}</td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => openEditModal(user)} style={{ marginRight: '10px', padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDeleteUser(user.id)} style={{ color: 'red', padding: '4px 8px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* CREATE/EDIT USER MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: '#1e1e1e', padding: '30px', borderRadius: '8px', width: '400px',
            border: '1px solid #555'
          }}>
            <h2 style={{ marginTop: 0 }}>{editingUser ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }} />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }} />
              </div>
              {!editingUser && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required
                      style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }} />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password</label>
                    <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required
                      style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }} />
                  </div>
                </>
              )}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Role</label>
                <select name="role" value={formData.role} onChange={handleChange}
                  style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: '8px 16px', background: '#555', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;