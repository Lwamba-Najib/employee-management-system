import { useState, useEffect } from 'react';

// MOCK DATA (This will disappear once the backend is fixed)
const mockEmployees = [
  { id: 1, first_name: "Ramba", last_name: "Alpha", email: "ramba@company.com", position: "Software Engineer", department: "IT", employee_status: "Active", salary: 95000 },
  { id: 2, first_name: "Sarah", last_name: "Connor", email: "sarah@skynet.com", position: "Senior Developer", department: "IT", employee_status: "Active", salary: 120000 },
  { id: 3, first_name: "Najib", last_name: "Best", email: "najib@clear.com", position: "Desk Help", department: "IT", employee_status: "Active", salary: 10000 },
  { id: 4, first_name: "Vero", last_name: "Veve", email: "vero@chat.com", position: "IT Support", department: "IT", employee_status: "Active", salary: 10000 },
];

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_employees: 4,
    active_employees: 4,
    total_users: 1,
    monthly_payroll: 235000,
  });

  useEffect(() => {
    // We are using mock data for now while the backend is being fixed
    setEmployees(mockEmployees);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Employee Dashboard</h1>
        <button onClick={handleLogout} className="btn-danger">Logout</button>
      </div>

      {/* STATS CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Employees</h4>
          <div className="number">{stats.total_employees}</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#4CAF50' }}>
          <h4>Active Employees</h4>
          <div className="number" style={{ color: '#4CAF50' }}>{stats.active_employees}</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#2563eb' }}>
          <h4>Total Users</h4>
          <div className="number" style={{ color: '#2563eb' }}>{stats.total_users}</div>
        </div>
        <div className="stat-card" style={{ borderColor: '#ea580c' }}>
          <h4>Monthly Payroll</h4>
          <div className="number" style={{ color: '#ea580c' }}>${stats.monthly_payroll.toLocaleString()}</div>
        </div>
      </div>

      {loading ? (
        <p>Loading employees...</p>
      ) : (
        <div>
          <h2>Employee List</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Salary</th>
                <th>Status</th>
              </tr>
            </thead>
                        <tbody>
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td>{emp.first_name} {emp.last_name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.position}</td>
                  <td>${emp.salary.toLocaleString()}</td>
                  <td>
                    <span style={{ color: emp.employee_status === 'Active' ? '#4CAF50' : '#dc2626', fontWeight: 'bold' }}>
                      {emp.employee_status}
                    </span>
                  </td>
                  {/* Add the Actions column here */}
                  <td>
                    <button 
                      style={{ marginRight: '10px', padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => alert('Edit button clicked for ' + emp.first_name)}
                    >
                      Edit
                    </button>
                    <button 
                      style={{ padding: '4px 8px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}
                      onClick={() => {
                        if(window.confirm(`Are you sure you want to permanently delete ${emp.first_name} ${emp.last_name}?`)) {
                          // We will connect this to the backend later
                          setEmployees(employees.filter(e => e.id !== emp.id));
                          alert('Employee permanently deleted (Mock)');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;