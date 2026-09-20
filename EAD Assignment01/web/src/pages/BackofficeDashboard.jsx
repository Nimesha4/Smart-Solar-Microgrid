import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sun } from 'lucide-react';

export default function BackofficeDashboard() {
  const [users, setUsers] = useState([]);
  const [nodes, setNodes] = useState([]);

  // Form States for Node Creation
  const [nodeName, setNodeName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [batterySlots, setBatterySlots] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Backoffice') navigate('/login');
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const usersRes = await axios.get('http://localhost:5199/api/users');
      setUsers(usersRes.data);
      const nodesRes = await axios.get('http://localhost:5199/api/nodes');
      setNodes(nodesRes.data);
    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  const handleDeactivateNode = async (id) => {
    try {
      await axios.put(`http://localhost:5199/api/nodes/deactivate/${id}`);
      fetchData();
    } catch (e) {
      alert("Cannot deactivate node. Active energy reservations exist.");
    }
  };

  const handleDeactivateUser = async (nic) => {
    try {
      await axios.put(`http://localhost:5199/api/users/deactivate/${nic}`);
      fetchData();
    } catch (e) {
      alert("Failed to deactivate user.");
    }
  };

  const handleActivateUser = async (nic) => {
    try {
      await axios.put(`http://localhost:5199/api/users/activate/${nic}`);
      fetchData();
    } catch (e) {
      alert("Failed to activate user.");
    }
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    try {
      const newNode = {
        name: nodeName,
        latitude: 6.9271, // Mock GPS
        longitude: 79.8612,
        capacityKwh: parseFloat(capacity),
        availableBatterySlots: parseInt(batterySlots),
        isActive: true,
        operatingSchedule: "08:00-18:00"
      };
      await axios.post('http://localhost:5199/api/nodes', newNode);
      setNodeName(''); setCapacity(''); setBatterySlots('');
      fetchData();
    } catch (e) {
      alert("Failed to create Node");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="bo-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .bo-root {
          min-height: 100vh;
          background:
            radial-gradient(720px 420px at 8% -10%, rgba(224,142,43,0.14), transparent 65%),
            radial-gradient(760px 480px at 100% 6%, rgba(20,107,92,0.10), transparent 60%),
            #FBFAF7;
          color: #1B2420;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .bo-root *, .bo-root *::before, .bo-root *::after { box-sizing: border-box; }
        .bo-display { font-family: 'Sora', 'Inter', sans-serif; }

        /* ---- Top bar ---- */
        .bo-bar {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px;
          padding: 16px 28px;
          background: rgba(251,250,247,0.9);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid #ECEAE2;
        }
        .bo-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .bo-mark {
          width: 34px; height: 34px; border-radius: 9px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 14px rgba(224,142,43,0.26);
        }
        .bo-brand h1 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
        .bo-brand span { font-size: 12.5px; color: #6B7A72; white-space: nowrap; }

        .bo-btn {
          font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border-radius: 8px; border: 1px solid transparent;
          transition: background-color .12s ease, border-color .12s ease, color .12s ease;
        }
        .bo-btn:focus-visible { outline: 2px solid #146B5C; outline-offset: 2px; }
        .bo-quiet { background: #FFFFFF; border-color: #DEDCD3; color: #33413A; }
        .bo-quiet:hover { border-color: #1B2420; }
        .bo-solid { background: #146B5C; color: #FFFFFF; }
        .bo-solid:hover { background: #0F5548; }

        /* ---- Page shell ---- */
        .bo-page { max-width: 1120px; margin: 0 auto; padding: 44px 28px 80px; }

        /* ---- Headline ---- */
        .bo-head { padding-bottom: 28px; border-bottom: 2px solid #1B2420; }
        .bo-head h2 {
          margin: 0; font-size: clamp(28px, 4vw, 38px);
          font-weight: 700; letter-spacing: -0.028em; line-height: 1.08;
        }
        .bo-head p { margin: 12px 0 0; max-width: 46ch; font-size: 15px; line-height: 1.6; color: #5B6B63; }

        /* ---- Counters ---- */
        .bo-counts { display: flex; gap: 48px; padding: 22px 0 36px; border-bottom: 1px solid #ECEAE2; margin-bottom: 44px; }
        .bo-count b {
          display: block; font-size: 30px; font-weight: 700; font-family: 'Sora', sans-serif;
          letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1;
          color: #146B5C;
        }
        .bo-count small { display: block; margin-top: 6px; font-size: 13px; color: #6B7A72; }

        /* ---- Section ---- */
        .bo-section { margin-bottom: 56px; }
        .bo-section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .bo-section-head h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.015em; }
        .bo-section-head p { margin: 0; font-size: 13px; color: #6B7A72; }

        /* ---- Table (card wrapper) ---- */
        .bo-card { background: #FFFFFF; border: 1px solid #ECEAE2; border-radius: 16px; padding: 4px 20px; }
        .bo-table { width: 100%; border-collapse: collapse; }
        .bo-table thead th {
          padding: 16px 16px 10px;
          font-size: 12px; font-weight: 600; color: #8A968F;
          text-align: left; border-bottom: 1px solid #ECEAE2; white-space: nowrap;
        }
        .bo-table thead th:first-child { padding-left: 0; }
        .bo-table thead th:last-child { padding-right: 0; text-align: right; }
        .bo-table tbody td { padding: 16px; border-bottom: 1px solid #F3F1EA; vertical-align: middle; font-size: 14px; }
        .bo-table tbody tr:last-child td { border-bottom: none; }
        .bo-table tbody td:first-child { padding-left: 0; }
        .bo-table tbody td:last-child { padding-right: 0; text-align: right; }
        .bo-table tbody tr:hover td { background: #FBFAF7; }
        .bo-name { font-weight: 600; letter-spacing: -0.005em; }
        .bo-sub { color: #8A968F; font-variant-numeric: tabular-nums; }
        .bo-num { font-variant-numeric: tabular-nums; }

        .bo-role {
          display: inline-block; padding: 2px 9px; border-radius: 999px;
          background: rgba(20,107,92,0.09); color: #146B5C; font-size: 12px; font-weight: 600;
        }

        .bo-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; }
        .bo-status i { width: 6px; height: 6px; border-radius: 50%; flex: none; }
        .bo-on  { color: #146B5C; } .bo-on  i { background: #146B5C; }
        .bo-off { color: #C9701B; } .bo-off i { background: #C9701B; }

        .bo-empty { padding: 44px 0; text-align: center; font-size: 14px; color: #8A968F; }

        /* ---- Actions ---- */
        .bo-actions { display: inline-flex; gap: 8px; justify-content: flex-end; }
        .bo-btn-sm { padding: 7px 12px; font-size: 13px; }
        .bo-caution { background: #FFFFFF; border-color: rgba(201,112,27,0.4); color: #C9701B; }
        .bo-caution:hover { background: rgba(201,112,27,0.08); border-color: #C9701B; }
        .bo-reactivate { background: #146B5C; color: #FFFFFF; }
        .bo-reactivate:hover { background: #0F5548; }

        /* ---- Create form ---- */
        .bo-form {
          display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
          padding: 18px 20px; background: #FFFFFF; border: 1px solid #ECEAE2; border-radius: 16px;
          margin-bottom: 20px;
        }
        .bo-input {
          font: inherit; font-size: 14px; color: #1B2420;
          padding: 10px 13px; border: 1px solid #DEDCD3; border-radius: 8px; background: #FFFFFF;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .bo-input::placeholder { color: #9AA6A0; }
        .bo-input:focus { outline: none; border-color: #146B5C; box-shadow: 0 0 0 3px rgba(20,107,92,0.12); }
        .bo-grow { flex: 1 1 200px; min-width: 0; }
        .bo-small { width: 112px; font-variant-numeric: tabular-nums; }
        .bo-submit { background: #E08E2B; color: #FFFFFF; padding: 10px 18px; font-size: 14px; }
        .bo-submit:hover { background: #C9701B; }

        @media (max-width: 760px) {
          .bo-page { padding: 32px 18px 60px; }
          .bo-bar { padding: 14px 18px; }
          .bo-counts { gap: 32px; }
          .bo-hide-sm { display: none; }
          .bo-input, .bo-small, .bo-grow { width: 100%; flex: 1 1 100%; }
          .bo-submit { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) { .bo-root * { transition: none !important; } }
      `}</style>

      {/* Top bar */}
      <div className="bo-bar">
        <div className="bo-brand">
          <div className="bo-mark">
            <Sun size={17} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="bo-display">Backoffice</h1>
            <span>Solar Microgrid network</span>
          </div>
        </div>
        <button onClick={logout} className="bo-btn bo-quiet">Sign out</button>
      </div>

      <div className="bo-page">

        {/* Headline */}
        <div className="bo-head">
          <h2 className="bo-display">Accounts and hubs</h2>
          <p>Review who can trade on the network and which hubs are accepting energy today.</p>
        </div>

        {/* Counters */}
        <div className="bo-counts">
          <div className="bo-count">
            <b>{users.length}</b>
            <small>Registered accounts</small>
          </div>
          <div className="bo-count">
            <b>{nodes.length}</b>
            <small>Registered hubs</small>
          </div>
        </div>

        {/* Users */}
        <div className="bo-section">
          <div className="bo-section-head">
            <h3>Prosumers and operators</h3>
            <p>Deactivating an account blocks sign-in immediately.</p>
          </div>

          <div className="bo-card">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="bo-hide-sm">Role</th>
                  <th className="bo-hide-sm">NIC</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.nic}>
                    <td>
                      <span className="bo-name">{u.name}</span>
                    </td>
                    <td className="bo-hide-sm"><span className="bo-role">{u.role}</span></td>
                    <td className="bo-hide-sm bo-sub">{u.nic}</td>
                    <td>
                      {u.isActive ? (
                        <span className="bo-status bo-on"><i />Active</span>
                      ) : (
                        <span className="bo-status bo-off"><i />Inactive</span>
                      )}
                    </td>
                    <td>
                      {u.isActive ? (
                        <div className="bo-actions">
                          <button onClick={() => handleDeactivateUser(u.nic)} className="bo-btn bo-btn-sm bo-caution">Deactivate</button>
                        </div>
                      ) : (
                        <div className="bo-actions">
                          <button onClick={() => handleActivateUser(u.nic)} className="bo-btn bo-btn-sm bo-reactivate">Reactivate</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="bo-empty">No accounts yet. They appear here as people register.</p>}
          </div>
        </div>

        {/* Nodes */}
        <div className="bo-section">
          <div className="bo-section-head">
            <h3>Microgrid hubs</h3>
            <p>Coordinates default to the Colombo grid reference.</p>
          </div>

          <form onSubmit={handleCreateNode} className="bo-form">
            <input type="text" placeholder="Hub name" value={nodeName} onChange={e => setNodeName(e.target.value)} className="bo-input bo-grow" required />
            <input type="number" placeholder="Capacity kWh" value={capacity} onChange={e => setCapacity(e.target.value)} className="bo-input bo-small" required />
            <input type="number" placeholder="Slots" value={batterySlots} onChange={e => setBatterySlots(e.target.value)} className="bo-input bo-small" required />
            <button type="submit" className="bo-btn bo-submit">Create hub</button>
          </form>

          <div className="bo-card">
            <table className="bo-table">
              <thead>
                <tr>
                  <th>Hub</th>
                  <th className="bo-hide-sm">Capacity</th>
                  <th className="bo-hide-sm">Battery slots</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map(n => (
                  <tr key={n.id}>
                    <td><span className="bo-name">{n.name}</span></td>
                    <td className="bo-hide-sm bo-num">{n.capacityKwh} kWh</td>
                    <td className="bo-hide-sm bo-num">{n.availableBatterySlots}</td>
                    <td>
                      {n.isActive ? (
                        <span className="bo-status bo-on"><i />Accepting energy</span>
                      ) : (
                        <span className="bo-status bo-off"><i />Offline</span>
                      )}
                    </td>
                    <td>
                      {n.isActive ? (
                        <div className="bo-actions">
                          <button onClick={() => handleDeactivateNode(n.id)} className="bo-btn bo-btn-sm bo-caution">Deactivate</button>
                        </div>
                      ) : (
                        <span className="bo-sub" style={{ fontSize: 13 }}>No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nodes.length === 0 && <p className="bo-empty">No hubs registered. Add the first one above.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}