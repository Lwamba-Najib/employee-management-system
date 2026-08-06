import { useState, useEffect } from 'react';

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for the Create User Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_Confirmation: '',
    role: 'user'
  });

  // Fetch users on load
  useEffect(() => {
    fetchUsers();
  }, []);

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

  // Handle input changes in the modal
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
    const handleCreateUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('User created successfully!');

        // 1. Reset form data 
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          password_confirmation: '', 
          role: 'user' 
        });

        // 2. Close the modal
        setShowModal(false);

        // 3. (VERY IMPORTANT) wait a tiny fraction of a second, then fetch users
        setTimeout(() => {
          fetchUsers();
        }, 100);
      
      } else {
        const errorData = await response.json();
        alert('Error: ' + JSON.stringify(errorData.errors || errorData.message));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to connect to server.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Admin Panel - User Management</h1>
      <p>Manage system users here.</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 20px', cursor: 'pointer', marginBottom: '20px' }}
        >
          + Create New User
        </button>

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
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
          {users && users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #444' }}>
                <td style={{ padding: '10px' }}>{user.id}</td>
                <td style={{ padding: '10px' }}>{user.name}</td>
                <td style={{ padding: '10px' }}>{user.email}</td>
                <td style={{ padding: '10px' }}>{user.role || 'user'}</td>
                <td style={{ padding: '10px' }}>
                  <button style={{ marginRight: '10px', padding: '4px 8px' }}>Edit</button>
                  <button
                  onClick={() => handleDeleteUser(user.id)}
                  style={{ color: 'red', padding: '4px 8px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                No users found in the database.
              </td>
            </tr>
          )}
        </tbody>
          </table>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: '#1e1e1e', padding: '30px', borderRadius: '8px', width: '400px',
            border: '1px solid #555'
          }}>
            <h2 style={{ marginTop: 0 }}>Create New User</h2>
            <form onSubmit={handleCreateUser}>
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
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required
                  style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }} />
                </div>

                {/* --- NEW PASSWORD CONFIRMATION INPUT --- */}
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Confirm Password</label>
                <input 
                  type="password" 
                  name="password_confirmation" 
                  value={formData.password_confirmation} 
                  onChange={handleChange} 
                  required
                  style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }} 
                />
              </div>
              {/* ----------------------------------------------------- */}

              {/* --- EXISTING ROLE DROPDOWN --- */}
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
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

    // Handle User Deletion
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) {
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:8000/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // 1. Show a success message
        alert('User deleted successfully!');

        // 2. Force the table to refresh by calling fetchUsers() right away
        fetchUsers();

        // 3. (Failsafe) If fetchUsers fails, reload the page after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert('Failed to delete user.');
      }
    }
     catch (error) {
      console.error('Error:', error);
      alert('Error connecting to server.');
     }
  };
}

export default AdminPanel;