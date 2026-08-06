import { useState, useEffect } from 'react';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/audit-logs', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Audit Logs</h1>
      <p>System accountability: Every action is tracked.</p>
      <button onClick={() => window.location.href='/dashboard'} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
        Back to Dashboard
      </button>
      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #444', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#222' }}>
              <tr>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>User</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Action</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Module</th>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #444' }}>
                  <td style={{ padding: '10px' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>{log.user ? log.user.name : 'System'}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: log.action === 'Deleted' ? '#ff6b6b' : '#4CAF50' }}>
                    {log.action}
                  </td>
                  <td style={{ padding: '10px' }}>{log.module}</td>
                  <td style={{ padding: '10px', color: '#aaa' }}>{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AuditLogs;