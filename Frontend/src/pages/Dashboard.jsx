import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [waterToday, setWaterToday] = useState(0);
  const [metricLogs, setMetricLogs] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [dash, water, metrics, plan] = await Promise.all([
          api.dashboard(),
          api.waterLog({ date: new Date().toISOString().slice(0, 10) }).catch(() => ({ entries: [] })),
          api.bodyMetrics({ limit: 60 }).catch(() => ({ metrics: [] })),
          api.activePlan().catch(() => ({ active: null })),
        ]);
        setData(dash);
        setWaterToday((water.entries || []).reduce((a, w) => a + Number(w.amount_ml || 0), 0));
        setMetricLogs(metrics.metrics || []);
        setActivePlan(plan.active || null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, []);

  const workouts = data?.weekly_workouts || [];
  const goals = data?.active_goals || [];
  const nutrition = data?.today_nutrition || {};
  const monthly = data?.monthly_stats || {};

  const max = Math.max(
    1,
    ...workouts.map(
      (x) => Number(x.total_minutes) || 0
    )
  );

  const bars = useMemo(() => {
    const labels = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];

    return labels.map((label, i) => ({
      label,
      value:
        Number(workouts[i]?.total_minutes) || 0,
    }));
  }, [workouts]);

  /*
   * These are currently frontend fallback examples.
   * When the backend exposes recent activity / upcoming
   * workouts, replace these with API data.
   */
