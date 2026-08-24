import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { api } from '../services/api';

const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 275, fat: 73, hydration_litres: 2.5 };
const GOALS_KEY = 'fittrack_nutrition_goals';

const defaultPrefs = {
  profile: false,
  activity: true,
  health: false,
  nutrition: false,
  analytics: true,
  recommendations: false,
  research: false,
};

const fmtDate = (s) => {
  if (!s) return 'Never';
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Settings() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [prefsServer, setPrefsServer] = useState(true);
  const [profile, setProfile] = useState({});
  const [exportOptions, setExportOptions] = useState({
    activity: true,
    nutrition: true,
    progress: true,
    goals: true,
    profile: true,
    plans: false,
  });
  const [message, setMessage] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  // Scroll to the section named by the URL hash (e.g. #privacy-policy)
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  // Load persisted prefs + profile (for the session card)
  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([api.settings(), api.getProfile()]);
        const saved = s.settings?.prefs || {};
        setPrefs({ ...defaultPrefs, ...saved });
        setProfile(p.user || {});
        setPrefsServer(true);
      } catch {
        setPrefsServer(false);
        try {
          const local = JSON.parse(localStorage.getItem('fittrack_prefs') || '{}');
          setPrefs({ ...defaultPrefs, ...local });
        } catch { /* defaults */ }
      } finally {
        setPrefsLoaded(true);
      }
    })();
  }, []);

  const savePrefs = async () => {
    setMessage('');
    const payload = {
      prefs,
      public_profile_visibility: Boolean(prefs.profile),
      research_data_sharing: Boolean(prefs.research),
    };
    if (prefsServer) {
      try {
        await api.updateSettings(payload);
        try { localStorage.setItem('fittrack_prefs', JSON.stringify(prefs)); } catch { /* ignore */ }
        setMessage('Privacy preferences saved to your account.');
        return;
      } catch (e) {
        setMessage(e.message);
        return;
      }
    }
    try { localStorage.setItem('fittrack_prefs', JSON.stringify(prefs)); } catch { /* ignore */ }
    setMessage('Settings endpoint unavailable — saved in this browser only.');
  };

  /* ---------- Export my data ---------- */
  const doExport = async () => {
    setExporting(true);
    setMessage('');
    try {
      const data = {};
      const tasks = {};
      if (exportOptions.activity) tasks.workouts = api.workouts();
      if (exportOptions.nutrition) {
        tasks.meals = api.meals();
        tasks.water = api.waterLog();
        tasks.nutrition_goals = api.nutritionGoals();
      }
      if (exportOptions.progress) tasks.body_metrics = api.bodyMetrics({ limit: 1000 });
      if (exportOptions.goals) tasks.goals = api.goals();
      if (exportOptions.profile) tasks.profile = api.getProfile();
      if (exportOptions.plans) tasks.plans = api.plans();

      const results = await Promise.allSettled(Object.values(tasks));
      Object.keys(tasks).forEach((key, i) => {
        const r = results[i];
        if (r.status === 'fulfilled') data[key] = r.value;
      });

      data.exported_at = new Date().toISOString();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fittrack-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('Export downloaded. It contains the sections you selected.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setExporting(false);
    }
  };

  /* ---------- Danger zone ---------- */
  const confirmTyped = (what) => {
    const typed = window.prompt(`Type DELETE to confirm you want to ${what}. This cannot be undone.`);
    return typed === 'DELETE';
  };

  const handleDeleteData = async () => {
    if (!confirmTyped('delete all of your workout, nutrition, goal and progress data')) return;
    setDeleting(true);
    setMessage('');
    try {
      const res = await api.deleteAllData({ confirm: 'DELETE' });
      setMessage(res.message);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmTyped('permanently delete your account')) return;
    setDeleting(true);
    setMessage('');
    try {
      await api.deleteAccount({ confirm: 'DELETE' });
      await logout();
      window.location.href = '/';
    } catch (e) {
      setMessage(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="app-page">
      <div className="page-header">
        <div>
          <div className="small muted" style={{ marginBottom: 8 }}>Settings</div>
          <h1 className="page-title">Privacy & Data Settings</h1>
          <p className="page-subtitle">
            Manage your nutrition targets, control how your data is used, manage active sessions,
            and export or delete your account data.
          </p>
        </div>
      </div>

      <div className="privacy-layout">
        <aside className="privacy-side">
          <section className="card user-summary">
            <span className="avatar">{user?.first_name?.[0] || 'A'}</span>
            <div>
              <strong style={{ fontSize: 14, fontWeight: 400 }}>{user?.first_name} {user?.last_name}</strong>
              <div className="small muted">{user?.email}</div>
              <div className="small muted" style={{ marginTop: 4 }}>● Settings</div>
            </div>
          </section>

          <section className="card privacy-nav">
            <a href="#nutrition">Nutrition Goals <span>›</span></a>
            <a href="#sharing">Data Sharing <span>›</span></a>
            <a href="#sessions">Session Security <span>›</span></a>
            <a href="#export">Export My Data <span>›</span></a>
            <a href="#privacy-policy">Privacy Policy <span>›</span></a>
            <a href="#danger">Danger Zone <span>›</span></a>
          </section>

          <div className="card card-pad small muted">
            <strong style={{ color: '#404040' }}>Last updated</strong>
            <br />
            {prefsServer
              ? 'Your preferences are saved to your account and sync across devices.'
              : 'Settings endpoint unavailable — preferences are stored in this browser only.'}
          </div>
        </aside>

        <main className="privacy-content">
          <NutritionGoals />

          <section className="card privacy-section" id="sharing">
            <div className="section-head">
              <div>
                <h2 className="section-title"><Icon name="shield" size={15} /> Data Sharing Preferences</h2>
                <p className="section-description">
                  Choose what data you share with FitTrack services and third-party integrations.
                </p>
              </div>
              {!prefsServer && <span className="badge">Browser-only</span>}
            </div>
            <div className="privacy-toggle-list">
              {[
                ['profile', 'Profile Visibility', 'Allow other FitTrack users to view your public profile and activity highlights'],
                ['activity', 'Activity Data Sharing', 'Share workout logs and activity summaries with connected apps and wearables'],
                ['health', 'Health Metrics Sharing', 'Share body weight, BMI, and vitals with integrated health platforms'],
                ['nutrition', 'Nutrition Data Sharing', 'Share meal logs and caloric data with dietary tracking services'],
                ['analytics', 'Analytics & App Improvement', 'Help improve FitTrack by sharing anonymized usage and performance data'],
                ['recommendations', 'Personalized Recommendations', 'Allow FitTrack to use your data for personalized workout and nutrition suggestions'],
                ['research', 'Third-Party Research', 'Contribute anonymized data to health and fitness research programs'],
              ].map(([k, t, d]) => (
                <Toggle key={k} title={t} description={d} value={prefs[k]} onChange={() => toggle(k)} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="button button-dark" onClick={savePrefs}>
                Save Preferences
              </button>
            </div>
          </section>

          <section className="card privacy-section" id="sessions">
            <div className="section-head">
              <div>
                <h2 className="section-title"><Icon name="lock" size={15} /> Session Security</h2>
                <p className="section-description">The device currently signed in to your FitTrack account.</p>
              </div>
              <span className="badge">● Secure session</span>
            </div>
            <div className="session-row">
              <div className="session-icon"><Icon name="user" /></div>
              <div className="session-copy">
                <strong>Current Session <span className="badge" style={{ marginLeft: 8 }}>This device</span></strong>
                <span>{navigator.userAgent.includes('Mobile') ? 'Mobile browser' : 'Desktop browser'} · Last active: Just now</span>
              </div>
            </div>
            <div className="list-row">
              <span className="small muted">Last password change</span>
              <span className="small">{fmtDate(profile.password_changed_at)}</span>
            </div>
            <div className="list-row">
              <span className="small muted">Member since</span>
              <span className="small">{fmtDate(profile.created_at)}</span>
            </div>
            <div className="privacy-highlight" style={{ marginTop: 12 }}>
              <Icon name="info" size={14} /> Sessions are issued as secure httpOnly cookies that expire after 24 hours.
              Signing out on this device clears the session.
            </div>
          </section>

          <section className="card privacy-section" id="export">
            <div className="section-head">
              <div>
                <h2 className="section-title"><Icon name="download" size={15} /> Export My Data</h2>
                <p className="section-description">Choose the information you want to download from your FitTrack account.</p>
              </div>
            </div>
            <div className="export-grid">
              {[
                ['activity', 'Activity data', 'Workout logs and activity history'],
                ['nutrition', 'Nutrition data', 'Meal logs, water entries and calorie information'],
                ['progress', 'Progress data', 'Body measurements and progress analytics'],
                ['goals', 'Goals data', 'Goal definitions and targets'],
                ['profile', 'Profile data', 'Account and personal details'],
                ['plans', 'Workout plans', 'Saved plan information'],
              ].map(([k, t, d]) => (
                <label className="export-option" key={k}>
                  <input
                    type="checkbox"
                    checked={exportOptions[k]}
                    onChange={e => setExportOptions({ ...exportOptions, [k]: e.target.checked })}
                  />
                  <div>
                    <strong style={{ fontSize: 14, fontWeight: 400 }}>{t}</strong>
                    <span className="small muted" style={{ display: 'block', marginTop: 2 }}>{d}</span>
                  </div>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="button button-dark" onClick={doExport} disabled={exporting}>
                <Icon name="download" /> {exporting ? 'Preparing export…' : 'Export Selected Data'}
              </button>
            </div>
            {message && <div className="privacy-highlight" style={{ marginTop: 12 }}>{message}</div>}
          </section>

          <section className="card privacy-section" id="privacy-policy">
            <div className="section-head">
              <div>
                <h2 className="section-title"><Icon name="shield" size={15} /> Privacy Policy Summary</h2>
                <p className="section-description">Key privacy commitments for your FitTrack account.</p>
              </div>
              <button className="button button-outline button-sm">View Full Policy →</button>
            </div>
            <div className="grid-2">
              <Policy title="Data minimisation" text="Only information needed for account, activity, nutrition and goal features should be collected." />
              <Policy title="User control" text="You can review sharing choices and request an export of your account information." />
              <Policy title="Security" text="Authentication uses secure server-side sessions and hashed passwords in the supplied backend." />
              <Policy title="Transparency" text="Sharing options are separated so users can make informed choices about optional uses." />
            </div>
          </section>

          <section className="card privacy-section danger-zone" id="danger">
            <div className="section-head">
              <div>
                <h2 className="section-title"><Icon name="trash" size={15} /> Danger Zone</h2>
                <p className="section-description">These actions are irreversible. Please read carefully before proceeding.</p>
              </div>
            </div>
            <div className="danger-item">
              <div>
                <h3>Delete All Data</h3>
                <p>Permanently remove workout, nutrition, goal, plan and progress records while retaining the account.</p>
              </div>
              <button className="button button-danger" onClick={handleDeleteData} disabled={deleting}>
                <Icon name="trash" /> Delete Data
              </button>
            </div>
            <div className="danger-item">
              <div>
                <h3>Delete Account</h3>
                <p>Permanently delete your FitTrack account and all associated data. You will be signed out.</p>
              </div>
              <button className="button button-danger" onClick={handleDeleteAccount} disabled={deleting}>
                <Icon name="trash" /> Delete Account
              </button>
            </div>
            <div className="privacy-highlight" style={{ marginTop: 16 }}>
              <Icon name="info" size={14} /> Both actions require typing DELETE to confirm. Deleted data cannot be recovered.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   NUTRITION GOALS (server-backed with local fallback)
============================================================ */

function NutritionGoals() {
  const [goals, setGoals] = useState({ ...DEFAULT_GOALS });
  const [form, setForm] = useState({ ...DEFAULT_GOALS });
  const [waterToday, setWaterToday] = useState(null); // ml
  const [serverAvailable, setServerAvailable] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.nutritionGoals();
        setGoals(res.goals);
        setForm({ ...res.goals });
        setServerAvailable(true);
      } catch {
        setServerAvailable(false);
        try {
          const local = JSON.parse(localStorage.getItem(GOALS_KEY) || '{}');
          setGoals({ ...DEFAULT_GOALS, ...local });
          setForm({ ...DEFAULT_GOALS, ...local });
        } catch { /* defaults stay */ }
      }

      try {
        const d = new Date();
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const res = await api.waterLog({ date: iso });
        setWaterToday(res.total_ml);
      } catch { /* water summary is optional */ }
    };
    load();
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setMessage('');
    const payload = {
      calories: Math.max(0, Number(form.calories) || 0),
      protein: Math.max(0, Number(form.protein) || 0),
      carbs: Math.max(0, Number(form.carbs) || 0),
      fat: Math.max(0, Number(form.fat) || 0),
      hydration_litres: Math.max(0, Number(form.hydration_litres) || 0),
    };
    if (serverAvailable) {
      try {
        const res = await api.updateNutritionGoals(payload);
        setGoals(res.goals);
        setForm({ ...res.goals });
        setMessage('Nutrition goals saved to your account.');
        setSaving(false);
        return;
      } catch { /* fall through to browser storage */ }
    }
    try { localStorage.setItem(GOALS_KEY, JSON.stringify(payload)); } catch { /* storage unavailable */ }
    setGoals(payload);
    setMessage('Nutrition-goals endpoint unavailable — saved in this browser only.');
    setSaving(false);
  };

  const waterPct = goals.hydration_litres > 0
    ? Math.min(100, Math.round(((waterToday || 0) / (goals.hydration_litres * 1000)) * 100))
    : 0;

  return (
    <section className="card privacy-section" id="nutrition">
      <div className="section-head">
        <div>
          <h2 className="section-title"><Icon name="nutrition" size={15} /> Nutrition Goals</h2>
          <p className="section-description">
            Daily calorie, macro and hydration targets used by the nutrition tracker.
          </p>
        </div>
        {!serverAvailable && (
          <span className="badge">Browser-only</span>
        )}
      </div>

      <div className="form-grid" style={{ marginBottom: 12 }}>
        <label className="field">
          <span className="field-label">Daily Calories (kcal)</span>
          <input type="number" min="0" value={form.calories} onChange={e => set('calories', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Protein (g)</span>
          <input type="number" min="0" step=".1" value={form.protein} onChange={e => set('protein', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Carbohydrates (g)</span>
          <input type="number" min="0" step=".1" value={form.carbs} onChange={e => set('carbs', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Fat (g)</span>
          <input type="number" min="0" step=".1" value={form.fat} onChange={e => set('fat', e.target.value)} />
        </label>
        <label className="field">
          <span className="field-label">Water Goal (L)</span>
          <input type="number" min="0" step=".1" value={form.hydration_litres} onChange={e => set('hydration_litres', e.target.value)} />
        </label>
      </div>

      {/* Today's water intake summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#fafafa',
          border: '1px solid #f0f1f3',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 16,
        }}
      >
        <div style={{ width: 34, height: 34, borderRadius: 999, background: '#e5e5e5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="water" size={15} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <strong style={{ fontSize: 13, fontWeight: 500 }}>Today's water intake</strong>
            <span className="small muted">
              {waterToday === null ? '—' : `${(waterToday / 1000).toFixed(1)} L`} of {goals.hydration_litres} L
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${waterPct}%` }} />
          </div>
        </div>
      </div>

      {message && <div className="privacy-highlight" style={{ marginBottom: 12 }}>{message}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="button button-dark" onClick={save} disabled={saving}>
          <Icon name="check" size={14} /> {saving ? 'Saving…' : 'Save Nutrition Goals'}
        </button>
      </div>

      <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
        These targets are shared with the Nutrition Tracking page — changes here apply immediately there, and vice versa.
      </p>
    </section>
  );
}

/* ============================================================
   SHARED SUB-COMPONENTS
============================================================ */

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

function Policy({ title, text }) {
  return (
    <div className="legal-link">
      <Icon name="shield" />
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
    </div>
  );
}
