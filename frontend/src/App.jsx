import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';
import EmployeeProfile from './EmployeeProfile';
import SalaryManager from './SalaryManager';
import AuditLogs from './AuditLogs'; // <--- Import added here

function App() {
  const token = localStorage.getItem('authToken');
  const isLoggedIn = !!token;
  const isAdmin = true; 

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            isLoggedIn ? (
              <div>
                <nav style={{ padding: '10px', borderBottom: '1px solid #555' }}>
                  <Link to="/dashboard" style={{ marginRight: '15px', color: 'white' }}>Dashboard</Link>
                  <Link to="/admin" style={{ marginRight: '15px', color: 'white' }}>Admin Panel</Link>
                  <Link to="/salary" style={{ marginRight: '15px', color: '#ff9800' }}>Salary</Link>
                  <Link to="/audit-logs" style={{ marginRight: '15px', color: 'white' }}>Audit Logs</Link>
                </nav>
                <Dashboard />
              </div>
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        <Route path="/admin" element={isLoggedIn && isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />} />
        <Route path="/employee/:id" element={<EmployeeProfile />} />
        <Route path="/salary" element={<SalaryManager />} />
        <Route path="/audit-logs" element={<AuditLogs />} /> {/* <--- Route added here */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;