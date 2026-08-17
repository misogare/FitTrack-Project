
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function Profile(){
  const {user, logout} = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState({
    workout: true, goals: true, weekly: true,
    nutrition: false, badges: true, marketing: false
  });

  // Load profile on mount
  useEffect(() => {
    api.getProfile().then(d => setProfile(d.user)).catch(() => {});
  }, []);

  // Scroll to hash section when URL hash changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  const save = async () => {
    try {
      await api.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        height_cm: profile.height_cm
      });
      setEditing(false);
      setMessage('Profile updated successfully.');
    } catch (e) {
      setError(e.message);
    }
  };

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <div className="app-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">Manage your personal information, security settings, and preferences.</p>
        </div>
      </div>

      {message && <div className="alert" style={{marginBottom:16}}>{message}</div>}
      {error && <div className="alert" style={{marginBottom:16}}>{error}</div>}

      <div className="profile-layout">
        <aside className="profile-side">
          <section className="card profile-avatar-card">
            <div className="profile-avatar-large">
              {(profile.first_name || 'A')[0]}{(profile.last_name || '')[0]}
            </div>
            <div className="profile-name">{profile.first_name} {profile.last_name}</div>
            <div className="profile-email">{profile.email}</div>
            <div className="member-badge">Active Member</div>
            <div className="profile-stats">
              <div className="profile-stat"><strong>—</strong><span>Workouts</span></div>
              <div className="profile-stat"><strong>—</strong><span>Goals Active</span></div>
            </div>
          </section>

          <section className="card quick-nav">
            <a href="#details" onClick={scrollTo('details')}>
              <Icon name="user"/> Personal Details <span style={{marginLeft:'auto'}}>›</span>
            </a>
            <a href="#password" onClick={scrollTo('password')}>
              <Icon name="lock"/> Change Password <span style={{marginLeft:'auto'}}>›</span>
            </a>
            <a href="#notifications" onClick={scrollTo('notifications')}>
              <Icon name="settings"/> Notifications <span style={{marginLeft:'auto'}}>›</span>
            </a>
            <Link to="/settings">
              <Icon name="shield"/> Privacy Settings <span style={{marginLeft:'auto'}}>›</span>
            </Link>
            <a href="#legal" onClick={scrollTo('legal')}>
              <Icon name="info"/> Legal <span style={{marginLeft:'auto'}}>›</span>
            </a>
          </section>
        </aside>

        <main className="profile-sections">
          <section className="card profile-section" id="details">
            <div className="section-head">
              <div>
                <h2 className="section-title">Personal Details</h2>
                <p className="section-description">Information stored on your FitTrack profile.</p>
              </div>
              {editing
                ? <button className="button button-dark button-sm" onClick={save}>Save Profile</button>
                : <button className="button button-outline button-sm" onClick={() => setEditing(true)}>
                    <Icon name="settings" size={13}/> Edit Profile
                  </button>
              }
            </div>
            <div className="detail-grid">
              {[
                ['first_name','First Name'],
                ['last_name','Last Name'],
                ['email','Email Address'],
                ['date_of_birth','Date of Birth'],
                ['gender','Gender'],
                ['height_cm','Height']
              ].map(([key, label]) => (
                <div className="detail-field" key={key}>
                  <label>{label}</label>
                  {editing && key !== 'email'
                    ? <input className="detail-value" value={profile[key] || ''} 
                        onChange={e => setProfile({...profile, [key]: e.target.value})}/>
                    : <div className="detail-value">
                        {profile[key] || 'Not provided'}
                        {key === 'email' && <span style={{float:'right', color:'#737373'}}>Verified</span>}
                        {key === 'height_cm' && profile[key] ? ' cm' : ''}
                      </div>
                  }
                </div>
              ))}
            </div>
          </section>

          <section className="card profile-section" id="password">
            <div className="section-head">
              <div>
                <h2 className="section-title">Change Password</h2>
                <p className="section-description">Password changes require backend support for the current password flow.</p>
              </div>
            </div>
            <div className="alert">
              <Icon name="info" size={14}/> The supplied backend currently supports login and registration but does not expose a password-change endpoint. The UI is included to match the Figma design without pretending the API exists.
            </div>
          </section>

          <section className="card profile-section" id="notifications">
            <div className="section-head">
              <div>
                <h2 className="section-title">Notification Settings</h2>
                <p className="section-description">Choose which reminders you want to receive.</p>
              </div>
            </div>
            <div>
              {[
                ['workout','Workout Reminders','Get reminded before scheduled workouts'],
                ['goals','Goal Progress Alerts','Receive updates when goals reach milestones'],
                ['weekly','Weekly Summary Report','Email digest every Monday with weekly stats'],
                ['nutrition','Nutrition Reminders','Log meals prompts at configured times'],
                ['badges','Achievement Badges','Notify when new badges are earned'],
                ['marketing','Marketing & Promotions','Offers, tips, and product updates from FitTrack']
              ].map(([key, t, d]) => (
                <Toggle key={key} title={t} description={d} value={notifications[key]} 
                  onChange={() => setNotifications({...notifications, [key]: !notifications[key]})}/>
              ))}
            </div>
          </section>

          <section className="card profile-section" id="legal">
            <div className="section-head">
              <div><h2 className="section-title">Legal & Support</h2></div>
            </div>
            <div className="legal-grid">
              <div className="legal-link"><Icon name="shield"/><div><strong>Privacy Policy</strong><span>How we handle your data</span></div></div>
              <div className="legal-link"><Icon name="info"/><div><strong>Terms of Service</strong><span>Usage rules and agreements</span></div></div>
              <div className="legal-link"><Icon name="info"/><div><strong>Help Center</strong><span>FAQs and support articles</span></div></div>
              <div className="legal-link"><Icon name="mail"/><div><strong>Contact Support</strong><span>Reach our support team</span></div></div>
            </div>
          </section>

          <section className="card profile-section">
            <div className="signout-row">
              <div>
                <strong style={{fontSize:14, fontWeight:400}}>Sign Out</strong>
                <p className="section-description">You will be logged out of this device. Your data and settings will be saved.</p>
              </div>
              <button className="button button-outline" onClick={async () => { await logout(); location.href='/'; }}>
                <Icon name="logout"/> Log Out
              </button>
            </div>
          </section>

          <div className="small muted" style={{textAlign:'center'}}>
            FitTrack v1.0 · © 2026 FitTrack · Report a Bug
          </div>
        </main>
      </div>
    </div>
  );
}

function Toggle({title, description, value, onChange}){
  return (
    <div className="toggle-row">
      <div className="toggle-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button type="button" className={`switch ${value ? 'on' : ''}`} onClick={onChange} aria-pressed={value}>
        <div className="switch-dot"/>
      </button>
    </div>
  );
}