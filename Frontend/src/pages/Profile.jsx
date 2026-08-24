import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './Profile.css';

/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const fmtDate = s => {
  if (!s) return '—';
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(m[1], m[2] - 1, m[3]).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
const fmtMemberSince = s => {
  if (!s) return '—';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};
const initials = p => `${(p.first_name || 'A')[0]}${(p.last_name || 'U')[0]}`.toUpperCase();
const fmtNum = v => { const n = Number(v); return Number.isFinite(n) && String(v) !== '' ? String(n) : v; };

const NOTIF_DEFAULTS = {
  workout: true, goals: true, weekly: true,
  nutrition: false, badges: true, marketing: false,
};
const NOTIF_ROWS = [
  ['workout', 'Workout Reminders', 'Get reminded before scheduled workouts'],
  ['goals', 'Goal Progress Alerts', 'Receive updates when goals reach milestones'],
  ['weekly', 'Weekly Summary Report', 'Email digest every Monday with weekly stats'],
  ['nutrition', 'Nutrition Reminders', 'Log meals prompts at configured times'],
  ['badges', 'Achievement Badges', 'Notify when new badges are earned'],
  ['marketing', 'Marketing & Promotions', 'Offers, tips, and product updates from FitTrack'],
];

export default function Profile() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwShow, setPwShow] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  const [notifications, setNotifications] = useState(() => {
    try {
      return { ...NOTIF_DEFAULTS, ...JSON.parse(localStorage.getItem('fittrack_notifications') || '{}') };
    } catch { return NOTIF_DEFAULTS; }
  });
  const [notifSaved, setNotifSaved] = useState('');

  const load = async () => {
    try {
      const d = await api.getProfile();
      setProfile(d.user);
    } catch { /* keep existing */ }
  };

  useEffect(() => { load(); }, []);

  // Scroll to hash section when URL hash changes
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const scrollTo = id => e => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.pushState(null, '', `#${id}`);
  };

  /* ---------- profile save ---------- */
  const save = async () => {
    try {
      await api.updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        date_of_birth: profile.date_of_birth,
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
      });
      setEditing(false);
      setMessage('Profile updated successfully.');
      setTimeout(() => setMessage(''), 3000);
      await load();
    } catch (e) { setError(e.message); setTimeout(() => setError(''), 4000); }
  };

  /* ---------- change password ---------- */
  const changePassword = async e => {
    e.preventDefault();
    setPwMessage(''); setPwError('');
    if (!pwForm.current_password) return setPwError('Enter your current password.');
    if (pwForm.new_password.length < 8 || !/[a-zA-Z]/.test(pwForm.new_password) || !/[0-9]/.test(pwForm.new_password)) {
      return setPwError('New password must be at least 8 characters and include a letter and a number.');
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      return setPwError('New passwords do not match.');
    }
    try {
      setPwSaving(true);
      await api.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setPwMessage('Password updated successfully.');
      setTimeout(() => setPwMessage(''), 4000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  /* ---------- notifications ---------- */
  const toggleNotif = key => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try { localStorage.setItem('fittrack_notifications', JSON.stringify(next)); } catch { /* ignore */ }
  };
  const saveNotifs = () => {
    setNotifSaved('Notification preferences saved on this device.');
    setTimeout(() => setNotifSaved(''), 3000);
  };

  const setField = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  return (
    <div className="app-page profile-page">

      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile</h1>
          <p className="page-subtitle">Manage your personal information, security settings, and preferences.</p>
        </div>
      </div>

      {message && <div className="alert" style={{ marginBottom: 16, background: '#ecfdf5', color: '#047857' }}>{message}</div>}
      {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="profile-layout">

        {/* LEFT COLUMN */}
        <aside className="profile-side">

          {/* AVATAR CARD */}
          <section className="profile-card profile-avatar-card">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-large">{initials(profile)}</div>
              <span className="profile-avatar-cam" title="Avatar coming soon"><Icon name="camera" size={11} /></span>
            </div>
            <div className="profile-name">{profile.first_name || '—'} {profile.last_name || ''}</div>
            <div className="profile-email">{profile.email || '—'}</div>
            <span className="profile-member-badge"><Icon name="check" size={10} /> Active Member</span>

            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{profile.workout_count ?? '—'}</strong>
                <span>Workouts</span>
              </div>
              <div className="profile-stat">
                <strong>{profile.active_goal_count ?? '—'}</strong>
                <span>Goals Active</span>
              </div>
            </div>
          </section>

          {/* MEMBER SINCE */}
          <section className="profile-card profile-member-card">
            <div className="profile-member-icon"><Icon name="calendar" size={15} /></div>
            <div>
              <span>Member Since</span>
              <strong>{fmtMemberSince(profile.created_at)}</strong>
            </div>
          </section>

          {/* QUICK NAV */}
          <nav className="profile-card profile-quick-nav">
            <a href="#details" onClick={scrollTo('details')}><Icon name="user" size={14} /> Personal Details <Icon name="chevronRight" size={12} /></a>
            <a href="#password" onClick={scrollTo('password')}><Icon name="lock" size={14} /> Change Password <Icon name="chevronRight" size={12} /></a>
            <a href="#notifications" onClick={scrollTo('notifications')}><Icon name="settings" size={14} /> Notifications <Icon name="chevronRight" size={12} /></a>
            <Link to="/settings"><Icon name="shield" size={14} /> Privacy Settings <Icon name="chevronRight" size={12} /></Link>
            <a href="#legal" onClick={scrollTo('legal')}><Icon name="info" size={14} /> Legal <Icon name="chevronRight" size={12} /></a>
          </nav>

        </aside>

        {/* RIGHT COLUMN */}
        <main className="profile-sections">

          {/* PERSONAL DETAILS */}
          <section className="profile-card profile-section" id="details">
            <div className="profile-section-head">
              <h2><Icon name="user" size={15} /> Personal Details</h2>
              {editing
                ? <button className="button button-dark button-sm" onClick={save}>Save Profile</button>
                : <button className="button button-outline button-sm" onClick={() => setEditing(true)}><Icon name="edit" size={12} /> Edit Profile</button>}
            </div>

            <div className="detail-grid">
              {[
                ['first_name', 'First Name'],
                ['last_name', 'Last Name'],
                ['email', 'Email Address'],
                ['date_of_birth', 'Date of Birth'],
                ['gender', 'Gender'],
                ['height_cm', 'Height'],
                ['weight_kg', 'Current Weight'],
              ].map(([key, label]) => (
                <div className="detail-field" key={key}>
                  <label>{label}</label>
                  {editing && key !== 'email' ? (
                    <input
                      className="detail-value"
                      value={profile[key] ?? ''}
                      onChange={e => setField(key, e.target.value)}
                      placeholder={key === 'gender' ? 'Male / Female / Other' : ''}
                    />
                  ) : (
                    <div className="detail-value">
                      {key === 'email'
                        ? <span className="detail-email">{profile[key] || '—'} <em><Icon name="check" size={10} /> Verified</em></span>
                        : key === 'height_cm'
                          ? (profile[key] ? `${fmtNum(profile[key])} cm` : 'Not provided')
                          : key === 'weight_kg'
                            ? (profile[key] ? `${fmtNum(profile[key])} kg` : 'Not provided')
                            : key === 'date_of_birth'
                              ? fmtDate(profile[key])
                              : (profile[key] || 'Not provided')}
                    </div>
                  )}
                </div>
              ))}
              <div className="detail-field detail-full">
                <label>Fitness Level</label>
                <div className="detail-value">Intermediate</div>
              </div>
            </div>
          </section>

          {/* CHANGE PASSWORD */}
          <section className="profile-card profile-section" id="password">
            <div className="profile-section-head">
              <h2><Icon name="lock" size={15} /> Change Password</h2>
            </div>

            {pwMessage && <div className="alert" style={{ marginBottom: 12, background: '#ecfdf5', color: '#047857' }}>{pwMessage}</div>}
            {pwError && <div className="alert" style={{ marginBottom: 12 }}>{pwError}</div>}

            <form onSubmit={changePassword}>
              <div className="detail-grid">
                <div className="detail-field detail-full">
                  <label>Current Password</label>
                  <div className="pw-input">
                    <input
                      type={pwShow.current ? 'text' : 'password'}
                      placeholder="Enter current password"
                      value={pwForm.current_password}
                      onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    />
                    <button type="button" onClick={() => setPwShow(s => ({ ...s, current: !s.current }))} aria-label="Show password">
                      <Icon name={pwShow.current ? 'eye' : 'eye'} size={14} />
                    </button>
                  </div>
                </div>
                <div className="detail-field">
                  <label>New Password</label>
                  <div className="pw-input">
                    <input
                      type={pwShow.new ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={pwForm.new_password}
                      onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                    />
                    <button type="button" onClick={() => setPwShow(s => ({ ...s, new: !s.new }))} aria-label="Show password">
                      <Icon name="eye" size={14} />
                    </button>
                  </div>
                  <small>Min. 8 characters, include a letter and a number.</small>
                </div>
                <div className="detail-field">
                  <label>Confirm New Password</label>
                  <div className="pw-input">
                    <input
                      type={pwShow.confirm ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={pwForm.confirm_password}
                      onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                    />
                    <button type="button" onClick={() => setPwShow(s => ({ ...s, confirm: !s.confirm }))} aria-label="Show password">
                      <Icon name="eye" size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="profile-form-foot">
                <span className="small muted">Passwords are stored as salted hashes — no one, including us, can read them.</span>
                <button type="submit" className="button button-dark button-sm" disabled={pwSaving}>
                  <Icon name="lock" size={12} /> {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          {/* NOTIFICATIONS */}
          <section className="profile-card profile-section" id="notifications">
            <div className="profile-section-head">
              <h2><Icon name="settings" size={15} /> Notification Settings</h2>
            </div>
            {notifSaved && <div className="alert" style={{ marginBottom: 12, background: '#ecfdf5', color: '#047857' }}>{notifSaved}</div>}
            <div className="toggle-list">
              {NOTIF_ROWS.map(([key, t, d]) => (
                <Toggle key={key} title={t} description={d} value={notifications[key]}
                  onChange={() => toggleNotif(key)} />
              ))}
            </div>
            <div className="profile-form-foot">
              <span className="small muted">Reminder delivery is configured per device.</span>
              <button className="button button-dark button-sm" onClick={saveNotifs}><Icon name="check" size={12} /> Save Preferences</button>
            </div>
          </section>

          {/* PRIVACY */}
          <section className="profile-card profile-section" id="privacy">
            <div className="profile-section-head">
              <h2><Icon name="shield" size={15} /> Privacy Settings</h2>
              <Link to="/settings" className="auth-link small">Full Privacy & Data Settings →</Link>
            </div>
            <div className="toggle-list">
              <div className="privacy-row">
                <div><strong>Profile Visibility</strong><span>Allow others to view your public profile</span></div>
                <span className="privacy-link"><Link to="/settings">Manage →</Link></span>
              </div>
              <div className="privacy-row">
                <div><strong>Data Sharing & Research</strong><span>Control how your anonymized data is used</span></div>
                <span className="privacy-link"><Link to="/settings">Manage →</Link></span>
              </div>
              <div className="privacy-row">
                <div><strong>Email Reminders</strong><span>Choose which emails FitTrack sends you</span></div>
                <span className="privacy-link"><Link to="/settings">Manage →</Link></span>
              </div>
            </div>
          </section>

          {/* LEGAL */}
          <section className="profile-card profile-section" id="legal">
            <div className="profile-section-head">
              <h2><Icon name="info" size={15} /> Legal & Support</h2>
            </div>
            <div className="legal-grid">
              {[
                ['shield', 'Privacy Policy', 'How we handle your data'],
                ['info', 'Terms of Service', 'Usage rules and agreements'],
                ['info', 'Help Center', 'FAQs and support articles'],
                ['mail', 'Contact Support', 'Reach our support team'],
              ].map(([icon, t, d]) => (
                <div className="legal-link" key={t}><div className="legal-icon"><Icon name={icon} size={14} /></div><div><strong>{t}</strong><span>{d}</span></div></div>
              ))}
            </div>
          </section>

          {/* SIGN OUT */}
          <section className="profile-card profile-section">
            <div className="signout-row">
              <div>
                <strong style={{ fontSize: 14, fontWeight: 500 }}>Sign Out</strong>
                <p className="section-description">You will be logged out of this device. Your data and settings will be saved.</p>
              </div>
              <button className="button button-outline" onClick={async () => { await logout(); window.location.href = '/'; }}>
                <Icon name="logout" size={14} /> Log Out
              </button>
            </div>
          </section>

          <div className="profile-version">
            FitTrack v1.0 · © 2026 FitTrack Inc. · Report a Bug
          </div>

        </main>
      </div>
    </div>
  );
}

/* ============================================================ */

function Toggle({ title, description, value, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <button type="button" className={`switch ${value ? 'on' : ''}`} onClick={onChange} aria-pressed={value}>
        <div className="switch-dot" />
      </button>
    </div>
  );
}
