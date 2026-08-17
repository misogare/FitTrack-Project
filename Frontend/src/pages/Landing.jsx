import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Icon from '../components/Icon';

export default function Landing() {
  return <div className="landing">
    <Navbar publicPage />
    <section className="landing-hero" id="about"><div className="landing-inner">
      <span className="eyebrow">Fitness, simplified</span>
      <h1>Build healthier habits with one clear view of your progress.</h1>
      <p className="landing-lead">FitTrack brings workouts, nutrition, goals and progress analytics together in a focused wellness dashboard.</p>
      <div className="hero-actions"><Link className="button button-dark" to="/register">Create free account <Icon name="arrow" size={14}/></Link><a className="button button-light" href="#features">Explore features</a></div>
    </div></section>
    <section className="landing-section" id="features"><div className="landing-inner">
      <div className="section-heading"><span className="eyebrow">Everything in one place</span><h2>Simple tools for consistent progress.</h2><p>Designed around quick logging, useful feedback and privacy-conscious health data handling.</p></div>
      <div className="feature-grid">
        {[['activity','Activity tracking','Log workouts with duration, intensity, calories and notes.'],['nutrition','Nutrition tracking','Record meals and monitor calories and macronutrients.'],['goal','Goals','Create measurable goals and update progress against a target date.'],['progress','Progress analytics','See weekly activity trends and performance summaries.'],['shield','Privacy first','Keep control of your profile, sharing preferences and data exports.'],['settings','Accessible by design','Clear forms, large targets, keyboard-friendly controls and responsive layouts.']].map(([icon,title,text])=><article className="feature-card" key={title}><div className="feature-icon"><Icon name={icon}/></div><h3>{title}</h3><p>{text}</p></article>)}
      </div>
    </div></section>
    <section className="landing-section alt" id="how-it-works"><div className="landing-inner">
      <div className="section-heading"><span className="eyebrow">How it works</span><h2>Three steps from intention to action.</h2></div>
      <div className="steps">{[['01','Create your account','Set up a secure FitTrack profile and choose your preferences.'],['02','Log your routine','Capture workouts, meals and goal progress as you go.'],['03','Review and improve','Use the dashboard and analytics to spot trends and stay consistent.']].map(([n,t,p])=><div className="step" key={n}><div className="step-number">{n}</div><h3>{t}</h3><p>{p}</p></div>)}</div>
    </div></section>
    <section className="landing-section" id="pricing"><div className="landing-inner"><div className="section-heading"><span className="eyebrow">Project scope</span><h2>Everything needed for the FitTrack prototype.</h2><p>Core fitness tracking functionality is available without adding a paid service dependency.</p></div><div className="pricing-card"><span className="badge">Student project</span><div className="price">$0</div><p className="muted">Core application prototype</p><ul style={{textAlign:'left',lineHeight:2,color:'#737373',fontSize:14}}><li>Workout and nutrition logging</li><li>Goal management and progress</li><li>Responsive React interface</li><li>Node/Express API integration</li></ul><Link className="button button-dark button-full" to="/register">Start with FitTrack</Link></div></div></section>
    <footer className="landing-footer"><div className="landing-inner"><div className="footer-grid"><div><div className="brand"><span className="brand-mark">ϟ</span><span>FitTrack</span></div><p className="footer-brand-copy">A fitness and wellness tracking system built for the FitTrack System Analysis and Design project.</p></div><div><div className="footer-title">Product</div><div className="footer-links"><a href="#features">Features</a><a href="#pricing">Pricing</a><a href="#how-it-works">How it works</a></div></div><div><div className="footer-title">Pages</div><div className="footer-links"><Link to="/login">Login</Link><Link to="/register">Register</Link><Link to="/dashboard">Dashboard</Link><Link to="/analytics">Analytics</Link></div></div><div><div className="footer-title">Legal</div><div className="footer-links"><Link to="/settings">Privacy settings</Link><span>Terms of Service</span><span>Contact</span></div></div></div><div className="footer-bottom"><span>© 2026 FitTrack. University SAD Documentation.</span><span>Responsive web application</span></div></div></footer>
  </div>;
}
