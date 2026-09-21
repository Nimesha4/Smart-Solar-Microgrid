import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sun, Wrench, ShieldCheck, ArrowRight, Zap, BatteryCharging, MapPin, Smartphone,
  Monitor, Globe, CheckCircle2, CalendarClock, Clock, QrCode, Leaf,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Real photography (Pexels, free to use). Swap the IDs to change    */
/*  any picture. If an image fails to load, a green gradient is shown */
/* ------------------------------------------------------------------ */
// Where to look for your own copies of the photos, e.g. /public/solar/18316987.jpg
// (set to '' to skip this step). Handy if Pexels is blocked on your network.
const LOCAL_DIR = '/solar';

const photoSources = (id, w) => [
  ...(LOCAL_DIR ? [`${LOCAL_DIR}/${id}.jpg`] : []),
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`,
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`,
];

const PHOTO = {
  hero: 18316987,      // rows of solar panels
  sky: 371900,         // panels under a blue sky
  roof: 12243093,      // house with rooftop solar
  field: 15751124,     // solar field
  install: 35237908,   // worker installing panels
  closeup: 356049,     // close-up of a panel
  brick: 9729882,      // brick house with solar roof
};

/* Drawn solar-farm artwork. Shown only if none of the photo sources can load,
   so the hero and panels are never left as a flat empty block. */
function SolarArt({ className = '' }) {
  const rows = 7;
  const yAt = i => 430 + 470 * Math.pow(i / rows, 1.5);
  const half = y => 560 + (y - 430) * 3.4;
  const items = [];
  for (let i = 0; i < rows; i++) {
    const y1 = yAt(i);
    const y2 = yAt(i + 1) - (3 + i * 2.5);
    const h1 = half(y1), h2 = half(y2);
    const pts = `${800 - h1},${y1} ${800 + h1},${y1} ${800 + h2},${y2} ${800 - h2},${y2}`;
    const cols = [];
    for (let k = -8; k <= 8; k++) {
      cols.push(<line key={k} x1={800 + (k * h1) / 8} y1={y1} x2={800 + (k * h2) / 8} y2={y2} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />);
    }
    items.push(
      <g key={i}>
        <polygon points={pts} fill="url(#smArtPanel)" />
        {cols}
        <line x1={800 - (h1 + h2) / 2} y1={(y1 + y2) / 2} x2={800 + (h1 + h2) / 2} y2={(y1 + y2) / 2} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        <polygon points={pts} fill="url(#smArtSheen)" />
      </g>
    );
  }
  return (
    <svg className={className} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="smArtSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B3F36" />
          <stop offset="55%" stopColor="#1F7A69" />
          <stop offset="100%" stopColor="#F2B15A" />
        </linearGradient>
        <radialGradient id="smArtSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE7B5" stopOpacity="1" />
          <stop offset="30%" stopColor="#F7C57A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#E08E2B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="smArtGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12493E" />
          <stop offset="100%" stopColor="#071F1A" />
        </linearGradient>
        <linearGradient id="smArtPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A4F7A" />
          <stop offset="100%" stopColor="#0A2140" />
        </linearGradient>
        <linearGradient id="smArtSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="430" fill="url(#smArtSky)" />
      <circle cx="1120" cy="330" r="340" fill="url(#smArtSun)" />
      <circle cx="1120" cy="330" r="48" fill="#FFF1D2" />
      <rect y="420" width="1600" height="480" fill="url(#smArtGround)" />
      {items}
    </svg>
  );
}

function Photo({ id, w = 1200, alt = '', className = '', eager = false }) {
  const list = photoSources(id, w);
  const [i, setI] = useState(0);
  if (i >= list.length) return <SolarArt className={className} />;
  return (
    <img
      key={list[i]}
      className={className}
      src={list[i]}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setI(n => n + 1)}
    />
  );
}

