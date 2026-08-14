import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const STORAGE = import.meta.env.VITE_STORAGE_URL || 'http://127.0.0.1:8000/storage/';

const emptyForm = {
  employee_number: '', first_name: '', last_name: '', gender: '', date_of_birth: '',
  national_id: '', phone: '', email: '', address: '', department: '', position: '',
  employment_type: '', date_of_employment: '', salary: '', supervisor: '',
  bank_name: '', bank_account_number: '', tin: '', nssf_number: '', status: 'Active', notes: '',
};

const inputStyle = { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' };
const btn = (bg) => ({ padding: '10px 16px', background: bg, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' });

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [search, setSearch] = useState('');
  const [fDepartment, setFDepartment] = useState('');
  const [fDesignation, setFDesignation] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [photoFile, setPhotoFile] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [passForm, setPassForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const token = localStorage.getItem('authToken');

  const load = async (p) => {
    try {
      const params = new URLSearchParams({ page: p || 1, per_page: perPage });
      if (search) params.append('search', search);
      if (fDepartment) params.append('department', fDepartment);
      if (fDesignation) params.append('designation', fDesignation);
      if (fStatus) params.append('status', fStatus);

      const res = await fetch(API + '/employees?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setTotal(data.total || 0);
        setStats(data.stats || null);
        setPage(data.page || 1);
      } else {
        console.error('Load failed:', res.status);
      }
    } catch (e) {
      console.error('Error loading employees:', e);
    }
  };

  useEffect(() => { load(1); }, [search, fDepartment, fDesignation, fStatus]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setPhotoFile(null);
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp.id);
    const next = { ...emptyForm };
    Object.keys(next).forEach((k) => { next[k] = emp[k] != null ? String(emp[k]) : ''; });
    setForm(next);
    setPhotoFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEdit = editingId !== null;
    const body = new FormData();
    Object.keys(form).forEach((k) => body.append(k, form[k]));
    if (photoFile) body.append('photo', photoFile);
    if (isEdit) body.append('_method', 'PUT');

    try {
      const res = await fetch(API + (isEdit ? '/employees/' + editingId : '/employees'), {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
        body,
      });
      const text = await res.text();
      if (res.ok) {
        alert(isEdit ? 'Employee updated successfully!' : 'Employee added successfully!');
        setShowModal(false);
        load(page);
      } else {
        try { alert('Error: ' + (JSON.parse(text).message || text)); }
        catch (e2) { console.error(text); alert('Server error — check console.'); }
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleDelete = async (emp) => {
    if (!window.confirm('Delete ' + (emp.name || emp.first_name) + '?')) return;
    try {
      const res = await fetch(API + '/employees/' + emp.id, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      });
      if (res.ok) { alert('Employee deleted.'); load(page); }
      else alert('Delete failed (HTTP ' + res.status + ')');
    } catch (e) { alert('Error connecting to server.'); }
  };

  const logout = async () => {
    try {
      await fetch(API + '/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      });
    } catch (e) {}
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    window.location.href = '/';
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
          if (passForm.password !== passForm.password_confirmation) { alert('New password and confirmation do NOT match — retype both.'); return; }
          
      const res = await fetch(API + '/change-password', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(passForm),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        alert('Password changed successfully!');
        setShowPass(false);
        setPassForm({ current_password: '', password: '', password_confirmation: '' });
      } else {
        alert('Error: ' + (data.message || 'Could not change password'));
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const exportPDF = async () => {
    const params = new URLSearchParams({ page: 1, per_page: 100000 });
    if (search) params.append('search', search);
    if (fDepartment) params.append('department', fDepartment);
    if (fDesignation) params.append('designation', fDesignation);
    if (fStatus) params.append('status', fStatus);
    
    const res = await fetch(API + '/employees?' + params.toString(), {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
    });
    if (!res.ok) return alert('Export failed');
    
    const data = await res.json();
    const rows = data.employees || [];
    const totalSalary = rows.reduce((sum, r) => sum + Number(r.salary || 0), 0);
    const activeCount = rows.filter(r => r.status === 'Active').length;
    
    const filters = [
      search ? `Search: "${search}"` : null,
      fDepartment ? `Department: ${fDepartment}` : null,
      fDesignation ? `Designation: ${fDesignation}` : null,
      fStatus ? `Status: ${fStatus}` : null,
    ].filter(Boolean).join(' · ');

    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Employee Report</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; }
        h1 { margin: 0 0 6px; font-size: 22px; }
        .meta { color: #64748b; font-size: 13px; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #1e293b; color: #fff; padding: 8px; text-align: left; }
        td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .active { color: #16a34a; } .inactive { color: #dc2626; }
        .summary { margin-top: 20px; padding: 14px; background: #f1f5f9; border-radius: 8px; font-size: 14px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h1>Employee Report</h1>
      <div class="meta">Generated ${new Date().toLocaleString()} · ${rows.length} records${filters ? ' · ' + filters : ''}</div>
      <table>
        <thead><tr>
          <th>Emp #</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Type</th><th>Salary</th><th>Status</th>
        </tr></thead>
        <tbody>${rows.map(r => `
          <tr>
            <td>${r.employee_number || '—'}</td>
            <td>${r.name || (r.first_name + ' ' + r.last_name)}</td>
            <td>${r.email}</td>
            <td>${r.department || '—'}</td>
            <td>${r.position || '—'}</td>
            <td>${r.employment_type || '—'}</td>
            <td>$${Number(r.salary || 0).toLocaleString()}</td>
            <td class="${r.status === 'Active' ? 'active' : 'inactive'}">${r.status}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="summary">
        <b>Total Employees:</b> ${rows.length} &nbsp; | &nbsp;
        <b>Active:</b> ${activeCount} &nbsp; | &nbsp;
        <b>Total Monthly Payroll:</b> $${totalSalary.toLocaleString()}
      </div>
      <p style="margin-top:30px"><button onclick="window.print()" style="padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;">🖨️ Print / Save as PDF</button></p>
      </body></html>
    `);
    w.document.close();
  };

  const field = (label, name, type = 'text', required = false) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input type={type} name={name} required={required} value={form[name]} onChange={handleChange} style={inputStyle} />
    </div>
  );

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h1>Employee Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={openCreate} style={btn('#2563eb')}>+ Add Employee</button>
          <button onClick={exportPDF} style={btn('#dc2626')}>Export PDF</button>
                  <button onClick={async (e) => { const b = e.currentTarget; b.textContent = 'Refreshing…'; b.disabled = true; await load(page); b.disabled = false; b.textContent = '✓ Refreshed'; setTimeout(() => (b.textContent = 'Refresh'), 1200); }} style={{ ...btn('#e2e8f0'), color: '#1e293b' }}>Refresh</button>
          <button onClick={() => setShowPass(true)} style={{ ...btn('#e2e8f0'), color: '#1e293b' }}>Change Password</button>
          <button onClick={logout} style={btn('#dc2626')}>Logout</button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', margin: '20px 0' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}><div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL EMPLOYEES</div><div style={{ fontSize: '28px', fontWeight: '700' }}>{stats.total_employees}</div></div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #22c55e' }}><div style={{ fontSize: '12px', color: '#64748b' }}>ACTIVE</div><div style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a' }}>{stats.active_employees}</div></div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f59e0b' }}><div style={{ fontSize: '12px', color: '#64748b' }}>INACTIVE</div><div style={{ fontSize: '28px', fontWeight: '700', color: '#d97706' }}>{stats.inactive_employees}</div></div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #2563eb' }}><div style={{ fontSize: '12px', color: '#64748b' }}>TOTAL USERS</div><div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>{stats.total_users}</div></div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ea580c' }}><div style={{ fontSize: '12px', color: '#64748b' }}>MONTHLY PAYROLL</div><div style={{ fontSize: '28px', fontWeight: '700', color: '#ea580c' }}>${Number(stats.monthly_payroll || 0).toLocaleString()}</div></div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '15px 0' }}>
        <input placeholder="Search all fields..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: '220px' }} />
        <input placeholder="Filter: department" value={fDepartment} onChange={(e) => setFDepartment(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
        <input placeholder="Filter: designation" value={fDesignation} onChange={(e) => setFDesignation(e.target.value)} style={{ ...inputStyle, width: '160px' }} />
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={{ ...inputStyle, width: '150px' }}>
          <option value="">All statuses</option>
          <option>Active</option><option>Suspended</option><option>Resigned</option><option>Terminated</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              {['ID', 'Emp #', 'Name', 'Email', 'Department', 'Position', 'Type', 'Salary', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '10px' }}>{emp.id}</td>
                <td style={{ padding: '10px' }}>{emp.employee_number || '-'}</td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {emp.photo
                                            ? <img src={STORAGE + emp.photo} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>{(emp.name || '?').charAt(0)}</div>}
                    <span>{emp.name || (emp.first_name + ' ' + emp.last_name)}</span>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>{emp.email}</td>
                <td style={{ padding: '10px' }}>{emp.department}</td>
                <td style={{ padding: '10px' }}>{emp.position}</td>
                <td style={{ padding: '10px' }}>{emp.employment_type || '-'}</td>
                <td style={{ padding: '10px' }}>${Number(emp.salary || 0).toLocaleString()}</td>
                <td style={{ padding: '10px' }}><span style={{ color: emp.status === 'Active' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>{emp.status}</span></td>
                <td style={{ padding: '10px' }}>
                  <button onClick={() => setViewing(emp)} style={{ marginRight: '8px', padding: '4px 8px', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer' }}>View</button>
                  <button onClick={() => openEdit(emp)} style={{ marginRight: '8px', padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => handleDelete(emp)} style={{ padding: '4px 8px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No employees found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
        <span style={{ color: '#64748b', fontSize: '14px' }}>Showing {total === 0 ? 0 : from}–{to} of {total} employees</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button disabled={page <= 1} onClick={() => load(page - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <button disabled={to >= total} onClick={() => load(page + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: to >= total ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '30px 0' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '700px', maxWidth: '92%' }}>
            <h2 style={{ marginTop: 0 }}>{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
            <form onSubmit={handleSubmit}>
              <h4 style={{ margin: '10px 0', color: '#2563eb' }}>Personal Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {field('Employee Number', 'employee_number')}
                {field('First Name', 'first_name', 'text', true)}
                {field('Last Name', 'last_name', 'text', true)}
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} style={inputStyle}>
                    <option value="">Select...</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                {field('Date of Birth', 'date_of_birth', 'date')}
                {field('National ID / Passport', 'national_id')}
                {field('Phone Number', 'phone')}
                {field('Email Address', 'email', 'email', true)}
              </div>
              <div style={{ marginTop: '12px' }}>{field('Physical Address', 'address')}</div>

              <h4 style={{ margin: '18px 0 10px', color: '#2563eb' }}>Employment</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {field('Department', 'department')}
                {field('Designation / Job Title', 'position')}
                <div>
                  <label style={labelStyle}>Employment Type</label>
                  <select name="employment_type" value={form.employment_type} onChange={handleChange} style={inputStyle}>
                    <option value="">Select...</option><option>Permanent</option><option>Contract</option><option>Casual</option><option>Intern</option>
                  </select>
                </div>
                {field('Date of Employment', 'date_of_employment', 'date')}
                {field('Basic Salary', 'salary', 'number')}
                {field('Supervisor / Manager', 'supervisor')}
                <div>
                  <label style={labelStyle}>Employee Status</label>
                  <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
                    <option>Active</option><option>Suspended</option><option>Resigned</option><option>Terminated</option>
                  </select>
                </div>
              </div>

              <h4 style={{ margin: '18px 0 10px', color: '#2563eb' }}>Bank & Tax</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {field('Bank Name', 'bank_name')}
                {field('Bank Account Number', 'bank_account_number')}
                {field('Tax Identification Number (TIN)', 'tin')}
                {field('NSSF Number', 'nssf_number')}
              </div>

              <h4 style={{ margin: '18px 0 10px', color: '#2563eb' }}>Photo & Notes</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Profile Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} style={{ width: '100%' }} />
                </div>
                <div>{field('Notes', 'notes')}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={btn('#2563eb')}>{editingId ? 'Save Changes' : 'Add Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewing && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '30px 0' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '700px', maxWidth: '92%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Employee Profile</h2>
              <button onClick={() => setViewing(null)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              {viewing.photo
                               ? <img src={STORAGE + viewing.photo} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover' }} />
                : <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{(viewing.name || '?').charAt(0)}</div>}
              <div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>{viewing.name}</div>
                <div style={{ color: '#64748b' }}>{viewing.position} · {viewing.department}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{viewing.employee_number} · <span style={{ color: viewing.status === 'Active' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>{viewing.status}</span></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                ['Email', viewing.email],
                ['Phone', viewing.phone],
                ['Gender', viewing.gender],
                ['Date of Birth', viewing.date_of_birth],
                ['National ID / Passport', viewing.national_id],
                ['Employment Type', viewing.employment_type],
                ['Date of Employment', viewing.date_of_employment],
                ['Supervisor', viewing.supervisor],
                ['Basic Salary', viewing.salary ? '$' + Number(viewing.salary).toLocaleString() : ''],
                ['Bank Name', viewing.bank_name],
                ['Bank Account Number', viewing.bank_account_number],
                ['TIN', viewing.tin],
                ['NSSF Number', viewing.nssf_number],
              ].map(([label, value]) => (
                <div key={label} style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px' }}>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{label}</span>
                  <div style={{ fontWeight: '600' }}>{value || '—'}</div>
                </div>
              ))}
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Physical Address</span>
                <div style={{ fontWeight: '600' }}>{viewing.address || '—'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', gridColumn: '1 / -1' }}>
                <span style={{ color: '#64748b', fontSize: '12px' }}>Notes</span>
                <div style={{ fontWeight: '600' }}>{viewing.notes || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => { openEdit(viewing); setViewing(null); }} style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Edit Employee</button>
            </div>
          </div>
        </div>
      )}

      {showPass && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', width: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Change Password</h2>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="password" placeholder="Current password" value={passForm.current_password} onChange={(e) => setPassForm({ ...passForm, current_password: e.target.value })} required style={inputStyle} />
              <input type="password" placeholder="New password (min 8 chars)" value={passForm.password} onChange={(e) => setPassForm({ ...passForm, password: e.target.value })} required minLength={8} style={inputStyle} />
              <input type="password" placeholder="Confirm new password" value={passForm.password_confirmation} onChange={(e) => setPassForm({ ...passForm, password_confirmation: e.target.value })} required style={inputStyle} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowPass(false)} style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={btn('#2563eb')}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;