const recent_workouts = data?.recent_workouts || [];
const recent_meals    = data?.recent_meals    || [];
const settings        = data?.settings        || {};
const today_summary   = data?.today_summary   || {};
  function relativeDay(dateStr) {
  if (!dateStr) return '';
  const today = new Date();
  const date  = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round(
    (today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) / 86400000
  );
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
const recentActivity = useMemo(() => {
  const w = recent_workouts.map((x) => ({
    id: `w-${x.workout_id}`,
    icon: 'activity',
    title: x.activity_name || x.workout_type,
    description: `${x.duration_minutes} min${
      x.calories_burned ? ` · ${x.calories_burned} kcal` : ''
    }`,
    time: relativeDay(x.workout_date),
    _sortKey: x.workout_date,
  }));

  const m = recent_meals.map((x) => ({
    id: `m-${x.meal_id}`,
    icon: 'nutrition',
    title: `${x.meal_type} · ${x.food_name}`,
    description: `${x.calories} kcal`,
    time: relativeDay(x.meal_date),
    _sortKey: x.meal_date,
  }));

  return [...w, ...m]
    .sort((a, b) => (a._sortKey < b._sortKey ? 1 : -1))
    .slice(0, 6);
}, [recent_workouts, recent_meals]);
  const distanceKm = Number(monthly.total_distance_km || 0);
  const waterLitres = waterToday / 1000;
  const hydrationGoal = Number(settings.daily_hydration_litres || 2.5);
  const hydrationProgress = Math.min(100, (waterLitres / hydrationGoal) * 100);

  const workoutCount = workouts.reduce(
    (sum, x) =>
      sum + (Number(x.workout_count) || 0),
    0
  );

  const workoutProgress = Math.min(
    100,
    (workoutCount / 5) * 100
  );

  const nutritionProgress = Math.min(
    100,
    (Number(nutrition.total_calories || 0) / 2200) *
      100
  );

  // Average duration this month (real)
  const avgDuration = Number(monthly.workouts_this_month)
    ? Math.round(Number(monthly.total_minutes_this_month || 0) / Number(monthly.workouts_this_month))
    : 0;

  // Upcoming sessions from the active plan
  const planItems = activePlan?.items || [];
  const planCompleted = planItems.filter(i => Number(i.is_completed)).length;
  const upcomingWorkouts = planItems.map((item) => ({
    id: `p-${item.plan_item_id}`,
    day: `Day ${item.day_number}`,
    title: item.activity_name,
    time: item.target_intensity ? `${item.target_intensity} · ${item.target_duration_minutes || 0} min` : '',
    completed: Boolean(Number(item.is_completed)),
  }));

  // Body metrics (latest + 8-week trend)
  const metricSeries = [...metricLogs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
  const lastMetric = metricSeries.length ? metricSeries[metricSeries.length - 1] : null;
  const firstMetric = metricSeries.length ? metricSeries[0] : null;
  const weightDelta = lastMetric && firstMetric
    ? Math.round((Number(lastMetric.weight_kg || 0) - Number(firstMetric.weight_kg || 0)) * 10) / 10
    : null;
  const fatDelta = lastMetric && firstMetric && lastMetric.body_fat_pct != null && firstMetric.body_fat_pct != null
    ? Math.round((Number(lastMetric.body_fat_pct) - Number(firstMetric.body_fat_pct)) * 10) / 10
    : null;
  const weightVals = metricSeries.map(m => Number(m.weight_kg)).filter(v => v > 0);
  const weightMin = weightVals.length ? Math.min(...weightVals) : 0;
  const weightRange = weightVals.length ? Math.max(...weightVals) - weightMin || 1 : 1;

  return (
    <div className="dashboard-page">

      {/* HEADER */}
      <div className="page-header">

        <div>
          <h1 className="page-title">
            Dashboard
          </h1>

          <p className="page-subtitle">
            Welcome back,{' '}
            {data?.user?.first_name ||
              user?.first_name ||
              'there'}
            . Here's your progress at a glance.
          </p>
        </div>

        <div className="header-actions">

          <Link
            className="button button-outline"
            to="/analytics"
          >
            <Icon name="chart" />
            View Analytics
          </Link>

          <Link
            className="button button-dark"
            to="/workouts"
          >
            <Icon name="plus" />
            Log Activity
          </Link>

        </div>

      </div>


      {/* ERROR */}
      {error && (
        <div
          className="alert"
          style={{ marginBottom: 16 }}
        >
          {error}
          {' '}
          Start the backend to load live data.
        </div>
      )}


      {/* KPI CARDS */}
      <div className="grid-4">

        <Metric
          icon="workout"
          title="Workouts"
          value={workoutCount}
          suffix="sessions this week"
          progress={workoutProgress}
        />

        <Metric
          icon="flame"
          title="Calories"
          value={Number(
            monthly.total_calories_burned || 0
          ).toLocaleString()}
          suffix="kcal burned this month"
          progress={Math.min(
            100,
            (Number(monthly.total_calories_burned || 0) /
              (Number(monthly.workouts_this_month || 0) *
                Number(settings.daily_calorie_burn_goal || 500) ||
                1)) *
              100
          )}
        />

        <Metric
          icon="activity"
          title="Distance"
          value={distanceKm ? distanceKm.toFixed(1) : '0'}
          suffix="km covered this month"
          progress={Math.min(100, (distanceKm / 50) * 100)}
        />

        <Metric
          icon="water"
          title="Hydration"
          value={`${waterLitres.toFixed(1)} L`}
          suffix={`of ${hydrationGoal} L daily target`}
          progress={hydrationProgress}
        />

      </div>


      {/* MAIN DASHBOARD */}
      <div className="dashboard-grid">

        {/* WEEKLY PROGRESS */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Weekly Progress Snapshot
              </h2>

              <p className="section-description">
                Workout minutes across the last 7 days
              </p>
            </div>

            <Link
              className="button button-outline button-sm"
              to="/analytics"
            >
              Details
            </Link>

          </div>

          <div className="chart">

            {bars.map((bar) => (
              <div
                key={bar.label}
                className="chart-column"
              >
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.max(
                      4,
                      (bar.value / max) * 120
                    )}px`,
                  }}
                  title={`${bar.value} minutes`}
                />

                <span>
                  {bar.label}
                </span>
              </div>
            ))}

          </div>

          <div
            className="grid-3"
            style={{ marginTop: 40 }}
          >

            <div>
              <div className="kpi-label">
                Avg. Duration
              </div>

              <div className="kpi-value">
                {avgDuration} min
              </div>
            </div>

            <div>
              <div className="kpi-label">
                Total Calories
              </div>

              <div className="kpi-value">
                {Number(
                  monthly.total_calories_burned || 0
                ).toLocaleString()}
                {' '}kcal
              </div>
            </div>

            <div>
              <div className="kpi-label">
                Active Days
              </div>

              <div className="kpi-value">
                {workouts.length || 0} / 7
              </div>
            </div>

          </div>

        </section>


        {/* QUICK ACTIONS */}
        <section className="card quick-actions">

          <h2 className="section-title">
            Quick Actions
          </h2>

          <p className="section-description">
            Log or start activities fast
          </p>

          <div className="quick-list">

            <Link
              className="quick-action"
              to="/workouts"
            >
              <Icon name="activity" />
              <span>Log Workout</span>
              <span className="quick-arrow">
                ›
              </span>
            </Link>

            <Link
              className="quick-action"
              to="/nutrition"
            >
              <Icon name="nutrition" />
              <span>Log Meal</span>
              <span className="quick-arrow">
                ›
              </span>
            </Link>

            <Link
              className="quick-action"
              to="/goals"
            >
              <Icon name="goal" />
              <span>Create Goal</span>
              <span className="quick-arrow">
                ›
              </span>
            </Link>

            <Link
              className="quick-action"
              to="/plans"
            >
              <Icon name="workout" />
              <span>Browse Plans</span>
              <span className="quick-arrow">
                ›
              </span>
            </Link>

          </div>


          {/* NUTRITION */}
          <div
            style={{
              borderTop: '1px solid #f0f1f3',
              marginTop: 16,
              paddingTop: 16,
            }}
          >

            <div className="kpi-label">
              Today's Nutrition
            </div>

            <div
              className="kpi-value"
              style={{ fontSize: 20 }}
            >
              {Number(
                nutrition.total_calories || 0
              ).toLocaleString()}
              {' '}kcal
            </div>

            <div
              className="progress-track"
              style={{ marginTop: 10 }}
            >
              <div
                className="progress-fill"
                style={{
                  width: `${nutritionProgress}%`,
                }}
              />
            </div>

          </div>

        </section>

      </div>


      {/* GOALS + NUTRITION */}
      <div
        className="grid-2"
        style={{ marginTop: 16 }}
      >

        {/* GOALS */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Active Goals
              </h2>

              <p className="section-description">
                Keep your targets visible
              </p>
            </div>

            <Link
              to="/goals"
              className="auth-link small"
            >
              View all →
            </Link>

          </div>

          {goals.length ? (
            goals
              .slice(0, 4)
              .map((goal) => (

                <div
                  className="list-row"
                  key={goal.goal_id}
                >

                  <div style={{ flex: 1 }}>

                    <strong
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      {goal.goal_type}
                    </strong>

                    <div
                      className="progress-track"
                      style={{ marginTop: 8 }}
                    >
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Number(
                              goal.percent_complete
                            ) || 0
                          )}%`,
                        }}
                      />
                    </div>

                  </div>

                  <span className="small muted">
                    {Number(
                      goal.percent_complete || 0
                    )}
                    %
                  </span>

                </div>

              ))
          ) : (
            <div className="empty">
              No active goals yet.{' '}
              <Link
                className="auth-link"
                to="/goals"
              >
                Create your first goal.
              </Link>
            </div>
          )}

        </section>


        {/* NUTRITION */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Nutrition Snapshot
              </h2>

              <p className="section-description">
                Today's logged totals
              </p>
            </div>

            <Link
              to="/nutrition"
              className="auth-link small"
            >
              Log meal →
            </Link>

          </div>

          <div className="nutrition-snapshot">

            <Snapshot
              label="Calories"
              value={`${Number(
                nutrition.total_calories || 0
              ).toLocaleString()} kcal`}
            />

            <Snapshot
              label="Protein"
              value={`${Number(
                nutrition.total_protein || 0
              )} g`}
            />

            <Snapshot
              label="Carbs"
              value={`${Number(
                nutrition.total_carbs || 0
              )} g`}
            />

          </div>

        </section>

      </div>


      {/* NEW DASHBOARD WIDGETS */}
      <div
        className="grid-2"
        style={{ marginTop: 16 }}
      >

        {/* RECENT ACTIVITY */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Recent Activity
              </h2>

              <p className="section-description">
                Your latest logged activities
              </p>
            </div>

            <Link
              to="/workouts"
              className="auth-link small"
            >
              View all →
            </Link>

          </div>

          <div className="dashboard-list">

            {recentActivity.map((activity) => (
              <div
                className="dashboard-list-item"
                key={activity.id}
              >

                <div className="dashboard-list-icon">
                  <Icon
                    name={activity.icon}
                    size={17}
                  />
                </div>

                <div className="dashboard-list-content">

                  <strong>
                    {activity.title}
                  </strong>

                  <span>
                    {activity.description}
                  </span>

                </div>

                <span className="dashboard-list-time">
                  {activity.time}
                </span>

              </div>
            ))}

          </div>

        </section>


        {/* UPCOMING WORKOUTS */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Upcoming Workouts
              </h2>

              <p className="section-description">
                {activePlan
                  ? `${activePlan.plan_name} · ${planCompleted} of ${planItems.length} sessions done`
                  : 'Sessions from your active plan'}
              </p>
            </div>

            <Link
              to="/plans"
              className="auth-link small"
            >
              View plans →
            </Link>

          </div>

          {upcomingWorkouts.length ? (
            <div className="dashboard-list">

              {upcomingWorkouts.map((workout) => (
                <div
                  className={`dashboard-list-item ${workout.completed ? 'done' : ''}`}
                  key={workout.id}
                >

                  <div className="workout-day">
                    <span>
                      {workout.day}
                    </span>

                    {workout.completed ? (
                      <strong className="workout-complete">
                        <Icon name="check" size={12} /> Done
                      </strong>
                    ) : (
                      <strong>
                        {workout.time}
                      </strong>
                    )}
                  </div>

                  <div className="dashboard-list-content">

                    <strong>
                      {workout.title}
                    </strong>

                    <span>
                      {workout.completed
                        ? 'Completed'
                        : 'Next session · ' +
                          (workout.time || 'upcoming')}
                    </span>

                  </div>

                  <Link
                    to="/plans"
                    className="dashboard-start-button"
                  >
                    {workout.completed ? 'View' : 'Start'}
                  </Link>

                </div>
              ))}

            </div>
          ) : (
            <div className="empty">
              No active plan.{' '}
              <Link className="auth-link" to="/plans">
                Create a plan to see upcoming sessions.
              </Link>
            </div>
          )}

        </section>

      </div>


      {/* BODY METRICS + TODAY'S FOCUS */}
      <div
        className="grid-2"
        style={{ marginTop: 16 }}
      >

        {/* BODY METRICS */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Body Metrics
              </h2>

              <p className="section-description">
                Latest weight, BMI and body fat trends
              </p>
            </div>

            <Link
              to="/analytics"
              className="auth-link small"
            >
              View analytics →
            </Link>

          </div>

          {lastMetric ? (
            <>
              <div className="dash-metric-row">
                <div className="dash-metric">
                  <span>Weight</span>
                  <strong>{Number(lastMetric.weight_kg || 0).toFixed(1)} kg</strong>
                  <small className={weightDelta != null && weightDelta < 0 ? 'good' : ''}>
                    {weightDelta != null ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg` : '—'}
                  </small>
                </div>
                <div className="dash-metric">
                  <span>BMI</span>
                  <strong>{lastMetric.bmi != null ? Number(lastMetric.bmi).toFixed(1) : '—'}</strong>
                  <small>{lastMetric.bmi != null ? 'Healthy 18.5–24.9' : '—'}</small>
                </div>
                <div className="dash-metric">
                  <span>Body Fat</span>
                  <strong>{lastMetric.body_fat_pct != null ? `${Number(lastMetric.body_fat_pct).toFixed(1)}%` : '—'}</strong>
                  <small className={fatDelta != null && fatDelta < 0 ? 'good' : ''}>
                    {fatDelta != null ? `${fatDelta > 0 ? '+' : ''}${fatDelta.toFixed(1)}%` : '—'}
                  </small>
                </div>
              </div>

              <div className="dash-weight-chart">
                {metricSeries.map((m, i) => {
                  const w = Number(m.weight_kg);
                  if (!w) return null;
                  const h = 20 + ((w - weightMin) / weightRange) * 80;
                  return (
                    <div className="dash-weight-bar" key={i} title={`${m.log_date}: ${w} kg`}>
                      <div style={{ height: `${h}%` }} />
                    </div>
                  );
                })}
              </div>
              <div className="small muted" style={{ marginTop: 6 }}>
                Weight trend — last {metricSeries.filter(m => Number(m.weight_kg)).length} logged {metricSeries.length === 1 ? 'entry' : 'entries'}
              </div>
            </>
          ) : (
            <div className="empty">
              No body metrics logged yet.{' '}
              <Link className="auth-link" to="/analytics">
                Log a measurement.
              </Link>
            </div>
          )}

        </section>


        {/* TODAY'S FOCUS */}
        <section className="card card-pad">

          <div className="section-head">

            <div>
              <h2 className="section-title">
                Today's Focus
              </h2>

              <p className="section-description">
                Your activity and hydration so far
              </p>
            </div>

            <Link
              to="/workouts"
              className="auth-link small"
            >
              Log activity →
            </Link>

          </div>

          <div className="dash-metric-row">
            <div className="dash-metric">
              <span>Workouts</span>
              <strong>{Number(today_summary.sessions_today || 0)}</strong>
              <small>session{today_summary.sessions_today === 1 ? '' : 's'} today</small>
            </div>
            <div className="dash-metric">
              <span>Active Minutes</span>
              <strong>{Number(today_summary.minutes_today || 0)}</strong>
              <small>of {Number(settings.daily_workout_minutes || 60)} min goal</small>
            </div>
            <div className="dash-metric">
              <span>Calories Burned</span>
              <strong>{Number(today_summary.calories_today || 0)}</strong>
              <small>of {Number(settings.daily_calorie_burn_goal || 500)} kcal goal</small>
            </div>
          </div>

          <div className="dash-focus-water">
            <div>
              <span className="kpi-label">Hydration Today</span>
              <strong>
                {waterLitres.toFixed(1)} L{' '}
                <small>of {hydrationGoal} L</small>
              </strong>
            </div>
            <div className="progress-track" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${hydrationProgress}%` }} />
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #f0f1f3',
              marginTop: 16,
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div className="kpi-label">Active Days This Month</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {Number(monthly.workouts_this_month || 0)}{' '}
              <span className="small muted">workouts</span>
            </div>
          </div>

        </section>

      </div>

    </div>
  );
}


/* =========================================
   COMPONENTS
========================================= */

function Metric({
  icon,
  title,
  value,
  suffix,
  progress,
}) {
  return (
    <div className="card kpi-card">

      <div className="kpi-top">

        <span>
          {title}
        </span>

        <span className="kpi-icon">
          <Icon name={icon} />
        </span>

      </div>

      <div className="kpi-main">
        {value}
      </div>

      <div className="kpi-meta">

        <span>
          {suffix}
        </span>

        <span>
          {Math.round(progress)}%
        </span>

      </div>

      <div
        className="progress-track"
        style={{ marginTop: 8 }}
      >
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

    </div>
  );
}


function Snapshot({
  label,
  value,
}) {
  return (
    <div className="snapshot">

      <span className="kpi-label">
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}