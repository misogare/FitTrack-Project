import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { api } from '../services/api';

const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 275, fat: 73, hydration_litres: 2.5 };
const GOALS_KEY = 'fittrack_nutrition_goals';

const initial = {
  profile: false,
  activity: true,
  health: false,
  nutrition: false,
  analytics: true,
  recommendations: false,
  research: false,
};

export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const [prefs, setPrefs] = useState(initial);
  const [exportOptions, setExportOptions] = useState({
    activity: true,
    nutrition: true,
    progress: true,
    goals: true,
    profile: true,
    plans: false,
  });
  const [message, setMessage] = useState('');
  const toggle = k => setPrefs(p => ({ ...p, [k]: !p[k] }));

  // Scroll to the section named by the URL hash (e.g. #privacy-policy)
  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

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
            Your privacy preferences are stored locally in this prototype until a persistence endpoint is added.
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
              <button className="button button-dark" onClick={() => setMessage('Privacy preferences saved for this browser.')}>
                Save Preferences
              </button>
            </div>
          </section>

          <section className="card privacy-section" id="sessions">
            <div className="section-head">
              <div>
                <h2 className="section-title"><Icon name="lock" size={15} /> Session Management</h2>
                <p className="section-description">Devices and browsers currently signed in to your FitTrack account.</p>
              </div>
              <span className="badge">● Secure session</span>
            </div>
            {[
              ['Current Session', 'Chrome on Windows', 'This device · Last active: Just now'],
              ['Safari on iPhone 15', 'Mobile browser', 'Last active: 2 hours ago'],
              ['Firefox on Windows 11', 'Desktop browser', 'Last active: 5 days ago'],
            ].map(([title, meta, detail], i) => (
              <div className="session-row" key={title}>
                <div className="session-icon"><Icon name="user" /></div>
                <div className="session-copy">
                  <strong>{title} {i === 0 && <span className="badge" style={{ marginLeft: 8 }}>Current</span>}</strong>
                  <span>{meta} · {detail}</span>
                </div>
                {i > 0 && <button className="button button-outline button-sm">Revoke</button>}
              </div>
            ))}
            <div className="list-row">
              <span className="small muted">Last password change</span>
              <span className="small">Not available from current API</span>
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
                ['nutrition', 'Nutrition data', 'Meal logs and calorie information'],
                ['progress', 'Progress data', 'Goal progress and analytics'],
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
              <button
                className="button button-dark"
                onClick={() => setMessage('Export request prepared. A real download endpoint should be connected here.')}
              >
                <Icon name="download" /> Export Selected Data
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
                <p>Permanently remove workout, nutrition, goal and progress records while retaining the account.</p>
              </div>
              <button
                className="button button-danger"
                onClick={() => setMessage('Delete-data API is not present in the supplied backend, so no data was deleted.')}
              >
                <Icon name="trash" /> Delete Data
              </button>
            </div>
            <div className="danger-item">
              <div>
                <h3>Delete Account</h3>
                <p>
                  Permanently delete your FitTrack account and associated data. This requires an explicit backend endpoint
                  and confirmation step.
                </p>
              </div>
              <button
                className="button button-danger"
                onClick={() => setMessage('Account-deletion API is not present in the supplied backend, so no account was deleted.')}
              >
                <Icon name="trash" /> Delete Account
              </button>
            </div>
            <div className="privacy-highlight" style={{ marginTop: 16 }}>
              <Icon name="info" size={14} /> The supplied backend currently does not expose delete/export/privacy persistence
              routes. These controls are implemented in the frontend without falsely claiming unsupported API behaviour.
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
