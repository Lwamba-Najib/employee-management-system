import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import AdminPanel from './AdminPanel';

function App() {
  const token = localStorage.getItem('authToken');
  const isLoggedIn = !!token;

  // TEMPORARY: We'll fetch the user's role from the backend soon
  const isAdmin = true; // For now, we assume you are an admin

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
                  <Link to="/dashboard" style={{ marginRight: '15px' }}>Dashboard</Link>
                  {isAdmin && <Link to="/admin">Admin Panel</Link>}
                </nav>
                <Dashboard />
              </div>
            ) : (
              <Navigate to="/" />
            )
          } 
        />

        <Route 
          path="/admin" 
          element={
            isLoggedIn && isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;