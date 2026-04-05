import './Homepage.css';
import { Link } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useUtils';
import { useState } from 'react';

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="hp-nav">
      <div className="container hp-nav__inner">
        <Link to="/" className="hp-nav__brand">City Boy Connect</Link>
        <button className="hp-nav__toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
        <div className={`hp-nav__links ${open ? 'hp-nav__links--open' : ''}`}>
          <a href="#about" onClick={() => setOpen(false)}>About</a>
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#structure" onClick={() => setOpen(false)}>Structure</a>
          <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/join" className="hp-nav__cta" onClick={() => setOpen(false)}>Register Now</Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hp-hero">
      <div className="hp-hero__bg">
        <div className="hp-hero__particles">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="hp-hero__particle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }} />
          ))}
        </div>
      </div>
      <div className="container hp-hero__content">
        <h1 className="hp-hero__title">Building Nigeria's Most Organised Youth Movement</h1>
        <p className="hp-hero__sub">
          A digital platform connecting thousands of young Nigerians from ward level to national leadership — structured, measurable, and unstoppable.
        </p>
        <div className="hp-hero__actions">
          <Link to="/join" className="hp-hero__btn hp-hero__btn--primary">Join the Movement</Link>
          <a href="#about" className="hp-hero__btn hp-hero__btn--ghost">Learn More</a>
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, end, suffix = '' }) {
  const [ref, value] = useCountUp(end, 2000);
  return (
    <div className="hp-stat" ref={ref}>
      <span className="hp-stat__value">{value.toLocaleString()}{suffix}</span>
      <span className="hp-stat__label">{label}</span>
    </div>
  );
}

function StatsStrip() {
  return (
    <section className="hp-stats">
      <div className="container hp-stats__grid">
        <StatItem label="Total Members" end={12500} suffix="+" />
        <StatItem label="States Active" end={36} />
        <StatItem label="LGAs Covered" end={774} />
        <StatItem label="Events Held" end={250} suffix="+" />
      </div>
    </section>
  );
}

