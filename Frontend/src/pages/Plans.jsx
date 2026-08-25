import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import ExerciseTable from '../pages/ExerciseTable';
import { api } from '../services/api';
import './Plans.css';

const TEMPLATES = [
  { plan_name: 'Beginner Full Body', difficulty: 'Beginner', duration_weeks: 4, description: 'Squats, push/pull basics, core and mobility',
    items: [
      { day_number: 1, activity_name: 'Lower Body',  activity_type: 'Strength Training', target_duration_minutes: 35, target_intensity: 'Medium' },
      { day_number: 2, activity_name: 'Upper Body',  activity_type: 'Strength Training', target_duration_minutes: 35, target_intensity: 'Medium' },
      { day_number: 3, activity_name: 'Core & Mobility', activity_type: 'Yoga',         target_duration_minutes: 30, target_intensity: 'Low' },
    ] },
  { plan_name: '5K Builder', difficulty: 'Beginner', duration_weeks: 6, description: 'Easy run, intervals, tempo, recovery',
    items: [
      { day_number: 1, activity_name: 'Easy Run',  activity_type: 'Running',  target_duration_minutes: 30, target_intensity: 'Low' },
      { day_number: 2, activity_name: 'Intervals', activity_type: 'Running',  target_duration_minutes: 35, target_intensity: 'High' },
      { day_number: 3, activity_name: 'Tempo Run', activity_type: 'Running',  target_duration_minutes: 40, target_intensity: 'Medium' },
      { day_number: 4, activity_name: 'Recovery',  activity_type: 'Walking', target_duration_minutes: 30, target_intensity: 'Low' },
    ] },
  { plan_name: 'Strength & Conditioning', difficulty: 'Intermediate', duration_weeks: 8, description: 'Lower, upper, core, conditioning',
    items: [
      { day_number: 1, activity_name: 'Lower Body Strength', activity_type: 'Strength Training', target_duration_minutes: 50, target_intensity: 'High' },
      { day_number: 2, activity_name: 'Upper Body Strength', activity_type: 'Strength Training', target_duration_minutes: 50, target_intensity: 'High' },
      { day_number: 3, activity_name: 'Core Circuit',         activity_type: 'Strength Training', target_duration_minutes: 25, target_intensity: 'Medium' },
      { day_number: 4, activity_name: 'Conditioning',          activity_type: 'Running',         target_duration_minutes: 30, target_intensity: 'High' },
    ] },
];

const ACTIVITY_TYPES = ['Running','Walking','Cycling','Swimming','Strength Training','Yoga','Other'];
const INTENSITIES = ['Low','Medium','High'];