/* A sample-only QR-style pattern for the illustration pass (not a real code) */
function SampleQr() {
  const N = 13;
  let seed = 11;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const inFinder = (r, c) => (r < 5 && c < 5) || (r < 5 && c >= N - 5) || (r >= N - 5 && c < 5);
  const cells = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!inFinder(r, c) && rnd() > 0.52) cells.push([r, c]);
  }
  const finders = [[0, 0], [0, N - 5], [N - 5, 0]];
  return (
    <svg viewBox={`-1 -1 ${N + 2} ${N + 2}`} className="sm-qr" role="img" aria-label="Sample QR pattern">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#FFFFFF" />
      {cells.map(([r, c]) => <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#14201B" />)}
      {finders.map(([r, c]) => (
        <g key={`${r}-${c}`}>
          <rect x={c} y={r} width="5" height="5" fill="#14201B" />
          <rect x={c + 1} y={r + 1} width="3" height="3" fill="#FFFFFF" />
          <rect x={c + 2} y={r + 2} width="1" height="1" fill="#14201B" />
        </g>
      ))}
    </svg>
  );
}

/* Typical sunny-day output curve with the best drop-off window shaded */
function SunDay() {
  const sun = h => (h < 5.5 || h > 19.5 ? 0 : Math.exp(-Math.pow(h - 12.5, 2) / (2 * 2.7 * 2.7)));
  const xOf = h => 14 + ((h - 5) / 15) * 372;
  const yOf = v => 112 - v * 88;
  const pts = [];
  for (let h = 5; h <= 20; h += 0.25) pts.push([xOf(h), yOf(sun(h))]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${xOf(20)} 112 L ${xOf(5)} 112 Z`;
  return (
    <svg viewBox="0 0 400 140" className="sm-sunday" role="img" aria-label="Typical solar output through a sunny day, strongest between 10 AM and 2 PM">
      <defs>
        <linearGradient id="smSunFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E08E2B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E08E2B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={xOf(10)} y="14" width={xOf(14) - xOf(10)} height="98" rx="8" fill="rgba(20,107,92,0.1)" />
      <text x={(xOf(10) + xOf(14)) / 2} y="28" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#146B5C">Strongest sun</text>
      <path d={area} fill="url(#smSunFill)" />
      <path d={line} fill="none" stroke="#E08E2B" strokeWidth="3" strokeLinecap="round" />
      <line x1="14" x2="386" y1="112" y2="112" stroke="#D6DED9" />
      <g fontSize="10.5" fill="#5F6F67" textAnchor="middle">
        <text x={xOf(6)} y="130">6 AM</text>
        <text x={xOf(9)} y="130">9 AM</text>
        <text x={xOf(12)} y="130">12 PM</text>
        <text x={xOf(15)} y="130">3 PM</text>
        <text x={xOf(18)} y="130">6 PM</text>
      </g>
    </svg>
  );
}

const FAQ = [
  {
    q: 'What is a prosumer?',
    a: 'A prosumer both produces and consumes energy. If you have solar panels on your roof, you power your own home first and can sell or drop off what is left over instead of letting it go to waste.',
  },
  {
    q: 'What is a microgrid hub?',
    a: 'A hub is a local grid site with batteries. Prosumers drop off surplus energy there and the hub keeps it available for people nearby, so energy travels a short distance instead of across the whole country.',
  },
  {
    q: 'What does a kilowatt-hour (kWh) mean?',
    a: 'A kWh is the amount of energy used by a 1,000-watt appliance running for one hour. Your reservation states how many kWh you plan to drop off, and hubs list their capacity in kWh.',
  },
  {
    q: 'Why do hubs have battery slots?',
    a: 'Each slot is space for stored energy. Grid operators keep the slot count current, so prosumers only see hubs that still have room when they book.',
  },
  {
    q: 'Why does a booking need approval?',
    a: 'A grid operator checks each booking against the hub’s capacity and schedule. Once it is approved, your reservation carries a secure QR token that the operator scans when you arrive.',
  },
  {
    q: 'Can I change my mind after booking?',
    a: 'Yes. Pending bookings can be cancelled from your reservations page, subject to the network’s 12-hour cancellation rule. Bookings are also checked against the 7-day booking rule.',
  },
];

export default function Home() {
  const [kw, setKw] = useState(5);

  // Rough daily yield: system size x sunshine hours x 0.75 performance ratio.
  // Sunshine range 4.5–6.0 kWh/m²/day is the annual average across Sri Lanka.
  const PR = 0.75;
  const low = kw * 4.5 * PR;
  const high = kw * 6.0 * PR;
  const fmt = (v) => Number(v.toFixed(1)).toLocaleString();

  return (
    <div className="sm-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .sm-root {
          --green: #146B5C; --green-d: #0F5548; --forest: #0B3F36;
          --amber: #E08E2B; --amber-d: #C9701B; --amber-text: #A65A0E;
          --ink: #14201B; --body: #43524B; --muted: #5F6F67;
          --line: #E1E8E4; --bg: #F3F6F4; --card: #FFFFFF;
          min-height: 100vh;
          background: var(--bg);
          color: var(--ink);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .sm-root *, .sm-root *::before, .sm-root *::after { box-sizing: border-box; }
        .sm-display { font-family: 'Sora', 'Inter', sans-serif; }
        .sm-root :focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
        .sm-wrap { max-width: 1320px; margin: 0 auto; padding: 0 40px; }

        /* ---- Nav ---- */
        .sm-nav-shell {
          position: sticky; top: 0; z-index: 40;
          background: rgba(255,255,255,0.86); backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--line);
        }
        .sm-nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 40px; width: 100%; }
        .sm-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink); }
        .sm-mark {
          width: 38px; height: 38px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
        }
        .sm-brand h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
        .sm-brand span { display: block; margin-top: 1px; font-size: 12px; color: var(--muted); }
        .sm-nav-links { display: flex; gap: 4px; }
        .sm-nav-links a { font-size: 14px; font-weight: 600; color: var(--muted); text-decoration: none; padding: 8px 14px; border-radius: 9px; transition: color .12s ease, background-color .12s ease; }
        .sm-nav-links a:hover { color: var(--ink); background: #E8EEEA; }
        .sm-nav-actions { display: flex; align-items: center; gap: 10px; }
        .sm-link-btn { font-size: 14px; font-weight: 600; color: var(--ink); text-decoration: none; padding: 9px 16px; border-radius: 9px; transition: background-color .12s ease; }
        .sm-link-btn:hover { background: #E8EEEA; }

        .sm-btn {
          display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
          font-size: 15px; font-weight: 700; text-decoration: none;
          padding: 13px 24px; border-radius: 12px; border: 1px solid transparent;
          transition: background-color .15s ease, border-color .15s ease, transform .1s ease;
        }
        .sm-btn:active { transform: translateY(1px); }
        .sm-btn-primary { background: var(--amber); color: #FFFFFF; }
        .sm-btn-primary:hover { background: var(--amber-d); }
        .sm-btn-green { background: var(--forest); color: #FFFFFF; box-shadow: 0 6px 16px rgba(11,63,54,0.25); }
        .sm-btn-green:hover { background: var(--green); }
        .sm-btn-glass { background: rgba(255,255,255,0.14); color: #FFFFFF; border-color: rgba(255,255,255,0.4); backdrop-filter: blur(8px); }
        .sm-btn-glass:hover { background: rgba(255,255,255,0.24); }
        .sm-btn-sm { padding: 9px 18px; font-size: 14px; border-radius: 10px; }

        /* ---- Hero ---- */
        .sm-hero-wrap { padding: 24px 40px 0; max-width: 1320px; margin: 0 auto; }
        .sm-hero {
          position: relative; overflow: hidden; color: #FFFFFF; background: var(--forest);
          border-radius: 32px; min-height: 640px; padding: 56px;
          display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 48px; align-items: end;
        }
        .sm-hero-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          animation: sm-settle 2.4s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes sm-settle { from { transform: scale(1.08); } to { transform: scale(1); } }
        .sm-hero-shade { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(8,42,36,0.94) 0%, rgba(8,42,36,0.74) 46%, rgba(8,42,36,0.16) 100%); }
        .sm-hero > *:not(.sm-hero-img):not(.sm-hero-shade) { position: relative; }
        .sm-chip {
          display: inline-flex; align-items: center; gap: 8px; margin-bottom: 22px;
          font-size: 13px; font-weight: 600; color: #FFFFFF;
          background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28); backdrop-filter: blur(8px);
          padding: 7px 14px; border-radius: 999px;
        }
        .sm-chip i { width: 7px; height: 7px; border-radius: 50%; background: #F2B15A; }
        .sm-hero h1 { margin: 0; max-width: 14ch; font-size: clamp(2.5rem, 5.6vw, 4.4rem); font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; }
        .sm-hero-lead { margin: 22px 0 0; max-width: 52ch; font-size: 17px; line-height: 1.7; color: rgba(255,255,255,0.84); }
        .sm-cta-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }

        .sm-glass-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 44px; }
        .sm-glass {
          padding: 14px 18px; min-width: 200px; flex: 1 1 200px; max-width: 260px;
          background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(10px); border-radius: 16px;
        }
        .sm-glass b { display: block; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.15; }
        .sm-glass small { display: block; margin-top: 4px; font-size: 12.5px; line-height: 1.4; color: rgba(255,255,255,0.78); }

        /* Sample pass */
        .sm-pass { background: #FFFFFF; color: var(--ink); border-radius: 24px; padding: 22px; box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .sm-pass-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .sm-pass-top h3 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
        .sm-sample { font-size: 11.5px; font-weight: 700; color: var(--muted); background: #EEF2EF; padding: 3px 10px; border-radius: 999px; }
        .sm-pass-body { display: flex; gap: 16px; align-items: center; }
        .sm-qr { width: 112px; height: 112px; flex: none; border: 1px solid var(--line); border-radius: 12px; padding: 4px; }
        .sm-pass-rows { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
        .sm-pass-rows div { display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: var(--body); font-weight: 600; }
        .sm-pass-rows svg { color: var(--green); flex: none; }
        .sm-pass-perf { margin: 18px 0; }
        .sm-pass-perf span { display: block; height: 1px; background: repeating-linear-gradient(90deg, #C9D4CE 0 6px, transparent 6px 12px); }
        .sm-pass-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .sm-pass-foot p { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--muted); }
        .sm-badge-ok { display: inline-flex; align-items: center; gap: 6px; flex: none; font-size: 12px; font-weight: 700; color: var(--green); background: rgba(20,107,92,0.12); padding: 5px 11px; border-radius: 999px; }

        /* ---- Sections ---- */
        .sm-section { padding: 96px 0 0; }
        .sm-head { max-width: 62ch; margin-bottom: 40px; }
        .sm-head h2 { margin: 0; font-size: clamp(1.9rem, 3.4vw, 2.7rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
        .sm-head p { margin: 14px 0 0; font-size: 16.5px; line-height: 1.7; color: var(--body); }

        /* Energy flow */
        .sm-flow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; position: relative; }
        .sm-flow-card { position: relative; background: var(--card); border: 1px solid var(--line); border-radius: 22px; padding: 26px 24px 28px; }
        .sm-flow-card:not(:last-child)::after {
          content: ''; position: absolute; top: 47px; left: calc(100% - 4px); width: 24px; height: 2px; z-index: 2;
          background: repeating-linear-gradient(90deg, var(--amber) 0 4px, transparent 4px 8px);
        }
        .sm-ic { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        .sm-ic.g { background: rgba(20,107,92,0.12); color: var(--green); }
        .sm-ic.a { background: rgba(224,142,43,0.16); color: var(--amber-text); }
        .sm-ic svg { width: 23px; height: 23px; }
        .sm-flow-card h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
        .sm-flow-card p { margin: 0; font-size: 14px; line-height: 1.65; color: var(--body); }

        /* Sunshine */
        .sm-sun { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: 20px; align-items: stretch; }
        .sm-facts { position: relative; overflow: hidden; border-radius: 28px; color: #FFFFFF; background: var(--forest); padding: 40px; display: flex; flex-direction: column; justify-content: flex-end; gap: 22px; min-height: 560px; }
        .sm-facts-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .sm-facts-shade { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(8,42,36,0.95) 0%, rgba(8,42,36,0.72) 55%, rgba(8,42,36,0.25) 100%); }
        .sm-facts > *:not(.sm-facts-img):not(.sm-facts-shade) { position: relative; }
        .sm-fact { padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.25); }
        .sm-fact b { display: block; font-family: 'Sora', sans-serif; font-size: clamp(1.5rem, 2.6vw, 2.1rem); letter-spacing: -0.03em; line-height: 1.1; }
        .sm-fact span { display: block; margin-top: 6px; max-width: 46ch; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.82); }
        .sm-source { font-size: 12px; color: rgba(255,255,255,0.7); }

        .sm-calc { background: var(--card); border: 1px solid var(--line); border-radius: 28px; padding: 36px; display: flex; flex-direction: column; }
        .sm-calc h3 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
        .sm-calc > p { margin: 8px 0 26px; font-size: 14.5px; line-height: 1.6; color: var(--body); }
        .sm-slider-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
        .sm-slider-row label { font-size: 13.5px; font-weight: 600; color: var(--body); }
        .sm-slider-row b { font-family: 'Sora', sans-serif; font-size: 22px; }
        .sm-range { width: 100%; accent-color: var(--green); height: 28px; }
        .sm-result { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0 22px; }
        .sm-result div { padding: 16px 18px; background: #F3F6F4; border-radius: 16px; }
        .sm-result b { display: block; font-family: 'Sora', sans-serif; font-size: 24px; letter-spacing: -0.02em; line-height: 1.1; }
        .sm-result small { display: block; margin-top: 4px; font-size: 12.5px; color: var(--muted); }
        .sm-sunday { width: 100%; height: auto; display: block; margin-top: auto; }
        .sm-note { margin: 14px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--muted); }

        /* Roles */
        .sm-roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .sm-role { overflow: hidden; background: var(--card); border: 1px solid var(--line); border-radius: 26px; display: flex; flex-direction: column; }
        .sm-role-img { position: relative; height: 220px; background: var(--forest); }
        .sm-role-img img, .sm-role-img svg { width: 100%; height: 100%; object-fit: cover; display: block; }
        .sm-role-tag {
          position: absolute; left: 16px; bottom: 16px; display: inline-flex; align-items: center; gap: 7px;
          padding: 6px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 700; background: rgba(255,255,255,0.95); color: var(--ink);
        }
        .sm-role-body { padding: 26px 26px 30px; }
        .sm-role-body .sm-ic { margin-bottom: 16px; }
        .sm-role h3 { margin: 0 0 8px; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
        .sm-role p { margin: 0 0 18px; font-size: 14.5px; line-height: 1.65; color: var(--body); }
        .sm-role ul { list-style: none; margin: 0; padding: 18px 0 0; border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 10px; }
        .sm-role li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; line-height: 1.5; color: var(--body); }
        .sm-role li svg { flex: none; margin-top: 2px; color: var(--green); }

        /* Steps */
        .sm-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .sm-step { background: var(--card); border: 1px solid var(--line); border-radius: 22px; padding: 26px 24px 28px; }
        .sm-step-n { width: 34px; height: 34px; border-radius: 50%; background: var(--ink); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700; margin-bottom: 18px; }
        .sm-step h3 { margin: 0 0 8px; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
        .sm-step p { margin: 0; font-size: 14px; line-height: 1.65; color: var(--body); }
        .sm-rules { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .sm-rule { display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; border-radius: 999px; background: #FFFFFF; border: 1px solid var(--line); font-size: 13.5px; font-weight: 600; color: var(--body); }
        .sm-rule svg { color: var(--green); }

        /* FAQ */
        .sm-faq-grid { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 56px; align-items: start; }
        .sm-faq { display: flex; flex-direction: column; gap: 10px; }
        .sm-faq details { background: var(--card); border: 1px solid var(--line); border-radius: 18px; padding: 0 22px; transition: border-color .12s ease; }
        .sm-faq details[open] { border-color: #B9C8C0; }
        .sm-faq summary { list-style: none; cursor: pointer; padding: 18px 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 15.5px; font-weight: 600; letter-spacing: -0.01em; }
        .sm-faq summary::-webkit-details-marker { display: none; }
        .sm-faq summary::after { content: '+'; flex: none; width: 28px; height: 28px; border-radius: 50%; background: #EEF2EF; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 500; color: var(--green); transition: transform .15s ease; }
        .sm-faq details[open] summary::after { transform: rotate(45deg); }
        .sm-faq details p { margin: 0; padding: 0 0 20px; font-size: 14.5px; line-height: 1.7; color: var(--body); max-width: 62ch; }

        /* CTA */
        .sm-cta { position: relative; overflow: hidden; border-radius: 32px; color: #FFFFFF; background: var(--forest); padding: 72px 56px; min-height: 380px; display: flex; flex-direction: column; justify-content: center; }
        .sm-cta-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .sm-cta-shade { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(8,42,36,0.94) 0%, rgba(8,42,36,0.75) 55%, rgba(8,42,36,0.3) 100%); }
        .sm-cta > *:not(.sm-cta-img):not(.sm-cta-shade) { position: relative; }
        .sm-cta h2 { margin: 0; max-width: 18ch; font-size: clamp(2rem, 4vw, 3.2rem); font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }
        .sm-cta p { margin: 16px 0 0; max-width: 50ch; font-size: 16.5px; line-height: 1.7; color: rgba(255,255,255,0.84); }

        /* Footer */
        .sm-footer { margin-top: 72px; border-top: 1px solid var(--line); background: #FFFFFF; }
        .sm-footer-in { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 32px; padding: 28px 40px; width: 100%; }
        .sm-footer p { margin: 0; font-size: 12.5px; color: var(--muted); }
        .sm-footer-links { display: flex; gap: 6px; }

        @media (max-width: 1100px) {
          .sm-hero { grid-template-columns: 1fr; min-height: 0; padding: 44px 36px; align-items: start; }
          .sm-pass { max-width: 420px; }
          .sm-flow, .sm-steps { grid-template-columns: repeat(2, 1fr); }
          .sm-flow-card:not(:last-child)::after { display: none; }
          .sm-sun, .sm-faq-grid { grid-template-columns: 1fr; }
          .sm-faq-grid { gap: 32px; }
          .sm-facts { min-height: 480px; }
          .sm-roles { grid-template-columns: 1fr; }
        }
        @media (max-width: 860px) {
          .sm-nav-links { display: none; }
        }
        @media (max-width: 640px) {
          .sm-wrap { padding: 0 16px; }
          .sm-nav { padding: 12px 16px; }
          .sm-brand span { display: none; }
          .sm-hero-wrap { padding: 12px 16px 0; }
          .sm-hero { padding: 30px 22px; border-radius: 24px; }
          .sm-glass { max-width: none; }
          .sm-section { padding-top: 72px; }
          .sm-flow, .sm-steps { grid-template-columns: 1fr; }
          .sm-facts, .sm-calc { padding: 26px 22px; border-radius: 22px; }
          .sm-cta { padding: 44px 24px; border-radius: 24px; }
          .sm-footer-in { padding: 24px 16px; }
          .sm-result { grid-template-columns: 1fr; }
          .sm-pass-body { flex-direction: column; align-items: flex-start; }
        }
        @media (prefers-reduced-motion: reduce) {
          .sm-root * { transition: none !important; }
          .sm-hero-img { animation: none; }
        }
      `}</style>

      {/* Nav */}
      <div className="sm-nav-shell">
        <nav className="sm-nav">
          <Link to="/" className="sm-brand">
            <div className="sm-mark">
              <Sun size={19} color="#FFFFFF" strokeWidth={2.25} />
            </div>
            <div>
              <h2 className="sm-display">Solar Microgrid</h2>
              <span>Peer-to-peer energy trading</span>
            </div>
          </Link>
          <div className="sm-nav-links">
            <a href="#how-solar-works">How solar works</a>
            <a href="#sunshine">Sunshine</a>
            <a href="#roles">Who it is for</a>
            <a href="#drop-off">Drop-offs</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="sm-nav-actions">
            <Link to="/login" className="sm-link-btn">Sign in</Link>
            <Link to="/register" className="sm-btn sm-btn-green sm-btn-sm">Register</Link>
          </div>
        </nav>
      </div>

      {/* Hero */}
      <div className="sm-hero-wrap">
        <header className="sm-hero">
          <Photo id={PHOTO.hero} w={2000} eager className="sm-hero-img" alt="Rows of solar panels stretching across a field" />
          <div className="sm-hero-shade" />

          <div>
            <span className="sm-chip"><i />Live across grid hubs in Sri Lanka</span>
            <h1 className="sm-display">Turn your rooftop into a trading floor</h1>
            <p className="sm-hero-lead">
              Book a slot, drop off your surplus solar energy at a local hub, and get paid for it.
              Solar Microgrid connects prosumers, grid operators, and administrators on one platform.
            </p>
            <div className="sm-cta-row">
              <Link to="/login" className="sm-btn sm-btn-primary">
                Log in to your portal <ArrowRight size={17} strokeWidth={2.5} />
              </Link>
              <Link to="/register" className="sm-btn sm-btn-glass">
                Register as a prosumer
              </Link>
            </div>

            <div className="sm-glass-row">
              <div className="sm-glass">
                <b>4.5–6.0 kWh/m²</b>
                <small>Average sunshine per day across Sri Lanka</small>
              </div>
              <div className="sm-glass">
                <b>18–20%</b>
                <small>Sunlight typical panels turn into electricity</small>
              </div>
              <div className="sm-glass">
                <b>3 roles, 1 platform</b>
                <small>Prosumers, operators and administrators</small>
              </div>
            </div>
          </div>

          <div className="sm-pass" aria-label="Example of a drop-off pass">
            <div className="sm-pass-top">
              <h3 className="sm-display">Drop-off pass</h3>
              <span className="sm-sample">Sample</span>
            </div>
            <div className="sm-pass-body">
              <SampleQr />
              <div className="sm-pass-rows">
                <div><MapPin size={15} />Your chosen hub</div>
                <div><CalendarClock size={15} />Date and time you pick</div>
                <div><Zap size={15} />Energy in kWh</div>
              </div>
            </div>
            <div className="sm-pass-perf"><span /></div>
            <div className="sm-pass-foot">
              <p>Show your secure QR token at the hub to finish the handover.</p>
              <span className="sm-badge-ok"><CheckCircle2 size={13} />Approved</span>
            </div>
          </div>
        </header>
      </div>

      {/* How solar works */}
      <section className="sm-section sm-wrap" id="how-solar-works">
        <div className="sm-head">
          <h2 className="sm-display">From sunlight to shared energy</h2>
          <p>
            Every drop-off starts on a roof. Here is the journey your surplus energy takes before a
            neighbour uses it.
          </p>
        </div>
        <div className="sm-flow">
          <div className="sm-flow-card">
            <div className="sm-ic a"><Sun /></div>
            <h3 className="sm-display">Sunlight hits the panels</h3>
            <p>Solar cells are made of silicon. When sunlight strikes them, they release electrons and create a flow of direct current (DC).</p>
          </div>
          <div className="sm-flow-card">
            <div className="sm-ic g"><Zap /></div>
            <h3 className="sm-display">The inverter converts it</h3>
            <p>An inverter changes DC into alternating current (AC), the type your home appliances and the grid use.</p>
          </div>
          <div className="sm-flow-card">
            <div className="sm-ic a"><BatteryCharging /></div>
            <h3 className="sm-display">Surplus gets stored</h3>
            <p>Whatever your home does not use can be kept in batteries. Hubs hold energy in battery slots that operators keep up to date.</p>
          </div>
          <div className="sm-flow-card">
            <div className="sm-ic g"><MapPin /></div>
            <h3 className="sm-display">The hub shares it locally</h3>
            <p>A microgrid hub keeps that energy close to where it is needed, so people nearby benefit from what prosumers drop off.</p>
          </div>
        </div>
      </section>

      {/* Sunshine */}
      <section className="sm-section sm-wrap" id="sunshine">
        <div className="sm-head">
          <h2 className="sm-display">Sri Lanka is built for solar</h2>
          <p>
            Sitting close to the equator, the island receives strong sunshine all year with little
            seasonal swing. See what a rooftop could produce.
          </p>
        </div>

        <div className="sm-sun">
          <div className="sm-facts">
            <Photo id={PHOTO.sky} w={1400} className="sm-facts-img" alt="Solar panels under a bright blue sky" />
            <div className="sm-facts-shade" />
            <div className="sm-fact">
              <b className="sm-display">4.5–6.0 kWh/m² a day</b>
              <span>Annual average sunlight energy reaching each square metre across most of the country.</span>
            </div>
            <div className="sm-fact">
              <b className="sm-display">1,247–2,106 kWh/m² a year</b>
              <span>The range across the island. Lowlands receive the most, while cloudy hill country receives less.</span>
            </div>
            <div className="sm-fact">
              <b className="sm-display">Around 18–20% efficiency</b>
              <span>Typical commercial panels convert roughly this share of sunlight into electricity.</span>
            </div>
            <div className="sm-source">Sources: ADB Sri Lanka energy assessment; Sri Lanka Sustainable Energy Authority solar atlas.</div>
          </div>

          <div className="sm-calc">
            <h3 className="sm-display">How much could your roof make?</h3>
            <p>Slide to your system size to see a rough daily and monthly range.</p>
            <div className="sm-slider-row">
              <label htmlFor="sm-kw">Solar system size</label>
              <b className="sm-display">{kw} kW</b>
            </div>
            <input id="sm-kw" className="sm-range" type="range" min="1" max="15" step="1" value={kw} onChange={e => setKw(Number(e.target.value))} />
            <div className="sm-result">
              <div><b className="sm-display">{fmt(low)}–{fmt(high)} kWh</b><small>Per day</small></div>
              <div><b className="sm-display">{fmt(low * 30)}–{fmt(high * 30)} kWh</b><small>Per 30 days</small></div>
            </div>
            <SunDay />
            <p className="sm-note">
              Illustrative curve for a sunny day. Estimates use the sunshine range above with a 75% system
              performance ratio; real output depends on shade, roof angle, clouds and equipment.
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="sm-section sm-wrap" id="roles">
        <div className="sm-head">
          <h2 className="sm-display">One network, three roles</h2>
          <p>Everyone gets the tools that fit their job, on the device they actually use.</p>
        </div>
        <div className="sm-roles">
          <article className="sm-role">
            <div className="sm-role-img">
              <Photo id={PHOTO.roof} w={900} alt="A house with solar panels on the roof" />
              <span className="sm-role-tag"><Smartphone size={14} />Mobile app</span>
            </div>
            <div className="sm-role-body">
              <div className="sm-ic a"><Sun /></div>
              <h3 className="sm-display">Solar prosumers</h3>
              <p>
                Book a date and time to drop off surplus energy at a nearby hub. Once approved,
                a secure QR code confirms the handover on arrival.
              </p>
              <ul>
                <li><CheckCircle2 size={15} />Pick a hub that still has battery slots free</li>
                <li><CheckCircle2 size={15} />Track every reservation and its approval status</li>
                <li><CheckCircle2 size={15} />Cancel a pending booking when plans change</li>
              </ul>
            </div>
          </article>

          <article className="sm-role">
            <div className="sm-role-img">
              <Photo id={PHOTO.install} w={900} alt="A technician working on solar panels" />
              <span className="sm-role-tag"><Globe size={14} />Web and mobile</span>
            </div>
            <div className="sm-role-body">
              <div className="sm-ic g"><Wrench /></div>
              <h3 className="sm-display">Grid operators</h3>
              <p>
                Track available battery slots at the hub, review incoming bookings, and scan a
                prosumer's QR code on-site to finalize each energy transfer.
              </p>
              <ul>
                <li><CheckCircle2 size={15} />Keep battery slot counts accurate in seconds</li>
                <li><CheckCircle2 size={15} />Approve pending bookings from one queue</li>
                <li><CheckCircle2 size={15} />Scan the QR token to complete the handover</li>
              </ul>
            </div>
          </article>

          <article className="sm-role">
            <div className="sm-role-img">
              <Photo id={PHOTO.field} w={900} alt="A solar farm with rows of panels" />
              <span className="sm-role-tag"><Monitor size={14} />Web app</span>
            </div>
            <div className="sm-role-body">
              <div className="sm-ic g"><ShieldCheck /></div>
              <h3 className="sm-display">Backoffice administrators</h3>
              <p>
                Register new grid hubs, set their capacity in kWh, and manage or deactivate
                prosumer and operator accounts across the network.
              </p>
              <ul>
                <li><CheckCircle2 size={15} />Add hubs with capacity and battery slots</li>
                <li><CheckCircle2 size={15} />Deactivate or reactivate accounts instantly</li>
                <li><CheckCircle2 size={15} />See accounts and hubs at a glance</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      {/* Drop-off steps */}
      <section className="sm-section sm-wrap" id="drop-off">
        <div className="sm-head">
          <h2 className="sm-display">How a drop-off works</h2>
          <p>Four steps from your roof to a completed transfer.</p>
        </div>
        <ol className="sm-steps">
          <li className="sm-step">
            <div className="sm-step-n">1</div>
            <h3 className="sm-display">Register</h3>
            <p>Create your prosumer account with your details so the network knows who is trading.</p>
          </li>
          <li className="sm-step">
            <div className="sm-step-n">2</div>
            <h3 className="sm-display">Book a slot</h3>
            <p>Choose a hub with room, the amount of energy in kWh, and the date and time that suit you.</p>
          </li>
          <li className="sm-step">
            <div className="sm-step-n">3</div>
            <h3 className="sm-display">Get approved</h3>
            <p>A grid operator reviews the booking. It moves from Pending to Approved and your QR token is ready.</p>
          </li>
          <li className="sm-step">
            <div className="sm-step-n">4</div>
            <h3 className="sm-display">Scan at the hub</h3>
            <p>Arrive, show your QR token, and the operator scans it to finalize the energy transfer.</p>
          </li>
        </ol>
        <div className="sm-rules">
          <span className="sm-rule"><CalendarClock size={15} />7-day booking rule</span>
          <span className="sm-rule"><Clock size={15} />12-hour cancellation rule</span>
          <span className="sm-rule"><QrCode size={15} />Secure QR handover</span>
          <span className="sm-rule"><Leaf size={15} />Clean energy, no fuel burned</span>
        </div>
      </section>

      {/* FAQ */}
      <section className="sm-section sm-wrap" id="faq">
        <div className="sm-faq-grid">
          <div className="sm-head" style={{ marginBottom: 0 }}>
            <h2 className="sm-display">Solar and microgrid basics</h2>
            <p>New to solar trading? These answers cover the words you will meet on the platform.</p>
          </div>
          <div className="sm-faq">
            {FAQ.map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="sm-section sm-wrap">
        <div className="sm-cta">
          <Photo id={PHOTO.brick} w={1800} className="sm-cta-img" alt="A brick house with solar panels on its roof" />
          <div className="sm-cta-shade" />
          <h2 className="sm-display">Put your spare sunshine to work</h2>
          <p>Register in minutes, book your first drop-off, and turn surplus solar energy into value for your neighbourhood.</p>
          <div className="sm-cta-row">
            <Link to="/register" className="sm-btn sm-btn-primary">
              Register as a prosumer <ArrowRight size={17} strokeWidth={2.5} />
            </Link>
            <Link to="/login" className="sm-btn sm-btn-glass">Log in to your portal</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="sm-footer">
        <div className="sm-footer-in">
          <p>Solar Microgrid Trading System</p>
          <div className="sm-footer-links">
            <Link to="/login" className="sm-link-btn">Sign in</Link>
            <Link to="/register" className="sm-link-btn">Register</Link>
          </div>
          <p>&copy; 2026 Solar Microgrid. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}