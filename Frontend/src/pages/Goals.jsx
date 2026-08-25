import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { api } from '../services/api';
import './Goals.css';

/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const dmyToDate = s => {
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? new Date(m[3], m[2] - 1, m[1]) : null;
};
const toYmd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtDeadline = s => {
  const d = dmyToDate(s);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : s || '—';
};
const fmtNum = n => Math.round(n).toLocaleString();

const TABS = ['All Goals', 'In Progress', 'Completed', 'Not Started'];
const GOAL_PRESETS = ['Weight Loss', 'Run 5K', 'Muscle Gain', 'Daily Water Intake', 'Weekly Workouts', 'Sleep Consistency', 'Daily Steps Goal'];

function goalStatus(g, progress) {
  if (g.status === 'Achieved') return 'Completed';
  if (g.status === 'Abandoned') return 'Abandoned';
  if (num(g.current_value) > 0 || (progress && progress.length)) return 'In Progress';
  return 'Not Started';
}

function goalStats(g, progress) {
  const target = num(g.target_value);
  const cur = num(g.current_value);
  const entries = [...(progress || [])].sort((a, b) => (dmyToDate(a.log_date) > dmyToDate(b.log_date) ? 1 : -1));
  const start = num(g.start_value);
  const decreasing = target < start;
  let pct;
  if (decreasing) {
    pct = start !== target ? ((start - cur) / (start - target)) * 100 : (cur <= target ? 100 : 0);
  } else {
    pct = start !== target ? ((cur - start) / (target - start)) * 100 : (cur >= target ? 100 : 0);
  }
  return { pct: Math.max(0, Math.min(100, Math.round(pct))), start, cur, target, decreasing, entries };
}

function goalIcon(g) {
  const t = g.goal_type.toLowerCase();
  if (/muscle|gain|strength|workout|gym/.test(t)) return 'workout';
  if (/weight|kg|mass|bmi|fat/.test(t)) return 'scale';
  if (/run|5k|cardio|km|cycling/.test(t)) return 'activity';
  if (/step/.test(t)) return 'steps';
  if (/water|hydrat|drink|litre|liter/.test(t)) return 'droplet';
  if (/sleep/.test(t)) return 'moon';
  if (/calorie|nutrition|diet|macro/.test(t)) return 'nutrition';
  return 'goal';
}

function goalUnit(g) {
  const t = g.goal_type.toLowerCase();
  if (/weight|kg|muscle|mass|bmi|fat/.test(t)) return 'kg';
  if (/run|5k|km|cycling/.test(t)) return 'km';
  if (/water|hydrat|drink|litre|liter/.test(t)) return 'L';
  if (/sleep|hour|hr/.test(t)) return 'hrs';
  return '';
}

const fmtValue = (v, unit) => {
  if (unit === 'steps') return fmtNum(v);
  if (unit === 'hrs') return `${v} hrs`;
  return unit ? `${v} ${unit}` : fmtNum(v);
};

