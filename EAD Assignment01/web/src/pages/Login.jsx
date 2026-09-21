import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Sun, IdCard, Lock, ArrowRight, AlertCircle, Eye, EyeOff, Wrench, ShieldCheck,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Photos: your own copy -> Pexels -> drawn solar artwork.           */
/*  Save your own photos as /public/solar/<id>.jpg if Pexels is       */
/*  blocked on your network. Set LOCAL_DIR to '' to skip that step.   */
/* ------------------------------------------------------------------ */
const LOCAL_DIR = '/solar';
const LOGIN_PHOTO = 12243093; // house with rooftop solar panels

const photoSources = (id, w) => [
  ...(LOCAL_DIR ? [`${LOCAL_DIR}/${id}.jpg`] : []),
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`,
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`,
];

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
        <polygon points={pts} fill="url(#lgArtPanel)" />
        {cols}
        <line x1={800 - (h1 + h2) / 2} y1={(y1 + y2) / 2} x2={800 + (h1 + h2) / 2} y2={(y1 + y2) / 2} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        <polygon points={pts} fill="url(#lgArtSheen)" />
      </g>
    );
  }
  return (
    <svg className={className} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="lgArtSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B3F36" />
          <stop offset="55%" stopColor="#1F7A69" />
          <stop offset="100%" stopColor="#F2B15A" />
        </linearGradient>
        <radialGradient id="lgArtSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFE7B5" stopOpacity="1" />
          <stop offset="30%" stopColor="#F7C57A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#E08E2B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lgArtGround" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12493E" />
          <stop offset="100%" stopColor="#071F1A" />
        </linearGradient>
        <linearGradient id="lgArtPanel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1A4F7A" />
          <stop offset="100%" stopColor="#0A2140" />
        </linearGradient>
        <linearGradient id="lgArtSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="430" fill="url(#lgArtSky)" />
      <circle cx="1120" cy="330" r="340" fill="url(#lgArtSun)" />
      <circle cx="1120" cy="330" r="48" fill="#FFF1D2" />
      <rect y="420" width="1600" height="480" fill="url(#lgArtGround)" />
      {items}
    </svg>
  );
}

function Photo({ id, w = 1600, alt = '', className = '' }) {
  const list = photoSources(id, w);
  const [i, setI] = useState(0);
  if (i >= list.length) return <SolarArt className={className} />;
  return (
    <img
      key={list[i]}
      className={className}
      src={list[i]}
      alt={alt}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setI(n => n + 1)}
    />
  );
}

/* ------------------------------------------------------------------ */

export default function Login() {
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://localhost:5199/api/users/${nic}`);
      const user = response.data;

      if (user.passwordHash !== password) {
        setError("Incorrect password.");
        return;
      }

      if (!user.isActive) {
        setError("Account is deactivated. Contact Backoffice.");
        return;
      }

      // Store in localStorage for basic auth simulation
      localStorage.setItem('user', JSON.stringify(user));

      if (user.role === 'Backoffice') navigate('/backoffice');
      else if (user.role === 'GridOperator') navigate('/operator');
      else if (user.role === 'Prosumer') navigate('/prosumer');
      else setError("Invalid role.");
    } catch (err) {
      setError("User not found or connection error.");
    }
  };

  return (
    <div className="lg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .lg-root {
          --green: #146B5C; --green-d: #0F5548; --forest: #0B3F36;
          --amber: #E08E2B; --amber-d: #C9701B; --amber-text: #A65A0E;
          --ink: #14201B; --body: #43524B; --muted: #5F6F67;
          --line: #E1E8E4; --bg: #F3F6F4;
          min-height: 100vh;
          display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          background: var(--bg);
          color: var(--ink);
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .lg-root *, .lg-root *::before, .lg-root *::after { box-sizing: border-box; }
        .lg-display { font-family: 'Sora', 'Inter', sans-serif; }
        .lg-root :focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }

        /* ---- Photo panel ---- */
        .lg-panel {
          position: relative; overflow: hidden; color: #FFFFFF; background: var(--forest);
          padding: 44px 48px; min-height: 100vh;
          display: flex; flex-direction: column; justify-content: space-between; gap: 32px;
        }
        .lg-panel-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          animation: lg-settle 2.2s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes lg-settle { from { transform: scale(1.08); } to { transform: scale(1); } }
        .lg-shade {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(8,42,36,0.78) 0%, rgba(8,42,36,0.38) 38%, rgba(8,42,36,0.94) 100%);
        }
        .lg-panel > *:not(.lg-panel-img):not(.lg-shade) { position: relative; }

        .lg-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: #FFFFFF; }
        .lg-mark {
          width: 38px; height: 38px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
        }
        .lg-brand h1 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; line-height: 1.2; }
        .lg-brand span { display: block; margin-top: 1px; font-size: 12.5px; color: rgba(255,255,255,0.78); }

        .lg-chip {
          display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;
          font-size: 13px; font-weight: 600;
          background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.28); backdrop-filter: blur(8px);
          padding: 7px 14px; border-radius: 999px;
        }
        .lg-chip i { width: 7px; height: 7px; border-radius: 50%; background: #F2B15A; }
        .lg-copy h2 { margin: 0; max-width: 14ch; font-size: clamp(2rem, 3.8vw, 3.2rem); font-weight: 700; letter-spacing: -0.035em; line-height: 1.04; }
        .lg-copy p { margin: 18px 0 0; max-width: 46ch; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.84); }

        .lg-glass-row { display: flex; flex-wrap: wrap; gap: 12px; }
        .lg-glass {
          flex: 1 1 130px; padding: 14px 18px;
          background: rgba(255,255,255,0.13); border: 1px solid rgba(255,255,255,0.22);
          backdrop-filter: blur(10px); border-radius: 16px;
        }
        .lg-glass b { display: block; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.15; }
        .lg-glass small { display: block; margin-top: 4px; font-size: 12.5px; color: rgba(255,255,255,0.78); }
        .lg-credit { margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); }

        /* ---- Mobile banner ---- */
        .lg-banner { display: none; position: relative; overflow: hidden; height: 170px; background: var(--forest); color: #FFFFFF; }
        .lg-banner .lg-panel-img { animation: none; }
        .lg-banner .lg-shade { background: linear-gradient(180deg, rgba(8,42,36,0.55), rgba(8,42,36,0.9)); }
        .lg-banner .lg-brand { position: absolute; left: 20px; bottom: 18px; }

        /* ---- Form panel ---- */
        .lg-form-wrap { display: flex; align-items: center; justify-content: center; padding: 48px 40px; }
        .lg-form-inner { width: 100%; max-width: 420px; }
        .lg-form-inner h2 { margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
        .lg-sub { margin: 10px 0 28px; font-size: 15px; line-height: 1.6; color: var(--body); }

        .lg-error {
          display: flex; align-items: flex-start; gap: 10px;
          background: rgba(224,142,43,0.12); border: 1px solid rgba(201,112,27,0.35);
          color: var(--amber-text); font-size: 13.5px; font-weight: 600; line-height: 1.45;
          padding: 12px 14px; border-radius: 12px; margin-bottom: 20px;
        }
        .lg-error svg { flex: none; margin-top: 1px; }

        .lg-field { margin-bottom: 18px; }
        .lg-field label { display: block; font-size: 13px; font-weight: 600; color: var(--body); margin-bottom: 7px; }
        .lg-input-wrap { position: relative; display: flex; align-items: center; }
        .lg-input-wrap > svg { position: absolute; left: 14px; color: var(--muted); pointer-events: none; }
        .lg-input-wrap input {
          width: 100%; font: inherit; font-size: 15px; color: var(--ink);
          background: #FFFFFF; border: 1px solid #D6DED9; border-radius: 12px;
          padding: 13px 44px 13px 42px;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .lg-input-wrap input::placeholder { color: #8B9892; }
        .lg-input-wrap input:focus { outline: none; border-color: var(--green); box-shadow: 0 0 0 3px rgba(20,107,92,0.16); }
        .lg-eye {
          position: absolute; right: 6px; width: 36px; height: 36px; border-radius: 9px; border: none; background: transparent;
          color: var(--muted); cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background-color .12s ease, color .12s ease;
        }
        .lg-eye:hover { background: #EEF2EF; color: var(--ink); }

        .lg-submit {
          width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: var(--forest); color: #FFFFFF; border: none; cursor: pointer;
          padding: 14px 0; border-radius: 12px; font: inherit; font-size: 15px; font-weight: 700;
          margin-top: 6px; box-shadow: 0 10px 24px rgba(11,63,54,0.22);
          transition: background-color .12s ease, transform .1s ease;
        }
        .lg-submit:hover { background: var(--green); }
        .lg-submit:active { transform: translateY(1px); }

        .lg-register { margin-top: 22px; text-align: center; font-size: 14px; color: var(--body); }
        .lg-register a { color: var(--green); font-weight: 700; text-decoration: none; }
        .lg-register a:hover { text-decoration: underline; }

        .lg-roles { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--line); }
        .lg-roles p { margin: 0 0 14px; font-size: 13px; font-weight: 600; color: var(--body); }
        .lg-role-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .lg-role {
          display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px;
          background: #FFFFFF; border: 1px solid var(--line); font-size: 13px; font-weight: 600; color: var(--body);
        }
        .lg-role svg { color: var(--green); }
        .lg-help { margin: 14px 0 0; font-size: 12.5px; line-height: 1.55; color: var(--muted); }

        @media (max-width: 900px) {
          .lg-root { grid-template-columns: 1fr; }
          .lg-panel { display: none; }
          .lg-banner { display: block; }
          .lg-form-wrap { padding: 32px 20px 48px; align-items: flex-start; }
          .lg-form-inner h2 { font-size: 26px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lg-root * { transition: none !important; }
          .lg-panel-img { animation: none; }
        }
      `}</style>

      {/* Photo panel (desktop) */}
      <aside className="lg-panel">
        <Photo id={LOGIN_PHOTO} w={1800} className="lg-panel-img" alt="A house with solar panels on the roof" />
        <div className="lg-shade" />

        <Link to="/" className="lg-brand">
          <div className="lg-mark"><Sun size={19} color="#FFFFFF" strokeWidth={2.25} /></div>
          <div>
            <h1 className="lg-display">Solar Microgrid</h1>
            <span>Peer-to-peer energy trading</span>
          </div>
        </Link>

        <div className="lg-copy">
          <span className="lg-chip"><i />Live across grid hubs in Sri Lanka</span>
          <h2 className="lg-display">Your surplus energy, put to work.</h2>
          <p>Sign in to book a drop-off, monitor a hub, or manage the network — whichever seat you sit in.</p>
        </div>

        <div>
          <div className="lg-glass-row">
            <div className="lg-glass"><b>24/7</b><small>Online booking</small></div>
            <div className="lg-glass"><b>QR</b><small>Secure handoff</small></div>
            <div className="lg-glass"><b>kWh</b><small>Real-time tracking</small></div>
          </div>
          <p className="lg-credit" style={{ marginTop: 18 }}>Photography from Pexels</p>
        </div>
      </aside>

      {/* Form panel */}
      <main>
        {/* Photo banner (mobile) */}
        <div className="lg-banner">
          <Photo id={LOGIN_PHOTO} w={900} className="lg-panel-img" alt="" />
          <div className="lg-shade" />
          <Link to="/" className="lg-brand">
            <div className="lg-mark"><Sun size={19} color="#FFFFFF" strokeWidth={2.25} /></div>
            <div>
              <h1 className="lg-display">Solar Microgrid</h1>
              <span>Peer-to-peer energy trading</span>
            </div>
          </Link>
        </div>

        <div className="lg-form-wrap">
          <div className="lg-form-inner">
            <h2 className="lg-display">Welcome back</h2>
            <p className="lg-sub">Sign in with your NIC and password to continue.</p>

            {error && (
              <div className="lg-error" role="alert">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="lg-field">
                <label htmlFor="lg-nic">NIC number</label>
                <div className="lg-input-wrap">
                  <IdCard size={17} />
                  <input
                    id="lg-nic"
                    type="text"
                    autoComplete="username"
                    placeholder="e.g. 200015700123"
                    value={nic}
                    onChange={(e) => setNic(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="lg-field">
                <label htmlFor="lg-pw">Password</label>
                <div className="lg-input-wrap">
                  <Lock size={17} />
                  <input
                    id="lg-pw"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button" className="lg-eye"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPw(v => !v)}
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="lg-submit">
                Log in <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </form>

            <div className="lg-register">
              Don't have an account? <Link to="/register">Register here</Link>
            </div>

            <div className="lg-roles">
              <p>One sign-in takes you to your own portal</p>
              <div className="lg-role-row">
                <span className="lg-role"><Sun size={14} />Prosumer</span>
                <span className="lg-role"><Wrench size={14} />Grid operator</span>
                <span className="lg-role"><ShieldCheck size={14} />Backoffice</span>
              </div>
              <p className="lg-help">Account deactivated? Ask Backoffice to reactivate it.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}