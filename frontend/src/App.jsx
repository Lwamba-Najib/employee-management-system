import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';

// Placeholder Components
function AdminPanel() { 
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Panel</h1>
        <button style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>+ Create New User</button>
      </div>
      
      {/* Search Bar */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search users..." 
          style={{ padding: '10px 12px', width: '300px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
        />
      </div>

      {/* Users Table */}
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
function SalaryManager() { return <div style={{ padding: '20px' }}><h1>Salary Management</h1><p>Payroll module coming soon.</p></div>; }
function AuditLogs() { return <div style={{ padding: '20px' }}><h1>Audit Logs</h1><p>System logs coming soon.</p></div>; }

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
      {/* LEFT SIDEBAR - We will change these colors next */}
      <div style={{ 
        width: '220px', 
        backgroundColor: '#ffffff', 
        borderRight: '1px solid #e2e8f0', 
        padding: '30px 20px', 
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0
      }}>
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