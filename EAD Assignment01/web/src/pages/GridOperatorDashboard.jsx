import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Minus, Plus, Battery, Clock, QrCode, MapPin, BatteryCharging, Zap,
  Hourglass, CheckCircle2, Ticket, User,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Real photography (Pexels, free to use). Swap the IDs to change    */
/*  any picture. If an image fails to load, a green gradient is shown */
/* ------------------------------------------------------------------ */
const px = (id, w = 1400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const HERO_PHOTO = 15751124; // field of solar panels
const HUB_PHOTOS = [18316987, 12243093, 356049, 9729882];

function Photo({ id, w = 1200, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`go-photo-fallback ${className}`} aria-hidden="true" />;
  return (
    <img
      className={className}
      src={px(id, w)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}

/* ------------------------------ Charts ----------------------------- */

function niceCeil(max) {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
}

const sunAt = h => (h < 5.5 || h > 19.5 ? 0 : Math.exp(-Math.pow(h - 12.5, 2) / (2 * 2.7 * 2.7)));

/* Smooth area/line chart: energy per day */
function EnergyChart({ data }) {
  const W = 640, H = 240, L = 46, R = 18, T = 26, B = 36;
  if (!data.length) {
    return <div className="go-chart-empty">Bookings will draw the energy timeline here.</div>;
  }
  const top = niceCeil(Math.max(...data.map(d => d.value)));
  const base = H - B;
  const x0 = L + 26, x1 = W - R - 26;
  const xAt = i => (data.length === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (data.length - 1));
  const yAt = v => T + (1 - v / top) * (base - T);
  const pts = data.map((d, i) => [xAt(i), yAt(d.value)]);

  let line = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1][0] + pts[i][0]) / 2;
    line += ` C ${mx} ${pts[i - 1][1]}, ${mx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
  }
  const area = `${line} L ${pts[pts.length - 1][0]} ${base} L ${pts[0][0]} ${base} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="go-chart" role="img" aria-label="Energy booked per day in kilowatt hours">
      <defs>
        <linearGradient id="goArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#146B5C" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#146B5C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, top / 2, top].map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} stroke="#E1E8E4" strokeDasharray={t === 0 ? '0' : '4 6'} />
          <text x={L - 10} y={yAt(t) + 4} textAnchor="end" fontSize="11" fill="#6B7A72">{Number(t.toFixed(1))}</text>
        </g>
      ))}
      {data.length > 1 && <path d={area} fill="url(#goArea)" />}
      {data.length > 1 && <path d={line} fill="none" stroke="#146B5C" strokeWidth="3" strokeLinecap="round" />}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={pts[i][0]} cy={pts[i][1]} r="6" fill="#FFFFFF" stroke="#E08E2B" strokeWidth="3">
            <title>{`${d.label}: ${Number(d.value.toFixed(1))} kWh`}</title>
          </circle>
          <text x={pts[i][0]} y={pts[i][1] - 14} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#14201B">
            {Number(d.value.toFixed(1))}
          </text>
          <text x={pts[i][0]} y={H - 12} textAnchor="middle" fontSize="11" fill="#6B7A72">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

/* Energy booked by hour of day, with a faint typical-sun curve behind it */
function HourChart({ hours }) {
  const W = 640, H = 230, L = 40, R = 12, T = 22, B = 32;
  const total = hours.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <div className="go-chart-empty">Once bookings arrive, you will see which hours are busiest.</div>;
  }
  const top = niceCeil(Math.max(...hours));
  const base = H - B;
  const slot = (W - L - R) / 24;
  const bw = slot * 0.62;
  const yAt = v => T + (1 - v / top) * (base - T);
  const peak = hours.indexOf(Math.max(...hours));
  const labels = { 0: '12a', 3: '3a', 6: '6a', 9: '9a', 12: '12p', 15: '3p', 18: '6p', 21: '9p' };

  let sun = '';
  for (let h = 0; h < 24; h += 0.5) {
    const x = L + (h / 24) * (W - L - R);
    const y = base - sunAt(h) * (base - T) * 0.95;
    sun += `${sun ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="go-chart" role="img" aria-label="Energy booked by hour of day in kilowatt hours">
      {[0, top / 2, top].map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} stroke="#E1E8E4" strokeDasharray={t === 0 ? '0' : '4 6'} />
          <text x={L - 8} y={yAt(t) + 4} textAnchor="end" fontSize="11" fill="#6B7A72">{Number(t.toFixed(1))}</text>
        </g>
      ))}
      <path d={sun} fill="none" stroke="#E08E2B" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" opacity="0.7" />
      {hours.map((v, h) => (
        <g key={h}>
          <rect
            x={L + h * slot + (slot - bw) / 2} y={yAt(v)} width={bw} height={Math.max(base - yAt(v), v > 0 ? 3 : 0)}
            rx="4" fill={h === peak ? '#E08E2B' : '#146B5C'} opacity={v > 0 ? 1 : 0}
          >
            <title>{`${h}:00 – ${h + 1}:00: ${Number(v.toFixed(1))} kWh`}</title>
          </rect>
          {labels[h] && <text x={L + h * slot + slot / 2} y={H - 10} textAnchor="middle" fontSize="11" fill="#6B7A72">{labels[h]}</text>}
        </g>
      ))}
    </svg>
  );
}

function StatusDonut({ segments, total }) {
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  const active = segments.filter(s => s.value > 0);
  return (
    <svg viewBox="0 0 140 140" className="go-donut" role="img" aria-label="Bookings by status">
      <circle cx="70" cy="70" r={R} fill="none" stroke="#EDF2EF" strokeWidth="16" />
      {total > 0 && active.map(s => {
        const len = (s.value / total) * C;
        const dash = Math.max(len - (active.length > 1 ? 4 : 0), 0.1);
        const el = (
          <circle
            key={s.name} cx="70" cy="70" r={R} fill="none" stroke={s.color} strokeWidth="16"
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        );
        offset += len;
        return el;
      })}
      <text x="70" y="68" textAnchor="middle" fontSize="26" fontWeight="700" fill="#14201B" fontFamily="Sora, sans-serif">{total}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#6B7A72">{total === 1 ? 'booking' : 'bookings'}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export default function GridOperatorDashboard() {
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [slotInputs, setSlotInputs] = useState({});
  const [activeTab, setActiveTab] = useState('hubs');
  const [filter, setFilter] = useState('All');
  const [loaded, setLoaded] = useState(false);
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
    } finally {
      setLoaded(true);
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

  /* ---------- derived data for stats and charts ---------- */
  const statusClass = (s) => s === 'Approved' ? 'go-on' : s === 'Pending' ? 'go-pending' : 'go-closed';
  const statusGroup = (s) => (s === 'Approved' || s === 'Pending' ? s : 'Other');
  const fmt = (v) => Number(v.toFixed(1)).toLocaleString();
  const kwhOf = (r) => Number(r.energyAmountKwh) || 0;

  const counts = {
    Approved: reservations.filter(r => r.status === 'Approved').length,
    Pending: pendingCount,
  };
  counts.Other = reservations.length - counts.Approved - counts.Pending;
  const totalKwh = reservations.reduce((s, r) => s + kwhOf(r), 0);
  const pendingKwh = reservations.filter(r => r.status === 'Pending').reduce((s, r) => s + kwhOf(r), 0);
  const maxKwh = Math.max(...reservations.map(kwhOf), 1);

  const totalSlots = nodes.reduce((s, n) => s + (Number(n.availableBatterySlots) || 0), 0);
  const maxSlots = Math.max(...nodes.map(n => Number(n.availableBatterySlots) || 0), 1);

  const energyByDay = (() => {
    const map = new Map();
    reservations.forEach(r => {
      const d = new Date(r.scheduledTime);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + kwhOf(r));
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, value]) => ({
        label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value,
      }));
  })();

  const kwhByHour = (() => {
    const hours = Array(24).fill(0);
    reservations.forEach(r => {
      const d = new Date(r.scheduledTime);
      if (!isNaN(d)) hours[d.getHours()] += kwhOf(r);
    });
    return hours;
  })();

  // Needs-attention first: pending, then approved, then the rest; soonest slot first
  const rank = (s) => (s === 'Pending' ? 0 : s === 'Approved' ? 1 : 2);
  const visible = [...reservations]
    .sort((a, b) => rank(a.status) - rank(b.status) || new Date(a.scheduledTime) - new Date(b.scheduledTime))
    .filter(r => filter === 'All' || statusGroup(r.status) === filter);

  const hasNodeRef = reservations.some(r => r.microgridNodeId !== undefined && r.microgridNodeId !== null);
  const hubName = (r) =>
    r.microgridNodeName || r.microgridNode?.name ||
    nodes.find(n => String(n.id) === String(r.microgridNodeId))?.name;

  return (
    <div className="go-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .go-root {
          --green: #146B5C; --green-d: #0F5548; --forest: #0B3F36;
          --amber: #E08E2B; --amber-d: #C9701B; --amber-text: #A65A0E;
          --ink: #14201B; --body: #43524B; --muted: #5F6F67;
          --line: #E1E8E4; --bg: #F3F6F4; --card: #FFFFFF;
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .go-root *, .go-root *::before, .go-root *::after { box-sizing: border-box; }
        .go-display { font-family: 'Sora', 'Inter', sans-serif; }
        .go-root button { font: inherit; }
        .go-root :focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
        .go-photo-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #146B5C, #0B3F36); }

        /* ---- Top bar ---- */
        .go-bar {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 40px;
          background: rgba(255,255,255,0.86);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .go-brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .go-mark {
          width: 36px; height: 36px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #146B5C, #0F5548);
          display: flex; align-items: center; justify-content: center;
        }
        .go-brand h1 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
        .go-brand span { font-size: 12.5px; color: var(--muted); white-space: nowrap; }

        .go-btn {
          font-size: 13px; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border-radius: 9px; border: 1px solid transparent;
          transition: background-color .12s ease, border-color .12s ease, color .12s ease, transform .1s ease;
        }
        .go-btn:active { transform: translateY(1px); }
        .go-quiet { background: #FFFFFF; border-color: #D6DED9; color: #33413A; }
        .go-quiet:hover { border-color: var(--ink); }

        .go-tabs-header { display: flex; gap: 4px; padding: 4px; background: #E8EEEA; border-radius: 12px; }
        .go-tab {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          padding: 8px 16px; border: none; background: transparent;
          color: var(--muted); border-radius: 9px;
          transition: color .15s ease, background-color .15s ease, box-shadow .15s ease;
        }
        .go-tab:hover { color: var(--ink); }
        .go-tab.active { color: var(--ink); background: #FFFFFF; box-shadow: 0 1px 3px rgba(20,32,27,0.14); }
        .go-tab-count {
          min-width: 20px; padding: 1px 6px; border-radius: 999px; font-size: 11.5px; font-weight: 700;
          background: rgba(224,142,43,0.2); color: var(--amber-text); text-align: center;
        }

        /* ---- Page shell ---- */
        .go-page { max-width: 1320px; margin: 0 auto; padding: 32px 40px 72px; }

        /* ---- Photo hero ---- */
        .go-hero {
          position: relative; overflow: hidden; color: #FFFFFF;
          border-radius: 28px; min-height: 360px; padding: 44px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
          background: var(--forest);
        }
        .go-hero-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          animation: go-settle 2.2s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes go-settle { from { transform: scale(1.08); } to { transform: scale(1); } }
        .go-hero-shade {
          position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(8,42,36,0.94) 0%, rgba(8,42,36,0.74) 44%, rgba(8,42,36,0.12) 100%);
        }
        .go-hero > *:not(.go-hero-img):not(.go-hero-shade) { position: relative; }
        .go-hero h2 {
          margin: 0; max-width: 16ch; font-size: clamp(32px, 4.4vw, 54px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.04;
        }
        .go-hero p { margin: 16px 0 0; max-width: 48ch; font-size: 16px; line-height: 1.65; color: rgba(255,255,255,0.82); }
        .go-hero-top { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; }

        .go-alert {
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-size: 13px; font-weight: 700; color: #FFFFFF; white-space: nowrap;
          background: rgba(224,142,43,0.85); border: 1px solid rgba(255,255,255,0.35);
          padding: 9px 15px; border-radius: 999px;
          transition: background-color .12s ease;
        }
        .go-alert:hover { background: #E08E2B; }
        .go-alert i { width: 7px; height: 7px; border-radius: 50%; background: #FFFFFF; }

        .go-glass-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .go-glass {
          display: flex; align-items: center; gap: 12px; padding: 14px 18px; min-width: 190px;
          background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(10px); border-radius: 16px;
        }
        .go-glass-ic {
          width: 38px; height: 38px; border-radius: 11px; flex: none;
          background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center;
        }
        .go-glass b { display: block; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.1; }
        .go-glass small { font-size: 12.5px; color: rgba(255,255,255,0.78); }

        /* ---- Section head ---- */
        .go-sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 40px 0 16px; }
        .go-sec-head h3 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .go-sec-head span { font-size: 13px; color: var(--muted); }

        .go-empty {
          padding: 44px; text-align: center; font-size: 14px; color: var(--muted);
          background: var(--card); border: 1px dashed #C9D4CE; border-radius: 16px; grid-column: 1 / -1;
        }

        /* ---- Hub cards ---- */
        .go-hubs { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
        .go-hub {
          overflow: hidden; background: var(--card); border: 1px solid var(--line); border-radius: 22px;
          display: flex; flex-direction: column;
        }
        .go-hub-img { position: relative; height: 150px; background: var(--forest); }
        .go-hub-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .go-hub-pill {
          position: absolute; left: 14px; bottom: 14px; display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
          background: rgba(255,255,255,0.94); color: var(--green);
        }
        .go-hub-pill.low { color: var(--amber-text); }
        .go-hub-pill.full { color: #7A2E2E; }
        .go-hub-body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1; }
        .go-hub-name { margin: 0 0 4px; font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
        .go-hub-loc { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--muted); min-height: 18px; margin-bottom: 14px; }

        .go-meter { height: 6px; border-radius: 999px; background: #E8EEEA; overflow: hidden; }
        .go-meter > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #146B5C, #2FA58F); }
        .go-meter.amber > i { background: linear-gradient(90deg, #E08E2B, #F2B15A); }
        .go-meter-cap { display: flex; justify-content: space-between; margin: 7px 0 16px; font-size: 12px; color: var(--muted); }

        .go-slot-label { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; font-weight: 600; color: var(--body); margin-bottom: 8px; }
        .go-dirty { font-size: 11.5px; font-weight: 700; color: var(--amber-text); background: rgba(224,142,43,0.16); padding: 2px 8px; border-radius: 999px; }

        .go-stepper { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; padding: 6px; background: #F3F6F4; border-radius: 14px; }
        .go-step-btn {
          width: 40px; height: 40px; border-radius: 10px; border: 1px solid #D6DED9; background: #FFFFFF; color: var(--ink);
          display: flex; align-items: center; justify-content: center; cursor: pointer; flex: none;
          transition: border-color .12s ease, background-color .12s ease;
        }
        .go-step-btn:hover { border-color: var(--green); background: rgba(20,107,92,0.06); }
        .go-step-val {
          flex: 1; min-width: 0; width: 100%; text-align: center; border: none; background: transparent;
          font-family: 'Sora', sans-serif; font-weight: 700; font-size: 24px; font-variant-numeric: tabular-nums; color: var(--ink);
          -moz-appearance: textfield;
        }
        .go-step-val::-webkit-outer-spin-button, .go-step-val::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .go-step-val:focus { outline: none; }

        .go-save {
          width: 100%; background: var(--green); color: #FFFFFF; padding: 11px 0;
          border-radius: 11px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; margin-top: auto;
          transition: background-color .12s ease;
        }
        .go-save:hover { background: var(--green-d); }
        .go-save.dirty { background: var(--amber); }
        .go-save.dirty:hover { background: var(--amber-d); }
        .go-hub-demand { display: flex; align-items: center; gap: 6px; margin: -4px 0 14px; font-size: 12.5px; color: var(--muted); }

        /* ---- Cards + charts ---- */
        .go-charts { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: 16px; }
        .go-card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 24px; }
        .go-card h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
        .go-card > p { margin: 4px 0 16px; font-size: 13px; color: var(--muted); }
        .go-chart { width: 100%; height: auto; display: block; }
        .go-chart-empty { padding: 56px 16px; text-align: center; font-size: 14px; color: var(--muted); background: #F7FAF8; border-radius: 14px; }
        .go-key { display: flex; align-items: center; gap: 8px; margin-top: 10px; font-size: 12px; color: var(--muted); }
        .go-key i { width: 22px; border-top: 2px dotted var(--amber); display: inline-block; }

        .go-caps { display: flex; flex-direction: column; gap: 14px; max-height: 260px; overflow-y: auto; padding-right: 4px; }
        .go-cap { display: grid; grid-template-columns: minmax(0, 1fr) 34px; gap: 4px 12px; align-items: center; }
        .go-cap-name { font-size: 13.5px; font-weight: 600; color: var(--body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .go-cap b { grid-row: 1; grid-column: 2; text-align: right; font-family: 'Sora', sans-serif; font-size: 15px; }
        .go-cap .go-meter { grid-column: 1 / -1; height: 8px; }

        .go-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .go-donut { width: 170px; height: 170px; }
        .go-legend { width: 100%; display: flex; flex-direction: column; gap: 9px; }
        .go-legend div { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: var(--body); }
        .go-legend span { display: inline-flex; align-items: center; gap: 8px; }
        .go-legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
        .go-legend b { color: var(--ink); font-variant-numeric: tabular-nums; }

        /* ---- Stats ---- */
        .go-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 28px; }
        .go-stat { display: flex; align-items: center; gap: 14px; padding: 18px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; }
        .go-stat-ic { width: 44px; height: 44px; border-radius: 13px; flex: none; display: flex; align-items: center; justify-content: center; }
        .go-stat-ic.g { background: rgba(20,107,92,0.12); color: var(--green); }
        .go-stat-ic.a { background: rgba(224,142,43,0.16); color: var(--amber-text); }
        .go-stat b { display: block; font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
        .go-stat small { font-size: 12.5px; color: var(--muted); }

        /* ---- Filter chips ---- */
        .go-list-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 40px 0 16px; }
        .go-list-head h3 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .go-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .go-chip {
          cursor: pointer; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
          border: 1px solid #D6DED9; background: #FFFFFF; color: var(--body);
          transition: background-color .12s ease, color .12s ease, border-color .12s ease;
        }
        .go-chip:hover { border-color: var(--ink); }
        .go-chip.active { background: var(--ink); border-color: var(--ink); color: #FFFFFF; }

        /* ---- Booking queue ---- */
        .go-queue { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 16px; }
        .go-item { display: flex; background: var(--card); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; }
        .go-item-date {
          width: 76px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
          border-right: 1px dashed #CBD6CF; padding: 14px 6px;
        }
        .go-item-date.go-on { background: rgba(20,107,92,0.08); color: var(--green); }
        .go-item-date.go-pending { background: rgba(224,142,43,0.12); color: var(--amber-text); }
        .go-item-date.go-closed { background: #F1F4F2; color: var(--muted); }
        .go-item-date b { font-family: 'Sora', sans-serif; font-size: 26px; line-height: 1; }
        .go-item-date span { font-size: 12px; font-weight: 600; }

        .go-item-body { flex: 1; min-width: 0; padding: 16px 18px; }
        .go-item-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .go-item-id { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14.5px; }
        .go-badge { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .go-badge.go-on { background: rgba(20,107,92,0.12); color: var(--green); }
        .go-badge.go-pending { background: rgba(224,142,43,0.16); color: var(--amber-text); }
        .go-badge.go-closed { background: #ECEFED; color: var(--muted); }
        .go-item-hub { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: var(--body); margin-bottom: 6px; }
        .go-item-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: var(--muted); }
        .go-item-meta span { display: inline-flex; align-items: center; gap: 6px; }
        .go-item .go-meter { margin-top: 12px; }
        .go-nic { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }

        .go-approve {
          margin-top: 14px; background: var(--amber); color: #FFFFFF; border: none; cursor: pointer;
          padding: 9px 16px; border-radius: 10px; font-size: 13px; font-weight: 700;
          display: inline-flex; align-items: center; gap: 7px;
          transition: background-color .12s ease;
        }
        .go-approve:hover { background: var(--amber-d); }

        .go-foot { margin-top: 48px; text-align: center; font-size: 12px; color: var(--muted); }

        @media (max-width: 1100px) {
          .go-stats { grid-template-columns: repeat(2, 1fr); }
          .go-charts { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .go-queue { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .go-page { padding: 20px 16px 64px; }
          .go-bar { padding: 12px 16px; flex-wrap: wrap; }
          .go-tabs-header { order: 3; width: 100%; }
          .go-tab { flex: 1; justify-content: center; }
          .go-hero { padding: 26px 22px; min-height: 340px; border-radius: 22px; }
          .go-glass { min-width: 0; flex: 1 1 100%; }
          .go-stats { grid-template-columns: 1fr; }
          .go-item-date { width: 64px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .go-root * { transition: none !important; }
          .go-hero-img { animation: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="go-bar">
        <div className="go-brand">
          <div className="go-mark">
            <Sun size={18} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h1 className="go-display">Grid Operator</h1>
            <span>Solar Microgrid network</span>
          </div>
        </div>

        <div className="go-tabs-header" role="tablist">
          <button role="tab" aria-selected={activeTab === 'hubs'} className={`go-tab ${activeTab === 'hubs' ? 'active' : ''}`} onClick={() => setActiveTab('hubs')}>Battery Slots</button>
          <button role="tab" aria-selected={activeTab === 'bookings'} className={`go-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            Bookings
            {pendingCount > 0 && <span className="go-tab-count">{pendingCount}</span>}
          </button>
        </div>

        <button onClick={logout} className="go-btn go-quiet">Sign out</button>
      </div>

      <div className="go-page">

        {/* Photo hero */}
        <section className="go-hero">
          <Photo id={HERO_PHOTO} w={1800} eager className="go-hero-img" alt="A field of solar panels" />
          <div className="go-hero-shade" />
          <div className="go-hero-top">
            <div>
              <h2 className="go-display">Hub console</h2>
              <p>Keep battery capacity current and clear bookings as prosumers arrive.</p>
            </div>
            {pendingCount > 0 && (
              <button className="go-alert" onClick={() => setActiveTab('bookings')}>
                <i />{pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting approval
              </button>
            )}
          </div>
          <div className="go-glass-row">
            <div className="go-glass">
              <div className="go-glass-ic"><MapPin size={18} /></div>
              <div><b>{nodes.length}</b><small>{nodes.length === 1 ? 'Hub' : 'Hubs'} on the network</small></div>
            </div>
            <div className="go-glass">
              <div className="go-glass-ic"><BatteryCharging size={18} /></div>
              <div><b>{totalSlots}</b><small>Battery slots open</small></div>
            </div>
            <div className="go-glass">
              <div className="go-glass-ic"><Hourglass size={18} /></div>
              <div><b>{fmt(pendingKwh)} kWh</b><small>Waiting for approval</small></div>
            </div>
          </div>
        </section>

        {/* ============================ BATTERY SLOTS TAB ============================ */}
        {activeTab === 'hubs' && (
          <>
            <div className="go-sec-head">
              <h3 className="go-display">Battery slot availability</h3>
              <span>{nodes.length} hub{nodes.length === 1 ? '' : 's'}</span>
            </div>

            {nodes.length === 0 ? (
              loaded && <div className="go-empty">No grid nodes available. Backoffice must create them.</div>
            ) : (
              <div className="go-hubs">
                {nodes.map((n, i) => {
                  const saved = Number(n.availableBatterySlots) || 0;
                  const draft = slotInputs[n.id] ?? n.availableBatterySlots;
                  const dirty = String(draft) !== String(n.availableBatterySlots);
                  const tone = saved <= 0 ? 'full' : saved <= 3 ? 'low' : '';
                  const hubRes = hasNodeRef ? reservations.filter(r => String(r.microgridNodeId) === String(n.id)) : [];
                  const hubPending = hubRes.filter(r => r.status === 'Pending').length;
                  return (
                    <div className="go-hub" key={n.id}>
                      <div className="go-hub-img">
                        <Photo id={HUB_PHOTOS[i % HUB_PHOTOS.length]} w={700} alt="" />
                        <span className={`go-hub-pill ${tone}`}>
                          <Battery size={13} />
                          {saved <= 0 ? 'Full' : saved <= 3 ? `Only ${saved} left` : `${saved} slots open`}
                        </span>
                      </div>
                      <div className="go-hub-body">
                        <h4 className="go-hub-name">{n.name}</h4>
                        <div className="go-hub-loc">
                          {(n.location || n.address) && <><MapPin size={12} />{n.location || n.address}</>}
                        </div>

                        <div className={`go-meter ${tone ? 'amber' : ''}`}>
                          <i style={{ width: `${Math.max((saved / maxSlots) * 100, saved > 0 ? 6 : 0)}%` }} />
                        </div>
                        <div className="go-meter-cap"><span>Capacity</span><span>{saved} of {maxSlots} slots</span></div>

                        {hasNodeRef && (
                          <div className="go-hub-demand">
                            <Ticket size={13} />
                            {hubRes.length} booking{hubRes.length === 1 ? '' : 's'}{hubPending > 0 && ` · ${hubPending} pending`}
                          </div>
                        )}

                        <div className="go-slot-label">
                          <span>Available slots</span>
                          {dirty && <span className="go-dirty">Unsaved · was {n.availableBatterySlots}</span>}
                        </div>
                        <div className="go-stepper">
                          <button
                            type="button" aria-label="Remove one slot" className="go-step-btn"
                            onClick={() => setSlotInputs({ ...slotInputs, [n.id]: Math.max(0, parseInt(slotInputs[n.id] ?? n.availableBatterySlots) - 1) })}
                          >
                            <Minus size={15} />
                          </button>
                          <input
                            type="number"
                            aria-label={`Available slots for ${n.name}`}
                            value={slotInputs[n.id] ?? n.availableBatterySlots}
                            onChange={(e) => setSlotInputs({ ...slotInputs, [n.id]: e.target.value })}
                            className="go-step-val"
                          />
                          <button
                            type="button" aria-label="Add one slot" className="go-step-btn"
                            onClick={() => setSlotInputs({ ...slotInputs, [n.id]: parseInt(slotInputs[n.id] ?? n.availableBatterySlots) + 1 })}
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                        <button onClick={() => handleUpdateSlots(n)} className={`go-save ${dirty ? 'dirty' : ''}`}>
                          {dirty ? 'Save new slot count' : 'Update'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Insights */}
            <div className="go-sec-head">
              <h3 className="go-display">Capacity and demand</h3>
            </div>
            <div className="go-charts">
              <div className="go-card">
                <h3 className="go-display">When prosumers drop off</h3>
                <p>kWh booked by hour of day. The dotted line is a typical sunny-day output curve.</p>
                <HourChart hours={kwhByHour} />
                <div className="go-key"><i />Typical solar output (illustrative)</div>
              </div>
              <div className="go-card">
                <h3 className="go-display">Slots by hub</h3>
                <p>Open battery slots right now.</p>
                {nodes.length === 0 ? (
                  <div className="go-chart-empty">Hubs will appear here.</div>
                ) : (
                  <div className="go-caps">
                    {nodes.map(n => {
                      const s = Number(n.availableBatterySlots) || 0;
                      return (
                        <div className="go-cap" key={n.id}>
                          <span className="go-cap-name">{n.name}</span>
                          <b>{s}</b>
                          <div className={`go-meter ${s <= 3 ? 'amber' : ''}`}><i style={{ width: `${Math.max((s / maxSlots) * 100, s > 0 ? 6 : 0)}%` }} /></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================ BOOKINGS TAB ============================ */}
        {activeTab === 'bookings' && (
          <>
            <div className="go-stats">
              <div className="go-stat">
                <div className="go-stat-ic g"><Ticket size={20} /></div>
                <div><b>{reservations.length}</b><small>Total bookings</small></div>
              </div>
              <div className="go-stat">
                <div className="go-stat-ic a"><Hourglass size={20} /></div>
                <div><b>{counts.Pending}</b><small>Awaiting approval</small></div>
              </div>
              <div className="go-stat">
                <div className="go-stat-ic g"><CheckCircle2 size={20} /></div>
                <div><b>{counts.Approved}</b><small>Approved</small></div>
              </div>
              <div className="go-stat">
                <div className="go-stat-ic a"><Zap size={20} /></div>
                <div><b>{fmt(totalKwh)}</b><small>kWh across all bookings</small></div>
              </div>
            </div>

            <div className="go-charts" style={{ marginTop: 16 }}>
              <div className="go-card">
                <h3 className="go-display">Energy timeline</h3>
                <p>kWh booked per day, latest {Math.min(energyByDay.length || 8, 8)} booking days.</p>
                <EnergyChart data={energyByDay} />
              </div>
              <div className="go-card">
                <h3 className="go-display">Status split</h3>
                <p>Where the queue stands.</p>
                <div className="go-donut-wrap">
                  <StatusDonut
                    total={reservations.length}
                    segments={[
                      { name: 'Approved', value: counts.Approved, color: '#146B5C' },
                      { name: 'Pending', value: counts.Pending, color: '#E08E2B' },
                      { name: 'Other', value: counts.Other, color: '#C4CFC9' },
                    ]}
                  />
                  <div className="go-legend">
                    <div><span><i style={{ background: '#146B5C' }} />Approved</span><b>{counts.Approved}</b></div>
                    <div><span><i style={{ background: '#E08E2B' }} />Pending</span><b>{counts.Pending}</b></div>
                    <div><span><i style={{ background: '#C4CFC9' }} />Other</span><b>{counts.Other}</b></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="go-list-head">
              <h3 className="go-display">Power trading bookings</h3>
              <div className="go-chips">
                {['All', 'Pending', 'Approved', 'Other'].map(f => (
                  <button key={f} className={`go-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f} {f === 'All' ? reservations.length : counts[f]}
                  </button>
                ))}
              </div>
            </div>

            {reservations.length === 0 ? (
              loaded && <div className="go-empty">No active power trading bookings found.</div>
            ) : visible.length === 0 ? (
              <div className="go-empty">No {filter.toLowerCase()} bookings.</div>
            ) : (
              <div className="go-queue">
                {visible.map(r => {
                  const d = new Date(r.scheduledTime);
                  const name = hubName(r);
                  return (
                    <div key={r.id} className="go-item">
                      <div className={`go-item-date ${statusClass(r.status)}`}>
                        <span>{d.toLocaleString(undefined, { month: 'short' })}</span>
                        <b>{d.getDate()}</b>
                        <span>{d.toLocaleString(undefined, { weekday: 'short' })}</span>
                      </div>
                      <div className="go-item-body">
                        <div className="go-item-top">
                          <span className="go-item-id">Reservation {r.id}</span>
                          <span className={`go-badge ${statusClass(r.status)}`}>{r.status}</span>
                        </div>
                        {name && <div className="go-item-hub"><MapPin size={13} />{name}</div>}
                        <div className="go-item-meta">
                          <span><Clock size={13} />{d.toLocaleString()}</span>
                          <span><Battery size={13} />{r.energyAmountKwh} kWh</span>
                        </div>
                        <div className={`go-meter ${r.status === 'Pending' ? 'amber' : ''}`} title={`${kwhOf(r)} kWh`}>
                          <i style={{ width: `${Math.max((kwhOf(r) / maxKwh) * 100, 4)}%` }} />
                        </div>
                        <div className="go-nic"><User size={13} />Prosumer NIC {r.prosumerNic}</div>
                        {r.status === 'Pending' && (
                          <button onClick={() => handleApproveReservation(r.id)} className="go-approve">
                            <QrCode size={15} /> Approve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <div className="go-foot">Photography from Pexels</div>
      </div>
    </div>
  );
}