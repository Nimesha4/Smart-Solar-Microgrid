import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sun, Minus, Plus, Battery, Clock, QrCode } from 'lucide-react';

export default function GridOperatorDashboard() {
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [slotInputs, setSlotInputs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'GridOperator') navigate('/login');
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const nodesRes = await axios.get('http://localhost:5199/api/nodes');
      setNodes(nodesRes.data);

      const resRes = await axios.get('http://localhost:5199/api/reservations');
      setReservations(resRes.data);

      // Initialize input states for nodes
      const initialInputs = {};
      nodesRes.data.forEach(n => {
        initialInputs[n.id] = n.availableBatterySlots;
      });
      setSlotInputs(initialInputs);

    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateSlots = async (node) => {
    try {
      const updatedNode = {
        ...node,
        availableBatterySlots: parseInt(slotInputs[node.id])
      };
      await axios.put(`http://localhost:5199/api/nodes/${node.id}`, updatedNode);
      alert(`Successfully updated battery slots for ${node.name}`);
      fetchData();
    } catch (e) {
      alert("Failed to update battery slots");
    }
  };

  const handleApproveReservation = async (id) => {
    try {
      await axios.put(`http://localhost:5199/api/reservations/approve/${id}`);
      fetchData();
    } catch (e) {
      alert("Failed to approve reservation");
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const pendingCount = reservations.filter(r => r.status === 'Pending').length;

  return (
    <div className="go-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .go-root {
          min-height: 100vh;
          background:
            radial-gradient(720px 420px at 8% -10%, rgba(224,142,43,0.14), transparent 65%),
            radial-gradient(760px 480px at 100% 6%, rgba(20,107,92,0.10), transparent 60%),
            #FBFAF7;
          color: #1B2420;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .go-root *, .go-root *::before, .go-root *::after { box-sizing: border-box; }
        .go-display { font-family: 'Sora', 'Inter', sans-serif; }

        /* ---- Top bar ---- */
        .go-bar {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 16px 28px;
          background: rgba(251,250,247,0.9);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid #ECEAE2;
        }
        .go-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .go-mark {
          width: 34px; height: 34px; border-radius: 9px; flex: none;
          background: linear-gradient(135deg, #146B5C, #0F5548);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 14px rgba(20,107,92,0.26);
        }
        .go-brand h1 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
        .go-brand span { font-size: 12.5px; color: #6B7A72; white-space: nowrap; }

        .go-btn {
          font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border-radius: 8px; border: 1px solid transparent;
          transition: background-color .12s ease, border-color .12s ease, color .12s ease, transform .1s ease;
        }
        .go-btn:active { transform: translateY(1px); }
        .go-btn:focus-visible { outline: 2px solid #146B5C; outline-offset: 2px; }
        .go-quiet { background: #FFFFFF; border-color: #DEDCD3; color: #33413A; }
        .go-quiet:hover { border-color: #1B2420; }

        /* ---- Page shell ---- */
        .go-page { max-width: 1180px; margin: 0 auto; padding: 40px 28px 88px; }

        .go-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px; margin-bottom: 40px; }
        .go-head h2 { margin: 0; font-size: clamp(26px, 4vw, 36px); font-weight: 700; letter-spacing: -0.028em; }
        .go-head p { margin: 8px 0 0; max-width: 44ch; font-size: 15px; line-height: 1.6; color: #5B6B63; }
        .go-pill {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: #C9701B;
          background: rgba(224,142,43,0.1); border: 1px solid rgba(224,142,43,0.24);
          padding: 8px 14px; border-radius: 999px; white-space: nowrap;
        }
        .go-pill i { width: 6px; height: 6px; border-radius: 50%; background: #C9701B; }

        /* ---- Section label ---- */
        .go-label { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
        .go-label h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.01em; color: #33413A; }
        .go-label .go-count { font-size: 12px; color: #8A968F; font-variant-numeric: tabular-nums; }
        .go-label .go-line { flex: 1; height: 1px; background: #ECEAE2; }

        /* ---- Hub cards: horizontal-scroll row, not a table ---- */
        .go-hub-row {
          display: flex; gap: 16px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 56px;
          scroll-snap-type: x proximity;
        }
        .go-hub-card {
          scroll-snap-align: start; flex: 0 0 240px;
          background: #FFFFFF; border: 1px solid #ECEAE2; border-radius: 16px; padding: 20px;
        }
        .go-hub-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .go-hub-icon {
          width: 32px; height: 32px; border-radius: 9px; flex: none;
          background: rgba(20,107,92,0.1); color: #146B5C;
          display: flex; align-items: center; justify-content: center;
        }
        .go-hub-card h4 { margin: 0; font-size: 14.5px; font-weight: 700; letter-spacing: -0.01em; }

        .go-stepper { display: flex; align-items: center; gap: 0; margin-bottom: 14px; }
        .go-step-btn {
          width: 34px; height: 34px; border-radius: 9px; border: 1px solid #DEDCD3; background: #FFFFFF;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: border-color .12s ease, background-color .12s ease;
        }
        .go-step-btn:hover { border-color: #146B5C; background: rgba(20,107,92,0.06); }
        .go-step-val {
          flex: 1; text-align: center; font-family: 'Sora', sans-serif; font-weight: 700;
          font-size: 22px; font-variant-numeric: tabular-nums; color: #1B2420;
        }
        .go-slot-label { font-size: 12px; color: #8A968F; margin-bottom: 8px; }

        .go-save {
          width: 100%; background: #146B5C; color: #FFFFFF; padding: 9px 0;
          border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer;
          transition: background-color .12s ease;
        }
        .go-save:hover { background: #0F5548; }

        .go-empty {
          padding: 32px; text-align: center; font-size: 14px; color: #8A968F;
          background: #FFFFFF; border: 1px dashed #DEDCD3; border-radius: 16px; width: 100%;
        }

        /* ---- Booking queue: vertical timeline list ---- */
        .go-queue { display: flex; flex-direction: column; }
        .go-item {
          display: flex; gap: 16px; padding: 18px 4px;
          border-bottom: 1px solid #ECEAE2;
        }
        .go-item:last-child { border-bottom: none; }

        .go-rail { display: flex; flex-direction: column; align-items: center; padding-top: 3px; }
        .go-rail i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
        .go-rail-pending i { background: #E08E2B; box-shadow: 0 0 0 4px rgba(224,142,43,0.15); }
        .go-rail-approved i { background: #146B5C; box-shadow: 0 0 0 4px rgba(20,107,92,0.13); }

        .go-item-body { flex: 1; min-width: 0; }
        .go-item-top { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 4px; }
        .go-item-id { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14.5px; }
        .go-badge {
          font-size: 11.5px; font-weight: 700; letter-spacing: 0.01em;
          padding: 3px 9px; border-radius: 999px;
        }
        .go-badge-pending { background: rgba(224,142,43,0.12); color: #C9701B; }
        .go-badge-approved { background: rgba(20,107,92,0.1); color: #146B5C; }
        .go-item-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: #5B6B63; margin-bottom: 2px; }
        .go-item-meta span { display: inline-flex; align-items: center; gap: 6px; }
        .go-nic { font-size: 12.5px; color: #8A968F; font-variant-numeric: tabular-nums; }

        .go-approve {
          flex: none; align-self: center;
          background: #E08E2B; color: #FFFFFF; border: none; cursor: pointer;
          padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 7px;
          transition: background-color .12s ease;
        }
        .go-approve:hover { background: #C9701B; }

        @media (max-width: 760px) {
          .go-page { padding: 28px 18px 64px; }
          .go-bar { padding: 14px 18px; }
          .go-item { flex-wrap: wrap; }
          .go-approve { width: 100%; justify-content: center; margin-top: 8px; }
        }
        @media (prefers-reduced-motion: reduce) { .go-root * { transition: none !important; } }
      `}</style>

      {/* Top bar */}
      <div className="go-bar">
        <div className="go-brand">
          <div className="go-mark">
            <Sun size={17} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="go-display">Grid Operator</h1>
            <span>Solar Microgrid network</span>
          </div>
        </div>
        <button onClick={logout} className="go-btn go-quiet">Sign out</button>
      </div>

      <div className="go-page">

        {/* Headline */}
        <div className="go-head">
          <div>
            <h2 className="go-display">Hub console</h2>
            <p>Keep battery capacity current and clear bookings as prosumers arrive.</p>
          </div>
          {pendingCount > 0 && (
            <span className="go-pill"><i />{pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting approval</span>
          )}
        </div>

        {/* Hub cards */}
        <div className="go-label">
          <h3>BATTERY SLOT AVAILABILITY</h3>
          <span className="go-line" />
          <span className="go-count">{nodes.length} hub{nodes.length === 1 ? '' : 's'}</span>
        </div>

        {nodes.length === 0 ? (
          <div className="go-empty" style={{ marginBottom: 56 }}>No grid nodes available. Backoffice must create them.</div>
        ) : (
          <div className="go-hub-row">
            {nodes.map(n => (
              <div key={n.id} className="go-hub-card">
                <div className="go-hub-top">
                  <div className="go-hub-icon"><Battery size={16} /></div>
                  <h4>{n.name}</h4>
                </div>
                <div className="go-slot-label">Available slots</div>
                <div className="go-stepper">
                  <button
                    className="go-step-btn"
                    onClick={() => setSlotInputs({ ...slotInputs, [n.id]: Math.max(0, parseInt(slotInputs[n.id] ?? n.availableBatterySlots) - 1) })}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={slotInputs[n.id] ?? n.availableBatterySlots}
                    onChange={(e) => setSlotInputs({ ...slotInputs, [n.id]: e.target.value })}
                    className="go-step-val"
                    style={{ border: 'none', background: 'transparent', width: '100%' }}
                  />
                  <button
                    className="go-step-btn"
                    onClick={() => setSlotInputs({ ...slotInputs, [n.id]: parseInt(slotInputs[n.id] ?? n.availableBatterySlots) + 1 })}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => handleUpdateSlots(n)} className="go-save">Update</button>
              </div>
            ))}
          </div>
        )}

        {/* Booking queue */}
        <div className="go-label">
          <h3>POWER TRADING BOOKINGS</h3>
          <span className="go-line" />
          <span className="go-count">{reservations.length} total</span>
        </div>

        {reservations.length === 0 ? (
          <div className="go-empty">No active power trading bookings found.</div>
        ) : (
          <div className="go-queue">
            {reservations.map(r => (
              <div key={r.id} className="go-item">
                <div className="go-rail">
                  <i className={r.status === 'Approved' ? 'go-rail-approved' : 'go-rail-pending'} />
                </div>
                <div className="go-item-body">
                  <div className="go-item-top">
                    <span className="go-item-id">Reservation {r.id}</span>
                    <span className={`go-badge ${r.status === 'Approved' ? 'go-badge-approved' : 'go-badge-pending'}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="go-item-meta">
                    <span><Clock size={13} />{new Date(r.scheduledTime).toLocaleString()}</span>
                    <span><Battery size={13} />{r.energyAmountKwh} kWh</span>
                  </div>
                  <div className="go-nic">Prosumer NIC {r.prosumerNic}</div>
                </div>
                {r.status === 'Pending' && (
                  <button onClick={() => handleApproveReservation(r.id)} className="go-approve">
                    <QrCode size={15} /> Approve
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}