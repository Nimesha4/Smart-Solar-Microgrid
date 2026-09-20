import { Link } from 'react-router-dom';
import { Sun, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="sm-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');

        .sm-root {
          min-height: 100vh;
          background:
            radial-gradient(720px 420px at 8% -10%, rgba(224,142,43,0.16), transparent 65%),
            radial-gradient(760px 480px at 100% 10%, rgba(20,107,92,0.12), transparent 60%),
            #FBFAF7;
          color: #1B2420;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .sm-root *, .sm-root *::before, .sm-root *::after { box-sizing: border-box; }
        .sm-display { font-family: 'Sora', 'Inter', sans-serif; }

        /* Nav */
        .sm-nav {
          display: flex; align-items: center; justify-content: space-between;
          max-width: 1180px; margin: 0 auto; padding: 26px 28px;
        }
        .sm-brand { display: flex; align-items: center; gap: 12px; }
        .sm-mark {
          width: 38px; height: 38px; border-radius: 10px; flex: none;
          background: linear-gradient(135deg, #E08E2B, #C9701B);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 16px rgba(224,142,43,0.28);
        }
        .sm-brand h2 { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
        .sm-brand span { display: block; margin-top: 1px; font-size: 12px; color: #6B7A72; }
        .sm-nav-actions { display: flex; align-items: center; gap: 10px; }
        .sm-link-btn {
          font-size: 14px; font-weight: 600; color: #1B2420; text-decoration: none;
          padding: 9px 16px; border-radius: 8px; transition: background-color .12s ease;
        }
        .sm-link-btn:hover { background: rgba(27,36,32,0.06); }

        /* Hero */
        .sm-hero { max-width: 840px; margin: 0 auto; padding: 56px 28px 8px; text-align: center; }
        .sm-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600; color: #146B5C;
          background: rgba(20,107,92,0.08); border: 1px solid rgba(20,107,92,0.16);
          padding: 6px 14px; border-radius: 999px; margin-bottom: 24px;
        }
        .sm-eyebrow i { width: 6px; height: 6px; border-radius: 50%; background: #146B5C; }
        .sm-hero h1 {
          margin: 0; font-size: clamp(2.3rem, 5vw, 3.4rem);
          font-weight: 700; letter-spacing: -0.03em; line-height: 1.08;
        }
        .sm-accent { color: #E08E2B; }
        .sm-hero p {
          margin: 22px auto 0; max-width: 54ch; font-size: 17px;
          line-height: 1.65; color: #5B6B63;
        }
        .sm-cta-row { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 34px; }
        .sm-btn {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 700; text-decoration: none;
          padding: 13px 24px; border-radius: 10px;
          transition: background-color .15s ease, border-color .15s ease, transform .1s ease;
        }
        .sm-btn:active { transform: translateY(1px); }
        .sm-btn-primary { background: #146B5C; color: #FFFFFF; box-shadow: 0 10px 24px rgba(20,107,92,0.22); }
        .sm-btn-primary:hover { background: #0F5548; }
        .sm-btn-outline { background: #FFFFFF; color: #1B2420; border: 1px solid #DEDCD3; }
        .sm-btn-outline:hover { border-color: #1B2420; }

        /* Roles */
        .sm-roles {
          max-width: 1180px; margin: 68px auto 0; padding: 0 28px 88px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        .sm-role {
          background: #FFFFFF; border: 1px solid #ECEAE2; border-radius: 16px;
          padding: 28px 24px; text-align: left;
        }
        .sm-role-icon {
          width: 44px; height: 44px; border-radius: 11px;
          display: flex; align-items: center; justify-content: center; margin-bottom: 18px;
        }
        .sm-role-icon svg { width: 22px; height: 22px; }
        .sm-role h3 { margin: 0 0 4px; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
        .sm-role .sm-tag { font-size: 12.5px; font-weight: 600; color: #8A968F; margin-bottom: 12px; }
        .sm-role p { margin: 0; font-size: 14px; line-height: 1.6; color: #5B6B63; }

        .sm-role-prosumer .sm-role-icon { background: rgba(224,142,43,0.12); color: #C9701B; }
        .sm-role-operator .sm-role-icon { background: rgba(20,107,92,0.12); color: #146B5C; }
        .sm-role-admin .sm-role-icon { background: rgba(27,36,32,0.08); color: #33413A; }

        .sm-foot { text-align: center; padding: 0 28px 40px; font-size: 12.5px; color: #9AA6A0; }

        @media (max-width: 860px) {
          .sm-roles { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) { .sm-root * { transition: none !important; } }
      `}</style>

      {/* Nav */}
      <nav className="sm-nav">
        <div className="sm-brand">
          <div className="sm-mark">
            <Sun size={19} color="#FFFFFF" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="sm-display">Solar Microgrid</h2>
            <span>Peer-to-peer energy trading</span>
          </div>
        </div>
        <div className="sm-nav-actions">
          <Link to="/login" className="sm-link-btn">Sign in</Link>
          <Link to="/register" className="sm-btn sm-btn-primary" style={{ padding: '9px 18px', fontSize: 14 }}>
            Register
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="sm-hero">
        <span className="sm-eyebrow"><i />Live across grid hubs in Sri Lanka</span>
        <h1 className="sm-display">
          Turn your rooftop into a <span className="sm-accent">trading floor</span>
        </h1>
        <p>
          Book a slot, drop off your surplus solar energy at a local hub, and get paid for it.
          Solar Microgrid connects prosumers, grid operators, and administrators on one platform.
        </p>
        <div className="sm-cta-row">
          <Link to="/login" className="sm-btn sm-btn-primary">
            Log in to your portal <ArrowRight size={17} strokeWidth={2.5} />
          </Link>
          <Link to="/register" className="sm-btn sm-btn-outline">
            Register as a prosumer
          </Link>
        </div>
      </header>

      {/* Roles */}
      <section className="sm-roles">
        <div className="sm-role sm-role-prosumer">
          <div className="sm-role-icon"><Sun strokeWidth={2} /></div>
          <div className="sm-tag">Mobile app</div>
          <h3>Solar prosumers</h3>
          <p>
            Book a date and time to drop off surplus energy at a nearby hub. Once approved,
            a secure QR code confirms the handover on arrival.
          </p>
        </div>

        <div className="sm-role sm-role-operator">
          <div className="sm-role-icon"><Wrench strokeWidth={2} /></div>
          <div className="sm-tag">Web and mobile</div>
          <h3>Grid operators</h3>
          <p>
            Track available battery slots at the hub, review incoming bookings, and scan a
            prosumer's QR code on-site to finalize each energy transfer.
          </p>
        </div>

        <div className="sm-role sm-role-admin">
          <div className="sm-role-icon"><ShieldCheck strokeWidth={2} /></div>
          <div className="sm-tag">Web app</div>
          <h3>Backoffice administrators</h3>
          <p>
            Register new grid hubs, set their capacity in kWh, and manage or deactivate
            prosumer and operator accounts across the network.
          </p>
        </div>
      </section>

      <p className="sm-foot">Enterprise Application Development (SE4040) — Assignment 1</p>
    </div>
  );
}