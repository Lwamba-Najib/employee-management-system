import { useState, useEffect } from 'react';

function SalaryManager() {
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    payroll_month: '',
    payroll_year: '',
    basic_salary: '',
    housing_allowance: 0,
    transport_allowance: 0,
    medical_allowance: 0,
    other_allowances: 0,
    bonus: 0,
    tax_paye: 0,
    nssf_deduction: 0,
    loan_deduction: 0,
    other_deductions: 0,
  });

  const token = localStorage.getItem('authToken');

  // Fetch employees and salaries
  useEffect(() => {
    fetchEmployees();
    fetchSalaries();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/employees', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchSalaries = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/salaries', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSalaries(data);
      }
    } catch (error) {
      console.error('Error fetching salaries:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateGross = () => {
    const { basic_salary, housing_allowance, transport_allowance, medical_allowance, other_allowances, bonus } = formData;
    return (
      Number(basic_salary || 0) +
      Number(housing_allowance || 0) +
      Number(transport_allowance || 0) +
      Number(medical_allowance || 0) +
      Number(other_allowances || 0) +
      Number(bonus || 0)
    );
  };

  const calculateNet = () => {
    const { tax_paye, nssf_deduction, loan_deduction, other_deductions } = formData;
    const totalDeductions = 
      Number(tax_paye || 0) +
      Number(nssf_deduction || 0) +
      Number(loan_deduction || 0) +
      Number(other_deductions || 0);
    return calculateGross() - totalDeductions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('http://127.0.0.1:8000/api/salaries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage('Salary record created successfully!');
        setFormData({
          employee_id: '',
          payroll_month: '',
          payroll_year: '',
          basic_salary: '',
          housing_allowance: 0,
          transport_allowance: 0,
          medical_allowance: 0,
          other_allowances: 0,
          bonus: 0,
          tax_paye: 0,
          nssf_deduction: 0,
          loan_deduction: 0,
          other_deductions: 0,
        });
        fetchSalaries();
      } else {
        const errorData = await res.json();
        setMessage('Error: ' + JSON.stringify(errorData.errors || errorData.message));
      }
    } catch (error) {
      setMessage('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Salary Management</h1>
        <button onClick={() => window.location.href='/dashboard'} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>

      <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* FORM SECTION */}
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
          <h3>Add Salary Record</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select name="employee_id" value={formData.employee_id} onChange={handleChange} required style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }}>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <input name="payroll_month" placeholder="Month" value={formData.payroll_month} onChange={handleChange} required style={{ flex: 1, padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
              <input name="payroll_year" placeholder="Year" value={formData.payroll_year} onChange={handleChange} required style={{ flex: 1, padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
            </div>

            <input name="basic_salary" type="number" placeholder="Basic Salary" value={formData.basic_salary} onChange={handleChange} required style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input name="housing_allowance" type="number" placeholder="Housing Allowance" value={formData.housing_allowance} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
              <input name="transport_allowance" type="number" placeholder="Transport Allowance" value={formData.transport_allowance} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
              <input name="medical_allowance" type="number" placeholder="Medical Allowance" value={formData.medical_allowance} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
              <input name="bonus" type="number" placeholder="Bonus" value={formData.bonus} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
            </div>

            <div style={{ borderTop: '1px solid #555', marginTop: '10px', paddingTop: '10px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>Deductions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input name="tax_paye" type="number" placeholder="PAYE Tax" value={formData.tax_paye} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
                <input name="nssf_deduction" type="number" placeholder="NSSF" value={formData.nssf_deduction} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
                <input name="loan_deduction" type="number" placeholder="Loan Deduction" value={formData.loan_deduction} onChange={handleChange} style={{ padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#2a2a2a', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
              <span>Gross: <strong>${calculateGross().toFixed(2)}</strong></span>
              <span>Net: <strong style={{ color: '#4CAF50' }}>${calculateNet().toFixed(2)}</strong></span>
            </div>

            <button type="submit" disabled={loading} style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Save Salary Record'}
            </button>
            {message && <p style={{ marginTop: '10px', color: message.includes('success') ? '#4CAF50' : '#ff6b6b' }}>{message}</p>}
          </form>
        </div>

        {/* LIST SECTION */}
        <div>
          <h3>Recent Salary Records</h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid #444', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#222', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Employee</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Month</th>
                  <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #555' }}>Net Pay</th>
                </tr>
              </thead>
              <tbody>
                {salaries.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #444' }}>
                    <td style={{ padding: '10px' }}>
                      {s.employee ? `${s.employee.first_name} ${s.employee.last_name}` : 'Unknown'}
                    </td>
                    <td style={{ padding: '10px' }}>{s.payroll_month} {s.payroll_year}</td>
                    <td style={{ padding: '10px', color: '#4CAF50', fontWeight: 'bold' }}>${s.net_salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryManager;