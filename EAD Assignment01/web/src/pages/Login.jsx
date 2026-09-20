import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Sun, IdCard, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [nic, setNic] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
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
          min-height: 100vh;
          display: grid; grid-template-columns: 1fr 1fr;
          background: #FBFAF7;
          color: #1B2420;
          font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .lg-root *, .lg-root *::before, .lg-root *::after { box-sizing: border-box; }
        .lg-display { font-family: 'Sora', 'Inter', sans-serif; }

        /* ---- Left brand panel ---- */
        .lg-panel {
          position: relative; overflow: hidden;
          background: linear-gradient(165deg, #146B5C 0%, #0F5548 70%, #0B4239 100%);
          color: #FFFFFF;
          padding: 48px;
          display: flex; flex-direction: column; justify-content: space-between;
        }
        .lg-panel::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(380px 380px at 85% -8%, rgba(224,142,43,0.28), transparent 65%),
            radial-gradient(260px 260px at 100% 100%, rgba(255,255,255,0.08), transparent 60%);
          pointer-events: none;
        }
        .lg-brand { position: relative; display: flex; align-items: center; gap: 12px; }
        .lg-mark {
          width: 36px; height: 36px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .lg-brand h1 { margin: 0; font-size: 15px; font-weight: 700; }
        .lg-brand span { font-size: 12.5px; color: rgba(255,255,255,0.7); }

        .lg-panel-copy { position: relative; max-width: 380px; }
        .lg-panel-copy h2 {
          margin: 0; font-size: clamp(28px, 3.4vw, 38px); font-weight: 700;
          letter-spacing: -0.03em; line-height: 1.1;
        }
        .lg-panel-copy p { margin: 16px 0 0; font-size: 15px; line-height: 1.65; color: rgba(255,255,255,0.75); }

        .lg-stats { position: relative; display: flex; gap: 36px; }
        .lg-stats div b {
          display: block; font-family: 'Sora', sans-serif; font-size: 24px; font-weight: 700;
          color: #F4C98A;
        }
        .lg-stats div span { display: block; margin-top: 4px; font-size: 12.5px; color: rgba(255,255,255,0.65); }

        /* ---- Right form panel ---- */
        .lg-form-wrap {
          display: flex; align-items: center; justify-content: center; padding: 40px;
        }
        .lg-form-inner { width: 100%; max-width: 380px; }

        .lg-mobile-brand { display: none; align-items: center; gap: 10px; margin-bottom: 28px; }
        .lg-mobile-brand .lg-mark { width: 30px; height: 30px; border-radius: 8px; }
        .lg-mobile-brand h1 { margin: 0; font-size: 14px; font-weight: 700; }

        .lg-form-inner h2 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
        .lg-form-inner > p.lg-sub { margin: 8px 0 28px; font-size: 14px; color: #5B6B63; }

        .lg-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(201,112,27,0.08); border: 1px solid rgba(201,112,27,0.28);
          color: #A85A15; font-size: 13.5px; padding: 11px 13px; border-radius: 9px; margin-bottom: 20px;
        }

        .lg-field { margin-bottom: 18px; }
        .lg-field label { display: block; font-size: 13px; font-weight: 600; color: #33413A; margin-bottom: 7px; }
        .lg-input-wrap { position: relative; display: flex; align-items: center; }
        .lg-input-wrap svg { position: absolute; left: 13px; color: #8A968F; pointer-events: none; }
        .lg-input-wrap input {
          width: 100%; font: inherit; font-size: 14.5px; color: #1B2420;
          background: #FFFFFF; border: 1px solid #DEDCD3; border-radius: 10px;
          padding: 12px 13px 12px 40px;
          transition: border-color .12s ease, box-shadow .12s ease;
        }
        .lg-input-wrap input::placeholder { color: #9AA6A0; }
        .lg-input-wrap input:focus { outline: none; border-color: #146B5C; box-shadow: 0 0 0 3px rgba(20,107,92,0.12); }

        .lg-submit {
          width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          background: #146B5C; color: #FFFFFF; border: none; cursor: pointer;
          padding: 13px 0; border-radius: 10px; font-size: 14.5px; font-weight: 700;
          margin-top: 6px; margin-bottom: 22px;
          transition: background-color .12s ease, transform .1s ease;
        }
        .lg-submit:hover { background: #0F5548; }
        .lg-submit:active { transform: translateY(1px); }

        .lg-register { text-align: center; font-size: 13.5px; color: #5B6B63; }
        .lg-register a { color: #146B5C; font-weight: 600; text-decoration: none; }
        .lg-register a:hover { text-decoration: underline; }

        @media (max-width: 900px) {
          .lg-root { grid-template-columns: 1fr; }
          .lg-panel { display: none; }
          .lg-mobile-brand { display: flex; }
          .lg-form-wrap { padding: 32px 20px; }
        }
        @media (prefers-reduced-motion: reduce) { .lg-root * { transition: none !important; } }
      `}</style>

      {/* Left brand panel */}
      <div className="lg-panel">
        <div className="lg-brand">
          <div className="lg-mark"><Sun size={18} color="#FFFFFF" strokeWidth={2.25} /></div>
          <div>
            <h1 className="lg-display">Solar Microgrid</h1>
            <span>Peer-to-peer energy trading</span>
          </div>
        </div>

        <div className="lg-panel-copy">
          <h2 className="lg-display">Your surplus energy, put to work.</h2>
          <p>Sign in to book a drop-off, monitor a hub, or manage the network — whichever seat you sit in.</p>
        </div>

        <div className="lg-stats">
          <div><b>24/7</b><span>Hub availability</span></div>
          <div><b>QR</b><span>Secure handoff</span></div>
          <div><b>kWh</b><span>Real-time tracking</span></div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg-form-wrap">
        <div className="lg-form-inner">
          <div className="lg-mobile-brand">
            <div className="lg-mark"><Sun size={15} color="#FFFFFF" strokeWidth={2.25} /></div>
            <h1 className="lg-display">Solar Microgrid</h1>
          </div>

          <h2 className="lg-display">Welcome back</h2>
          <p className="lg-sub">Sign in with your NIC and password to continue.</p>

          {error && (
            <div className="lg-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="lg-field">
              <label>NIC number</label>
              <div className="lg-input-wrap">
                <IdCard size={16} />
                <input
                  type="text"
                  placeholder="e.g. 200015700123"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="lg-field">
              <label>Password</label>
              <div className="lg-input-wrap">
                <Lock size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="lg-submit">
              Log in <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </form>

          <div className="lg-register">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}