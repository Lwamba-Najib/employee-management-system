import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [stats, setStats] = useState({ total_employees: 0, active_employees: 0, total_users: 0, monthly_payroll: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '', position: '', 
    salary: '', hire_date: '', employee_number: '', gender: '', department: '', 
    employment_type: 'Permanent', employee_status: 'Active'
  });

  const token = localStorage.getItem('authToken');

  // Fetch Employees with Pagination
  const fetchEmployees = async (page = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/employees?page=${page}&per_page=5`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.data);
        setCurrentPage(data.current_page);
        setLastPage(data.last_page);
      }
    } catch (error) { console.error('Error:', error); } 
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setStatsLoading(false);
      }
    } catch (error) { console.error('Error fetching stats:', error); setStatsLoading(false); }
  };

  useEffect(() => { fetchEmployees(); fetchStats(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData({ first_name: '', last_name: '', email: '', phone_number: '', position: '', salary: '', hire_date: '', employee_number: '', gender: '', department: '', employment_type: 'Permanent', employee_status: 'Active' });
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    setEditingEmployee(emp.id);
    setFormData({ ...emp, profile_photo: null });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataObj = new FormData();
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      formDataObj.append(key, value === null ? '' : value);
    });

    const url = editingEmployee ? `http://127.0.0.1:8000/api/employees/${editingEmployee}` : 'http://127.0.0.1:8000/api/employees';
    
    try {
      const response = await fetch(url, {
        method: editingEmployee ? 'POST' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataObj,
      });
      if (response.ok) {
        setShowModal(false);
        fetchEmployees(currentPage);
        alert(editingEmployee ? 'Employee updated successfully!' : 'Employee created successfully!');
      } else {
        const errorData = await response.json();
        alert('Error: ' + JSON.stringify(errorData.errors || errorData.message));
      }
    } catch (error) { console.error('Error:', error); alert('Failed to connect to server.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this employee?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        fetchEmployees(currentPage);
        alert('Employee deleted successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) { console.error('Error:', error); alert('Error connecting to server.'); }
  };

  const handleLogout = () => { localStorage.removeItem('authToken'); window.location.reload(); };

  // Filter employees based on search term (Client-side)
  const filteredEmployees = employees.filter((emp) =>
    emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employee_number && emp.employee_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Employee Dashboard</h1>
        <div>
          <button onClick={openAddModal} style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}>+ Add Employee</button>
          <button onClick={() => fetchEmployees(1)} style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}>Refresh Data</button>
          <a href="http://127.0.0.1:8000/export-employees" target="_blank" style={{ marginRight: '10px', padding: '8px 16px', background: '#1a73e8', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>📥 Export CSV</a>
          <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {!statsLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px', marginTop: '20px' }}>
          <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #444', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Total Employees</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{stats.total_employees}</div>
          </div>
          <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #4CAF50', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Active Employees</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>{stats.active_employees}</div>
          </div>
          <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #2196F3', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Total Users</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>{stats.total_users}</div>
          </div>
          <div style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px', border: '1px solid #ff9800', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Monthly Payroll</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>${stats.monthly_payroll.toLocaleString()}</div>
          </div>
        </div>
      )}

      {loading ? ( <p>Loading employees...</p> ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2>Employee List</h2>
            <input type="text" placeholder="Search by name, email, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: '8px 12px', width: '300px', background: '#333', border: '1px solid #555', color: 'white', borderRadius: '4px' }} />
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #555', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Emp #</th>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Dept</th>
                  <th style={{ padding: '10px' }}>Position</th>
                  <th style={{ padding: '10px' }}>Salary</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ padding: '10px' }}>{emp.id}</td>
                    <td style={{ padding: '10px' }}>{emp.employee_number || '-'}</td>
                    <td style={{ padding: '10px' }}><Link to={`/employee/${emp.id}`} style={{ color: '#4CAF50', textDecoration: 'underline', cursor: 'pointer' }}>{emp.first_name} {emp.last_name}</Link></td>
                    <td style={{ padding: '10px' }}>{emp.email}</td>
                    <td style={{ padding: '10px' }}>{emp.department || '-'}</td>
                    <td style={{ padding: '10px' }}>{emp.position}</td>
                    <td style={{ padding: '10px' }}>${emp.salary}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: emp.employee_status === 'Active' ? '#4CAF50' : '#ff6b6b', fontWeight: 'bold' }}>
                        {emp.employee_status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => openEditModal(emp)} style={{ marginRight: '5px', padding: '4px 8px', background: '#555', color: 'white', border: 'none', cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDelete(emp.id)} style={{ padding: '4px 8px', background: '#d32f2f', color: 'white', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION CONTROLS */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button 
              onClick={() => fetchEmployees(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{ padding: '8px 16px', background: currentPage === 1 ? '#333' : '#555', color: 'white', border: 'none', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px', color: '#fff' }}>
              Page {currentPage} of {lastPage}
            </span>
            <button 
              onClick={() => fetchEmployees(currentPage + 1)} 
              disabled={currentPage === lastPage}
              style={{ padding: '8px 16px', background: currentPage === lastPage ? '#333' : '#555', color: 'white', border: 'none', cursor: currentPage === lastPage ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ADD/EDIT EMPLOYEE MODAL */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '8px', width: '500px', border: '1px solid #555', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</h2>
            <form onSubmit={handleSubmit}>
              <input name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="email" placeholder="Email" type="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="employee_number" placeholder="Employee #" value={formData.employee_number} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="position" placeholder="Position" value={formData.position} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="department" placeholder="Department" value={formData.department} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="salary" placeholder="Salary" type="number" value={formData.salary} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="hire_date" placeholder="Hire Date (YYYY-MM-DD)" type="date" value={formData.hire_date} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="date_of_birth" placeholder="Date of Birth (YYYY-MM-DD)" type="date" value={formData.date_of_birth || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="physical_address" placeholder="Physical Address" value={formData.physical_address || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input name="supervisor" placeholder="Supervisor" value={formData.supervisor || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              <input type="file" name="profile_photo" onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px', background: '#333', border: '1px solid #555', color: 'white' }} />
              
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <select name="gender" value={formData.gender} onChange={handleChange} style={{ width: '48%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}>
                  <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
                <select name="employment_type" value={formData.employment_type} onChange={handleChange} style={{ width: '48%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}>
                  <option value="Permanent">Permanent</option><option value="Contract">Contract</option><option value="Intern">Intern</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#555', color: 'white', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>{editingEmployee ? 'Update Employee' : 'Create Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;