const todayIdx = (new Date().getDay() + 6) % 7;
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editPlan, setEditPlan] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [plansRes, activeRes] = await Promise.all([api.plans(), api.activePlan()]);
      setPlans(plansRes.plans || []);
      setActivePlan(activeRes.active || null);
      if (activeRes.active) {
        try { setStats((await api.planStats(activeRes.active.plan_id)).stats); }
        catch { setStats(null); }
      } else { setStats(null); }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const flash = (msg, ok = true) => {
    if (ok) setSuccess(msg); else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const activateTemplate = async (tpl) => {
    try {
      await api.createPlan(tpl);
      flash(`Plan "${tpl.plan_name}" created.`);
      await loadAll();
    } catch (e) { flash(e.message, false); }
  };

  const activateExisting = async (id) => {
    try { await api.activatePlan(id); flash('Plan activated.'); await loadAll(); }
    catch (e) { flash(e.message, false); }
  };

  const setStatus = async (id, status) => {
    try { await api.updatePlanStatus(id, status); flash(`Plan marked ${status}.`); await loadAll(); }
    catch (e) { flash(e.message, false); }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try { await api.deletePlan(id); flash('Plan deleted.'); await loadAll(); }
    catch (e) { flash(e.message, false); }
  };

  const startTodayWorkout = async (planItemId) => {
    try { await api.startPlanWorkout(planItemId); flash('Workout logged from plan.'); await loadAll(); }
    catch (e) { flash(e.message, false); }
  };

  const saveEdit = async (payload) => {
    try {
      await api.updatePlan(editPlan.plan_id, payload);
      setEditPlan(null);
      flash('Plan updated.');
      await loadAll();
    } catch (e) { flash(e.message, false); }
  };

  const saveCreate = async (payload) => {
    try {
      await api.createPlan(payload);
      setShowCreate(false);
      flash('Plan created.');
      await loadAll();
    } catch (e) { flash(e.message, false); }
  };

  return (
    <div className="app-page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Workout Plans</h1>
          <p className="page-subtitle">Manage plans, see your weekly schedule, and start today's session.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link className="button button-outline" to="/workouts"><Icon name="plus" /> Log Activity</Link>
          <button className="button button-dark" onClick={() => setShowCreate(true)}>
            <Icon name="plus" /> Create Plan
          </button>
        </div>
      </div>

      {error && <div className="alert" style={{ marginTop: 16 }}>{error}</div>}
      {success && (
        <div className="alert" style={{ marginTop: 16, background: '#ecfdf5', color: '#047857' }}>
          {success}
        </div>
      )}

      {/* ACTIVE PLAN BANNER */}
      {loading ? (
        <div className="alert" style={{ marginTop: 16 }}>Loading your plans…</div>
      ) : activePlan ? (
        <ActivePlanBanner plan={activePlan} />
      ) : (
        <div className="alert" style={{ marginTop: 16 }}>
          <Icon name="info" size={14} /> No active plan. Pick a template below or create your own.
        </div>
      )}

      {/* MAIN GRID: PLANS | SCHEDULE + STATS */}
      <div className="plans-grid">

        {/* LEFT COL */}
        <div className="plans-main-col">
          <section className="card card-pad">
            <div className="section-head">
              <div>
                <h2 className="section-title">My Workout Plans</h2>
                <p className="section-description">All plans you've created</p>
              </div>
            </div>

            {loading ? (
              <div className="empty">Loading plans…</div>
            ) : plans.length ? (
              <div className="plans-cards-grid">
                {plans.map(plan => (
                  <PlanCard
                    key={plan.plan_id}
                    plan={plan}
                    onActivate={() => activateExisting(plan.plan_id)}
                    onPause={() => setStatus(plan.plan_id, 'Paused')}
                    onComplete={() => setStatus(plan.plan_id, 'Completed')}
                    onEdit={() => setEditPlan(plan)}
                    onDelete={() => deletePlan(plan.plan_id)}
                  />
                ))}
                <div className="plan-card-add" onClick={() => setShowCreate(true)}>
                  <div className="plan-card-add-icon"><Icon name="plus" /></div>
                  <span style={{ fontSize: 13, color: '#525252' }}>Create a New Workout Plan</span>
                  <span style={{ fontSize: 11, color: '#a3a3a3' }}>Build a custom plan or choose from templates</span>
                </div>
              </div>
            ) : (
              <div className="empty">
                No plans yet.{' '}
                <button className="auth-link" onClick={() => setShowCreate(true)}>Create your first plan.</button>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COL: SCHEDULE + STATS */}
        <div className="plans-side-col">

          {activePlan && (
            <WeeklySchedule plan={activePlan} onStart={startTodayWorkout} />
          )}

          {activePlan && stats && (
            <PlanStatistics stats={stats} plan={activePlan} />
          )}

        </div>

      </div>

      {/* TODAY'S WORKOUT (full width) */}
      {activePlan && (() => {
        const todayItem = (activePlan.items || []).find(i => !i.is_completed) || (activePlan.items || [])[0];
        if (!todayItem) return null;
        return (
          <section className="card card-pad plans-section-full">
            <div className="section-head">
              <div>
                <h2 className="section-title">Today's Workout · {todayItem.activity_name}</h2>
                <p className="section-description">
                  {activePlan.plan_name} · {todayItem.target_duration_minutes || 30} min · {todayItem.target_intensity || 'Medium'} intensity
                </p>
              </div>
              <button
                className="button button-dark"
                onClick={() => startTodayWorkout(todayItem.plan_item_id)}
              >
                <Icon name="play" /> Start Workout
              </button>
            </div>

            <ExerciseTable planItemId={todayItem.plan_item_id} canEdit={true} />
          </section>
        );
      })()}

      {/* TEMPLATES (full width, end of page) */}
      <section className="card card-pad plans-section-full">
        <div className="section-head">
          <div>
            <h2 className="section-title">Plan Templates</h2>
            <p className="section-description">Quick-start with a pre-built routine</p>
          </div>
        </div>

        <div className="grid-3">
          {TEMPLATES.map(tpl => (
            <article className="card plan-card-item" key={tpl.plan_name} style={{ padding: 16 }}>
              <div className="plan-card-icon"><Icon name="workout" /></div>
              <h3 className="plan-card-title">{tpl.plan_name}</h3>
              <p className="plan-card-subtitle">
                {tpl.items.length} sessions · {tpl.difficulty} · {tpl.duration_weeks} weeks
              </p>
              <ul style={{ marginTop: 4, paddingLeft: 18, fontSize: 13, color: '#525252' }}>
                {tpl.items.map(i => <li key={i.day_number}>{i.activity_name}</li>)}
              </ul>
              <button className="button button-outline" onClick={() => activateTemplate(tpl)}>
                Create from template
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* MODALS */}
      {editPlan && (
        <EditPlanModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSave={saveEdit}
        />
      )}

      {showCreate && (
        <CreatePlanModal
          onClose={() => setShowCreate(false)}
          onSave={saveCreate}
        />
      )}

    </div>
  );
}

/* ============== SUB COMPONENTS ============== */

function ActivePlanBanner({ plan }) {
  const pct = plan.percent_complete || 0;
  const todayItem = (plan.items || []).find(i => !i.is_completed);
  return (
    <section className="plan-banner" style={{ marginTop: 16 }}>
      <div className="plan-banner-left">
        <div className="plan-banner-icon"><Icon name="workout" /></div>
        <div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="plan-banner-badge">Active Plan</span>
            <span style={{ fontSize: 11, color: '#a3a3a3' }}>{plan.duration_weeks || 0} weeks</span>
          </div>
          <h2 style={{ fontSize: 16, margin: '4px 0', color: '#fff' }}>{plan.plan_name}</h2>
          <p style={{ fontSize: 12, color: '#a3a3a3' }}>{plan.description || ''}</p>
        </div>
      </div>

      <div className="plan-banner-stats">
        <div className="plan-banner-stat">
          <div className="plan-banner-stat-value">{pct}%</div>
          <div className="plan-banner-stat-label">Complete</div>
          <div className="plan-banner-progress">
            <div style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="plan-banner-stat">
          <div className="plan-banner-stat-value">{plan.completed_sessions}</div>
          <div className="plan-banner-stat-label">Sessions Done</div>
        </div>
        <div className="plan-banner-stat">
          <div className="plan-banner-stat-value">{(plan.total_sessions - plan.completed_sessions)}</div>
          <div className="plan-banner-stat-label">Remaining</div>
        </div>
      </div>

      <div className="plan-banner-actions">
        <Link to="/workouts" className="button button-outline" style={{  borderColor: 'rgba(255,255,255,0.3)' }}>
          <Icon name="edit" /> Edit
        </Link>
        {todayItem && (
          <button
            className="button"
            style={{ background: '#fff', color: '#0a0a0a' }}
            onClick={() => {}}
          >
            <Icon name="play" /> Start Today's Workout
          </button>
        )}
      </div>
    </section>
  );
}

function WeeklySchedule({ plan, onStart }) {
  const itemsByDay = {};
  (plan.items || []).forEach(item => { itemsByDay[item.day_number] = item; });

  return (
    <section className="card card-pad">
      <div className="section-head">
        <div>
          <h2 className="section-title">This Week's Schedule</h2>
          <p className="section-description">From your active plan</p>
        </div>
      </div>

      <div className="weekly-schedule-list" style={{ marginTop: 12 }}>
        {DAY_LABELS.map((label, i) => {
          const item = itemsByDay[i + 1];
          const isToday = i === todayIdx;
          const classes = ['schedule-day'];
          if (isToday) classes.push('is-today');
          if (item) classes.push('has-session');
          else classes.push('is-rest');

          return (
            <div key={label} className={classes.join(' ')}>
              <div className="schedule-day-label">
                <span className="schedule-day-name">{label}</span>
              </div>
              <div className="schedule-day-content">
                {item ? (
                  <>
                    <div className="schedule-day-title">{item.activity_name}</div>
                    <div className="schedule-day-meta">
                      {item.activity_type} · {item.target_duration_minutes || '—'} min · {item.target_intensity || '—'}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="schedule-day-title rest">Rest Day</div>
                    <div className="schedule-day-meta rest">Active recovery or stretching</div>
                  </>
                )}
              </div>
              <span className={`schedule-day-pill ${
                item?.is_completed ? 'done'
                : isToday ? 'today'
                : item ? ''
                : 'rest'
              }`}>
                {item?.is_completed ? 'Done' : isToday ? 'Today' : item ? 'Upcoming' : 'Rest'}
              </span>
              {item && !item.is_completed && isToday && (
                <button className="button button-outline button-sm" onClick={() => onStart(item.plan_item_id)}>
                  Start
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PlanStatistics({ stats, plan }) {
  const total = Number(stats.total_sessions) || 0;
  const done = Number(stats.completed_sessions) || 0;
  const avgDur = Number(stats.avg_duration) || 0;
  const totalCal = Number(stats.total_calories) || 0;
  const daysLeft = Number(stats.days_remaining) || 0;

  return (
    <section className="card card-pad">
      <div className="section-head">
        <div>
          <h2 className="section-title">Plan Statistics</h2>
          <p className="section-description">{plan.plan_name}</p>
        </div>
      </div>

      <div className="plan-stats-grid" style={{ marginTop: 12 }}>
        <div className="plan-stat">
          <span className="plan-stat-label">Total Sessions</span>
          <div className="plan-stat-value">{total}</div>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Completed</span>
          <div className="plan-stat-value">{done}</div>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Avg. Duration</span>
          <div className="plan-stat-value">{Math.round(avgDur)} min</div>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Total Calories</span>
          <div className="plan-stat-value">{totalCal.toLocaleString()}</div>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Days Remaining</span>
          <div className="plan-stat-value">{daysLeft > 0 ? daysLeft : 0}</div>
        </div>
        <div className="plan-stat">
          <span className="plan-stat-label">Plan Status</span>
          <div className="plan-stat-value">{plan.status}</div>
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan, onActivate, onPause, onComplete, onEdit, onDelete }) {
  const total = Number(plan.total_sessions) || 0;
  const done = Number(plan.completed_sessions) || 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const classes = ['plan-card-item'];
  if (plan.status === 'Active') classes.push('active');

  return (
    <article className={classes.join(' ')}>
      <span className={`plan-card-status status-${plan.status.toLowerCase()}`}>{plan.status}</span>

      <div className="plan-card-header">
        <div className="plan-card-icon"><Icon name="workout" /></div>
        <div>
          <h3 className="plan-card-title">{plan.plan_name}</h3>
          <p className="plan-card-subtitle">{plan.difficulty || '—'}</p>
        </div>
      </div>

      <div>
        <div className="plan-card-progress-row">
          <span>Progress</span>
          <span>{done} / {total} sessions</span>
        </div>
        <div className="plan-card-progress">
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="plan-card-meta">
        <div className="plan-card-meta-item">
          <span className="plan-card-meta-label">Duration</span>
          <span className="plan-card-meta-value">{plan.duration_weeks || 0} wks</span>
        </div>
        <div className="plan-card-meta-item">
          <span className="plan-card-meta-label">Sessions</span>
          <span className="plan-card-meta-value">{total}</span>
        </div>
        <div className="plan-card-meta-item">
          <span className="plan-card-meta-label">Difficulty</span>
          <span className="plan-card-meta-value">{plan.difficulty || '—'}</span>
        </div>
      </div>

      <div className="plan-card-actions">
        <button className="button button-outline button-sm" onClick={onEdit}>
          <Icon name="edit" /> Edit
        </button>
        {plan.status === 'Active' ? (
          <button className="button button-outline button-sm" onClick={onPause}>Pause</button>
        ) : (
          <button className="button button-dark button-sm" onClick={onActivate}>
            <Icon name="play" /> Activate
          </button>
        )}
        {plan.status !== 'Completed' && (
          <button className="button button-outline button-sm" onClick={onComplete}>Complete</button>
        )}
        <button className="button button-outline button-sm" onClick={onDelete}>
          <Icon name="trash" />
        </button>
      </div>
    </article>
  );
}

/* ============== MODALS ============== */

function EditPlanModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState({
    plan_name: plan.plan_name || '',
    description: plan.description || '',
    difficulty: plan.difficulty || 'Beginner',
    duration_weeks: plan.duration_weeks || 4,
  });

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      duration_weeks: Number(form.duration_weeks) || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Edit Plan</h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <label className="field">
              <span className="field-label">Plan Name *</span>
              <input
                type="text"
                value={form.plan_name}
                onChange={e => setForm({ ...form, plan_name: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Difficulty</span>
                <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
              <label className="field">
                <span className="field-label">Duration (weeks)</span>
                <input
                  type="number"
                  min="1"
                  value={form.duration_weeks}
                  onChange={e => setForm({ ...form, duration_weeks: e.target.value })}
                />
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="button button-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-dark">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreatePlanModal({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    plan_name: '',
    description: '',
    difficulty: 'Beginner',
    duration_weeks: 4,
    status: 'Draft',
    items: [
      { day_number: 1, activity_name: '', activity_type: 'Strength Training',
        target_duration_minutes: 30, target_intensity: 'Medium' },
    ],
  });

  const updateField = (k, v) => setForm({ ...form, [k]: v });

  const updateItem = (i, k, v) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    setForm({ ...form, items });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, {
        day_number: form.items.length + 1,
        activity_name: '',
        activity_type: 'Strength Training',
        target_duration_minutes: 30,
        target_intensity: 'Medium',
      }],
    });
  };

  const removeItem = (i) => {
    const items = form.items.filter((_, idx) => idx !== i)
      .map((it, idx) => ({ ...it, day_number: idx + 1 }));
    setForm({ ...form, items });
  };

  const next = () => setStep(s => Math.min(3, s + 1));
  const back = () => setStep(s => Math.max(1, s - 1));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      duration_weeks: Number(form.duration_weeks) || null,
      items: form.items.map(it => ({
        ...it,
        target_duration_minutes: Number(it.target_duration_minutes) || null,
      })),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="section-title">Create Workout Plan</h2>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="wizard-steps">
            <div className={`wizard-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`} />
            <div className={`wizard-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`} />
            <div className={`wizard-step ${step === 3 ? 'active' : ''}`} />
          </div>

          {step === 1 && (
            <>
              <label className="field">
                <span className="field-label">Plan Name *</span>
                <input
                  type="text"
                  placeholder="e.g. My 4-week Strength Plan"
                  value={form.plan_name}
                  onChange={e => updateField('plan_name', e.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span className="field-label">Description</span>
                <textarea
                  rows={3}
                  placeholder="What's this plan about?"
                  value={form.description}
                  onChange={e => updateField('description', e.target.value)}
                />
              </label>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Difficulty</span>
                  <select value={form.difficulty} onChange={e => updateField('difficulty', e.target.value)}>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Duration (weeks)</span>
                  <input
                    type="number"
                    min="1"
                    value={form.duration_weeks}
                    onChange={e => updateField('duration_weeks', e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Status</span>
                <select value={form.status} onChange={e => updateField('status', e.target.value)}>
                  <option>Draft</option>
                  <option>Active</option>
                </select>
              </label>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p className="section-description">Add sessions (one per day of the week)</p>
                <button type="button" className="button button-outline button-sm" onClick={addItem}>
                  <Icon name="plus" /> Add Session
                </button>
              </div>

              {form.items.map((item, i) => (
                <div className="plan-item-row" key={i}>
                  <span style={{ textAlign: 'center', fontSize: 12, color: '#737373' }}>#{i + 1}</span>
                  <input
                    type="text"
                    placeholder="Activity name"
                    value={item.activity_name}
                    onChange={e => updateItem(i, 'activity_name', e.target.value)}
                    required
                  />
                  <select value={item.activity_type} onChange={e => updateItem(i, 'activity_type', e.target.value)}>
                    {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input
                    type="number"
                    min="1"
                    placeholder="Min"
                    value={item.target_duration_minutes}
                    onChange={e => updateItem(i, 'target_duration_minutes', e.target.value)}
                  />
                  <select value={item.target_intensity} onChange={e => updateItem(i, 'target_intensity', e.target.value)}>
                    {INTENSITIES.map(x => <option key={x}>{x}</option>)}
                  </select>
                  <button type="button" className="plan-item-remove" onClick={() => removeItem(i)}>×</button>
                </div>
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <p className="section-description">Review your plan before saving.</p>
              <div style={{ background: '#fafafa', padding: 12, borderRadius: 8 }}>
                <strong>{form.plan_name || 'Untitled'}</strong>
                <div style={{ fontSize: 12, color: '#737373', marginTop: 4 }}>
                  {form.difficulty} · {form.duration_weeks} weeks · {form.items.length} sessions
                </div>
                <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 13, color: '#525252' }}>
                  {form.items.map((it, i) => (
                    <li key={i}>
                      Day {i + 1}: {it.activity_name || '—'} ({it.activity_type}, {it.target_duration_minutes} min, {it.target_intensity})
                    </li>
                  ))}
                </ul>
              </div>
              <p className="section-description" style={{ marginTop: 8 }}>
                You'll be able to add exercises (sets/reps/weight) to each session after creating the plan.
              </p>
            </>
          )}
        </div>

        <div className="modal-footer">
          {step > 1 && (
            <button type="button" className="button button-outline" onClick={back}>Back</button>
          )}
          {step < 3 ? (
            <button type="button" className="button button-dark" onClick={next}>Next</button>
          ) : (
            <button type="submit" className="button button-dark" onClick={submit}>Create Plan</button>
          )}
        </div>
      </div>
    </div>
  );
}