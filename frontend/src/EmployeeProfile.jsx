import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

function EmployeeProfile() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch(`http://localhost:8000/api/employees/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setEmployee(data);
        }
      } catch (error) {
        console.error('Error fetching employee:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) return <p style={{ padding: '20px' }}>Loading profile...</p>;
  if (!employee) return <p style={{ padding: '20px' }}>Employee not found.</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Employee Profile</h1>
        <Link to="/dashboard" style={{ padding: '8px 16px', background: '#555', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ 
        marginTop: '20px', 
        background: '#1e1e1e', 
        padding: '30px', 
        borderRadius: '8px', 
        border: '1px solid #444' 
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h2 style={{ borderBottom: '1px solid #555', paddingBottom: '10px' }}>Personal Info</h2>
            <p><strong>ID:</strong> {employee.id}</p>
            {employee.profile_photo && (
                <div style={{ margin: '10px 0' }}>
                    <img
                        src={`http://localhost:8000/${employee.profile_photo}`}
                        alt="Profile"
                        style={{ 
                            Width: '120px', 
                            height: 'auto', 
                            oblectFit: 'cover', 
                            borderRadius: '10%', 
                            border: '2px solid #555',
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'}}
                    />
                </div>
            )}
            <p><strong>Name:</strong> {employee.first_name} {employee.last_name}</p>
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Phone:</strong> {employee.phone_number || '-'}</p>
            <p><strong>Gender:</strong> {employee.gender || '-'}</p>
            <p><strong>DOB:</strong> {employee.date_of_birth || '-'}</p>
            <p><strong>Address:</strong> {employee.physical_address || '-'}</p>
          </div>

          <div>
            <h2 style={{ borderBottom: '1px solid #555', paddingBottom: '10px' }}>Job Details</h2>
            <p><strong>Employee #:</strong> {employee.employee_number || '-'}</p>
            <p><strong>Department:</strong> {employee.department || '-'}</p>
            <p><strong>Position:</strong> {employee.position}</p>
            <p><strong>Employment Type:</strong> {employee.employment_type || '-'}</p>
            <p><strong>Hire Date:</strong> {employee.hire_date}</p>
            <p><strong>Salary:</strong> ${employee.salary}</p>
            <p><strong>Status:</strong> 
              <span style={{ 
                color: employee.employee_status === 'Active' ? '#4CAF50' : '#ff6b6b',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}>
                {employee.employee_status || 'Active'}
              </span>
            </p>
            <p><strong>Supervisor:</strong> {employee.supervisor || '-'}</p>
          </div>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #555', paddingTop: '20px' }}>
          <h2>Financial Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <p><strong>Bank Name:</strong> {employee.bank_name || '-'}</p>
            <p><strong>Account #:</strong> {employee.bank_account_number || '-'}</p>
            <p><strong>TIN:</strong> {employee.tin_number || '-'}</p>
            <p><strong>NSSF:</strong> {employee.nssf_number || '-'}</p>
          </div>
        </div>

        <div style={{ marginTop: '30px', borderTop: '1px solid #555', paddingTop: '20px' }}>
          <h2>Notes</h2>
          <p style={{ color: '#aaa' }}>{employee.notes || 'No notes available.'}</p>
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfile;