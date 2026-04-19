import { Link } from 'react-router-dom';
import { useScrollReveal, useCountUp } from '../hooks/useUtils';
import { useState } from 'react';
import { cn } from '../lib/cn';

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed inset-x-0 top-0 z-[1000] bg-forest-dark/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="font-display font-extrabold text-xl text-gold no-underline">City Boy Connect</Link>
        <button className="md:hidden bg-transparent border-none text-white text-2xl cursor-pointer" onClick={() => setOpen(!open)} aria-label="Toggle navigation">☰</button>
        <div className={cn(
          "items-center gap-4 md:gap-6 md:flex md:static md:flex-row md:p-0 md:bg-transparent md:border-0",
          open ? "flex flex-col absolute top-16 inset-x-0 bg-forest-dark p-6 border-b-2 border-gold" : "hidden"
        )}>
          <a href="#about" className="text-white/80 text-sm font-medium no-underline hover:text-white transition-colors" onClick={() => setOpen(false)}>About</a>
          <a href="#features" className="text-white/80 text-sm font-medium no-underline hover:text-white transition-colors" onClick={() => setOpen(false)}>Features</a>
          <a href="#structure" className="text-white/80 text-sm font-medium no-underline hover:text-white transition-colors" onClick={() => setOpen(false)}>Structure</a>
          <Link to="/login" className="text-white/80 text-sm font-medium no-underline hover:text-white transition-colors" onClick={() => setOpen(false)}>Login</Link>
          <Link to="/join" className="bg-gold text-forest-dark px-6 py-2 rounded-full font-semibold no-underline hover:bg-gold-light transition-colors" onClick={() => setOpen(false)}>Register Now</Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[linear-gradient(145deg,#0d2416_0%,#1a472a_50%,#1a3a2a_100%)]">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0">
          {Array.from({ length: 20 }, (_, i) => (
            <span key={i} className="absolute w-1 h-1 bg-gold rounded-full opacity-30 animate-float" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }} />
          ))}
        </div>
      </div>
      <div className="relative z-10 text-center max-w-[800px] pt-[120px] pb-20 px-4 animate-fade-in">
        <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold text-white leading-tight mb-6">Building Nigeria's Most Organised Youth Movement</h1>
        <p className="text-[clamp(1rem,2vw,1.2rem)] text-white/75 leading-relaxed mb-8 max-w-[600px] mx-auto">
          A digital platform connecting thousands of young Nigerians from ward level to national leadership — structured, measurable, and unstoppable.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/join" className="inline-flex items-center px-8 py-4 rounded-full font-semibold text-base no-underline transition-all bg-gold text-forest-dark hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,160,23,0.3)]">Join the Movement</Link>
          <a href="#about" className="inline-flex items-center px-8 py-4 rounded-full font-semibold text-base no-underline transition-all bg-transparent text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/5">Learn More</a>
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, end, suffix = '' }) {
  const [ref, value] = useCountUp(end, 2000);
  return (
    <div className="text-center" ref={ref}>
      <span className="block font-display text-[clamp(2rem,4vw,2.75rem)] font-extrabold text-gold leading-none">{value.toLocaleString()}{suffix}</span>
      <span className="block text-sm text-white/70 mt-1">{label}</span>
    </div>
  );
}

