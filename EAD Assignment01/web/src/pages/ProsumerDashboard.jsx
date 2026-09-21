import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sun, Zap, CalendarClock, QrCode, X, MapPin, BatteryCharging, Leaf,
  Clock, ShieldCheck, Copy, Check, Ticket, Hourglass,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Real photography (Pexels, free to use). Swap the IDs to change    */
/*  any picture. If an image fails to load, a green gradient is shown */
/* ------------------------------------------------------------------ */
const px = (id, w = 1400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const PHOTO = {
  heroField: 18316987,   // rows of solar panels
  heroRoof: 12243093,    // house with rooftop solar
};
const HUB_PHOTOS = [15751124, 12243093, 356049, 9729882];

// Rough grid emission factor used for the "CO2 avoided" estimate. Change to your country's value.
const CO2_KG_PER_KWH = 0.5;

function Photo({ id, w = 1200, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`pr-photo-fallback ${className}`} aria-hidden="true" />;
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

function EnergyChart({ data }) {
  const W = 640, H = 240, L = 46, R = 18, T = 26, B = 36;
  if (!data.length) {
    return <div className="pr-chart-empty">Book a drop-off and your energy timeline will appear here.</div>;
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
  const ticks = [0, top / 2, top];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pr-chart" role="img" aria-label="Energy booked per day in kilowatt hours">
      <defs>
        <linearGradient id="prArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#146B5C" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#146B5C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map(t => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={yAt(t)} y2={yAt(t)} stroke="#E1E8E4" strokeDasharray={t === 0 ? '0' : '4 6'} />
          <text x={L - 10} y={yAt(t) + 4} textAnchor="end" fontSize="11" fill="#6B7A72">{Number(t.toFixed(1))}</text>
        </g>
      ))}
      {data.length > 1 && <path d={area} fill="url(#prArea)" />}
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

function StatusDonut({ segments, total }) {
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  const active = segments.filter(s => s.value > 0);
  return (
    <svg viewBox="0 0 140 140" className="pr-donut" role="img" aria-label="Reservations by status">
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

/* A typical sunny-day output curve. The amber marker follows the time chosen in the form. */
function SunCurve({ hour }) {
  const sun = h => (h < 5.5 || h > 19.5 ? 0 : Math.exp(-Math.pow(h - 12.5, 2) / (2 * 2.7 * 2.7)));
  const xOf = h => 12 + ((h - 5) / 15) * 296;
  const yOf = v => 68 - v * 54;
  const pts = [];
  for (let h = 5; h <= 20; h += 0.5) pts.push([xOf(h), yOf(sun(h))]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${xOf(20)} 68 L ${xOf(5)} 68 Z`;

  let caption = 'Pick a time to see how strong the sun is at your slot.';
  let marker = null;
  if (hour !== null) {
    const v = sun(hour);
    const label = v >= 0.75 ? 'Peak sun' : v >= 0.4 ? 'Good sun' : v > 0.05 ? 'Low sun' : 'After dark';
    const hh = Math.floor(hour), mm = Math.round((hour - hh) * 60);
    const time = new Date(2000, 0, 1, hh, mm).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    caption = `${label} at ${time}`;
    if (hour >= 5 && hour <= 20) marker = { x: xOf(hour), y: yOf(v) };
  }

  return (
    <div className="pr-sun">
      <svg viewBox="0 0 320 84" role="img" aria-label="Typical solar output through the day">
        <path d={area} fill="rgba(255,255,255,0.14)" />
        <path d={line} fill="none" stroke="#F2B15A" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" x2="308" y1="68" y2="68" stroke="rgba(255,255,255,0.3)" />
        {marker && (
          <g>
            <line x1={marker.x} x2={marker.x} y1={marker.y} y2="68" stroke="#F2B15A" strokeDasharray="3 4" />
            <circle cx={marker.x} cy={marker.y} r="9" fill="#E08E2B" opacity="0.3" />
            <circle cx={marker.x} cy={marker.y} r="5" fill="#E08E2B" stroke="#FFFFFF" strokeWidth="2" />
          </g>
        )}
        <g fontSize="9.5" fill="rgba(255,255,255,0.7)" textAnchor="middle">
          <text x={xOf(6)} y="80">6 AM</text>
          <text x={xOf(12)} y="80">12 PM</text>
          <text x={xOf(18)} y="80">6 PM</text>
        </g>
      </svg>
      <div className="pr-sun-cap"><Sun size={13} />{caption}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function ProsumerDashboard() {
  const [nodes, setNodes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedNode, setSelectedNode] = useState('');
  const [energyAmount, setEnergyAmount] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [activeTab, setActiveTab] = useState('reserve');
  const [filter, setFilter] = useState('All');
  const [copied, setCopied] = useState(null);
  const [loaded, setLoaded] = useState(false);

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
    } finally {
      setLoaded(true);
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

  const copyToken = async (r) => {
    try {
      await navigator.clipboard.writeText(r.qrCodeData);
      setCopied(r.id);
      setTimeout(() => setCopied(null), 1600);
    } catch (e) {
      console.error(e);
    }
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const statusClass = (s) => s === 'Approved' ? 'pr-on' : s === 'Pending' ? 'pr-pending' : 'pr-closed';
  const statusGroup = (s) => (s === 'Approved' || s === 'Pending' ? s : 'Other');

  /* ---------- derived data for stats and charts ---------- */
  const totalKwh = reservations.reduce((sum, r) => sum + (Number(r.energyAmountKwh) || 0), 0);
  const maxKwh = Math.max(...reservations.map(r => Number(r.energyAmountKwh) || 0), 1);
  const counts = {
    Approved: reservations.filter(r => r.status === 'Approved').length,
    Pending: reservations.filter(r => r.status === 'Pending').length,
  };
  counts.Other = reservations.length - counts.Approved - counts.Pending;
  const co2 = totalKwh * CO2_KG_PER_KWH;
  const fmt = (v) => Number(v.toFixed(1)).toLocaleString();

  const energyByDay = (() => {
    const map = new Map();
    reservations.forEach(r => {
      const d = new Date(r.scheduledTime);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      map.set(key, (map.get(key) || 0) + (Number(r.energyAmountKwh) || 0));
    });
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8)
      .map(([key, value]) => ({
        label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value,
      }));
  })();

  const visible = [...reservations]
    .sort((a, b) => new Date(b.scheduledTime) - new Date(a.scheduledTime))
    .filter(r => filter === 'All' || statusGroup(r.status) === filter);

  const totalSlots = nodes.reduce((sum, n) => sum + (Number(n.availableBatterySlots) || 0), 0);
  const maxSlots = Math.max(...nodes.map(n => Number(n.availableBatterySlots) || 0), 1);

  const hubName = (r) =>
    r.microgridNodeName || r.microgridNode?.name ||
    nodes.find(n => String(n.id) === String(r.microgridNodeId))?.name;

  const pickedHour = (() => {
    if (!scheduledDate) return null;
    const d = new Date(scheduledDate);
    return isNaN(d) ? null : d.getHours() + d.getMinutes() / 60;
  })();
  const estCo2 = parseFloat(energyAmount) > 0 ? parseFloat(energyAmount) * CO2_KG_PER_KWH : 0;

  return (
    <div className="pr-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .pr-root {
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
        .pr-root *, .pr-root *::before, .pr-root *::after { box-sizing: border-box; }
        .pr-display { font-family: 'Sora', 'Inter', sans-serif; }
        .pr-root button { font: inherit; }
        .pr-root :focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }

        .pr-photo-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #146B5C, #0B3F36); }

        /* ---- Top bar ---- */
        .pr-bar {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 40px; width: 100%;
          background: rgba(255,255,255,0.86); backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .pr-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink); }
        .pr-mark {
          width: 38px; height: 38px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
        }
        .pr-brand h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
        .pr-brand span { display: block; margin-top: 1px; font-size: 12px; color: var(--muted); }

        .pr-tabs-header { display: flex; gap: 4px; }
        .pr-tab {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border: none; background: transparent;
          color: var(--muted); border-radius: 9px;
          transition: color .12s ease, background-color .12s ease;
        }
        .pr-tab:hover { color: var(--ink); background: #E8EEEA; }
        .pr-tab.active { color: var(--ink); background: transparent; }
        .pr-tab-count {
          min-width: 20px; padding: 1px 6px; border-radius: 999px; font-size: 11.5px; font-weight: 700;
          background: rgba(20,107,92,0.12); color: var(--green); text-align: center;
        }

        .pr-user { display: flex; align-items: center; gap: 10px; }
        .pr-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex: none;
          background: var(--green); color: #FFFFFF; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif;
        }
        .pr-user span { font-size: 13.5px; font-weight: 600; color: #33413A; }
        .pr-btn {
          font-size: 14px; font-weight: 600; cursor: pointer;
          padding: 9px 16px; border-radius: 9px; border: 1px solid #D6DED9; background: #FFFFFF; color: var(--ink);
          transition: background-color .12s ease;
        }
        .pr-btn:hover { background: #E8EEEA; border-color: transparent; }

        /* ---- Page shell ---- */
        .pr-page { max-width: 1320px; margin: 0 auto; padding: 32px 40px 72px; }

        /* ---- Photo hero ---- */
        .pr-hero {
          position: relative; overflow: hidden; color: #FFFFFF;
          border-radius: 28px; min-height: 400px; padding: 44px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
          background: var(--forest);
        }
        .pr-hero.pr-hero-short { min-height: 300px; }
        .pr-hero-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          animation: pr-settle 2.2s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes pr-settle { from { transform: scale(1.08); } to { transform: scale(1); } }
        .pr-hero-shade {
          position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(8,42,36,0.94) 0%, rgba(8,42,36,0.74) 44%, rgba(8,42,36,0.12) 100%);
        }
        .pr-hero > *:not(.pr-hero-img):not(.pr-hero-shade) { position: relative; }
        .pr-hero h2 {
          margin: 0; max-width: 16ch; font-size: clamp(32px, 4.4vw, 54px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.04;
        }
        .pr-hero p { margin: 16px 0 0; max-width: 48ch; font-size: 16px; line-height: 1.65; color: rgba(255,255,255,0.82); }

        .pr-glass-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .pr-glass {
          display: flex; align-items: center; gap: 12px; padding: 14px 18px; min-width: 190px;
          background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(10px); border-radius: 16px;
        }
        .pr-glass-ic {
          width: 38px; height: 38px; border-radius: 11px; flex: none;
          background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center;
        }
        .pr-glass b { display: block; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.1; }
        .pr-glass small { font-size: 12.5px; color: rgba(255,255,255,0.78); }

        /* ---- Two-column layout ---- */
        .pr-split { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 32px; margin-top: 36px; align-items: start; }
        .pr-side { display: flex; flex-direction: column; gap: 20px; }

        .pr-sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
        .pr-sec-head h3 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .pr-sec-head span { font-size: 13px; color: var(--muted); }

        /* ---- Hub photo cards ---- */
        .pr-hubs { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
        .pr-hub {
          padding: 0; text-align: left; cursor: pointer; overflow: hidden;
          background: var(--card); border: 1px solid var(--line); border-radius: 20px;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .pr-hub:hover { border-color: #B9C8C0; }
        .pr-hub.sel { border-color: var(--green); box-shadow: 0 0 0 3px rgba(20,107,92,0.18); }
        .pr-hub-img { position: relative; height: 136px; background: var(--forest); }
        .pr-hub-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pr-hub-pill {
          position: absolute; left: 12px; bottom: 12px; display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 700;
          background: rgba(255,255,255,0.94); color: var(--green);
        }
        .pr-hub-pill.low { color: var(--amber-text); }
        .pr-hub-pill.full { color: #7A2E2E; }
        .pr-hub-check {
          position: absolute; top: 12px; right: 12px; width: 26px; height: 26px; border-radius: 50%;
          background: var(--green); color: #FFFFFF; display: none; align-items: center; justify-content: center;
        }
        .pr-hub.sel .pr-hub-check { display: flex; }
        .pr-hub-body { padding: 14px 16px 16px; }
        .pr-hub-name { margin: 0 0 4px; font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
        .pr-hub-loc { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--muted); margin-bottom: 12px; min-height: 18px; }
        .pr-meter { height: 6px; border-radius: 999px; background: #E8EEEA; overflow: hidden; }
        .pr-meter > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #146B5C, #2FA58F); }
        .pr-meter.amber > i { background: linear-gradient(90deg, #E08E2B, #F2B15A); }
        .pr-meter-cap { display: flex; justify-content: space-between; margin-top: 7px; font-size: 12px; color: var(--muted); }

        /* ---- How it works ---- */
        .pr-how { margin-top: 32px; background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 26px; }
        .pr-how h3 { margin: 0 0 18px; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
        .pr-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .pr-step-n {
          width: 30px; height: 30px; border-radius: 50%; margin-bottom: 12px;
          background: rgba(224,142,43,0.16); color: var(--amber-text);
          display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700;
        }
        .pr-steps strong { display: block; font-size: 14.5px; margin-bottom: 4px; }
        .pr-steps p { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--body); }
        .pr-rules { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; padding-top: 22px; border-top: 1px solid var(--line); }
        .pr-rule { display: flex; gap: 12px; align-items: flex-start; }
        .pr-rule-ic {
          width: 34px; height: 34px; border-radius: 10px; flex: none; background: rgba(20,107,92,0.1); color: var(--green);
          display: flex; align-items: center; justify-content: center;
        }
        .pr-rule b { display: block; font-size: 13.5px; margin-bottom: 2px; }
        .pr-rule span { font-size: 12.5px; line-height: 1.5; color: var(--muted); }

        .pr-empty {
          padding: 44px; text-align: center; font-size: 14px; color: var(--muted);
          background: var(--card); border: 1px dashed #C9D4CE; border-radius: 16px; grid-column: 1 / -1;
        }
        .pr-empty .pr-btn { margin-top: 14px; }

        /* ---- Booking pass ---- */
        .pr-pass {
          position: relative; overflow: hidden; color: #FFFFFF;
          background: var(--green); border-radius: 24px; padding: 28px 26px 24px;
          box-shadow: 0 22px 44px rgba(20,107,92,0.26);
        }
        .pr-pass-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .pr-pass-top h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; }
        .pr-pass-icon {
          width: 32px; height: 32px; border-radius: 9px; background: rgba(255,255,255,0.16);
          display: flex; align-items: center; justify-content: center;
        }
        .pr-field { margin-bottom: 16px; }
        .pr-field label { display: block; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 7px; }
        .pr-field select, .pr-field input {
          width: 100%; font: inherit; font-size: 14.5px; color: #FFFFFF;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.26);
          border-radius: 10px; padding: 11px 13px;
          transition: border-color .12s ease, background-color .12s ease;
        }
        .pr-field select option { color: var(--ink); }
        .pr-field select:focus, .pr-field input:focus {
          outline: none; border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.16);
        }
        .pr-field input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.8; }
        .pr-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .pr-sun { margin-top: 4px; padding: 12px 14px 10px; background: rgba(0,0,0,0.14); border-radius: 14px; }
        .pr-sun svg { width: 100%; height: auto; display: block; }
        .pr-sun-cap { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 12.5px; font-weight: 600; color: #F7D9AB; }

        .pr-perf { position: relative; margin: 22px -26px 18px; padding: 0 26px; }
        .pr-perf::before, .pr-perf::after {
          content: ''; position: absolute; top: 50%; width: 20px; height: 20px; margin-top: -10px;
          border-radius: 50%; background: var(--bg);
        }
        .pr-perf::before { left: -10px; }
        .pr-perf::after { right: -10px; }
        .pr-dash { display: block; height: 1px; background: repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0 6px, transparent 6px 12px); }

        .pr-est { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; font-size: 13px; color: rgba(255,255,255,0.8); }
        .pr-est b { display: inline-flex; align-items: center; gap: 6px; color: #FFFFFF; font-weight: 700; }
        .pr-confirm {
          width: 100%; background: var(--amber); color: #FFFFFF; border: none; cursor: pointer;
          padding: 14px 0; border-radius: 12px; font-size: 15px; font-weight: 700;
          transition: background-color .12s ease, transform .1s ease;
        }
        .pr-confirm:hover { background: var(--amber-d); }
        .pr-confirm:active { transform: translateY(1px); }

        /* ---- Stats ---- */
        .pr-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 28px; }
        .pr-stat { display: flex; align-items: center; gap: 14px; padding: 18px; background: var(--card); border: 1px solid var(--line); border-radius: 18px; }
        .pr-stat-ic { width: 44px; height: 44px; border-radius: 13px; flex: none; display: flex; align-items: center; justify-content: center; }
        .pr-stat-ic.g { background: rgba(20,107,92,0.12); color: var(--green); }
        .pr-stat-ic.a { background: rgba(224,142,43,0.16); color: var(--amber-text); }
        .pr-stat b { display: block; font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
        .pr-stat small { font-size: 12.5px; color: var(--muted); }

        /* ---- Charts ---- */
        .pr-charts { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: 16px; margin-top: 16px; }
        .pr-card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 24px; }
        .pr-card h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
        .pr-card > p { margin: 4px 0 16px; font-size: 13px; color: var(--muted); }
        .pr-chart { width: 100%; height: auto; display: block; }
        .pr-chart-empty { padding: 56px 16px; text-align: center; font-size: 14px; color: var(--muted); background: #F7FAF8; border-radius: 14px; }
        .pr-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .pr-donut { width: 170px; height: 170px; }
        .pr-legend { width: 100%; display: flex; flex-direction: column; gap: 9px; }
        .pr-legend div { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: var(--body); }
        .pr-legend span { display: inline-flex; align-items: center; gap: 8px; }
        .pr-legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
        .pr-legend b { color: var(--ink); font-variant-numeric: tabular-nums; }

        /* ---- Filter chips ---- */
        .pr-list-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin: 40px 0 16px; }
        .pr-list-head h3 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .pr-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .pr-chip {
          cursor: pointer; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
          border: 1px solid #D6DED9; background: #FFFFFF; color: var(--body);
          transition: background-color .12s ease, color .12s ease, border-color .12s ease;
        }
        .pr-chip:hover { border-color: var(--ink); }
        .pr-chip.active { background: var(--ink); border-color: var(--ink); color: #FFFFFF; }

        /* ---- Reservation ticket cards ---- */
        .pr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
        .pr-stub { display: flex; background: var(--card); border: 1px solid var(--line); border-radius: 18px; overflow: hidden; }
        .pr-stub-date {
          width: 76px; flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
          border-right: 1px dashed #CBD6CF; padding: 14px 6px;
        }
        .pr-stub-date.pr-on { background: rgba(20,107,92,0.08); color: var(--green); }
        .pr-stub-date.pr-pending { background: rgba(224,142,43,0.12); color: var(--amber-text); }
        .pr-stub-date.pr-closed { background: #F1F4F2; color: var(--muted); }
        .pr-stub-date b { font-family: 'Sora', sans-serif; font-size: 26px; line-height: 1; }
        .pr-stub-date span { font-size: 12px; font-weight: 600; }

        .pr-stub-body { flex: 1; padding: 16px 18px; min-width: 0; }
        .pr-stub-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .pr-stub-id { font-family: 'Sora', sans-serif; font-weight: 700; font-size: 14.5px; }
        .pr-badge { font-size: 11.5px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
        .pr-badge.pr-on { background: rgba(20,107,92,0.12); color: var(--green); }
        .pr-badge.pr-pending { background: rgba(224,142,43,0.16); color: var(--amber-text); }
        .pr-badge.pr-closed { background: #ECEFED; color: var(--muted); }

        .pr-stub-hub { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: var(--body); margin-bottom: 6px; }
        .pr-stub-meta { display: flex; flex-wrap: wrap; gap: 14px; font-size: 13px; color: var(--muted); }
        .pr-stub-meta span { display: inline-flex; align-items: center; gap: 6px; }
        .pr-stub .pr-meter { margin-top: 12px; }

        .pr-qr {
          margin-top: 14px; padding: 10px 12px; background: #F7FAF8; border: 1px dashed #C9D4CE;
          border-radius: 10px; font-size: 11.5px; word-break: break-all; color: #33413A;
        }
        .pr-qr-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
        .pr-qr-head b { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: var(--green); }
        .pr-copy {
          display: inline-flex; align-items: center; gap: 5px; cursor: pointer; padding: 3px 9px; border-radius: 7px;
          border: 1px solid #D6DED9; background: #FFFFFF; color: #33413A; font-size: 11.5px; font-weight: 600;
        }
        .pr-copy:hover { border-color: var(--ink); }

        .pr-cancel {
          margin-top: 14px; display: inline-flex; align-items: center; gap: 6px;
          background: #FFFFFF; border: 1px solid rgba(201,112,27,0.45); color: var(--amber-text);
          padding: 7px 13px; border-radius: 9px; font-size: 12.5px; font-weight: 600; cursor: pointer;
          transition: background-color .12s ease, border-color .12s ease;
        }
        .pr-cancel:hover { background: rgba(201,112,27,0.08); border-color: var(--amber-d); }

        .pr-foot { margin-top: 48px; text-align: center; font-size: 12px; color: var(--muted); }

        @media (min-width: 1100px) and (min-height: 780px) {
          .pr-side { position: sticky; top: 92px; }
        }
        @media (max-width: 1100px) {
          .pr-split { grid-template-columns: 1fr; }
          .pr-stats { grid-template-columns: repeat(2, 1fr); }
          .pr-charts { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .pr-steps, .pr-rules { grid-template-columns: 1fr; }
          .pr-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .pr-page { padding: 20px 16px 64px; }
          .pr-bar { padding: 12px 16px; flex-wrap: wrap; }
          .pr-tabs-header { order: 3; width: 100%; }
          .pr-tab { flex: 1; justify-content: center; }
          .pr-hero { padding: 26px 22px; min-height: 360px; border-radius: 22px; }
          .pr-glass { min-width: 0; flex: 1 1 100%; }
          .pr-row2 { grid-template-columns: 1fr; }
          .pr-user span { display: none; }
          .pr-stats { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pr-root * { transition: none !important; }
          .pr-hero-img { animation: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="pr-bar">
        <Link to="/" className="pr-brand">
          <div className="pr-mark">
            <Sun size={19} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="pr-display">Solar Microgrid</h2>
            <span>Peer-to-peer energy trading</span>
          </div>
        </Link>

        <div className="pr-tabs-header" role="tablist">
          <button role="tab" aria-selected={activeTab === 'reserve'} className={`pr-tab ${activeTab === 'reserve' ? 'active' : ''}`} onClick={() => setActiveTab('reserve')}>Reserve Drop-off</button>
          <button role="tab" aria-selected={activeTab === 'history'} className={`pr-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            My Reservations
            {reservations.length > 0 && <span className="pr-tab-count">{reservations.length}</span>}
          </button>
        </div>

        <div className="pr-user">
          <button onClick={logout} className="pr-btn">Sign out</button>
        </div>
      </div>

      <div className="pr-page">

        {/* ============================ RESERVE TAB ============================ */}
        {activeTab === 'reserve' && (
          <>
            <section className="pr-hero">
              <Photo id={PHOTO.heroField} w={1800} eager className="pr-hero-img" alt="Rows of solar panels in a field" />
              <div className="pr-hero-shade" />
              <div>
                <h2 className="pr-display">Reserve your next drop-off</h2>
                <p>Pick a hub with room for your energy, choose a time, and confirm. Your slot is held until the hub scans your pass.</p>
              </div>
              <div className="pr-glass-row">
                <div className="pr-glass">
                  <div className="pr-glass-ic"><MapPin size={18} /></div>
                  <div><b>{nodes.length}</b><small>Active hubs</small></div>
                </div>
                <div className="pr-glass">
                  <div className="pr-glass-ic"><BatteryCharging size={18} /></div>
                  <div><b>{totalSlots}</b><small>Battery slots open</small></div>
                </div>
                <div className="pr-glass">
                  <div className="pr-glass-ic"><Zap size={18} /></div>
                  <div><b>{fmt(totalKwh)} kWh</b><small>Booked by you</small></div>
                </div>
              </div>
            </section>

            <div className="pr-split">
              {/* Left: hub picker + how it works */}
              <div>
                <div className="pr-sec-head">
                  <h3 className="pr-display">Choose a hub</h3>
                  <span>{nodes.length} available</span>
                </div>

                <div className="pr-hubs">
                  {loaded && nodes.length === 0 && (
                    <div className="pr-empty">No hubs are active right now. Check back soon — new hubs appear here as soon as they go live.</div>
                  )}
                  {nodes.map((n, i) => {
                    const slots = Number(n.availableBatterySlots) || 0;
                    const sel = String(n.id) === String(selectedNode);
                    const tone = slots <= 0 ? 'full' : slots <= 3 ? 'low' : '';
                    return (
                      <button
                        type="button" key={n.id}
                        className={`pr-hub ${sel ? 'sel' : ''}`}
                        aria-pressed={sel}
                        onClick={() => setSelectedNode(String(n.id))}
                      >
                        <div className="pr-hub-img">
                          <Photo id={HUB_PHOTOS[i % HUB_PHOTOS.length]} w={700} alt="" />
                          <span className={`pr-hub-pill ${tone}`}>
                            <BatteryCharging size={13} />
                            {slots <= 0 ? 'Full' : slots <= 3 ? `Only ${slots} left` : `${slots} slots open`}
                          </span>
                          <span className="pr-hub-check"><Check size={15} strokeWidth={3} /></span>
                        </div>
                        <div className="pr-hub-body">
                          <h4 className="pr-hub-name">{n.name}</h4>
                          <div className="pr-hub-loc">
                            {(n.location || n.address) && <><MapPin size={12} />{n.location || n.address}</>}
                          </div>
                          <div className={`pr-meter ${tone ? 'amber' : ''}`}>
                            <i style={{ width: `${Math.max((slots / maxSlots) * 100, slots > 0 ? 6 : 0)}%` }} />
                          </div>
                          <div className="pr-meter-cap"><span>Capacity</span><span>{slots} of {maxSlots} slots</span></div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <section className="pr-how">
                  <h3 className="pr-display">How a drop-off works</h3>
                  <ol className="pr-steps">
                    <li>
                      <div className="pr-step-n">1</div>
                      <strong>Reserve a slot</strong>
                      <p>Pick a hub, the amount of energy you want to drop off and a time that suits you.</p>
                    </li>
                    <li>
                      <div className="pr-step-n">2</div>
                      <strong>Wait for approval</strong>
                      <p>Your reservation starts as Pending and moves to Approved once the hub confirms it.</p>
                    </li>
                    <li>
                      <div className="pr-step-n">3</div>
                      <strong>Check in at the hub</strong>
                      <p>Show your secure QR token when you arrive so the hub can scan your pass.</p>
                    </li>
                  </ol>
                  <div className="pr-rules">
                    <div className="pr-rule">
                      <div className="pr-rule-ic"><CalendarClock size={17} /></div>
                      <div><b>7-day booking rule</b><span>Each booking is checked against the network's 7-day rule.</span></div>
                    </div>
                    <div className="pr-rule">
                      <div className="pr-rule-ic"><Clock size={17} /></div>
                      <div><b>12-hour cancellation rule</b><span>Cancel a pending booking before the 12-hour cutoff.</span></div>
                    </div>
                    <div className="pr-rule">
                      <div className="pr-rule-ic"><ShieldCheck size={17} /></div>
                      <div><b>Secure QR token</b><span>Your token appears on the reservation once it is ready.</span></div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right: booking pass */}
              <aside className="pr-side">
                <form onSubmit={handleCreateBooking} className="pr-pass">
                  <div className="pr-pass-top">
                    <h3 className="pr-display">New reservation</h3>
                    <div className="pr-pass-icon"><Zap size={16} /></div>
                  </div>

                  <div className="pr-field">
                    <label htmlFor="pr-hub">Grid hub</label>
                    <select id="pr-hub" value={selectedNode} onChange={e => setSelectedNode(e.target.value)} required>
                      <option value="">Choose a hub</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name} — {n.availableBatterySlots} slots available</option>
                      ))}
                    </select>
                  </div>

                  <div className="pr-row2">
                    <div className="pr-field">
                      <label htmlFor="pr-kwh">Energy amount</label>
                      <input id="pr-kwh" type="number" placeholder='kWh' step="0.1" value={energyAmount} onChange={e => setEnergyAmount(e.target.value)} required />
                    </div>
                    <div className="pr-field">
                      <label htmlFor="pr-when">Date &amp; time</label>
                      <input id="pr-when" type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} required />
                    </div>
                  </div>

                  <SunCurve hour={pickedHour} />

                  <div className="pr-perf"><span className="pr-dash" /></div>

                  <div className="pr-est">
                    <span>Estimated CO₂ avoided</span>
                    <b><Leaf size={14} />{estCo2 > 0 ? `≈ ${fmt(estCo2)} kg` : '—'}</b>
                  </div>

                  <button type="submit" className="pr-confirm">Confirm reservation</button>
                </form>
              </aside>
            </div>
          </>
        )}

        {/* ============================ HISTORY TAB ============================ */}
        {activeTab === 'history' && (
          <>
            <section className="pr-hero pr-hero-short">
              <Photo id={PHOTO.heroRoof} w={1800} eager className="pr-hero-img" alt="Solar panels on a house roof" />
              <div className="pr-hero-shade" />
              <div>
                <h2 className="pr-display">Your reservations</h2>
                <p>Track approvals, see how much energy you have booked, and find the QR token you need at the hub.</p>
              </div>
            </section>

            {/* Stats */}
            <div className="pr-stats">
              <div className="pr-stat">
                <div className="pr-stat-ic g"><Ticket size={20} /></div>
                <div><b>{reservations.length}</b><small>Total reservations</small></div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-ic a"><Zap size={20} /></div>
                <div><b>{fmt(totalKwh)}</b><small>kWh booked</small></div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-ic a"><Hourglass size={20} /></div>
                <div><b>{counts.Pending}</b><small>Waiting for approval</small></div>
              </div>
              <div className="pr-stat">
                <div className="pr-stat-ic g"><Leaf size={20} /></div>
                <div><b>≈ {fmt(co2)} kg</b><small>CO₂ avoided (estimate)</small></div>
              </div>
            </div>

            {/* Charts */}
            <div className="pr-charts">
              <div className="pr-card">
                <h3 className="pr-display">Energy timeline</h3>
                <p>kWh you have booked per day, latest {Math.min(energyByDay.length || 8, 8)} booking days.</p>
                <EnergyChart data={energyByDay} />
              </div>
              <div className="pr-card">
                <h3 className="pr-display">Status split</h3>
                <p>How your reservations are doing.</p>
                <div className="pr-donut-wrap">
                  <StatusDonut
                    total={reservations.length}
                    segments={[
                      { name: 'Approved', value: counts.Approved, color: '#146B5C' },
                      { name: 'Pending', value: counts.Pending, color: '#E08E2B' },
                      { name: 'Other', value: counts.Other, color: '#C4CFC9' },
                    ]}
                  />
                  <div className="pr-legend">
                    <div><span><i style={{ background: '#146B5C' }} />Approved</span><b>{counts.Approved}</b></div>
                    <div><span><i style={{ background: '#E08E2B' }} />Pending</span><b>{counts.Pending}</b></div>
                    <div><span><i style={{ background: '#C4CFC9' }} />Other</span><b>{counts.Other}</b></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reservation list */}
            <div className="pr-list-head">
              <h3 className="pr-display">All reservations</h3>
              <div className="pr-chips">
                {['All', 'Pending', 'Approved', 'Other'].map(f => (
                  <button key={f} className={`pr-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f} {f === 'All' ? reservations.length : counts[f]}
                  </button>
                ))}
              </div>
            </div>

            <div className="pr-grid">
              {reservations.length === 0 && (
                <div className="pr-empty">
                  You have no reservations yet.
                  <div><button className="pr-btn" onClick={() => setActiveTab('reserve')}>Reserve a drop-off</button></div>
                </div>
              )}
              {reservations.length > 0 && visible.length === 0 && (
                <div className="pr-empty">No {filter.toLowerCase()} reservations.</div>
              )}
              {visible.map(r => {
                const d = new Date(r.scheduledTime);
                const kwh = Number(r.energyAmountKwh) || 0;
                const name = hubName(r);
                return (
                  <div key={r.id} className="pr-stub">
                    <div className={`pr-stub-date ${statusClass(r.status)}`}>
                      <span>{d.toLocaleString(undefined, { month: 'short' })}</span>
                      <b>{d.getDate()}</b>
                      <span>{d.toLocaleString(undefined, { weekday: 'short' })}</span>
                    </div>
                    <div className="pr-stub-body">
                      <div className="pr-stub-top">
                        <span className="pr-stub-id">Booking {r.id}</span>
                        <span className={`pr-badge ${statusClass(r.status)}`}>{r.status}</span>
                      </div>
                      {name && <div className="pr-stub-hub"><MapPin size={13} />{name}</div>}
                      <div className="pr-stub-meta">
                        <span><CalendarClock size={13} />{d.toLocaleString()}</span>
                        <span><Zap size={13} />{r.energyAmountKwh} kWh</span>
                      </div>
                      <div className={`pr-meter ${r.status === 'Pending' ? 'amber' : ''}`} title={`${kwh} kWh`}>
                        <i style={{ width: `${Math.max((kwh / maxKwh) * 100, 4)}%` }} />
                      </div>

                      {r.qrCodeData && (
                        <div className="pr-qr">
                          <div className="pr-qr-head">
                            <b><QrCode size={13} />Secure QR token</b>
                            <button type="button" className="pr-copy" onClick={() => copyToken(r)}>
                              {copied === r.id ? <><Check size={12} />Copied</> : <><Copy size={12} />Copy</>}
                            </button>
                          </div>
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
                );
              })}
            </div>
          </>
        )}

        <div className="pr-foot">&copy; 2026 Solar Microgrid. All rights reserved. &middot; CO₂ figures are estimates based on {CO2_KG_PER_KWH} kg per kWh</div>
      </div>
    </div>
  );
}