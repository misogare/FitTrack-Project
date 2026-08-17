// src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setData).catch(e => setError(e.message));
  }, []);

  const workouts = data?.weekly_workouts || [];
  const max = Math.max(1, ...workouts.map(x => Number(x.total_minutes) || 0));
  const goals = data?.active_goals || [];
  const nutrition = data?.today_nutrition || {};
  const monthly = data?.monthly_stats || {};

  const bars = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return labels.map((label, i) => ({
      label,
      value: Number(workouts[i]?.total_minutes) || 0
    }));
  }, [workouts]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back, {data?.user?.first_name || user?.first_name || 'there'}. 
            Here's your progress at a glance.
          </p>
        </div>
        <div className="header-actions">
          <Link className="button button-outline" to="/analytics">
            <Icon name="chart"/> View Analytics
          </Link>
          <Link className="button button-dark" to="/workouts">
            <Icon name="plus"/> Log Activity
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert" style={{ marginBottom: 16 }}>
          {error} Start the backend to load live data.
        </div>
      )}

      <div className="grid-4">
        <Metric icon="workout" title="Workouts" 
          value={workouts.reduce((s, x) => s + (Number(x.workout_count) || 0), 0) || 0} 
          suffix="sessions this week" 
          progress={Math.min(100, (workouts.reduce((s, x) => s + (Number(x.workout_count) || 0), 0) / 5) * 100)} />
        <Metric icon="flame" title="Calories" 
          value={Number(monthly.total_calories_burned || 0).toLocaleString()} 
          suffix="kcal burned this month" progress={64} />
        <Metric icon="activity" title="Steps" value="7,342" 
          suffix="of 10,000 steps today" progress={73} />
        <Metric icon="water" title="Hydration" value="1.8 L" 
          suffix="of 2.5 L daily target" progress={72} />
      </div>

      <div className="dashboard-grid">
        <section className="card card-pad">
          <div className="section-head">
            <div>
              <h2 className="section-title">Weekly Progress Snapshot</h2>
              <p className="section-description">Workout minutes across the last 7 days</p>
            </div>
            <Link className="button button-outline button-sm" to="/analytics">Details</Link>
          </div>
          <div className="chart">
            {bars.map(b => (
              <div key={b.label} className="chart-bar" 
                style={{ height: `${Math.max(4, (b.value / max) * 120)}px` }}>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
          <div className="grid-3" style={{ marginTop: 40 }}>
            <div><div className="kpi-label">Avg. Duration</div><div className="kpi-value">48 min</div></div>
            <div><div className="kpi-label">Total Calories</div>
              <div className="kpi-value">{Number(monthly.total_calories_burned || 0).toLocaleString()} kcal</div>
            </div>
            <div><div className="kpi-label">Active Days</div><div className="kpi-value">{workouts.length || 0} / 7</div></div>
          </div>
        </section>

        <section className="card quick-actions">
          <h2 className="section-title">Quick Actions</h2>
          <p className="section-description">Log or start activities fast</p>
          <div className="quick-list">
            <Link className="quick-action" to="/workouts"><Icon name="activity"/> Log Workout <span style={{ marginLeft: 'auto' }}>›</span></Link>
            <Link className="quick-action" to="/nutrition"><Icon name="nutrition"/> Log Meal <span style={{ marginLeft: 'auto' }}>›</span></Link>
            <Link className="quick-action" to="/goals"><Icon name="goal"/> Create Goal <span style={{ marginLeft: 'auto' }}>›</span></Link>
            <Link className="quick-action" to="/plans"><Icon name="workout"/> Browse Plans <span style={{ marginLeft: 'auto' }}>›</span></Link>
          </div>
          <div style={{ borderTop: '1px solid #f5f5f5', marginTop: 16, paddingTop: 16 }}>
            <div className="kpi-label">Today's Nutrition</div>
            <div className="kpi-value" style={{ fontSize: 20 }}>
              {Number(nutrition.total_calories || 0).toLocaleString()} kcal
            </div>
            <div className="progress-track" style={{ marginTop: 10 }}>
              <div className="progress-fill" style={{ width: `${Math.min(100, (Number(nutrition.total_calories || 0) / 2200) * 100)}%` }} />
            </div>
          </div>
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <section className="card card-pad">
          <div className="section-head">
            <div>
              <h2 className="section-title">Active Goals</h2>
              <p className="section-description">Keep your targets visible</p>
            </div>
            <Link to="/goals" className="auth-link small">View all →</Link>
          </div>
          {goals.length ? goals.slice(0, 4).map(g => (
            <div className="list-row" key={g.goal_id}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: 14, fontWeight: 400 }}>{g.goal_type}</strong>
                <div className="progress-track" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${Math.min(100, Number(g.percent_complete) || 0)}%` }} />
                </div>
              </div>
              <span className="small muted">{Number(g.percent_complete || 0)}%</span>
            </div>
          )) : (
            <div className="empty">No active goals yet. <Link className="auth-link" to="/goals">Create your first goal.</Link></div>
          )}
        </section>

        <section className="card card-pad">
          <div className="section-head">
            <div>
              <h2 className="section-title">Nutrition Snapshot</h2>
              <p className="section-description">Today's logged totals</p>
            </div>
            <Link to="/nutrition" className="auth-link small">Log meal →</Link>
          </div>
          <div className="nutrition-snapshot">
            <Snapshot label="Calories" value={`${Number(nutrition.total_calories || 0).toLocaleString()} kcal`} />
            <Snapshot label="Protein" value={`${Number(nutrition.total_protein || 0)} g`} />
            <Snapshot label="Carbs" value={`${Number(nutrition.total_carbs || 0)} g`} />
          </div>
        </section>
      </div>
    </>
  );
}

function Metric({ icon, title, value, suffix, progress }) {
  return (
    <div className="card kpi-card">
      <div className="kpi-top"><span>{title}</span><span className="kpi-icon"><Icon name={icon} /></span></div>
      <div className="kpi-main">{value}</div>
      <div className="kpi-meta"><span>{suffix}</span><span>{Math.round(progress)}%</span></div>
      <div className="progress-track" style={{ marginTop: 8 }}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function Snapshot({ label, value }) {
  return (
    <div className="snapshot">
      <span className="kpi-label">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}