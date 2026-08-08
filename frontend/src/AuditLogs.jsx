import { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:8000/api';

const inputStyle = { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', boxSizing: 'border-box' };
const labelStyle = { fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' };

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', user: '', module: '', action: '', from: '', to: '' });
  const [options, setOptions] = useState({ users: [], modules: [], actions: [] });
  const [expanded, setExpanded] = useState(null);
  const perPage = 10;
  const token = localStorage.getItem('authToken');

  const load = async (p) => {
    try {
      const params = new URLSearchParams({ page: p || 1, per_page: perPage });
      Object.keys(filters).forEach((k) => { if (filters[k]) params.append(k, filters[k]); });

      const res = await fetch(API + '/audit-logs?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setOptions({ users: data.users || [], modules: data.modules || [], actions: data.actions || [] });
      } else {
        console.error('Audit load failed:', res.status);
      }
    } catch (e) {
      console.error('Error loading audit logs:', e);
    }
  };

  useEffect(() => { load(1); }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const parse = (json) => { try { return json ? JSON.parse(json) : {}; } catch (e) { return {}; } };

  const changedRows = (log) => {
    const o = parse(log.old_values);
    const n = parse(log.new_values);
    if (log.action === 'Created') return Object.keys(n).map((k) => [k, null, n[k]]);
    if (log.action === 'Deleted') return Object.keys(o).map((k) => [k, o[k], null]);
    return Object.keys(n).filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k])).map((k) => [k, o[k], n[k]]);
  };

  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Audit Logs</h1>
      <p style={{ color: '#64748b' }}>Every important action is recorded automatically — who did what, when, from where, and what changed.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', margin: '15px 0' }}>
        <div><label style={labelStyle}>Search</label><input placeholder="User, module, record..." value={filters.search} onChange={set('search')} style={inputStyle} /></div>
        <div>
          <label style={labelStyle}>User</label>
          <select value={filters.user} onChange={set('user')} style={inputStyle}>
            <option value="">All users</option>
            {options.users.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Module</label>
          <select value={filters.module} onChange={set('module')} style={inputStyle}>
            <option value="">All modules</option>
            {options.modules.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Action</label>
          <select value={filters.action} onChange={set('action')} style={inputStyle}>
            <option value="">All actions</option>
            {options.actions.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div><label style={labelStyle}>From</label><input type="date" value={filters.from} onChange={set('from')} style={inputStyle} /></div>
        <div><label style={labelStyle}>To</label><input type="date" value={filters.to} onChange={set('to')} style={inputStyle} /></div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <tr>
              {['ID', 'Date & Time', 'User', 'Module', 'Action', 'Record', 'Status', 'IP Address', ''].map((h, i) => (
                <th key={i} style={{ padding: '12px', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <>
                <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '10px' }}>{log.id}</td>
                  <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '10px', fontWeight: '600' }}>{log.user_name}</td>
                  <td style={{ padding: '10px' }}><span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px' }}>{log.module}</span></td>
                  <td style={{ padding: '10px', fontWeight: '600' }}>{log.action}</td>
                  <td style={{ padding: '10px' }}>#{log.record_id} {log.record_label || ''}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ color: log.status === 'Success' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>{log.status}</span>
                  </td>
                  <td style={{ padding: '10px' }}>{log.ip_address}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => setExpanded(expanded === log.id ? null : log.id)} style={{ padding: '4px 8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer' }}>
                      {expanded === log.id ? 'Hide' : 'Details'}
                    </button>
                  </td>
                </tr>
                {expanded === log.id && (
                  <tr style={{ background: '#f8fafc' }}>
                    <td colSpan="9" style={{ padding: '15px' }}>
                      <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                        <strong>Device:</strong> {log.user_agent || 'Unknown'}
                      </div>
                      {changedRows(log).length === 0 && <div style={{ color: '#64748b' }}>No field details recorded.</div>}
                      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '6px', fontSize: '13px' }}>
                        <div style={{ fontWeight: '700' }}>Field</div>
                        <div style={{ fontWeight: '700', color: '#dc2626' }}>Old Value</div>
                        <div style={{ fontWeight: '700', color: '#16a34a' }}>New Value</div>
                        {changedRows(log).map(([k, ov, nv]) => (
                          <>
                            <div key={k} style={{ padding: '4px 0' }}>{k}</div>
                            <div key={k + 'o'} style={{ padding: '4px 0', wordBreak: 'break-all' }}>{ov == null ? '—' : String(ov)}</div>
                            <div key={k + 'n'} style={{ padding: '4px 0', wordBreak: 'break-all' }}>{nv == null ? '—' : String(nv)}</div>
                          </>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan="9" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No audit logs found. Perform some actions (create/edit/delete) and refresh.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
        <span style={{ color: '#64748b', fontSize: '14px' }}>Showing {total === 0 ? 0 : from}–{to} of {total} logs</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button disabled={page <= 1} onClick={() => load(page - 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <button disabled={to >= total} onClick={() => load(page + 1)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: to >= total ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;