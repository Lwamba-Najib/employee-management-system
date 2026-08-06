import { useState, useEffect } from 'react';

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const response = await fetch('http://localhost:8000/api/employees', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
        console.log("Fetched employees:", data); // Check your browser console to see this!
      } else {
        console.error('Failed to fetch employees');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Employee Dashboard</h1>
        <div>
          <button 
            onClick={fetchEmployees}
            style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
          >
            Refresh Data
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </div>
      
      <p>Welcome! You are logged in.</p>

      {loading ? (
        <p>Loading employees...</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <h2>Employee List</h2>
          {employees.length === 0 ? (
            <p>No employees found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #555', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Position</th>
                  <th style={{ padding: '10px' }}>Salary</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ padding: '10px' }}>{emp.first_name} {emp.last_name}</td>
                    <td style={{ padding: '10px' }}>{emp.email}</td>
                    <td style={{ padding: '10px' }}>{emp.position}</td>
                    <td style={{ padding: '10px' }}>${emp.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;