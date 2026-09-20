import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sun, Zap, CalendarClock, QrCode, X } from 'lucide-react';

export default function ProsumerDashboard() {
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [energyAmount, setEnergyAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user || user.role !== 'Prosumer') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const nodesRes = await axios.get('http://localhost:5199/api/nodes');
      // Only show active nodes
      setNodes(nodesRes.data.filter(n => n.isActive));

      const resRes = await axios.get(`http://localhost:5199/api/reservations/prosumer/${user.nic}`);
      setReservations(resRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const newBooking = {
        prosumerNic: user.nic,
        microgridNodeId: selectedNode,
        scheduledTime: new Date(scheduledDate).toISOString(),
        energyAmountKwh: parseFloat(energyAmount)
      };

      await axios.post('http://localhost:5199/api/reservations', newBooking);
      alert("Booking created successfully!");
      setEnergyAmount('');
      setScheduledDate('');
      fetchData();
    } catch (e) {
      if (e.response && e.response.data) {
        alert(e.response.data); // Shows the 7-day rule error from backend
      } else {
        alert("Failed to create booking.");
      }
    }
  };

  const handleCancelBooking = async (id) => {
    try {
      await axios.delete(`http://localhost:5199/api/reservations/${id}`);
      fetchData();
    } catch (e) {
      if (e.response && e.response.data) {
        alert(e.response.data); // Shows 12-hour rule error from backend
      } else {
        alert("Failed to cancel booking.");
      }
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const statusClass = (s) => s === 'Approved' ? 'pr-on' : s === 'Pending' ? 'pr-pending' : 'pr-closed';

  return (
    <div className="pr-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .pr-root {
          min-height: 100vh;
          background:
            radial-gradient(900px 480px at 6% -10%, rgba(224,142,43,0.13), transparent 65%),
            radial-gradient(900px 520px at 100% 4%, rgba(20,107,92,0.10), transparent 60%),
            #FBFAF7;
          color: #1B2420;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .pr-root *, .pr-root *::before, .pr-root *::after { box-sizing: border-box; }
        .pr-display { font-family: 'Sora', 'Inter', sans-serif; }

        /* ---- Top bar ---- */
        .pr-bar {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 18px 40px;
          background: rgba(251,250,247,0.9);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid #ECEAE2;
        }
        .pr-brand { display: flex; align-items: center; gap: 12px; }
        .pr-mark {
          width: 34px; height: 34px; border-radius: 9px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 14px rgba(224,142,43,0.26);
        }
        .pr-brand h1 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
        .pr-brand span { font-size: 12.5px; color: #6B7A72; }

        .pr-user { display: flex; align-items: center; gap: 12px; }
        .pr-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex: none;
          background: #146B5C; color: #FFFFFF; font-size: 12.5px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif;
        }
        .pr-user span { font-size: 13.5px; font-weight: 600; color: #33413A; }
        .pr-btn {
          font: inherit; font-size: 13px; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border-radius: 8px; border: 1px solid #DEDCD3; background: #FFFFFF; color: #33413A;
          transition: border-color .12s ease;
        }
        .pr-btn:hover { border-color: #1B2420; }
        .pr-btn:focus-visible { outline: 2px solid #146B5C; outline-offset: 2px; }

        /* ---- Page shell: full width ---- */
        .pr-page { max-width: 1320px; margin: 0 auto; padding: 52px 40px 96px; }

        /* ---- Hero: two columns, pass + illustration ---- */
        .pr-hero {
          display: grid; grid-template-columns: minmax(0, 480px) 1fr;
          gap: 48px; align-items: center; margin-bottom: 64px;
        }
        .pr-greet h2 {
          margin: 0; font-size: clamp(30px, 4vw, 44px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.06;
        }
        .pr-greet p { margin: 14px 0 28px; max-width: 42ch; font-size: 15.5px; line-height: 1.65; color: #5B6B63; }

        /* ---- Booking pass ---- */
        .pr-pass {
          position: relative;
          background: #146B5C;
          border-radius: 20px;
          padding: 26px 26px 22px;
          color: #FFFFFF;
          box-shadow: 0 18px 40px rgba(20,107,92,0.24);
          overflow: hidden;
        }
        .pr-pass::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(240px 160px at 100% 0%, rgba(255,255,255,0.10), transparent 60%);
          pointer-events: none;
        }
        .pr-pass-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .pr-pass-top h3 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
        .pr-pass-icon {
          width: 30px; height: 30px; border-radius: 8px; background: rgba(255,255,255,0.14);
          display: flex; align-items: center; justify-content: center;
        }

        .pr-field { margin-bottom: 16px; }
        .pr-field label {
          display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.01em;
          color: rgba(255,255,255,0.72); margin-bottom: 7px;
        }
        .pr-field select, .pr-field input {
          width: 100%; font: inherit; font-size: 14.5px; color: #FFFFFF;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.22);
          border-radius: 9px; padding: 11px 13px;
          transition: border-color .12s ease, background-color .12s ease;
        }
        .pr-field select option { color: #1B2420; }
        .pr-field select:focus, .pr-field input:focus {
          outline: none; border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.16);
        }
        .pr-field input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.8; }

        .pr-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .pr-perf { display: flex; align-items: center; gap: 6px; margin: 20px -26px 18px; padding: 0 26px; }
        .pr-perf .pr-dash { flex: 1; height: 1px; background: repeating-linear-gradient(90deg, rgba(255,255,255,0.35) 0 6px, transparent 6px 12px); }

        .pr-confirm {
          width: 100%; background: #E08E2B; color: #FFFFFF; border: none; cursor: pointer;
          padding: 13px 0; border-radius: 10px; font-size: 14.5px; font-weight: 700;
          transition: background-color .12s ease, transform .1s ease;
        }
        .pr-confirm:hover { background: #C9701B; }
        .pr-confirm:active { transform: translateY(1px); }

        /* ---- Illustration panel ---- */
        .pr-art {
          border-radius: 24px; background: #FFFFFF; border: 1px solid #ECEAE2;
          padding: 20px; display: flex; align-items: center; justify-content: center;
          min-height: 420px;
        }
        .pr-art svg { width: 100%; height: auto; max-width: 460px; }

        /* ---- Section label ---- */
        .pr-label { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .pr-label h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.01em; color: #33413A; }
        .pr-label .pr-line { flex: 1; height: 1px; background: #ECEAE2; }
        .pr-label .pr-count { font-size: 12px; color: #8A968F; font-variant-numeric: tabular-nums; }

        /* ---- Reservation stub cards: responsive grid ---- */
        .pr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .pr-stub {
          position: relative;
          display: flex; background: #FFFFFF; border: 1px solid #ECEAE2; border-radius: 14px;
          overflow: hidden;
        }
        .pr-stub-rail { width: 6px; flex: none; }
        .pr-stub-rail.pr-on { background: #146B5C; }
        .pr-stub-rail.pr-pending { background: #E08E2B; }
        .pr-stub-rail.pr-closed { background: #C9C6B8; }

        .pr-stub-body { flex: 1; padding: 18px 20px; min-width: 0; }
        .pr-stub-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
        .pr-stub-id { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14px; }
        .pr-badge { font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
        .pr-badge.pr-on { background: rgba(20,107,92,0.1); color: #146B5C; }
        .pr-badge.pr-pending { background: rgba(224,142,43,0.12); color: #C9701B; }
        .pr-badge.pr-closed { background: #F2F1EA; color: #8A968F; }

        .pr-stub-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: #5B6B63; margin-bottom: 2px; }
        .pr-stub-meta span { display: inline-flex; align-items: center; gap: 6px; }

        .pr-qr {
          margin-top: 12px; padding: 10px 12px; background: #FBFAF7; border: 1px dashed #DEDCD3;
          border-radius: 9px; font-size: 11.5px; word-break: break-all; color: #33413A;
        }
        .pr-qr b { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #146B5C; margin-bottom: 5px; }

        .pr-cancel {
          margin-top: 12px; display: inline-flex; align-items: center; gap: 6px;
          background: #FFFFFF; border: 1px solid rgba(201,112,27,0.4); color: #C9701B;
          padding: 7px 13px; border-radius: 8px; font-size: 12.5px; font-weight: 600; cursor: pointer;
          transition: background-color .12s ease, border-color .12s ease;
        }
        .pr-cancel:hover { background: rgba(201,112,27,0.08); border-color: #C9701B; }

        .pr-empty {
          padding: 44px; text-align: center; font-size: 14px; color: #8A968F;
          background: #FFFFFF; border: 1px dashed #DEDCD3; border-radius: 14px; grid-column: 1 / -1;
        }

        @media (max-width: 980px) {
          .pr-hero { grid-template-columns: 1fr; }
          .pr-art { min-height: 280px; order: -1; }
        }
        @media (max-width: 640px) {
          .pr-page { padding: 36px 20px 72px; }
          .pr-bar { padding: 14px 20px; }
          .pr-row2 { grid-template-columns: 1fr; }
          .pr-user span { display: none; }
        }
        @media (prefers-reduced-motion: reduce) { .pr-root * { transition: none !important; } }
      `}</style>

      {/* Top bar */}
      <div className="pr-bar">
        <div className="pr-brand">
          <div className="pr-mark">
            <Sun size={17} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="pr-display">Prosumer</h1>
            <span>Solar Microgrid network</span>
          </div>
        </div>
        <div className="pr-user">
          <div className="pr-avatar">{initials}</div>
          <span>{user?.name}</span>
          <button onClick={logout} className="pr-btn">Sign out</button>
        </div>
      </div>

      <div className="pr-page">

        {/* Hero: greeting + pass on the left, illustration on the right */}
        <div className="pr-hero">
          <div>
            <div className="pr-greet">
              <h2 className="pr-display">Reserve your next drop-off</h2>
              <p>Pick a hub with room for your energy, choose a time, and confirm. Your slot is held until the hub scans your pass.</p>
            </div>

            <form onSubmit={handleCreateBooking} className="pr-pass">
              <div className="pr-pass-top">
                <h3>New reservation</h3>
                <div className="pr-pass-icon"><Zap size={15} /></div>
              </div>

              <div className="pr-field">
                <label>Grid hub</label>
                <select value={selectedNode} onChange={e => setSelectedNode(e.target.value)} required>
                  <option value="">Choose a hub</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name} — {n.availableBatterySlots} slots available</option>
                  ))}
                </select>
              </div>

              <div className="pr-row2">
                <div className="pr-field">
                  <label>Energy amount (kWh)</label>
                  <input type="number" step="0.1" value={energyAmount} onChange={e => setEnergyAmount(e.target.value)} required />
                </div>
                <div className="pr-field" style={{ marginBottom: 0 }}>
                  <label>Date &amp; time</label>
                  <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
                </div>
              </div>

              <div className="pr-perf"><span className="pr-dash" /></div>

              <button type="submit" className="pr-confirm">Confirm reservation</button>
            </form>
          </div>

          {/* Original inline illustration — solar hub with panels, sun and an energy pulse to the grid */}
          <div className="pr-art">
            <svg viewBox="0 0 460 420" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="360" cy="70" r="46" fill="#E08E2B" opacity="0.14" />
              <circle cx="360" cy="70" r="30" fill="#E08E2B" />
              <g stroke="#E08E2B" strokeWidth="4" strokeLinecap="round" opacity="0.55">
                <line x1="360" y1="8" x2="360" y2="22" />
                <line x1="360" y1="118" x2="360" y2="132" />
                <line x1="298" y1="70" x2="312" y2="70" />
                <line x1="408" y1="70" x2="422" y2="70" />
                <line x1="317" y1="27" x2="326" y2="36" />
                <line x1="394" y1="104" x2="403" y2="113" />
                <line x1="403" y1="27" x2="394" y2="36" />
                <line x1="326" y1="104" x2="317" y2="113" />
              </g>

              <rect x="30" y="330" width="400" height="10" rx="5" fill="#146B5C" opacity="0.16" />

              <g transform="translate(40,180)">
                <path d="M0 150 L40 40 H190 L230 150 Z" fill="#146B5C" />
                <g fill="#FBFAF7" opacity="0.92">
                  <rect x="55" y="64" width="34" height="24" rx="2" transform="skewX(-8)" />
                  <rect x="98" y="64" width="34" height="24" rx="2" transform="skewX(-8)" />
                  <rect x="141" y="64" width="34" height="24" rx="2" transform="skewX(-8)" />
                  <rect x="48" y="98" width="38" height="24" rx="2" transform="skewX(-8)" />
                  <rect x="95" y="98" width="38" height="24" rx="2" transform="skewX(-8)" />
                  <rect x="142" y="98" width="38" height="24" rx="2" transform="skewX(-8)" />
                </g>
                <rect x="105" y="150" width="20" height="26" fill="#0F5548" />
              </g>

              <g transform="translate(260,190)">
                <rect x="0" y="70" width="130" height="90" rx="10" fill="#FFFFFF" stroke="#ECEAE2" strokeWidth="2" />
                <rect x="14" y="86" width="102" height="14" rx="3" fill="#E08E2B" />
                <rect x="14" y="108" width="70" height="10" rx="3" fill="#DEDCD3" />
                <rect x="14" y="126" width="86" height="10" rx="3" fill="#DEDCD3" />
                <circle cx="108" cy="132" r="10" fill="#146B5C" opacity="0.12" />
                <path d="M105 127 L109 132 L116 124" stroke="#146B5C" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              <path d="M230 205 C260 205 250 215 285 215" stroke="#E08E2B" strokeWidth="3" strokeDasharray="2 8" strokeLinecap="round" />
              <circle cx="285" cy="215" r="4" fill="#E08E2B" />
            </svg>
          </div>
        </div>

        {/* Reservation history */}
        <div className="pr-label">
          <h3>YOUR RESERVATIONS</h3>
          <span className="pr-line" />
          <span className="pr-count">{reservations.length} total</span>
        </div>

        <div className="pr-grid">
          {reservations.length === 0 && <div className="pr-empty">You have no reservations yet.</div>}
          {reservations.map(r => (
            <div key={r.id} className="pr-stub">
              <div className={`pr-stub-rail ${statusClass(r.status)}`} />
              <div className="pr-stub-body">
                <div className="pr-stub-top">
                  <span className="pr-stub-id">Booking {r.id}</span>
                  <span className={`pr-badge ${statusClass(r.status)}`}>{r.status}</span>
                </div>
                <div className="pr-stub-meta">
                  <span><CalendarClock size={13} />{new Date(r.scheduledTime).toLocaleString()}</span>
                  <span><Zap size={13} />{r.energyAmountKwh} kWh</span>
                </div>

                {r.qrCodeData && (
                  <div className="pr-qr">
                    <b><QrCode size={13} />Secure QR token</b>
                    {r.qrCodeData}
                  </div>
                )}

                {r.status === 'Pending' && (
                  <button onClick={() => handleCancelBooking(r.id)} className="pr-cancel">
                    <X size={13} /> Cancel booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}