/* ============================================================ */

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [tab, setTab] = useState('All Goals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [detailsGoal, setDetailsGoal] = useState(null);
  const [menuFor, setMenuFor] = useState(null);

  const flash = (msg, ok = true) => {
    if (ok) setSuccess(msg); else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 3000);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.goals();
      const list = res.goals || [];
      setGoals(list);
      const entries = await Promise.all(list.map(async g => {
        try {
          const p = await api.goalProgress(g.goal_id);
          return [g.goal_id, p.progress || []];
        } catch { return [g.goal_id, []]; }
      }));
      setProgressMap(Object.fromEntries(entries));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ---------- derived ---------- */
  const decorated = useMemo(
    () => goals.map(g => {
      const progress = progressMap[g.goal_id] || [];
      const status = goalStatus(g, progress);
      const stats = goalStats(g, progress);
      return { ...g, progress, status, stats };
    }),
    [goals, progressMap]
  );

  const counts = useMemo(() => ({
    total: decorated.length,
    inProgress: decorated.filter(g => g.status === 'In Progress').length,
    completed: decorated.filter(g => g.status === 'Completed').length,
    notStarted: decorated.filter(g => g.status === 'Not Started').length,
  }), [decorated]);

  const visible = tab === 'All Goals' ? decorated : decorated.filter(g => g.status === tab);

  /* ---------- actions ---------- */
  const createGoal = async payload => {
    try {
      await api.createGoal(payload);
      setShowCreate(false);
      flash('Goal created.');
      await load();
    } catch (e) { flash(e.message, false); }
  };

  const saveEdit = async (id, payload) => {
    try {
      await api.updateGoal(id, payload);
      setEditGoal(null);
      flash('Goal updated.');
      await load();
    } catch (e) { flash(e.message, false); }
  };

  const startGoal = async g => {
    try {
      await api.updateGoalProgress({ goal_id: g.goal_id, log_date: toYmd(new Date()), value: num(g.start_value) });
      flash(`"${g.goal_type}" started — log progress to stay on track.`);
      await load();
    } catch (e) { flash(e.message, false); }
  };

  const setStatus = async (g, status, msg) => {
    try {
      await api.updateGoal(g.goal_id, { status });
      flash(msg || `Goal marked ${status === 'Achieved' ? 'complete' : status}.`);
      await load();
    } catch (e) { flash(e.message, false); }
  };

  const deleteGoal = async g => {
    if (!window.confirm(`Delete the "${g.goal_type}" goal?`)) return;
    try {
      await api.deleteGoal(g.goal_id);
      flash('Goal deleted.');
      await load();
    } catch (e) { flash(e.message, false); }
  };

  const logProgress = async (goalId, payload) => {
    try {
      await api.updateGoalProgress({ goal_id: goalId, ...payload });
      flash('Progress logged.');
      const res = await api.goalProgress(goalId);
      setProgressMap(m => ({ ...m, [goalId]: res.progress || [] }));
      await load();
      return true;
    } catch (e) { flash(e.message, false); return false; }
  };

  return (
    <div className="app-page goals-page">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals Management</h1>
          <p className="page-subtitle">Track your fitness goals and monitor your progress toward each target.</p>
        </div>
        <button className="button button-dark" onClick={() => setShowCreate(true)}>
          <Icon name="plus" /> Create New Goal
        </button>
      </div>

      {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert" style={{ marginBottom: 16, background: '#ecfdf5', color: '#047857' }}>{success}</div>
      )}

      {loading ? (
        <div className="alert" style={{ marginTop: 16 }}>Loading your goals…</div>
      ) : (
        <>
          {/* SUMMARY STATS */}
          <div className="goals-stats">
            <div className="goal-stat"><span>Total Goals</span><strong>{counts.total}</strong></div>
            <div className="goal-stat"><span>In Progress</span><strong>{counts.inProgress}</strong></div>
            <div className="goal-stat"><span>Completed</span><strong>{counts.completed}</strong></div>
            <div className="goal-stat"><span>Not Started</span><strong>{counts.notStarted}</strong></div>
          </div>

          {/* FILTER TABS */}
          <div className="goals-tabs">
            {TABS.map(t => (
              <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>

          {/* CARDS GRID */}
          {visible.length ? (
            <div className="goals-grid">
              {visible.map(g => (
                <GoalCard
                  key={g.goal_id}
                  goal={g}
                  menuOpen={menuFor === g.goal_id}
                  onToggleMenu={() => setMenuFor(menuFor === g.goal_id ? null : g.goal_id)}
                  onEdit={() => { setMenuFor(null); setEditGoal(g); }}
                  onDetails={() => { setMenuFor(null); setDetailsGoal(g); }}
                  onStart={() => startGoal(g)}
                  onComplete={() => setStatus(g, 'Achieved')}
                  onReactivate={() => setStatus(g, 'Active')}
                  onDelete={() => { setMenuFor(null); deleteGoal(g); }}
                />
              ))}
            </div>
          ) : (
            <div className="empty" style={{ marginTop: 24 }}>No goals in this view.</div>
          )}

          {/* PRO TIP */}
          <div className="goals-tip">
            <div className="goals-tip-icon"><Icon name="lightbulb" size={16} /></div>
            <div>
              <strong>Pro Tip</strong>
              <p>Break big goals into smaller weekly milestones for better consistency. Goals with specific deadlines are 42% more likely to be achieved. Try updating your progress at least once a week to stay on track.</p>
            </div>
          </div>
        </>
      )}

      {/* CREATE MODAL */}
      {showCreate && (
        <GoalFormModal
          title="Create New Goal"
          subtitle="Set a measurable target and deadline."
          initial={{ goal_type: 'Weight Loss', start_value: '', target_value: '', start_date: toYmd(new Date()), target_date: '' }}
          onClose={() => setShowCreate(false)}
          onSubmit={createGoal}
        />
      )}

      {/* EDIT MODAL */}
      {editGoal && (
        <GoalFormModal
          title={`Edit ${editGoal.goal_type}`}
          subtitle="Update your target, deadline or status."
          initial={{
            goal_type: editGoal.goal_type,
            start_value: editGoal.stats.start || '',
            target_value: editGoal.target_value,
            start_date: editGoal.start_date ? toYmd(dmyToDate(editGoal.start_date)) : toYmd(new Date()),
            target_date: editGoal.target_date ? toYmd(dmyToDate(editGoal.target_date)) : '',
          }}
          current={editGoal.current_value}
          onClose={() => setEditGoal(null)}
          onSubmit={payload => saveEdit(editGoal.goal_id, payload)}
        />
      )}

      {/* DETAILS MODAL — live goal so logged progress re-renders instantly */}
      {detailsGoal && (
        <DetailsModal
          goal={decorated.find(g => g.goal_id === detailsGoal.goal_id) || detailsGoal}
          onClose={() => setDetailsGoal(null)}
          onLog={logProgress}
          onComplete={() => { setStatus(detailsGoal, 'Achieved'); setDetailsGoal(null); }}
        />
      )}
    </div>
  );
}

/* ============================================================
   GOAL CARD
============================================================ */

function GoalCard({ goal, menuOpen, onToggleMenu, onEdit, onDetails, onStart, onComplete, onReactivate, onDelete }) {
  const { status, stats } = goal;
  const unit = goalUnit(goal);
  const icon = goalIcon(goal);
  const started = status === 'Not Started';

  const curTxt = started ? '—' : fmtValue(stats.cur, unit);
  const targetTxt = fmtValue(stats.target, unit);
  const startTxt = started ? 'Not started' : `Start: ${fmtValue(stats.start, unit)}`;

  return (
    <article className={`goal-card ${status === 'Completed' ? 'done' : ''} ${status === 'Abandoned' ? 'abandoned' : ''}`}>
      <div className="goal-card-head">
        <div className="goal-card-title">
          <div className="goal-card-icon"><Icon name={icon} size={16} /></div>
          <div>
            <h2>{goal.goal_type}</h2>
            <p>{status === 'Completed' ? `Completed: ${goal.target_date ? fmtDeadline(goal.target_date) : '—'}` : `Deadline: ${fmtDeadline(goal.target_date)}`}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="goal-card-body">
        <div className="goal-cur-target">
          <div>
            <span>Current vs Target</span>
            <strong>{curTxt} <em>→</em> {targetTxt}</strong>
          </div>
          <span className="goal-percent">{started ? 0 : stats.pct}%</span>
        </div>
        <div className="goal-progress-track">
          <div className={started ? 'low' : stats.pct >= 100 ? 'full' : ''} style={{ width: `${started ? 0 : stats.pct}%` }} />
        </div>
        <div className="goal-start-target">
          <span>{startTxt}</span>
          <span>Target: {targetTxt}</span>
        </div>
      </div>

      <div className="goal-card-actions">
        {started ? (
          <button className="button button-outline button-sm" onClick={onStart}><Icon name="play" size={11} /> Start Goal</button>
        ) : (
          <button className="button button-outline button-sm" disabled={status === 'Completed'} onClick={onEdit}><Icon name="edit" size={11} /> Edit</button>
        )}
        <button className="button button-outline button-sm" onClick={onDetails}><Icon name="chart" size={11} /> View Details</button>
        <div className="goal-menu-wrap">
          <button className="goal-menu-btn" onClick={onToggleMenu} aria-label="More actions"><Icon name="ellipsis" size={14} /></button>
          {menuOpen && (
            <div className="goal-menu">
              {status === 'In Progress' && <button onClick={onComplete}><Icon name="check" size={12} /> Mark Complete</button>}
              {status === 'Completed' && <button onClick={onReactivate}><Icon name="play" size={12} /> Reactivate</button>}
              <button className="danger" onClick={onDelete}><Icon name="trash" size={12} /> Delete</button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  if (status === 'Completed') {
    return <span className="goal-status completed"><Icon name="check" size={10} /> Completed</span>;
  }
  if (status === 'Abandoned') {
    return <span className="goal-status abandoned"><span className="dot" /> Abandoned</span>;
  }
  if (status === 'In Progress') {
    return <span className="goal-status"><span className="dot" /> In Progress</span>;
  }
  return <span className="goal-status not-started"><span className="dot" /> Not Started</span>;
}

/* ============================================================
   CREATE / EDIT MODAL
============================================================ */

function GoalFormModal({ title, subtitle, initial, current, onClose, onSubmit }) {
  const [form, setForm] = useState(initial);
  const [custom, setCustom] = useState(!GOAL_PRESETS.includes(initial.goal_type));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async e => {
    e.preventDefault();
    const target = Number(form.target_value);
    if (!form.goal_type.trim()) return setErr('Goal type is required.');
    if (!Number.isFinite(target) || target <= 0) return setErr('Target value must be a positive number.');
    if (!form.target_date) return setErr('Target date is required.');
    const payload = {
      goal_type: form.goal_type.trim(),
      target_value: target,
      start_value: form.start_value === '' || form.start_value == null ? 0 : Number(form.start_value),
      start_date: form.start_date,
      target_date: form.target_date,
    };
    setSaving(true);
    try {
      await onSubmit(payload);
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            <p>{subtitle}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>
        {err && <div className="alert" style={{ marginBottom: 12 }}>{err}</div>}
        {current != null && (
          <div className="goals-current-note">Current value: <strong>{num(current)}</strong> — logging new progress will replace it.</div>
        )}
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label className="field">
            <span className="field-label">Goal Type *</span>
            {custom ? (
              <input value={form.goal_type} onChange={e => set('goal_type', e.target.value)} placeholder="e.g. Lose 5 kg" />
            ) : (
              <select value={form.goal_type} onChange={e => set('goal_type', e.target.value)}>
                {GOAL_PRESETS.map(t => <option key={t}>{t}</option>)}
              </select>
            )}
            <button type="button" className="link-btn" onClick={() => setCustom(c => !c)}>
              {custom ? 'Pick a preset' : 'Use a custom name'}
            </button>
          </label>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Start Value</span>
              <input type="number" step="0.1" min="0" placeholder="Optional baseline (e.g. 90 for weight)" value={form.start_value ?? ''} onChange={e => set('start_value', e.target.value)} />
            </label>
            <label className="field">
              <span className="field-label">Target Value *</span>
              <input type="number" step="0.1" min="0" placeholder="e.g. 75" value={form.target_value ?? ''} onChange={e => set('target_value', e.target.value)} />
            </label>
          </div>
          <div className="form-grid">
            <label className="field">
              <span className="field-label">Start Date</span>
              <input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} />
              <small>Format: YYYY-MM-DD</small>
            </label>
            <label className="field">
              <span className="field-label">Target Date *</span>
              <input type="date" value={form.target_date || ''} onChange={e => set('target_date', e.target.value)} />
              <small>Format: YYYY-MM-DD (e.g. 2025-12-31)</small>
            </label>
          </div>
          <div className="modal-foot">
            <button type="button" className="button button-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Save Goal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   DETAILS MODAL (progress history + log progress)
============================================================ */

function DetailsModal({ goal, onClose, onLog, onComplete }) {
  const { status, stats } = goal;
  const unit = goalUnit(goal);
  const [date, setDate] = useState(toYmd(new Date()));
  const [value, setValue] = useState(stats.cur || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const entries = stats.entries;
  const maxVal = Math.max(...entries.map(e => num(e.value)), stats.target, 1);

  const submit = async e => {
    e.preventDefault();
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0) return setErr('Enter a valid value.');
    setSaving(true);
    setErr('');
    try {
      await onLog(goal.goal_id, { log_date: date, value: v });
      setSaving(false);
    } catch { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{goal.goal_type}</h3>
            <p>{status === 'Completed' ? `Completed ${goal.target_date ? fmtDeadline(goal.target_date) : ''}` : `Deadline: ${fmtDeadline(goal.target_date)}`} · {status}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" size={16} /></button>
        </div>

        <div className="details-summary">
          <div>
            <span>Current</span>
            <strong>{fmtValue(stats.cur, unit)}</strong>
          </div>
          <div>
            <span>Target</span>
            <strong>{fmtValue(stats.target, unit)}</strong>
          </div>
          <div>
            <span>Started at</span>
            <strong>{fmtValue(stats.start, unit)}</strong>
          </div>
          <div>
            <span>Progress</span>
            <strong>{stats.pct}%</strong>
          </div>
        </div>

        <div className="details-progress">
          <span className="details-label">Progress history ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})</span>
          {entries.length ? (
            <>
              <div className="details-chart">
                {entries.map((en, i) => (
                  <div className="details-bar" key={i} title={`${fmtDeadline(en.log_date)}: ${en.value}`}>
                    <div style={{ height: `${Math.max(4, (num(en.value) / maxVal) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="details-log">
                {[...entries].reverse().map((en, i) => (
                  <div key={i}>
                    <span>{fmtDeadline(en.log_date)}</span>
                    <strong>{fmtValue(num(en.value), unit)}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="nutrition-note">No progress logged yet{status === 'Not Started' ? ' — start this goal to begin tracking' : ''}.</div>
          )}
        </div>

        {status !== 'Completed' && (
          <form onSubmit={submit} className="details-log-form">
            <span className="details-label">Log progress</span>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Date</span>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                <small>Format: YYYY-MM-DD</small>
              </label>
              <label className="field">
                <span className="field-label">Value {unit ? `(${unit})` : ''}</span>
                <input type="number" step="0.1" min="0" value={value} onChange={e => setValue(e.target.value)} />
              </label>
            </div>
            {err && <div className="alert" style={{ marginTop: 4 }}>{err}</div>}
            <div className="modal-foot">
              {status === 'In Progress' && (
                <button type="button" className="button button-outline" onClick={onComplete}><Icon name="check" size={12} /> Mark Complete</button>
              )}
              <button type="submit" className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Log Progress'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
