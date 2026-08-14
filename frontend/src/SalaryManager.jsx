import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const emptyForm = {
  employee_id: '',
  payroll_month: '',
  payroll_year: '2026',
  basic_salary: '0',
  housing_allowance: '0',
  transport_allowance: '0',
  medical_allowance: '0',
  other_allowances: '0',
  bonus: '0',
  paye: '0',
  nssf_deduction: '0',
  loan_deduction: '0',
  other_deductions: '0',
  payment_date: '',
  payment_status: 'Pending',
};

const num = (v) => parseFloat(v) || 0;
const money = (v) => `$${Number(v || 0).toLocaleString()}`;

const inputStyle = {
  padding: '8px',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: '12px',
  color: '#64748b',
  display: 'block',
  marginBottom: '4px',
};

const btn = (bg) => ({
  padding: '10px 16px',
  background: bg,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
});

function SalaryManager() {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const perPage = 5;

  const [search, setSearch] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fYear, setFYear] = useState('');
  const [fStatus, setFStatus] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const token = localStorage.getItem('authToken');

  const gross =
    num(form.basic_salary) +
    num(form.housing_allowance) +
    num(form.transport_allowance) +
    num(form.medical_allowance) +
    num(form.other_allowances) +
    num(form.bonus);

  const totalDeductions =
    num(form.paye) + num(form.nssf_deduction) + num(form.loan_deduction) + num(form.other_deductions);

  const net = gross - totalDeductions;

  const load = async (p) => {
    try {
      const params = new URLSearchParams({ page: p || 1, per_page: perPage });
      if (search) params.append('search', search);
      if (fMonth) params.append('month', fMonth);
      if (fYear) params.append('year', fYear);
      if (fStatus) params.append('status', fStatus);

      const res = await fetch(`${API}/salaries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setSalaries(data.salaries || []);
        setTotal(data.total || 0);
        setStats(data.stats || null);
        setPage(data.page || 1);
      } else {
        console.error('Load failed:', res.status);
      }
    } catch (e) {
      console.error('Error loading salaries:', e);
    }
  };

  useEffect(() => {
    load(1);
  }, [search, fMonth, fYear, fStatus]);

  useEffect(() => {
    fetch(`${API}/employees?per_page=100000`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : { employees: [] }))
      .then((d) => setEmployees(d.employees || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowModal(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    const next = { ...emptyForm };
    Object.keys(next).forEach((k) => {
      next[k] = s[k] != null ? String(s[k]) : '';
    });
    setForm(next);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = editingId !== null;

    try {
      const res = await fetch(`${API}${isEdit ? `/salaries/${editingId}` : '/salaries'}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const text = await res.text();

      if (res.ok) {
        alert(isEdit ? 'Salary record updated!' : 'Salary record created!');
        setShowModal(false);
        load(page);
      } else {
        try {
          alert(`Error: ${JSON.parse(text).message || text}`);
        } catch (e2) {
          console.error(text);
          alert('Server error — check console.');
        }
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete salary record for ${s.employee_name || 'employee'} (${s.payroll_month} ${s.payroll_year})?`)) {
      return;
    }

    try {
      const res = await fetch(`${API}/salaries/${s.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });

      if (res.ok) {
        alert('Record deleted.');
        load(page);
      } else {
        alert(`Delete failed (HTTP ${res.status})`);
      }
    } catch (e) {
      alert('Error connecting to server.');
    }
  };

  const markPaid = async (s) => {
    if (!window.confirm(`Mark ${s.employee_name || 'record'} — ${s.payroll_month} ${s.payroll_year} as PAID?`)) {
      return;
    }

    try {
      const res = await fetch(`${API}/salaries/${s.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_status: 'Paid',
          payment_date: new Date().toISOString().slice(0, 10),
        }),
      });

      if (res.ok) {
        alert('Marked as paid. 💸');
        load(page);
      } else {
        alert(`Failed (HTTP ${res.status})`);
      }
    } catch (e) {
      alert('Error connecting to server.');
    }
  };

  const field = (label, name, type = 'number') => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} value={form[name]} onChange={handleChange} style={inputStyle} />
    </div>
  );

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div style={{ padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <h1>Salary Management</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={openCreate} style={btn('#2563eb')}>
            + Create Salary Record
          </button>
          <button onClick={() => load(page)} style={{ ...btn('#e2e8f0'), color: '#1e293b' }}>
            Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL RECORDS</div>
            <div style={{ fontSize: '28px', fontWeight: '700' }}>{stats.total_records}</div>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #f59e0b',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b' }}>PENDING</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#d97706' }}>{stats.pending}</div>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #22c55e',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b' }}>PAID</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>{stats.paid}</div>
          </div>
          <div
            style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '1px solid #ea580c',
            }}
          >
            <div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL NET</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ea580c' }}>{money(stats.total_net)}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '15px 0' }}>
        <input
          placeholder="Search employee name / #..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: '220px' }}
        />
        <select
          value={fMonth}
          onChange={(e) => setFMonth(e.target.value)}
          style={{ ...inputStyle, width: '150px' }}
        >
          <option value="">All months</option>
          {MONTHS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          placeholder="Year (e.g. 2026)"
          value={fYear}
          onChange={(e) => setFYear(e.target.value)}
          style={{ ...inputStyle, width: '130px' }}
        />
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          style={{ ...inputStyle, width: '150px' }}
        >
          <option value="">All statuses</option>
          <option>Pending</option>
          <option>Paid</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              {['ID', 'Employee', 'Period', 'Gross', 'Net', 'Payment Date', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {salaries.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>{s.id}</td>
                <td style={{ padding: '10px' }}>
                  <div>{s.employee_name || 'Unknown'}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{s.employee_number || ''}</div>
                </td>
                <td style={{ padding: '10px' }}>
                  {s.payroll_month} {s.payroll_year}
                </td>
                <td style={{ padding: '10px' }}>{money(s.gross_salary)}</td>
                <td style={{ padding: '10px', fontWeight: '700' }}>{money(s.net_salary)}</td>
                <td style={{ padding: '10px' }}>{s.payment_date || '—'}</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      background: s.payment_status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                      color: s.payment_status === 'Paid' ? '#16a34a' : '#d97706',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: '600',
                    }}
                  >
                    {s.payment_status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  {s.payment_status === 'Pending' && (
                    <button
                      onClick={() => markPaid(s)}
                      style={{
                        marginRight: '8px',
                        padding: '4px 8px',
                        color: '#16a34a',
                        background: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Pay
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(s)}
                    style={{
                      marginRight: '8px',
                      padding: '4px 8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
                    style={{
                      padding: '4px 8px',
                      color: '#dc2626',
                      background: '#fef2f2',
                      border: '1px solid #fca5a5',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {salaries.length === 0 && (
              <tr>
                <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  No salary records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '15px',
        }}
      >
        <span style={{ color: '#64748b', fontSize: '14px' }}>
          Showing {total === 0 ? 0 : from}–{to} of {total} records
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            disabled={page <= 1}
            onClick={() => load(page - 1)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Previous
          </button>
          <button
            disabled={to >= total}
            onClick={() => load(page + 1)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              cursor: to >= total ? 'not-allowed' : 'pointer',
            }}
          >
            Next
          </button>
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            overflowY: 'auto',
            padding: '30px 0',
          }}
        >
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '700px', maxWidth: '92%' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Salary Record' : 'Create Salary Record'}</h2>
            <form onSubmit={handleSubmit}>
              <h4 style={{ margin: '10px 0', color: '#2563eb' }}>Employee & Period</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Employee *</label>
                  <select
                    name="employee_id"
                    value={form.employee_id}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.employee_number ? `${emp.employee_number} — ` : ''}
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Payroll Month *</label>
                  <select
                    name="payroll_month"
                    value={form.payroll_month}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  >
                    <option value="">Select...</option>
                    {MONTHS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                {field('Payroll Year *', 'payroll_year', 'number')}
              </div>

              <h4 style={{ margin: '18px 0 10px', color: '#16a34a' }}>Earnings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {field('Basic Salary', 'basic_salary')}
                {field('Housing Allowance', 'housing_allowance')}
                {field('Transport Allowance', 'transport_allowance')}
                {field('Medical Allowance', 'medical_allowance')}
                {field('Other Allowances', 'other_allowances')}
                {field('Bonus', 'bonus')}
              </div>

              <h4 style={{ margin: '18px 0 10px', color: '#dc2626' }}>Deductions</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {field('Tax (PAYE)', 'paye')}
                {field('NSSF Deduction', 'nssf_deduction')}
                {field('Loan Deduction', 'loan_deduction')}
                {field('Other Deductions', 'other_deductions')}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginTop: '15px',
                  background: '#f8fafc',
                  padding: '15px',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={labelStyle}>GROSS SALARY</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a' }}>{money(gross)}</div>
                </div>
                <div>
                  <div style={labelStyle}>TOTAL DEDUCTIONS</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#dc2626' }}>
                    {money(totalDeductions)}
                  </div>
                </div>
                <div>
                  <div style={labelStyle}>NET SALARY</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#2563eb' }}>{money(net)}</div>
                </div>
              </div>

              <h4 style={{ margin: '18px 0 10px', color: '#2563eb' }}>Payment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {field('Payment Date', 'payment_date', 'date')}
                <div>
                  <label style={labelStyle}>Payment Status</label>
                  <select name="payment_status" value={form.payment_status} onChange={handleChange} style={inputStyle}>
                    <option>Pending</option>
                    <option>Paid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#e2e8f0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" style={btn('#2563eb')}>
                  {editingId ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryManager;