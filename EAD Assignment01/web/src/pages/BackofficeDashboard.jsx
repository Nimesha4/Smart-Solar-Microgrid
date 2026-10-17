/**
 * Course: SE4040 - Enterprise Application Development
 * Assignment: Assignment 1 - Smart Solar Microgrid Trading System
 * Component: BackofficeDashboard
 * Description: Administration portal for User Management (NIC PK, deactivation/reactivation),
 *              Microgrid Node Management (GPS, Capacity, Battery Slots), and Energy Slot Scheduling.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Users, Search, Plus, Power, Clock, MapPin, BatteryCharging, Zap, X, Edit2, Check, Calendar, Trash2, ExternalLink } from 'lucide-react';
import ProfileModal from '../components/ProfileModal';
import HeaderMenu from '../components/HeaderMenu';
import EditNodeModal from '../components/EditNodeModal';
import EditEnergySlotModal from '../components/EditEnergySlotModal';
import MicrogridGoogleMap from '../components/MicrogridGoogleMap';
import { apiUrl } from '../config';
import { clearAuthSession } from '../auth';

/* ------------------------------------------------------------------ */
/*  Real photography (Pexels, free to use). Swap the IDs to change    */
/*  any picture. If an image fails to load, a green gradient is shown */
/* ------------------------------------------------------------------ */
const px = (id, w = 1400) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

const HERO_PHOTO = 356049;      // close-up of solar panels
const FORM_PHOTO = 18316987;    // rows of solar panels
const HUB_PHOTOS = [15751124, 12243093, 9729882, 18316987];

function Photo({ id, w = 1200, alt = '', className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className={`bo-photo-fallback ${className}`} aria-hidden="true" />;
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

/* Generic donut chart */
function Donut({ segments, total, unit }) {
  const R = 54, C = 2 * Math.PI * R;
  let offset = 0;
  const active = segments.filter(s => s.value > 0);
  return (
    <svg viewBox="0 0 140 140" className="bo-donut" role="img" aria-label={`${unit} by status`}>
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
      <text x="70" y="86" textAnchor="middle" fontSize="11" fill="#6B7A72">{unit}</text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */

export default function BackofficeDashboard() {
  const [users, setUsers] = useState([]);
  const [nodes, setNodes] = useState([]);

  // Form States for Node Creation (Capacity, Battery Slots & GPS)
  const [nodeName, setNodeName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [batterySlots, setBatterySlots] = useState('');
  const [nodeLat, setNodeLat] = useState('6.9271');
  const [nodeLng, setNodeLng] = useState('79.8612');
  const [nodeSchedule, setNodeSchedule] = useState('08:00-18:00');

  // Energy Slots States
  const [energySlots, setEnergySlots] = useState([]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [slotFilterHub, setSlotFilterHub] = useState('All');
  const [slotFilterStatus, setSlotFilterStatus] = useState('All');

  // Energy Slot Form States
  const [newSlotHubId, setNewSlotHubId] = useState('');
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlotStart, setNewSlotStart] = useState('08:00');
  const [newSlotEnd, setNewSlotEnd] = useState('10:00');
  const [newSlotCap, setNewSlotCap] = useState('25');
  const [newSlotSlots, setNewSlotSlots] = useState('4');
  const [newSlotRate, setNewSlotRate] = useState('0.35');

  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('All');
  const [hubFilter, setHubFilter] = useState('All');
  const [showHubMap, setShowHubMap] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user'));
  const initials = (user?.name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    if (!user || user.role !== 'Backoffice') navigate('/login');
    fetchData();
  }, [navigate]);

  const generateDefaultSlots = (hubList) => {
    const today = new Date().toISOString().split('T')[0];
    const timeWindows = [
      { start: '08:00', end: '10:00', status: 'Available' },
      { start: '10:00', end: '12:00', status: 'Booked' },
      { start: '12:00', end: '14:00', status: 'Available' },
      { start: '14:00', end: '16:00', status: 'Available' },
      { start: '16:00', end: '18:00', status: 'Available' }
    ];
    const generated = [];
    hubList.forEach((hub, hIdx) => {
      timeWindows.forEach((tw, tIdx) => {
        generated.push({
          id: `SLOT-${hub.id ? String(hub.id).slice(-4) : hIdx + 1}-${tIdx + 1}`,
          hubId: hub.id,
          hubName: hub.name,
          date: today,
          startTime: tw.start,
          endTime: tw.end,
          capacityKwh: Math.max(10, Math.round((Number(hub.capacityKwh) || 50) / 4)),
          batterySlots: Math.max(2, Math.round((Number(hub.availableBatterySlots) || 8) / 2)),
          status: tw.status,
          ratePerKwh: 0.35
        });
      });
    });
    return generated;
  };

  const loadEnergySlots = (currentNodes) => {
    try {
      const saved = localStorage.getItem('custom_energy_slots');
      if (saved) {
        setEnergySlots(JSON.parse(saved));
        return;
      }
    } catch (e) {}
    if (currentNodes && currentNodes.length > 0) {
      const defaults = generateDefaultSlots(currentNodes);
      setEnergySlots(defaults);
      localStorage.setItem('custom_energy_slots', JSON.stringify(defaults));
    }
  };

  const getMergedNodes = (rawNodes) => {
    try {
      const saved = JSON.parse(localStorage.getItem('custom_nodes_edits') || '{}');
      return rawNodes.map(n => (saved[n.id] ? { ...n, ...saved[n.id] } : n));
    } catch {
      return rawNodes;
    }
  };

  const fetchData = async () => {
    try {
      const usersRes = await axios.get(apiUrl('/api/users'));
      setUsers(usersRes.data);
      const nodesRes = await axios.get(apiUrl('/api/nodes'));
      const mergedNodes = getMergedNodes(nodesRes.data);
      setNodes(mergedNodes);
      loadEnergySlots(mergedNodes);
    } catch (e) {
      console.error("Fetch error", e);
      try {
        const saved = JSON.parse(localStorage.getItem('custom_nodes_edits') || '{}');
        const list = Object.values(saved);
        if (list.length > 0) {
          setNodes(list);
          loadEnergySlots(list);
        }
      } catch {}
    } finally {
      setLoaded(true);
    }
  };

  const handleCreateEnergySlot = (e) => {
    e.preventDefault();
    if (!newSlotHubId) {
      alert("Please choose a Microgrid Hub.");
      return;
    }
    const hub = nodes.find(n => String(n.id) === String(newSlotHubId));
    const newSlot = {
      id: `SLOT-${Date.now().toString().slice(-6)}`,
      hubId: newSlotHubId,
      hubName: hub ? hub.name : 'Solar Grid Hub',
      date: newSlotDate,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      capacityKwh: parseFloat(newSlotCap) || 20,
      batterySlots: parseInt(newSlotSlots, 10) || 4,
      status: 'Available',
      ratePerKwh: parseFloat(newSlotRate) || 0.35
    };
    const updated = [newSlot, ...energySlots];
    setEnergySlots(updated);
    localStorage.setItem('custom_energy_slots', JSON.stringify(updated));
    alert("Energy slot created successfully!");
  };

  const handleUpdateEnergySlot = (updatedSlot) => {
    const updated = energySlots.map(s => s.id === updatedSlot.id ? updatedSlot : s);
    setEnergySlots(updated);
    localStorage.setItem('custom_energy_slots', JSON.stringify(updated));
    setEditingSlot(null);
  };

  const handleDeleteEnergySlot = (slotId) => {
    if (!window.confirm("Are you sure you want to delete this energy slot?")) return;
    const updated = energySlots.filter(s => s.id !== slotId);
    setEnergySlots(updated);
    localStorage.setItem('custom_energy_slots', JSON.stringify(updated));
    setEditingSlot(null);
  };

  const handleUpdateNode = async (updatedNode) => {
    setNodes(prev => prev.map(n => (n.id === updatedNode.id ? updatedNode : n)));

    try {
      const saved = JSON.parse(localStorage.getItem('custom_nodes_edits') || '{}');
      saved[updatedNode.id] = updatedNode;
      localStorage.setItem('custom_nodes_edits', JSON.stringify(saved));
    } catch (err) {
      console.error("Failed to save to localStorage", err);
    }

    try {
      await axios.put(apiUrl(`/api/nodes/${updatedNode.id}`), updatedNode);
    } catch (e) {
      console.log("Backend sync skipped/failed, saved to frontend state successfully.");
    }

    setEditingNode(null);
  };

  const handleDeactivateNode = async (id) => {
    const updated = nodes.map(n => (n.id === id ? { ...n, isActive: false } : n));
    setNodes(updated);

    try {
      const saved = JSON.parse(localStorage.getItem('custom_nodes_edits') || '{}');
      const target = updated.find(n => n.id === id);
      if (target) {
        saved[id] = target;
        localStorage.setItem('custom_nodes_edits', JSON.stringify(saved));
      }
    } catch {}

    try {
      await axios.put(apiUrl(`/api/nodes/deactivate/${id}`));
    } catch (e) {
      console.log("Backend deactivate endpoint notice, frontend updated.");
    }
  };

  const handleActivateNode = async (id) => {
    const updated = nodes.map(n => (n.id === id ? { ...n, isActive: true } : n));
    setNodes(updated);

    try {
      const saved = JSON.parse(localStorage.getItem('custom_nodes_edits') || '{}');
      const target = updated.find(n => n.id === id);
      if (target) {
        saved[id] = target;
        localStorage.setItem('custom_nodes_edits', JSON.stringify(saved));
      }
      await axios.put(apiUrl(`/api/nodes/${id}`), target);
    } catch (e) {
      console.log("Backend activate sync notice, frontend updated.");
    }
  };

  const handleDeactivateUser = async (nic) => {
    try {
      await axios.put(apiUrl(`/api/users/deactivate/${nic}`));
      fetchData();
    } catch (e) {
      alert("Failed to deactivate user.");
    }
  };

  const handleActivateUser = async (nic) => {
    try {
      await axios.put(apiUrl(`/api/users/activate/${nic}`));
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
        latitude: parseFloat(nodeLat) || 6.9271,
        longitude: parseFloat(nodeLng) || 79.8612,
        capacityKwh: parseFloat(capacity),
        availableBatterySlots: parseInt(batterySlots),
        isActive: true,
        operatingSchedule: nodeSchedule || "08:00-18:00"
      };
      await axios.post(apiUrl('/api/nodes'), newNode);
      setNodeName(''); setCapacity(''); setBatterySlots('');
      fetchData();
    } catch (e) {
      alert("Failed to create Node");
    }
  };

  const logout = () => {
    clearAuthSession();
    navigate('/login');
  };

  /* ---------- derived data ---------- */
  const fmt = (v) => Number(Number(v).toFixed(1)).toLocaleString();
  const roleLabel = (r) => (r || 'Unknown').replace(/([a-z])([A-Z])/g, '$1 $2');
  const roleColor = (r) => (r === 'Prosumer' ? '#146B5C' : r === 'GridOperator' ? '#E08E2B' : r === 'Backoffice' ? '#33413A' : '#C4CFC9');
  const roleClass = (r) => (r === 'Prosumer' ? 'bo-role-p' : r === 'GridOperator' ? 'bo-role-g' : r === 'Backoffice' ? 'bo-role-b' : '');
  const initialsOf = (name) =>
    (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.length - activeUsers;
  const roleCounts = [...users.reduce((m, u) => m.set(u.role, (m.get(u.role) || 0) + 1), new Map()).entries()]
    .sort((a, b) => b[1] - a[1]);

  const activeNodes = nodes.filter(n => n.isActive);
  const offlineNodes = nodes.length - activeNodes.length;
  const activeCapacity = activeNodes.reduce((s, n) => s + (Number(n.capacityKwh) || 0), 0);
  const maxCap = Math.max(...nodes.map(n => Number(n.capacityKwh) || 0), 1);

  const q = search.trim().toLowerCase();
  const visibleUsers = users.filter(u => {
    const statusOk = userFilter === 'All' || (userFilter === 'Active' ? u.isActive : !u.isActive);
    const textOk = !q || [u.name, u.nic, u.role].some(v => String(v ?? '').toLowerCase().includes(q));
    return statusOk && textOk;
  });
  const visibleNodes = nodes.filter(n => hubFilter === 'All' || (hubFilter === 'Accepting' ? n.isActive : !n.isActive));

  return (
    <div className="bo-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        
        html, body, #root {
          color-scheme: light only;
          background: #F3F6F4;
        }

        .bo-root {
          
          color-scheme: light;

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
        .bo-root *, .bo-root *::before, .bo-root *::after { box-sizing: border-box; }
        .bo-root input, .bo-root select, .bo-root textarea, .bo-root button {
          color-scheme: light;
        }
        .bo-display { font-family: 'Sora', 'Inter', sans-serif; }
        .bo-root button { font: inherit; }
        .bo-root :focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
        .bo-photo-fallback { width: 100%; height: 100%; background: linear-gradient(135deg, #146B5C, #0B3F36); }

        /* ---- Top bar ---- */
        .bo-bar {
          position: sticky; top: 0; z-index: 30;
          display: flex; align-items: center; justify-content: space-between;
          gap: 16px; padding: 14px 40px; width: 100%;
          background: rgba(255,255,255,0.86); backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .bo-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink); }
        .bo-mark {
          width: 38px; height: 38px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
        }
        .bo-brand h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
        .bo-brand span { display: block; margin-top: 1px; font-size: 12px; color: var(--muted); }

        .bo-tabs-header { display: flex; gap: 4px; }
        .bo-tab {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          padding: 8px 14px; border: none; background: transparent;
          color: var(--muted); border-radius: 9px;
          transition: color .12s ease, background-color .12s ease;
        }
        .bo-tab:hover { color: var(--ink); background: #E8EEEA; }
        .bo-tab.active { color: var(--ink); background: transparent; }
        .bo-tab-count {
          min-width: 20px; padding: 1px 6px; border-radius: 999px; font-size: 11.5px; font-weight: 700;
          background: rgba(20,107,92,0.12); color: var(--green); text-align: center;
        }

        .bo-user { display: flex; align-items: center; gap: 10px; }
        .bo-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex: none;
          background: var(--green); color: #FFFFFF; font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif;
        }
        .bo-user span { font-size: 13.5px; font-weight: 600; color: #33413A; }

        .bo-btn {
          font-size: 14px; font-weight: 600; cursor: pointer;
          padding: 9px 16px; border-radius: 9px;
          border: none; background: var(--green); color: #FFFFFF;
          transition: background-color .12s ease;
        }
        .bo-btn:hover { background: var(--green-d); }
        .bo-quiet { background: transparent; color: var(--ink); border: 1px solid #D6DED9; }
        .bo-quiet:hover { background: #E8EEEA; color: var(--ink); border-color: transparent; }

        /* ---- Page shell ---- */
        .bo-page { max-width: 1320px; margin: 0 auto; padding: 32px 40px 72px; }

        /* ---- Photo hero ---- */
        .bo-hero {
          position: relative; overflow: hidden; color: #FFFFFF;
          border-radius: 28px; min-height: 360px; padding: 44px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
          background: var(--forest);
        }
        .bo-hero-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          animation: bo-settle 2.2s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes bo-settle { from { transform: scale(1.08); } to { transform: scale(1); } }
        .bo-hero-shade {
          position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(8,42,36,0.94) 0%, rgba(8,42,36,0.74) 44%, rgba(8,42,36,0.12) 100%);
        }
        .bo-hero > *:not(.bo-hero-img):not(.bo-hero-shade) { position: relative; }
        .bo-hero h2 {
          margin: 0; max-width: 16ch; font-size: clamp(32px, 4.4vw, 54px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.04;
        }
        .bo-hero p { margin: 16px 0 0; max-width: 48ch; font-size: 16px; line-height: 1.65; color: rgba(255,255,255,0.82); }

        .bo-glass-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .bo-glass {
          display: flex; align-items: center; gap: 12px; padding: 14px 18px; min-width: 190px;
          background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(10px); border-radius: 16px;
        }
        .bo-glass-ic {
          width: 38px; height: 38px; border-radius: 11px; flex: none;
          background: rgba(255,255,255,0.16); display: flex; align-items: center; justify-content: center;
        }
        .bo-glass b { display: block; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.1; }
        .bo-glass small { font-size: 12.5px; color: rgba(255,255,255,0.78); }

        /* ---- Section head ---- */
        .bo-sec-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px; margin: 40px 0 16px; }
        .bo-sec-head h3 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .bo-sec-head span { font-size: 13px; color: var(--muted); }

        /* ---- Cards + charts ---- */
        .bo-charts { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(0, 1fr); gap: 16px; margin-top: 28px; }
        .bo-card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 24px; }
        .bo-card h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
        .bo-card > p { margin: 4px 0 18px; font-size: 13px; color: var(--muted); }

        .bo-bars { display: flex; flex-direction: column; gap: 16px; max-height: 300px; overflow-y: auto; padding-right: 4px; }
        .bo-bar-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 6px 12px; align-items: center; }
        .bo-bar-name { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--body); min-width: 0; }
        .bo-bar-name span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bo-bar-name i { width: 10px; height: 10px; border-radius: 3px; flex: none; }
        .bo-bar-val { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; text-align: right; }
        .bo-bar-val b { color: var(--ink); font-family: 'Sora', sans-serif; font-size: 15px; }
        .bo-meter { grid-column: 1 / -1; height: 8px; border-radius: 999px; background: #E8EEEA; overflow: hidden; }
        .bo-meter > i { display: block; height: 100%; border-radius: 999px; }
        .bo-seg { display: flex; gap: 3px; height: 10px; margin-bottom: 18px; }
        .bo-seg i { display: block; border-radius: 999px; }
        .bo-chart-empty { padding: 44px 16px; text-align: center; font-size: 14px; color: var(--muted); background: #F7FAF8; border-radius: 14px; }

        .bo-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .bo-donut { width: 170px; height: 170px; }
        .bo-legend { width: 100%; display: flex; flex-direction: column; gap: 9px; }
        .bo-legend div { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: var(--body); }
        .bo-legend span { display: inline-flex; align-items: center; gap: 8px; }
        .bo-legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
        .bo-legend b { color: var(--ink); font-variant-numeric: tabular-nums; }

        /* ---- Toolbar: search + chips ---- */
        .bo-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
        .bo-search { position: relative; }
        .bo-search svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); }
        .bo-search input {
          width: 260px; font: inherit; font-size: 14px; color: var(--ink);
          padding: 9px 13px 9px 36px; border: 1px solid #D6DED9; border-radius: 10px; background: #FFFFFF;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .bo-search input::placeholder { color: #8B9892; }
        .bo-search input:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 3px rgba(20,107,92,0.14); }
        .bo-chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .bo-chip {
          cursor: pointer; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 600;
          border: 1px solid #D6DED9; background: #FFFFFF; color: var(--body);
          transition: background-color .12s ease, color .12s ease, border-color .12s ease;
        }
        .bo-chip:hover { border-color: var(--ink); }
        .bo-chip.active { background: var(--ink); border-color: var(--ink); color: #FFFFFF; }

        /* ---- Users table ---- */
        .bo-table-card { background: var(--card); border: 1px solid var(--line); border-radius: 20px; padding: 6px 24px; overflow-x: auto; }
        .bo-table { width: 100%; border-collapse: collapse; }
        .bo-table thead th {
          padding: 16px 16px 12px; font-size: 12.5px; font-weight: 600; color: var(--muted);
          text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap;
        }
        .bo-table thead th:first-child { padding-left: 0; }
        .bo-table thead th:last-child { padding-right: 0; text-align: right; }
        .bo-table tbody td { padding: 14px 16px; border-bottom: 1px solid #EEF2EF; vertical-align: middle; font-size: 14px; }
        .bo-table tbody tr:last-child td { border-bottom: none; }
        .bo-table tbody td:first-child { padding-left: 0; }
        .bo-table tbody td:last-child { padding-right: 0; text-align: right; }
        .bo-table tbody tr:hover td { background: #F8FBF9; }
        .bo-person { display: flex; align-items: center; gap: 12px; }
        .bo-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center;
          background: rgba(20,107,92,0.12); color: var(--green); font-family: 'Sora', sans-serif; font-size: 12.5px; font-weight: 700;
        }
        .bo-avatar.off { background: #ECEFED; color: var(--muted); }
        .bo-name { font-weight: 600; letter-spacing: -0.005em; }
        .bo-sub { color: var(--muted); font-variant-numeric: tabular-nums; }

        .bo-role { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #ECEFED; color: var(--body); font-size: 12px; font-weight: 600; }
        .bo-role-p { background: rgba(20,107,92,0.12); color: var(--green); }
        .bo-role-g { background: rgba(224,142,43,0.16); color: var(--amber-text); }
        .bo-role-b { background: #E1E6E3; color: #24312B; }

        .bo-status { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
        .bo-status i { width: 7px; height: 7px; border-radius: 50%; flex: none; }
        .bo-on { color: var(--green); } .bo-on i { background: var(--green); box-shadow: 0 0 0 3px rgba(20,107,92,0.16); }
        .bo-off { color: var(--amber-text); } .bo-off i { background: var(--amber-d); box-shadow: 0 0 0 3px rgba(224,142,43,0.2); }

        .bo-empty {
          padding: 44px; text-align: center; font-size: 14px; color: var(--muted);
          background: var(--card); border: 1px dashed #C9D4CE; border-radius: 16px; grid-column: 1 / -1;
        }
        .bo-table-card .bo-empty { border: none; background: transparent; }

        .bo-actions { display: inline-flex; gap: 8px; justify-content: flex-end; }
        .bo-btn-sm { padding: 7px 12px; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        .bo-caution { background: #FFFFFF; border-color: rgba(201,112,27,0.45); color: var(--amber-text); }
        .bo-caution:hover { background: rgba(201,112,27,0.08); border-color: var(--amber-d); }
        .bo-reactivate { background: var(--green); color: #FFFFFF; }
        .bo-reactivate:hover { background: var(--green-d); }

        /* ---- Create hub ---- */
        .bo-split { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 16px; margin-top: 28px; align-items: start; }
        .bo-formcard { overflow: hidden; background: var(--card); border: 1px solid var(--line); border-radius: 24px; }
        .bo-form-photo { position: relative; height: 150px; background: var(--forest); color: #FFFFFF; }
        .bo-form-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bo-form-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(0deg, rgba(8,42,36,0.85), rgba(8,42,36,0.1)); }
        .bo-form-photo h3 { position: absolute; left: 22px; bottom: 18px; z-index: 1; margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em; }
        .bo-form-body { padding: 22px 22px 24px; }
        .bo-field { margin-bottom: 14px; }
        .bo-field label { display: block; font-size: 12.5px; font-weight: 600; color: var(--body); margin-bottom: 6px; }
        .bo-input {
          width: 100%; font: inherit; font-size: 14.5px; color: var(--ink);
          padding: 11px 13px; border: 1px solid #D6DED9; border-radius: 10px; background: #FFFFFF;
          font-variant-numeric: tabular-nums;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .bo-input::placeholder { color: #8B9892; }
        .bo-input:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 3px rgba(20,107,92,0.14); }
        .bo-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .bo-note { display: flex; gap: 8px; margin: 2px 0 18px; font-size: 12.5px; line-height: 1.5; color: var(--muted); }
        .bo-note svg { flex: none; margin-top: 2px; color: var(--green); }
        .bo-submit {
          width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--amber); color: #FFFFFF; border: none; padding: 13px 0; border-radius: 12px; font-size: 15px; font-weight: 700;
        }
        .bo-submit:hover { background: var(--amber-d); }

        /* ---- Hub cards ---- */
        .bo-hubs { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .bo-hub { overflow: hidden; background: var(--card); border: 1px solid var(--line); border-radius: 22px; display: flex; flex-direction: column; }
        .bo-hub-img { position: relative; height: 150px; background: var(--forest); }
        .bo-hub-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bo-hub.is-off .bo-hub-img img, .bo-hub.is-off .bo-photo-fallback { filter: grayscale(1) brightness(0.9); }
        .bo-hub-pill {
          position: absolute; left: 14px; bottom: 14px; display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 11px; border-radius: 999px; font-size: 12px; font-weight: 700; background: rgba(255,255,255,0.95);
        }
        .bo-hub-pill i { width: 7px; height: 7px; border-radius: 50%; }
        .bo-hub-pill.bo-on i { background: var(--green); box-shadow: none; }
        .bo-hub-pill.bo-off i { background: var(--amber-d); box-shadow: none; }
        .bo-hub-body { padding: 18px 20px 20px; display: flex; flex-direction: column; flex: 1; }
        .bo-hub-name { margin: 0 0 4px; font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
        .bo-hub-loc { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--muted); min-height: 18px; margin-bottom: 16px; }
        .bo-hub-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .bo-hub-stat { padding: 12px 14px; background: #F3F6F4; border-radius: 14px; }
        .bo-hub-stat b { display: block; font-family: 'Sora', sans-serif; font-size: 20px; letter-spacing: -0.02em; line-height: 1.1; }
        .bo-hub-stat small { font-size: 12px; color: var(--muted); }
        .bo-hub-sched { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: var(--muted); margin: 12px 0 16px; }
        .bo-hub-foot { margin-top: auto; }
        .bo-hub-actions { display: flex; gap: 8px; width: 100%; }
        .bo-hub-actions .bo-btn { flex: 1; justify-content: center; }
        .bo-edit-btn { background: #FFFFFF; color: #14201B; border: 1px solid #D6DED9; }
        .bo-edit-btn:hover { background: #E8EEEA; border-color: #B8C7C0; color: #14201B; }
        .bo-hub-foot .bo-btn { justify-content: center; }
        .bo-noaction { display: block; text-align: center; font-size: 13px; color: var(--muted); padding: 8px 0; }

        /* ---- Energy slots ---- */
        .bo-slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-top: 16px; }
        .bo-slot-card {
          background: var(--card); border: 1px solid var(--line); border-radius: 18px;
          padding: 18px 20px; display: flex; flex-direction: column; gap: 12px;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .bo-slot-card:hover { border-color: #B8C7C0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
        .bo-slot-top { display: flex; align-items: center; justify-content: space-between; }
        .bo-slot-time { font-family: 'Sora', sans-serif; font-size: 16px; font-weight: 700; color: var(--ink); display: flex; align-items: center; gap: 6px; }
        .bo-slot-hub { font-size: 13px; font-weight: 600; color: var(--body); display: flex; align-items: center; gap: 6px; }
        .bo-slot-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #F3F6F4; border-radius: 12px; padding: 10px 12px; }
        .bo-slot-stat b { display: block; font-family: 'Sora', sans-serif; font-size: 16px; color: var(--ink); }
        .bo-slot-stat small { font-size: 11.5px; color: var(--muted); }
        .bo-slot-actions { display: flex; gap: 8px; margin-top: 4px; }
        .bo-slot-actions .bo-btn { flex: 1; justify-content: center; }

        .bo-foot { margin-top: 48px; text-align: center; font-size: 12px; color: var(--muted); }

        @media (max-width: 1100px) {
          .bo-charts, .bo-split { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .bo-hide-sm { display: none; }
        }
        @media (max-width: 640px) {
          .bo-page { padding: 20px 16px 64px; }
          .bo-bar { padding: 12px 16px; flex-wrap: wrap; }
          .bo-tabs-header { order: 3; width: 100%; }
          .bo-tab { flex: 1; justify-content: center; }
          .bo-hero { padding: 26px 22px; min-height: 340px; border-radius: 22px; }
          .bo-glass { min-width: 0; flex: 1 1 100%; }
          .bo-search, .bo-search input { width: 100%; }
          .bo-table-card { padding: 4px 16px; }
          .bo-row2 { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bo-root * { transition: none !important; }
          .bo-hero-img { animation: none; }
        }
      `}</style>

      {/* Top bar */}
      <div className="bo-bar">
        <Link to="/" className="bo-brand">
          <div className="bo-mark">
            <Sun size={19} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="bo-display">Solar Microgrid</h2>
            <span>Peer-to-peer energy trading</span>
          </div>
        </Link>

        <div className="bo-tabs-header" role="tablist">
          <button role="tab" aria-selected={activeTab === 'users'} className={`bo-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            Users
          </button>
          <button role="tab" aria-selected={activeTab === 'nodes'} className={`bo-tab ${activeTab === 'nodes' ? 'active' : ''}`} onClick={() => setActiveTab('nodes')}>
            Microgrid Hubs
          </button>
          <button role="tab" aria-selected={activeTab === 'slots'} className={`bo-tab ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => setActiveTab('slots')}>
            Energy Slots
          </button>
        </div>

        <div className="bo-user">
          <HeaderMenu onProfileClick={() => setShowProfile(true)} />
        </div>
      </div>

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
      {editingNode && (
        <EditNodeModal
          node={editingNode}
          onClose={() => setEditingNode(null)}
          onSave={handleUpdateNode}
        />
      )}
      {editingSlot && (
        <EditEnergySlotModal
          slot={editingSlot}
          nodes={nodes}
          onClose={() => setEditingSlot(null)}
          onSave={handleUpdateEnergySlot}
          onDelete={handleDeleteEnergySlot}
        />
      )}

      <div className="bo-page">

        {/* Photo hero */}
        <section className="bo-hero">
          <Photo id={HERO_PHOTO} w={1800} eager className="bo-hero-img" alt="Close-up of solar panels" />
          <div className="bo-hero-shade" />
          <div>
            <h2 className="bo-display">Accounts and hubs</h2>
            <p>Review who can trade on the network and which hubs are accepting energy today.</p>
          </div>
          <div className="bo-glass-row">
            <div className="bo-glass">
              <div className="bo-glass-ic"><Users size={18} /></div>
              <div><b>{users.length}</b><small>Registered accounts</small></div>
            </div>
            <div className="bo-glass">
              <div className="bo-glass-ic"><MapPin size={18} /></div>
              <div><b>{nodes.length}</b><small>Registered hubs</small></div>
            </div>
            <div className="bo-glass">
              <div className="bo-glass-ic"><Zap size={18} /></div>
              <div><b>{fmt(activeCapacity)} kWh</b><small>Capacity accepting energy</small></div>
            </div>
          </div>
        </section>

        {/* ============================ USERS TAB ============================ */}
        {activeTab === 'users' && (
          <>
            <div className="bo-charts">
              <div className="bo-card">
                <h3 className="bo-display">Who is on the network</h3>
                <p>Accounts grouped by role.</p>
                {roleCounts.length === 0 ? (
                  <div className="bo-chart-empty">Roles will appear here as people register.</div>
                ) : (
                  <>
                    <div className="bo-seg" aria-hidden="true">
                      {roleCounts.map(([role, n]) => (
                        <i key={role} style={{ flex: n, background: roleColor(role) }} />
                      ))}
                    </div>
                    <div className="bo-bars">
                      {roleCounts.map(([role, n]) => (
                        <div className="bo-bar-row" key={role}>
                          <div className="bo-bar-name"><i style={{ background: roleColor(role) }} /><span>{roleLabel(role)}</span></div>
                          <div className="bo-bar-val"><b>{n}</b> · {Math.round((n / users.length) * 100)}%</div>
                          <div className="bo-meter"><i style={{ width: `${(n / users.length) * 100}%`, background: roleColor(role) }} /></div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="bo-card">
                <h3 className="bo-display">Account status</h3>
                <p>Who can sign in right now.</p>
                <div className="bo-donut-wrap">
                  <Donut
                    total={users.length}
                    unit={users.length === 1 ? 'account' : 'accounts'}
                    segments={[
                      { name: 'Active', value: activeUsers, color: '#146B5C' },
                      { name: 'Inactive', value: inactiveUsers, color: '#E08E2B' },
                    ]}
                  />
                  <div className="bo-legend">
                    <div><span><i style={{ background: '#146B5C' }} />Active</span><b>{activeUsers}</b></div>
                    <div><span><i style={{ background: '#E08E2B' }} />Inactive</span><b>{inactiveUsers}</b></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bo-sec-head">
              <div>
                <h3 className="bo-display">Prosumers and operators</h3>
                <span>Deactivating an account blocks sign-in immediately.</span>
              </div>
              <div className="bo-toolbar">
                <label className="bo-search">
                  <Search size={15} />
                  <input
                    type="search" placeholder="Search name, NIC or role" aria-label="Search accounts"
                    value={search} onChange={e => setSearch(e.target.value)}
                  />
                </label>
                <div className="bo-chips">
                  {['All', 'Active', 'Inactive'].map(f => (
                    <button key={f} className={`bo-chip ${userFilter === f ? 'active' : ''}`} onClick={() => setUserFilter(f)}>
                      {f} {f === 'All' ? users.length : f === 'Active' ? activeUsers : inactiveUsers}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bo-table-card">
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
                  {visibleUsers.map(u => (
                    <tr key={u.nic}>
                      <td>
                        <div className="bo-person">
                          <div className={`bo-avatar ${u.isActive ? '' : 'off'}`}>{initialsOf(u.name)}</div>
                          <span className="bo-name">{u.name}</span>
                        </div>
                      </td>
                      <td className="bo-hide-sm"><span className={`bo-role ${roleClass(u.role)}`}>{roleLabel(u.role)}</span></td>
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
              {loaded && users.length === 0 && <p className="bo-empty">No accounts yet. They appear here as people register.</p>}
              {users.length > 0 && visibleUsers.length === 0 && <p className="bo-empty">No accounts match your search.</p>}
            </div>
          </>
        )}

        {/* ============================ HUBS TAB ============================ */}
        {activeTab === 'nodes' && (
          <>
            <div className="bo-split">
              {/* Create hub */}
              <form onSubmit={handleCreateNode} className="bo-formcard">
                <div className="bo-form-photo">
                  <Photo id={FORM_PHOTO} w={800} alt="" />
                  <h3 className="bo-display">Add a new hub</h3>
                </div>
                <div className="bo-form-body">
                  <div className="bo-field">
                    <label htmlFor="bo-name">Hub name</label>
                    <input id="bo-name" type="text" placeholder="Hub name" value={nodeName} onChange={e => setNodeName(e.target.value)} className="bo-input" required />
                  </div>
                  <div className="bo-row2">
                    <div className="bo-field">
                      <label htmlFor="bo-cap">Capacity (kWh)</label>
                      <input id="bo-cap" type="number" placeholder="Capacity kWh" value={capacity} onChange={e => setCapacity(e.target.value)} className="bo-input" required />
                    </div>
                    <div className="bo-field">
                      <label htmlFor="bo-slots">Battery slots</label>
                      <input id="bo-slots" type="number" placeholder="Slots" value={batterySlots} onChange={e => setBatterySlots(e.target.value)} className="bo-input" required />
                    </div>
                  </div>
                  <div className="bo-row2">
                    <div className="bo-field">
                      <label htmlFor="bo-lat">Latitude (GPS)</label>
                      <input id="bo-lat" type="number" step="any" placeholder="6.9271" value={nodeLat} onChange={e => setNodeLat(e.target.value)} className="bo-input" />
                    </div>
                    <div className="bo-field">
                      <label htmlFor="bo-lng">Longitude (GPS)</label>
                      <input id="bo-lng" type="number" step="any" placeholder="79.8612" value={nodeLng} onChange={e => setNodeLng(e.target.value)} className="bo-input" />
                    </div>
                  </div>
                  <div className="bo-field">
                    <label htmlFor="bo-sched">Operating Schedule</label>
                    <input id="bo-sched" type="text" placeholder="08:00-18:00" value={nodeSchedule} onChange={e => setNodeSchedule(e.target.value)} className="bo-input" />
                  </div>
                  <div className="bo-note">
                    <MapPin size={14} />
                    <span>Coordinates and operating schedule will be stored and mapped across the solar microgrid.</span>
                  </div>
                  <button type="submit" className="bo-btn bo-submit"><Plus size={17} />Create hub</button>
                </div>
              </form>

              {/* Capacity chart */}
              <div className="bo-card">
                <h3 className="bo-display">Capacity by hub</h3>
                <p>{activeNodes.length} accepting energy · {offlineNodes} offline</p>
                {nodes.length === 0 ? (
                  <div className="bo-chart-empty">Add your first hub and its capacity will show here.</div>
                ) : (
                  <>
                    <div className="bo-seg" aria-hidden="true">
                      {activeNodes.length > 0 && <i style={{ flex: activeNodes.length, background: '#146B5C' }} />}
                      {offlineNodes > 0 && <i style={{ flex: offlineNodes, background: '#C4CFC9' }} />}
                    </div>
                    <div className="bo-bars">
                      {nodes.map(n => {
                        const cap = Number(n.capacityKwh) || 0;
                        return (
                          <div className="bo-bar-row" key={n.id}>
                            <div className="bo-bar-name"><i style={{ background: n.isActive ? '#146B5C' : '#C4CFC9' }} /><span>{n.name}</span></div>
                            <div className="bo-bar-val"><b>{fmt(cap)}</b> kWh · {n.availableBatterySlots} slots</div>
                            <div className="bo-meter">
                              <i style={{ width: `${Math.max((cap / maxCap) * 100, cap > 0 ? 4 : 0)}%`, background: n.isActive ? 'linear-gradient(90deg, #146B5C, #2FA58F)' : '#C4CFC9' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bo-sec-head">
              <div>
                <h3 className="bo-display">Microgrid hubs</h3>
                <span>Manage GPS coordinates, battery storage slots, and energy capacity.</span>
              </div>
              <div className="bo-chips">
                <button
                  type="button"
                  className={`bo-chip ${showHubMap ? 'active' : ''}`}
                  onClick={() => setShowHubMap(!showHubMap)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <MapPin size={12} />
                  {showHubMap ? 'Hide Google Map' : 'Show Google Map'}
                </button>
                {['All', 'Accepting', 'Offline'].map(f => (
                  <button key={f} className={`bo-chip ${hubFilter === f ? 'active' : ''}`} onClick={() => setHubFilter(f)}>
                    {f} {f === 'All' ? nodes.length : f === 'Accepting' ? activeNodes.length : offlineNodes}
                  </button>
                ))}
              </div>
            </div>

            {/* Google Maps Integration */}
            {showHubMap && (
              <MicrogridGoogleMap
                nodes={visibleNodes.length > 0 ? visibleNodes : nodes}
                onEditNode={setEditingNode}
              />
            )}

            <div className="bo-hubs">
              {loaded && nodes.length === 0 && <div className="bo-empty">No hubs registered. Add the first one above.</div>}
              {nodes.length > 0 && visibleNodes.length === 0 && <div className="bo-empty">No {hubFilter.toLowerCase()} hubs.</div>}
              {visibleNodes.map(n => {
                const idx = nodes.findIndex(x => x.id === n.id);
                return (
                  <div className={`bo-hub ${n.isActive ? '' : 'is-off'}`} key={n.id}>
                    <div className="bo-hub-img">
                      <Photo id={HUB_PHOTOS[idx % HUB_PHOTOS.length]} w={700} alt="" />
                      <span className={`bo-hub-pill ${n.isActive ? 'bo-on' : 'bo-off'}`}>
                        <i />{n.isActive ? 'Accepting energy' : 'Offline'}
                      </span>
                    </div>
                    <div className="bo-hub-body">
                      <h4 className="bo-hub-name">{n.name}</h4>
                      <div className="bo-hub-loc">
                        {n.latitude != null && n.longitude != null && (
                          <a
                            href={`https://www.google.com/maps?q=${n.latitude},${n.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#146B5C', textDecoration: 'none', fontWeight: 500 }}
                            title="Open GPS in Google Maps"
                          >
                            <MapPin size={12} />GPS: {Number(n.latitude).toFixed(4)}, {Number(n.longitude).toFixed(4)}
                            <ExternalLink size={10} style={{ opacity: 0.7 }} />
                          </a>
                        )}
                      </div>
                      <div className="bo-hub-stats">
                        <div className="bo-hub-stat"><b>{n.capacityKwh}</b><small>kWh capacity</small></div>
                        <div className="bo-hub-stat"><b>{n.availableBatterySlots}</b><small>Battery slots</small></div>
                      </div>
                      {n.operatingSchedule && <div className="bo-hub-sched"><Clock size={13} />Open {n.operatingSchedule}</div>}
                      <div className="bo-hub-foot">
                        <div className="bo-hub-actions">
                          <button
                            type="button"
                            onClick={() => setEditingNode(n)}
                            className="bo-btn bo-btn-sm bo-edit-btn"
                          >
                            <Edit2 size={13} />Edit
                          </button>
                          {n.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleDeactivateNode(n.id)}
                              className="bo-btn bo-btn-sm bo-caution"
                            >
                              <Power size={13} />Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleActivateNode(n.id)}
                              className="bo-btn bo-btn-sm bo-reactivate"
                            >
                              <Check size={13} />Activate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ============================ ENERGY SLOTS TAB ============================ */}
        {activeTab === 'slots' && (
          <>
            <div className="bo-split">
              {/* Create energy slot form */}
              <form onSubmit={handleCreateEnergySlot} className="bo-formcard">
                <div className="bo-form-photo">
                  <Photo id={HERO_PHOTO} w={800} alt="" />
                  <h3 className="bo-display">Create energy slot</h3>
                </div>
                <div className="bo-form-body">
                  <div className="bo-field">
                    <label htmlFor="slot-hub-create">Assigned hub</label>
                    <select
                      id="slot-hub-create"
                      value={newSlotHubId}
                      onChange={e => setNewSlotHubId(e.target.value)}
                      className="bo-input"
                      required
                    >
                      <option value="">Select a microgrid hub</option>
                      {nodes.map(n => (
                        <option key={n.id} value={n.id}>{n.name} ({n.capacityKwh} kWh)</option>
                      ))}
                    </select>
                  </div>

                  <div className="bo-field">
                    <label htmlFor="slot-date-create">Date</label>
                    <input
                      id="slot-date-create"
                      type="date"
                      value={newSlotDate}
                      onChange={e => setNewSlotDate(e.target.value)}
                      className="bo-input"
                      required
                    />
                  </div>

                  <div className="bo-row2">
                    <div className="bo-field">
                      <label htmlFor="slot-start-create">Start time</label>
                      <input
                        id="slot-start-create"
                        type="time"
                        value={newSlotStart}
                        onChange={e => setNewSlotStart(e.target.value)}
                        className="bo-input"
                        required
                      />
                    </div>
                    <div className="bo-field">
                      <label htmlFor="slot-end-create">End time</label>
                      <input
                        id="slot-end-create"
                        type="time"
                        value={newSlotEnd}
                        onChange={e => setNewSlotEnd(e.target.value)}
                        className="bo-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="bo-row2">
                    <div className="bo-field">
                      <label htmlFor="slot-cap-create">Capacity (kWh)</label>
                      <input
                        id="slot-cap-create"
                        type="number"
                        step="0.5"
                        min="1"
                        placeholder="e.g. 25"
                        value={newSlotCap}
                        onChange={e => setNewSlotCap(e.target.value)}
                        className="bo-input"
                        required
                      />
                    </div>
                    <div className="bo-field">
                      <label htmlFor="slot-slots-create">Battery slots</label>
                      <input
                        id="slot-slots-create"
                        type="number"
                        min="1"
                        placeholder="e.g. 4"
                        value={newSlotSlots}
                        onChange={e => setNewSlotSlots(e.target.value)}
                        className="bo-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="bo-field">
                    <label htmlFor="slot-rate-create">Tariff / Credit ($/kWh)</label>
                    <input
                      id="slot-rate-create"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newSlotRate}
                      onChange={e => setNewSlotRate(e.target.value)}
                      className="bo-input"
                    />
                  </div>

                  <div className="bo-note">
                    <Clock size={14} />
                    <span>Energy slots define discrete time windows for prosumers to drop off power at this hub.</span>
                  </div>

                  <button type="submit" className="bo-btn bo-submit">
                    <Plus size={17} />Create energy slot
                  </button>
                </div>
              </form>

              {/* Energy slots overview stats */}
              <div className="bo-card">
                <h3 className="bo-display">Energy slots summary</h3>
                <p>{energySlots.filter(s => s.status === 'Available').length} available · {energySlots.filter(s => s.status === 'Booked').length} booked · {energySlots.filter(s => s.status === 'Maintenance').length} maintenance</p>

                <div className="bo-donut-wrap" style={{ marginTop: '16px' }}>
                  <Donut
                    total={energySlots.length}
                    unit={energySlots.length === 1 ? 'slot' : 'slots'}
                    segments={[
                      { name: 'Available', value: energySlots.filter(s => s.status === 'Available').length, color: '#146B5C' },
                      { name: 'Booked', value: energySlots.filter(s => s.status === 'Booked').length, color: '#E08E2B' },
                      { name: 'Maintenance', value: energySlots.filter(s => s.status === 'Maintenance').length, color: '#C4CFC9' },
                    ]}
                  />
                  <div className="bo-legend">
                    <div><span><i style={{ background: '#146B5C' }} />Available</span><b>{energySlots.filter(s => s.status === 'Available').length}</b></div>
                    <div><span><i style={{ background: '#E08E2B' }} />Booked</span><b>{energySlots.filter(s => s.status === 'Booked').length}</b></div>
                    <div><span><i style={{ background: '#C4CFC9' }} />Maintenance</span><b>{energySlots.filter(s => s.status === 'Maintenance').length}</b></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar for Energy Slots */}
            <div className="bo-sec-head">
              <div>
                <h3 className="bo-display">Available & scheduled energy slots</h3>
                <span>View and maintain active booking slots across all hubs.</span>
              </div>
              <div className="bo-toolbar">
                <select
                  value={slotFilterHub}
                  onChange={e => setSlotFilterHub(e.target.value)}
                  className="bo-chip"
                  style={{ outline: 'none', cursor: 'pointer', paddingRight: '28px' }}
                >
                  <option value="All">All Hubs</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>

                <div className="bo-chips">
                  {['All', 'Available', 'Booked', 'Maintenance'].map(st => (
                    <button
                      key={st}
                      className={`bo-chip ${slotFilterStatus === st ? 'active' : ''}`}
                      onClick={() => setSlotFilterStatus(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grid of Energy Slots */}
            <div className="bo-slot-grid">
              {energySlots
                .filter(s => slotFilterHub === 'All' || String(s.hubId) === String(slotFilterHub))
                .filter(s => slotFilterStatus === 'All' || s.status === slotFilterStatus)
                .map(slot => (
                  <div className="bo-slot-card" key={slot.id}>
                    <div className="bo-slot-top">
                      <div className="bo-slot-time">
                        <Clock size={16} color="#146B5C" />
                        <span>{slot.startTime} – {slot.endTime}</span>
                      </div>
                      <span className={`bo-hub-pill ${slot.status === 'Available' ? 'bo-on' : slot.status === 'Booked' ? 'bo-off' : ''}`} style={{ position: 'static' }}>
                        <i />{slot.status}
                      </span>
                    </div>

                    <div className="bo-slot-hub">
                      <Zap size={14} color="#E08E2B" />
                      <span>{slot.hubName}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#5F6F67' }}>
                      <Calendar size={13} />
                      <span>{slot.date}</span>
                      <span style={{ margin: '0 4px' }}>&middot;</span>
                      <span>Tariff: <b>${slot.ratePerKwh}/kWh</b></span>
                    </div>

                    <div className="bo-slot-stats">
                      <div className="bo-slot-stat">
                        <b>{slot.capacityKwh} kWh</b>
                        <small>Slot capacity</small>
                      </div>
                      <div className="bo-slot-stat">
                        <b>{slot.batterySlots} slots</b>
                        <small>Battery slots</small>
                      </div>
                    </div>

                    <div className="bo-slot-actions">
                      <button
                        type="button"
                        onClick={() => setEditingSlot(slot)}
                        className="bo-btn bo-btn-sm bo-edit-btn"
                      >
                        <Edit2 size={13} />Edit slot
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEnergySlot(slot.id)}
                        className="bo-btn bo-btn-sm bo-caution"
                        title="Delete slot"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              {energySlots.length === 0 && (
                <div className="bo-empty">No energy slots found. Create the first slot above.</div>
              )}
            </div>
          </>
        )}

        <div className="bo-foot">&copy; 2026 Solar Microgrid. All rights reserved.</div>
      </div>
    </div>
  );
}