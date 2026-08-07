import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';

// --- SALARY MANAGEMENT UI ---
function SalaryManager() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Salary Management</h1>
      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Form Section */}
        <div style={{ background: '#ffffff', padding: '25px', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#1e293b', marginTop: 0 }}>Add Salary Record</h3>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select style={{ padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <option>Select Employee</option>
              <option>John Doe</option>
              <option>Sarah Connor</option>
            </select>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input placeholder="Month" style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input placeholder="Year" style={{ flex: 1, padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            </div>
            <input placeholder="Basic Salary" type="number" style={{ padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Housing Allowance" type="number" style={{ padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              <input placeholder="Transport" type="number" style={{ padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
            </div>
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '10px', paddingTop: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>Deductions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="PAYE Tax" type="number" style={{ padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
                <input placeholder="NSSF" type="number" style={{ padding: '10px', background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '12px', borderRadius: '6px', marginTop: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ color: '#1e293b' }}>Gross: <strong>$0.00</strong></span>
              <span style={{ color: '#1e293b' }}>Net: <strong style={{ color: '#2563eb' }}>$0.00</strong></span>
            </div>
            <button style={{ padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Save Salary Record</button>
          </form>
        </div>

        {/* List Section */}
        <div>
          <h3 style={{ color: '#1e293b' }}>Recent Salary Records</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Employee</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Month</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Net Pay</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', color: '#1e293b' }}>John Doe</td>
                  <td style={{ padding: '12px', color: '#1e293b' }}>August 2026</td>
                  <td style={{ padding: '12px', color: '#2563eb', fontWeight: 'bold' }}>$111,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- AUDIT LOGS UI ---
function AuditLogs() {
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Audit Logs</h1>
      <p style={{ color: '#64748b' }}>Record of every action performed in the system.</p>
      
      <div style={{ marginTop: '20px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#ffffff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date/Time</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Action</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Module</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '12px', color: '#1e293b' }}>07/08/2026, 12:34 PM</td>
              <td style={{ padding: '12px', color: '#1e293b' }}>Test User</td>
              <td style={{ padding: '12px', color: '#dc2626', fontWeight: 'bold' }}>Deleted</td>
              <td style={{ padding: '12px', color: '#1e293b' }}>Employee</td>
              <td style={{ padding: '12px', color: '#64748b' }}>Deleted employee: Vero Veve</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- ADMIN PANEL UI ---
function AdminPanel() { 
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Panel</h1>
        <button style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Create New User</button>
      </div>
      
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <input type="text" placeholder="Search users..." style={{ padding: '10px 12px', width: '300px', border: '1px solid #e2e8f0', borderRadius: '6px' }} />
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>Test User</td>
            <td>test@example.com</td>
            <td><span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>Admin</span></td>
            <td>
              <button style={{ marginRight: '10px', padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
              <button style={{ padding: '4px 8px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// --- SIDEBAR LAYOUT ---
function Layout({ children }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const linkStyle = (path) => ({
    color: currentPath === path ? '#2563eb' : '#64748b',
    fontWeight: currentPath === path ? '600' : '400',
    textDecoration: 'none',
    padding: '10px 15px',
    borderRadius: '6px',
    backgroundColor: currentPath === path ? '#eff6ff' : 'transparent',
    display: 'block',
    marginBottom: '5px',
    transition: '0.2s'
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fa' }}>
      <div style={{ width: '220px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', padding: '30px 20px', height: '100vh', position: 'sticky', top: 0 }}>
        <h3 style={{ margin: '0 0 30px 0', color: '#1e293b', fontSize: '20px' }}>EMS Admin</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
          <Link to="/admin" style={linkStyle('/admin')}>Admin Panel</Link>
          <Link to="/salary" style={linkStyle('/salary')}>Salary</Link>
          <Link to="/audit-logs" style={linkStyle('/audit-logs')}>Audit Logs</Link>
        </div>
      </div>
      <div style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {children}
      </div>
    </div>
  );
}

// --- MAIN APP ---
function App() {
  const token = localStorage.getItem('authToken');
  const isLoggedIn = !!token;
  const isAdmin = true; 

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={isLoggedIn ? <Layout><Dashboard /></Layout> : <Navigate to="/" />} />
        <Route path="/admin" element={isLoggedIn && isAdmin ? <Layout><AdminPanel /></Layout> : <Navigate to="/dashboard" />} />
        <Route path="/salary" element={isLoggedIn ? <Layout><SalaryManager /></Layout> : <Navigate to="/" />} />
        <Route path="/audit-logs" element={isLoggedIn ? <Layout><AuditLogs /></Layout> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;