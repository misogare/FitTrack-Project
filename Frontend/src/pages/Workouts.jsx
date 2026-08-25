import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { api } from '../services/api';

const ACTIVITY_TYPES = [
  'Running',
  'Walking',
  'Cycling',
  'Swimming',
  'Strength Training',
  'Yoga',
  'Other',
];

const QUICK_ACTIVITIES = [
  { label: 'Running', type: 'Running', icon: 'activity' },
  { label: 'Walking', type: 'Walking', icon: 'activity' },
  { label: 'Cycling', type: 'Cycling', icon: 'activity' },
  { label: 'Strength', type: 'Strength Training', icon: 'workout' },
];
const EMPTY_FORM = {
  activity_name: '',
  workout_type: 'Running',
  duration_minutes: 30,
  intensity: 'Medium',
  calories_burned: '',
  distance_km: '',
  workout_date: new Date().toISOString().slice(0, 10),
  notes: '',
  plan_id: '',
plan_item_id: '',   // <-- add this

};

export default function Workouts() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);


  const load = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await api.workouts();
      setItems(data.workouts || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  const loadSummary = async () => {
  try {
    const data = await api.dailyWorkoutSummary();
    setSummary(data);
  } catch {
    // silent fail — keep page working
  }
};

useEffect(() => { loadSummary(); }, []);

  const quickAdd = type => {
    setForm(prev => ({
      ...prev,
      workout_type: type,
      activity_name: type,
    }));

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const submit = async e => {
  e.preventDefault();
  setError('');
  setSuccess('');

  if (!form.activity_name.trim()) {
    setError('Activity Name is required.');
    return;
  }
  if (!form.workout_type) {
    setError('Activity Type is required.');
    return;
  }
  if (!form.duration_minutes || Number(form.duration_minutes) <= 0) {
    setError('Duration must be greater than 0 minutes.');
    return;
  }
  if (!form.workout_date) {
    setError('Workout Date is required.');
    return;
  }

  const payload = {
    activity_name:    form.activity_name.trim(),
    workout_type:      form.workout_type,
    duration_minutes:  Number(form.duration_minutes),
    intensity:         form.intensity,
    calories_burned:   form.calories_burned === '' ? null : Number(form.calories_burned),
    distance_km:       form.distance_km === '' ? null : Number(form.distance_km),
    workout_date:      form.workout_date,
    plan_id:           form.plan_id === '' ? null : Number(form.plan_id),
    plan_item_id:      form.plan_item_id === '' ? null : Number(form.plan_item_id),
    notes:             form.notes.trim() || null,
  };

  try {
    setSaving(true);

    if (editingId) {
      await api.updateWorkout(editingId, payload);
      setSuccess('Activity updated successfully.');
      setEditingId(null);
      setForm(EMPTY_FORM);
    } else {
      await api.createWorkout(payload);
      setSuccess('Activity saved successfully.');
      setForm(EMPTY_FORM);
    }

    await load();
    await loadSummary();
    setPage(1);
  } catch (e) {
    setError(e.message);
  } finally {
    setSaving(false);
  }
};

  const deleteActivity = async id => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this activity?'
    );

    if (!confirmed) return;

    try {
      setError('');
      await api.deleteWorkout(id);

      setSuccess('Activity deleted successfully.');

      await load();
      await loadSummary();

    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = workout => {
    setEditingId(workout.workout_id);

    setForm({
      activity_name:
        workout.activity_name ||
        workout.workout_type ||
        '',

      workout_type: workout.workout_type || 'Running',

      duration_minutes:
        workout.duration_minutes || 30,

      intensity:
        workout.intensity || 'Medium',

      calories_burned:
        workout.calories_burned ?? '',

      distance_km:
        workout.distance_km ?? '',

      workout_date:
        workout.workout_date || '',

      notes:
        workout.notes || '',

      plan_id:
        workout.plan_id || '',
      plan_item_id:  workout.plan_item_id ?? '',   // <-- was missing

    });

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const activityName = (
        item.activity_name ||
        item.workout_type ||
        ''
      ).toLowerCase();

      const matchesSearch =
        !search ||
        activityName.includes(search.toLowerCase());

      const matchesType =
        typeFilter === 'All' ||
        item.workout_type === typeFilter;

      const matchesDate =
        !dateFilter ||
        item.workout_date === dateFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesDate
      );
    });
  }, [items, search, typeFilter, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  );

  const visibleItems = filteredItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="app-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Activity Tracking
          </h1>

          <p className="page-subtitle">
            Log completed activities and keep your workout history organised.
          </p>
        </div>
      </div>

      {/* FEEDBACK */}
      {error && (
        <div
          className="alert"
          style={{ marginBottom: 16 }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="alert"
          style={{
            marginBottom: 16,
            background: '#ecfdf5',
            color: '#047857',
          }}
        >
          {success}
        </div>
      )}

      {/* QUICK ADD */}
      <section
        className="card card-pad"
        style={{ marginBottom: 16 }}
      >
        <div className="section-head">
          <div>
            <h2 className="section-title">
              Quick Add
            </h2>

            <p className="section-description">
              Start logging a common activity.
            </p>
          </div>
        </div>

        <div
          className="grid-4"
          style={{ marginTop: 16 }}
        >
          {QUICK_ACTIVITIES.map(activity => (
            <button
              key={activity.type}
              type="button"
              className="button button-outline"
              onClick={() =>
                quickAdd(activity.type)
              }
            >
              <Icon
                name={activity.icon}
                size={15}
              />

              {activity.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid-2">

        {/* LOG ACTIVITY */}
        <section className="card card-pad">

          <div className="section-head">
            <div>
              <h2 className="section-title">
                {editingId
                  ? 'Edit Activity'
                  : 'Log Activity'}
              </h2>

              <p className="section-description">
                Capture your activity while it is fresh.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                className="button button-outline button-sm"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>

          <form
            className="auth-form"
            onSubmit={submit}
          >

            {/* ACTIVITY NAME */}
            <label className="field">
              <span className="field-label">
                Activity Name *
              </span>

              <input
                type="text"
                placeholder="e.g. Morning Run"
                value={form.activity_name}
                onChange={e =>
                  updateField(
                    'activity_name',
                    e.target.value
                  )
                }
              />
            </label>

            {/* TYPE */}
            <label className="field">
              <span className="field-label">
                Activity Type *
              </span>

              <select
                value={form.workout_type}
                onChange={e =>
                  updateField(
                    'workout_type',
                    e.target.value
                  )
                }
              >
                {ACTIVITY_TYPES.map(type => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {/* DURATION + INTENSITY */}
            <div className="form-grid">

              <label className="field">
                <span className="field-label">
                  Duration (minutes) *
                </span>

                <input
                  type="number"
                  min="1"
                  value={form.duration_minutes}
                  onChange={e =>
                    updateField(
                      'duration_minutes',
                      e.target.value
                    )
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">
                  Intensity
                </span>

                <select
                  value={form.intensity}
                  onChange={e =>
                    updateField(
                      'intensity',
                      e.target.value
                    )
                  }
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>

            </div>

            {/* CALORIES + DATE */}
            <div className="form-grid">

              <label className="field">
                <span className="field-label">
                  Calories Burned
                </span>

                <input
                  type="number"
                  min="0"
                  placeholder="Optional"
                  value={form.calories_burned}
                  onChange={e =>
                    updateField(
                      'calories_burned',
                      e.target.value
                    )
                  }
                />

                <small className="muted">
                  Leave blank if unknown.
                </small>
              </label>

              <label className="field">
                <span className="field-label">
                  Activity Date *
                </span>

                <input
                  type="date"
                  value={form.workout_date}
                  onChange={e =>
                    updateField(
                      'workout_date',
                      e.target.value
                    )
                  }
                />
                <small>Format: YYYY-MM-DD (e.g. 2025-06-15)</small>
              </label>

            </div>

            {/* DISTANCE */}
            <label className="field">
              <span className="field-label">
                Distance (km)
              </span>

              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Optional — e.g. 5.0 for a run"
                value={form.distance_km}
                onChange={e =>
                  updateField(
                    'distance_km',
                    e.target.value
                  )
                }
              />

              <small className="muted">
                Leave blank if distance does not apply (e.g. strength training).
              </small>
            </label>

            {/* PLAN */}
            <label className="field">
              <span className="field-label">
                Workout Plan
              </span>

              <select
                value={form.plan_id}
                onChange={e =>
                  updateField(
                    'plan_id',
                    e.target.value
                  )
                }
              >
                <option value="">
                  No workout plan
                </option>

                {/* Populate from /plans once plan API exists */}
              </select>

              <small className="muted">
                Associate this activity with an active workout plan.
              </small>
            </label>

            {/* NOTES */}
            <label className="field">
              <span className="field-label">
                Notes
              </span>

              <textarea
                placeholder="Optional notes about this activity"
                value={form.notes}
                onChange={e =>
                  updateField(
                    'notes',
                    e.target.value
                  )
                }
              />
            </label>

            <button
              className="button button-dark button-full"
              disabled={saving}
            >
              <Icon name="check" />

              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Activity'
                  : 'Save Activity'}
            </button>

          </form>
        </section>

        {/* DAILY GOALS */}
        <section className="card card-pad">

          <div className="section-head">
            <div>
              <h2 className="section-title">
                Daily Goals
              </h2>

              <p className="section-description">
                Keep today's targets visible while logging activities.
              </p>
            </div>

            <Icon
              name="goal"
              size={20}
            />
          </div>

          <div
            className="goal-summary"
            style={{
              display: 'grid',
              gap: 18,
              marginTop: 20,
            }}
          >
            {summary ? (
  <>
    <GoalProgress
      label="Daily Activity"
      value={summary.goals.dailyActivity.value}
      target={`${summary.goals.dailyActivity.target} ${summary.goals.dailyActivity.unit}`}
      percent={summary.goals.dailyActivity.percent}
    />
    <GoalProgress
      label="Calories Burned"
      value={summary.goals.caloriesBurned.value}
      target={`${summary.goals.caloriesBurned.target} ${summary.goals.caloriesBurned.unit}`}
      percent={summary.goals.caloriesBurned.percent}
    />
    <GoalProgress
      label="Workout Sessions"
      value={summary.goals.workoutSessions.value}
      target={`${summary.goals.workoutSessions.target} ${summary.goals.workoutSessions.unit}`}
      percent={summary.goals.workoutSessions.percent}
    />
  </>
) : (
  <div className="empty">Loading today's goals…</div>
)}
          </div>

          <div
            className="empty"
            style={{ marginTop: 20 }}
          >
            Daily goals are linked to your account settings.
          </div>

        </section>

      </div>

      {/* RECENT ACTIVITIES */}
      <section
        className="card card-pad"
        style={{ marginTop: 16 }}
      >

        <div className="section-head">

          <div>
            <h2 className="section-title">
              Recent Activities
            </h2>

            <p className="section-description">
              Search, filter and manage your activity history.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              type="button"
              className="button button-outline button-sm"
              onClick={() =>
                alert(
                  'CSV/PDF export will be connected when the export backend endpoint is added.'
                )
              }
            >
              Export
            </button>
          </div>

        </div>

        {/* FILTERS */}
        <div
          className="form-grid"
          style={{
            marginTop: 20,
            marginBottom: 20,
          }}
        >

          <label className="field">
            <span className="field-label">
              Search Activity
            </span>

            <input
              type="text"
              placeholder="Search by activity name..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <label className="field">
            <span className="field-label">
              Activity Type
            </span>

            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">
                All Activities
              </option>

              {ACTIVITY_TYPES.map(type => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ))}
            </select>
          </label>

        </div>

        <div
          className="form-grid"
          style={{ marginBottom: 20 }}
        >

          <label className="field">
            <span className="field-label">
              Filter by Date
            </span>

            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
            />
            <small>Format: YYYY-MM-DD</small>
          </label>

          <div
            style={{
              display: 'flex',
              alignItems: 'end',
            }}
          >
            <button
              type="button"
              className="button button-outline button-sm"
              onClick={() => {
                setSearch('');
                setTypeFilter('All');
                setDateFilter('');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          </div>

        </div>

        {/* COUNT */}
        <div
          className="kpi-label"
          style={{ marginBottom: 12 }}
        >
          Showing {visibleItems.length} of{' '}
          {filteredItems.length} activities
        </div>

        {/* ACTIVITIES */}
        {loading ? (
          <div className="empty">
            Loading activities...
          </div>
        ) : visibleItems.length ? (

          <div>

            {visibleItems.map(workout => (

              <div
                className="activity-item"
                key={workout.workout_id}
              >

                <div className="activity-icon">
                  <Icon name="activity" />
                </div>

                <div className="activity-copy">

                  <strong>
                    {workout.activity_name ||
                      workout.workout_type}
                  </strong>

                  <span>
                    {workout.workout_date}
                    {' · '}
                    {workout.intensity}
                    {' intensity'}
                  </span>

                </div>

                <div className="activity-value">

                  {workout.duration_minutes} min

                  {workout.distance_km ? (
                    <span>
                      {Number(workout.distance_km).toFixed(1)}{' '}
                      km
                    </span>
                  ) : null}

                  <span>
                    {workout.calories_burned || 0}{' '}
                    kcal
                  </span>

                </div>

                <button
                  className="icon-button"
                  title="Edit"
                  onClick={() =>
                    startEdit(workout)
                  }
                >
                  <Icon
                    name="edit"
                    size={13}
                  />
                </button>

                <button
                  className="icon-button"
                  title="Delete"
                  onClick={() =>
                    deleteActivity(
                      workout.workout_id
                    )
                  }
                >
                  <Icon
                    name="trash"
                    size={13}
                  />
                </button>

              </div>

            ))}

          </div>

        ) : (

          <div className="empty">
            No activities match your current filters.
          </div>

        )}

        {/* PAGINATION */}
        {filteredItems.length > ITEMS_PER_PAGE && (

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 20,
            }}
          >

            <span className="small muted">
              Page {page} of {totalPages}
            </span>

            <div
              style={{
                display: 'flex',
                gap: 8,
              }}
            >

              <button
                className="button button-outline button-sm"
                disabled={page === 1}
                onClick={() =>
                  setPage(prev =>
                    Math.max(1, prev - 1)
                  )
                }
              >
                Previous
              </button>

              <button
                className="button button-outline button-sm"
                disabled={page === totalPages}
                onClick={() =>
                  setPage(prev =>
                    Math.min(
                      totalPages,
                      prev + 1
                    )
                  )
                }
              >
                Next
              </button>

            </div>

          </div>

        )}

      </section>

    </div>
  );
}

function GoalProgress({ label, value, target, percent }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <strong style={{ fontSize: 14, fontWeight: 500 }}>{label}</strong>
        <span className="small muted">{value} / {target}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <div className="small muted" style={{ marginTop: 6, textAlign: 'right' }}>
        {percent}%
      </div>
    </div>
  );
}