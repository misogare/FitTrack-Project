import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((e) => {
        console.error(e);
        setError(e.message);
      });
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
  const upcomingWorkouts = [
    {
      id: 1,
      day: 'Today',
      title: 'Upper Body Strength',
      time: '6:00 PM',
      duration: '45 min',
    },
    {
      id: 2,
      day: 'Tomorrow',
      title: 'Cardio & Conditioning',
      time: '7:30 AM',
      duration: '30 min',
    },
    {
      id: 3,
      day: 'Friday',
      title: 'Full Body Workout',
      time: '5:30 PM',
      duration: '50 min',
    },
  ];

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
          progress={64}
        />

        <Metric
          icon="activity"
          title="Steps"
          value="7,342"
          suffix="of 10,000 steps today"
          progress={73}
        />

        <Metric
          icon="water"
          title="Hydration"
          value="1.8 L"
          suffix="of 2.5 L daily target"
          progress={72}
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
                48 min
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
                Stay on top of your training plan
              </p>
            </div>

            <Link
              to="/plans"
              className="auth-link small"
            >
              View plans →
            </Link>

          </div>

          <div className="dashboard-list">

            {upcomingWorkouts.map((workout) => (
              <div
                className="dashboard-list-item"
                key={workout.id}
              >

                <div className="workout-day">
                  <span>
                    {workout.day}
                  </span>

                  <strong>
                    {workout.time}
                  </strong>
                </div>

                <div className="dashboard-list-content">

                  <strong>
                    {workout.title}
                  </strong>

                  <span>
                    {workout.duration}
                  </span>

                </div>

                <Link
                  to="/plans"
                  className="dashboard-start-button"
                >
                  Start
                </Link>

              </div>
            ))}

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