function StatsStrip() {
  return (
    <section className="bg-forest py-12 border-b-[3px] border-gold">
      <div className="container mx-auto px-4 grid grid-cols-4 gap-6 max-md:grid-cols-2">
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
    <section className="py-20 bg-off-white" id="about" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold text-forest-dark text-center mb-2">How It Works</h2>
        <p className="text-center text-gray-500 text-base max-w-[560px] mx-auto mb-12">Three simple steps to become part of Nigeria's most organized youth movement</p>
        <div className="grid grid-cols-3 gap-8 max-md:grid-cols-1">
          {steps.map((s, i) => (
            <div key={i} className={cn("text-center px-6 py-8 bg-white rounded-xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated", vis && "animate-slide-up")} style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="text-[2.5rem] mb-4">{s.icon}</div>
              <div className="inline-block text-[0.7rem] font-bold uppercase tracking-widest text-gold-dark bg-gold/10 px-3 py-0.5 rounded-full mb-2">Step {i + 1}</div>
              <h3 className="text-lg font-bold mb-1 text-forest-dark">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
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
    <section className="py-20" id="structure" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold text-forest-dark text-center mb-2">Movement Structure</h2>
        <p className="text-center text-gray-500 text-base max-w-[560px] mx-auto mb-12">A pyramid of leadership from polling units to national coordination</p>
        <div className="flex flex-col items-center gap-4 max-w-[700px] mx-auto">
          {levels.map((l, i) => (
            <div key={i} className={cn("flex items-center gap-4 max-md:w-full", vis && "animate-slide-up")} style={{ width: `${40 + i * 10}%`, animationDelay: `${i * 0.1}s` }}>
              <div className="w-1.5 h-12 rounded-sm shrink-0" style={{ background: l.color }} />
              <div>
                <h4 className="text-[0.95rem] font-bold text-forest-dark">{l.name}</h4>
                <p className="text-[0.8rem] text-gray-500">{l.desc}</p>
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
    { icon: '📍', title: 'Political Placement', desc: "Automatic placement into Nigeria's political structure — Zone, State, LGA, Ward" },
    { icon: '📊', title: 'Leader Dashboards', desc: 'Real-time analytics for coordinators at every level with performance tracking' },
    { icon: '📅', title: 'Event Management', desc: 'Create, manage, and track attendance at rallies, town halls, and training events' },
    { icon: '📢', title: 'Announcements', desc: 'Targeted communications that reach the right members at the right level' },
    { icon: '📋', title: 'Grassroots Reports', desc: 'Structured reporting from ward level up to national leadership' },
  ];
  return (
    <section className="py-20 bg-off-white" id="features" ref={ref}>
      <div className="container mx-auto px-4">
        <h2 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold text-forest-dark text-center mb-2">Platform Features</h2>
        <p className="text-center text-gray-500 text-base max-w-[560px] mx-auto mb-12">Everything you need to build and manage a modern political movement</p>
        <div className="grid grid-cols-3 gap-6 max-md:grid-cols-1">
          {features.map((f, i) => (
            <div key={i} className={cn("bg-white p-8 rounded-xl shadow-card transition-all duration-300 border-t-[3px] border-t-transparent hover:-translate-y-1 hover:shadow-elevated hover:border-t-gold", vis && "animate-slide-up")} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-[2rem] mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-forest-dark mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
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
    <section className="py-20 bg-forest-dark" ref={ref}>
      <div className="container mx-auto px-4 text-center max-w-[700px]">
        <blockquote className={cn("font-display text-[clamp(1.1rem,2.2vw,1.5rem)] font-medium text-white leading-relaxed italic", vis && "animate-fade-in")}>
          "The future of Nigeria belongs to those who organize. City Boy Connect is how we build the most
          structured, accountable, and impactful youth movement this country has ever seen."
        </blockquote>
        <cite className="block mt-6 text-gold text-sm font-semibold not-italic">— City Boy Movement National Leadership</cite>
      </div>
    </section>
  );
}

function JoinCTA() {
  return (
    <section className="py-20 bg-[linear-gradient(135deg,#1a472a_0%,#2d6a4f_100%)] text-center">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-[clamp(1.5rem,3vw,2.5rem)] font-extrabold text-white mb-4">Ready to Join the Movement?</h2>
        <p className="text-lg text-white/80 max-w-[500px] mx-auto mb-8">Be part of something bigger. Register today and help build Nigeria's future from the grassroots up.</p>
        <Link to="/join" className="inline-flex items-center bg-gold text-forest-dark px-10 py-4 rounded-full text-lg font-bold no-underline transition-all hover:bg-gold-light hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,160,23,0.35)]">Register Now — It's Free</Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white/70 pt-20">
      <div className="container mx-auto px-4 grid grid-cols-[2fr_1.5fr_1fr] gap-12 pb-12 border-b border-white/10 max-md:grid-cols-1 max-md:gap-8">
        <div>
          <h4 className="font-display font-extrabold text-lg text-gold mb-2">City Boy Connect</h4>
          <p className="text-sm leading-relaxed">The official digital platform of the City Boy Movement Nigeria, aligned with the All Progressives Congress (APC).</p>
        </div>
        <div>
          <h5 className="text-white text-sm mb-4">Contact</h5>
          <p className="text-sm mb-1 leading-relaxed">No. 11 Niafounke Street, Off Aminu Kano Crescent, Wuse II, FCT Abuja</p>
          <p className="text-sm mb-1"><a href="mailto:Officeofdgcityboymovement@gmail.com" className="text-white/70 no-underline hover:text-gold transition-colors">Officeofdgcityboymovement@gmail.com</a></p>
          <p className="text-sm"><a href="tel:09077776773" className="text-white/70 no-underline hover:text-gold transition-colors">09077776773</a> · <a href="tel:08037143337" className="text-white/70 no-underline hover:text-gold transition-colors">08037143337</a></p>
        </div>
        <div className="flex flex-col">
          <h5 className="text-white text-sm mb-4">Quick Links</h5>
          <Link to="/join" className="text-white/70 no-underline text-sm mb-1 hover:text-gold transition-colors">Join the Movement</Link>
          <Link to="/login" className="text-white/70 no-underline text-sm mb-1 hover:text-gold transition-colors">Member Login</Link>
          <a href="#features" className="text-white/70 no-underline text-sm mb-1 hover:text-gold transition-colors">Features</a>
          <a href="#structure" className="text-white/70 no-underline text-sm mb-1 hover:text-gold transition-colors">Structure</a>
        </div>
      </div>
      <div className="py-6">
        <div className="container mx-auto px-4 flex items-center justify-between text-xs max-md:flex-col max-md:gap-2 max-md:text-center">
          <span>© {new Date().getFullYear()} City Boy Movement Nigeria. All rights reserved.</span>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded text-[0.7rem] font-bold bg-[#006600] text-white" title="APC">APC</span>
            <span className="inline-flex items-center px-3 py-1 rounded text-[0.7rem] font-bold bg-gold text-forest-dark" title="Renewed Hope">Renewed Hope</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Homepage() {
  return (
    <div>
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
