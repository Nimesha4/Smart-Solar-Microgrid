import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Sun, User, IdCard, Mail, Lock, ArrowRight, AlertCircle, Zap, Wrench, ShieldCheck } from 'lucide-react';

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

export default function Register() {
  const [nic, setNic] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Prosumer');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        nic: nic,
        name: name,
        email: email,
        passwordHash: password, // In a real app, hash this before sending or on backend
        role: role, // Selected role
        isActive: true
      };

      await axios.post('http://localhost:5199/api/users', newUser);
      alert("Registration successful! You can now log in.");
      navigate('/login');
    } catch (err) {
      setError("Registration failed. NIC may already exist.");
    }
  };

  const roles = [
    { value: 'Prosumer', label: 'Prosumer', icon: Zap },
    { value: 'GridOperator', label: 'Grid operator', icon: Wrench },
    { value: 'Backoffice', label: 'Backoffice', icon: ShieldCheck },
  ];

  return (
    <div className="rg-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .rg-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #EAEFEF;
          color: #1B2420;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .rg-card {
          display: grid; 
          grid-template-columns: 1fr 1fr;
          max-width: 1080px;
          width: 100%;
          background: #FFFFFF;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 24px 54px rgba(11, 63, 54, 0.08), 0 4px 14px rgba(11, 63, 54, 0.04);
        }

        .rg-root *, .rg-root *::before, .rg-root *::after { box-sizing: border-box; }
        .rg-display { font-family: 'Sora', 'Inter', sans-serif; }

        /* ---- Left brand panel ---- */
        .rg-panel {
          position: relative; overflow: hidden; color: #FFFFFF; background: #0B3F36;
          padding: 44px 44px; min-height: 640px;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .rg-panel-img {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          animation: rg-settle 2.2s cubic-bezier(.2,.7,.2,1) both;
        }
        @keyframes rg-settle { from { transform: scale(1.08); } to { transform: scale(1); } }
        .rg-shade {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(8,42,36,0.78) 0%, rgba(8,42,36,0.38) 38%, rgba(8,42,36,0.94) 100%);
        }
        .rg-panel > *:not(.rg-panel-img):not(.rg-shade) { position: relative; }

        .rg-brand { position: relative; display: flex; align-items: center; gap: 12px; text-decoration: none; color: #FFFFFF; }
        .rg-mark {
          width: 36px; height: 36px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .rg-brand h1 { margin: 0; font-size: 15px; font-weight: 700; }
        .rg-brand span { font-size: 12.5px; color: rgba(255,255,255,0.7); }

        .rg-panel-copy { position: relative; max-width: 380px; }
        .rg-panel-copy h2 {
          margin: 0; font-size: clamp(28px, 3.4vw, 38px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .rg-panel-copy p { margin: 16px 0 0; font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.75); }

        .rg-role-list { position: relative; display: flex; flex-direction: column; gap: 14px; }
        .rg-role-list div { display: flex; align-items: center; gap: 12px; }
        .rg-role-icon {
          width: 32px; height: 32px; border-radius: 9px; flex: none;
          background: rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: center;
        }
        .rg-role-list b { display: block; font-size: 13.5px; font-weight: 600; }
        .rg-role-list span { display: block; font-size: 12.5px; color: rgba(255,255,255,0.65); }

        /* ---- Right form panel ---- */
        .rg-form-wrap { display: flex; align-items: center; justify-content: center; padding: 48px 40px; height: 100%; }
        .rg-form-inner { width: 100%; max-width: 380px; }

        .rg-mobile-brand { display: none; align-items: center; gap: 10px; margin-bottom: 24px; }
        .rg-mobile-brand .rg-mark { width: 30px; height: 30px; border-radius: 8px; }
        .rg-mobile-brand h1 { margin: 0; font-size: 14px; font-weight: 700; }

        .rg-form-inner h2 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
        .rg-form-inner > p.rg-sub { margin: 8px 0 24px; font-size: 14px; color: #5B6B63; }

        .rg-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(201,112,27,0.08); border: 1px solid rgba(201,112,27,0.28);
          color: #A85A15; font-size: 13.5px; padding: 11px 13px; border-radius: 9px; margin-bottom: 18px;
        }

        .rg-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .rg-field { margin-bottom: 16px; }
        .rg-field label { display: block; font-size: 13px; font-weight: 600; color: #33413A; margin-bottom: 7px; }
        .rg-input-wrap { position: relative; display: flex; align-items: center; }
        .rg-input-wrap svg { position: absolute; left: 13px; color: #8A968F; pointer-events: none; }
        .rg-input-wrap input {
          width: 100%; font: inherit; font-size: 14.5px; color: #1B2420;
          background: #FFFFFF; border: 1px solid #DEDCD3; border-radius: 10px;
          padding: 12px 13px 12px 40px;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .rg-input-wrap input::placeholder { color: #9AA6A0; }
        .rg-input-wrap input:focus { outline: none; border-color: #146B5C; box-shadow: 0 0 0 3px rgba(20,107,92,0.12); }

        /* Role segmented control */
        .rg-role-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .rg-role-btn {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 12px 6px; border-radius: 10px; border: 1px solid #DEDCD3; background: #FFFFFF;
          cursor: pointer; font: inherit; color: #5B6B63;
          transition: border-color .12s ease, background-color .12s ease, color .12s ease;
        }
        .rg-role-btn svg { width: 17px; height: 17px; }
        .rg-role-btn span { font-size: 12px; font-weight: 600; text-align: center; }
        .rg-role-btn:hover { border-color: #146B5C; }
        .rg-role-btn.rg-active {
          border-color: #146B5C; background: rgba(20,107,92,0.07); color: #146B5C;
        }
        .rg-role-btn:focus-visible { outline: 2px solid #146B5C; outline-offset: 2px; }

        .rg-submit {
          width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: #146B5C; color: #FFFFFF; border: none; cursor: pointer;
          padding: 13px 0; border-radius: 10px; font-size: 14.5px; font-weight: 700;
          margin-top: 8px; margin-bottom: 20px;
          transition: background-color .12s ease, transform .1s ease;
        }
        .rg-submit:hover { background: #0F5548; }
        .rg-submit:active { transform: translateY(1px); }

        .rg-login { text-align: center; font-size: 13.5px; color: #5B6B63; }
        .rg-login a { color: #146B5C; font-weight: 600; text-decoration: none; }
        .rg-login a:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .rg-root { padding: 0; align-items: flex-start; }
          .rg-card { grid-template-columns: 1fr; border-radius: 0; box-shadow: none; min-height: 100vh; }
          .rg-panel { display: none; }
          .rg-mobile-brand { display: flex; }
          .rg-form-wrap { padding: 32px 20px; height: auto; min-height: 100vh; }
        }
        @media (max-width: 460px) {
          .rg-row2 { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) { .rg-root * { transition: none !important; } }
      `}</style>

      <div className="rg-card">
        {/* Left brand panel */}
        <div className="rg-panel">
          <Photo id={LOGIN_PHOTO} w={1800} className="rg-panel-img" alt="A house with solar panels on the roof" />
          <div className="rg-shade" />
          
          <Link to="/" className="rg-brand">
            <div className="rg-mark"><Sun size={18} color="#FFFFFF" strokeWidth={2.25} /></div>
            <div>
              <h1 className="rg-display">Solar Microgrid</h1>
              <span>Peer-to-peer energy trading</span>
            </div>
          </Link>

          <div className="rg-panel-copy">
            <h2 className="rg-display">One account, three ways to take part.</h2>
            <p>Tell us which seat you'll sit in — you can trade energy, run a hub, or manage the network.</p>
          </div>

          <div className="rg-role-list">
            <div>
              <div className="rg-role-icon"><Zap size={16} /></div>
              <div>
                <b>Prosumer</b>
                <span>Book drop-offs and trade surplus solar energy</span>
              </div>
            </div>
            <div>
              <div className="rg-role-icon"><Wrench size={16} /></div>
              <div>
                <b>Grid operator</b>
                <span>Monitor battery slots and confirm handoffs on-site</span>
              </div>
            </div>
            <div>
              <div className="rg-role-icon"><ShieldCheck size={16} /></div>
              <div>
                <b>Backoffice</b>
                <span>Register hubs and manage accounts network-wide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="rg-form-wrap">
          <div className="rg-form-inner">
            <div className="rg-mobile-brand">
              <div className="rg-mark"><Sun size={15} color="#FFFFFF" strokeWidth={2.25} /></div>
              <h1 className="rg-display">Solar Microgrid</h1>
            </div>

            <h2 className="rg-display">Create your account</h2>
            <p className="rg-sub">Register in a minute, then sign in to your portal.</p>

            {error && (
              <div className="rg-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="rg-field">
                <label>Full name</label>
                <div className="rg-input-wrap">
                  <User size={16} />
                  <input type="text" placeholder="Jane Perera" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>

              <div className="rg-row2">
                <div className="rg-field">
                  <label>NIC number</label>
                  <div className="rg-input-wrap">
                    <IdCard size={16} />
                    <input type="text" placeholder="200015700123" value={nic} onChange={(e) => setNic(e.target.value)} required />
                  </div>
                </div>
                <div className="rg-field">
                  <label>Password</label>
                  <div className="rg-input-wrap">
                    <Lock size={16} />
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div className="rg-field">
                <label>Email</label>
                <div className="rg-input-wrap">
                  <Mail size={16} />
                  <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="rg-field" style={{ marginBottom: 24 }}>
                <label>Account type</label>
                <div className="rg-role-seg" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="rg-role-btn rg-active" style={{ cursor: 'default', flexDirection: 'row', justifyContent: 'center', gap: '8px', padding: '14px' }}>
                    <Zap size={18} />
                    <span style={{ fontSize: '13.5px' }}>Prosumer</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="rg-submit">
                Register <ArrowRight size={16} strokeWidth={2.5} />
              </button>
            </form>

            <div className="rg-login">
              Already have an account? <Link to="/login">Login here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}