function HowItWorks() {
  const [ref, vis] = useScrollReveal();
  const steps = [
    { icon: '📱', title: 'Register', desc: 'Sign up with your phone number and verify via OTP in seconds' },
    { icon: '📍', title: 'Get Placed', desc: 'Select your State, LGA, and Ward to join your local political unit' },
    { icon: '🏗️', title: 'Build Structure', desc: 'Connect with local leaders, attend events, and grow the movement' },
  ];
  return (
    <section className="hp-how" id="about" ref={ref}>
      <div className={`container hp-how__inner ${vis ? 'reveal' : ''}`}>
        <h2 className="hp-section-title">How It Works</h2>
        <p className="hp-section-sub">Three simple steps to become part of Nigeria's most organized youth movement</p>
        <div className="hp-how__steps">
          {steps.map((s, i) => (
            <div key={i} className="hp-how__step" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="hp-how__icon">{s.icon}</div>
              <div className="hp-how__num">Step {i + 1}</div>
              <h3 className="hp-how__title">{s.title}</h3>
              <p className="hp-how__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StructureOverview() {
  const [ref, vis] = useScrollReveal();
  const levels = [
    { name: 'National Leadership', desc: 'Strategic direction and coordination across all states', color: '#0d2416' },
    { name: 'Zonal Coordinators', desc: '6 geopolitical zones ensuring regional alignment', color: '#1a472a' },
    { name: 'State Directors', desc: '36 states + FCT with dedicated innovation teams', color: '#2d6a4f' },
    { name: 'LGA Coordinators', desc: '774 local government areas with on-ground structures', color: '#40916c' },
    { name: 'Ward Coordinators', desc: 'Direct community engagement at the grassroots', color: '#52b788' },
    { name: 'Polling Unit Agents', desc: 'Eyes and ears at every voting point', color: '#74c69d' },
  ];
  return (
    <section className="hp-structure" id="structure" ref={ref}>
      <div className={`container hp-structure__inner ${vis ? 'reveal' : ''}`}>
        <h2 className="hp-section-title">Movement Structure</h2>
        <p className="hp-section-sub">A pyramid of leadership from polling units to national coordination</p>
        <div className="hp-structure__pyramid">
          {levels.map((l, i) => (
            <div key={i} className="hp-structure__level" style={{ '--level-color': l.color, '--level-width': `${40 + i * 10}%`, animationDelay: `${i * 0.1}s` }}>
              <div className="hp-structure__bar" />
              <div className="hp-structure__info">
                <h4>{l.name}</h4>
                <p>{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const [ref, vis] = useScrollReveal();
  const features = [
    { icon: '👤', title: 'Member Registry', desc: 'Comprehensive digital profiles with voter card verification and unique membership IDs' },
    { icon: '📍', title: 'Political Placement', desc: 'Automatic placement into Nigeria\'s political structure — Zone, State, LGA, Ward' },
    { icon: '📊', title: 'Leader Dashboards', desc: 'Real-time analytics for coordinators at every level with performance tracking' },
    { icon: '📅', title: 'Event Management', desc: 'Create, manage, and track attendance at rallies, town halls, and training events' },
    { icon: '📢', title: 'Announcements', desc: 'Targeted communications that reach the right members at the right level' },
    { icon: '📋', title: 'Grassroots Reports', desc: 'Structured reporting from ward level up to national leadership' },
  ];
  return (
    <section className="hp-features" id="features" ref={ref}>
      <div className={`container hp-features__inner ${vis ? 'reveal' : ''}`}>
        <h2 className="hp-section-title">Platform Features</h2>
        <p className="hp-section-sub">Everything you need to build and manage a modern political movement</p>
        <div className="hp-features__grid">
          {features.map((f, i) => (
            <div key={i} className="hp-features__card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="hp-features__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadershipQuote() {
  const [ref, vis] = useScrollReveal();
  return (
    <section className="hp-quote" ref={ref}>
      <div className={`container hp-quote__inner ${vis ? 'reveal' : ''}`}>
        <blockquote className="hp-quote__text">
          "The future of Nigeria belongs to those who organize. City Boy Connect is how we build the most
          structured, accountable, and impactful youth movement this country has ever seen."
        </blockquote>
        <cite className="hp-quote__cite">— City Boy Movement National Leadership</cite>
      </div>
    </section>
  );
}

function JoinCTA() {
  return (
    <section className="hp-cta">
      <div className="container hp-cta__inner">
        <h2 className="hp-cta__title">Ready to Join the Movement?</h2>
        <p className="hp-cta__sub">Be part of something bigger. Register today and help build Nigeria's future from the grassroots up.</p>
        <Link to="/join" className="hp-cta__btn">Register Now — It's Free</Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="hp-footer">
      <div className="container hp-footer__inner">
        <div className="hp-footer__col">
          <h4 className="hp-footer__brand">City Boy Connect</h4>
          <p className="hp-footer__desc">The official digital platform of the City Boy Movement Nigeria, aligned with the All Progressives Congress (APC).</p>
        </div>
        <div className="hp-footer__col">
          <h5>Contact</h5>
          <p>No. 11 Niafounke Street, Off Aminu Kano Crescent, Wuse II, FCT Abuja</p>
          <p><a href="mailto:Officeofdgcityboymovement@gmail.com">Officeofdgcityboymovement@gmail.com</a></p>
          <p><a href="tel:09077776773">09077776773</a> · <a href="tel:08037143337">08037143337</a></p>
        </div>
        <div className="hp-footer__col">
          <h5>Quick Links</h5>
          <Link to="/join">Join the Movement</Link>
          <Link to="/login">Member Login</Link>
          <a href="#features">Features</a>
          <a href="#structure">Structure</a>
        </div>
      </div>
      <div className="hp-footer__bottom">
        <div className="container hp-footer__bottom-inner">
          <span>© {new Date().getFullYear()} City Boy Movement Nigeria. All rights reserved.</span>
          <div className="hp-footer__logos">
            <span className="hp-footer__logo-badge" title="APC">APC</span>
            <span className="hp-footer__logo-badge hp-footer__logo-badge--gold" title="Renewed Hope">Renewed Hope</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Homepage() {
  return (
    <div className="homepage">
      <Navbar />
      <Hero />
      <StatsStrip />
      <HowItWorks />
      <StructureOverview />
      <Features />
      <LeadershipQuote />
      <JoinCTA />
      <Footer />
    </div>
  );
}
