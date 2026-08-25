import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon';
import { api } from '../services/api';
import './Analytics.css';

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];

/* ---------- helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); x.setHours(0, 0, 0, 0); return x; };
const dmyToYmd = s => {
  const m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${pad(m[2])}-${pad(m[1])}` : '';
};
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const fmt = n => Math.round(n).toLocaleString();
const sum = (list, key) => list.reduce((a, x) => a + num(x[key]), 0);
const fmtShort = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
const fmtLong = d => d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

function buildBuckets(period, ref) {
  if (period === 'Weekly') {
    const start = startOfWeek(ref);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return { key: toISO(d), label: d.toLocaleDateString('en-AU', { weekday: 'short' }), monthKey: `${d.getFullYear()}-${pad(d.getMonth() + 1)}` };
    });
  }
  if (period === 'Monthly') {
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: dim }, (_, i) => ({
      key: toISO(new Date(y, m, i + 1)),
      label: String(i + 1),
      monthKey: `${y}-${pad(m + 1)}`,
    }));
  }
  const y = ref.getFullYear();
  return Array.from({ length: 12 }, (_, i) => ({
    key: `${y}-${pad(i + 1)}`,
    label: new Date(y, i, 1).toLocaleDateString('en-AU', { month: 'short' }),
    monthKey: `${y}-${pad(i + 1)}`,
  }));
}

const inBucket = (isoDate, bucket) =>
  bucket.key.length === 7 ? isoDate.slice(0, 7) === bucket.key : isoDate === bucket.key;

export default function Analytics() {
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [goals, setGoals] = useState([]);
  const [weightProgress, setWeightProgress] = useState([]);
  const [metricLogs, setMetricLogs] = useState([]);
  const [dash, setDash] = useState(null);
  const [nutritionGoals, setNutritionGoals] = useState({ calories: 2200 });

  const [showMeasure, setShowMeasure] = useState(false);
  const [measureForm, setMeasureForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [period, setPeriod] = useState('Monthly');
  const [refDate, setRefDate] = useState(() => new Date());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [dashRes, wRes, mRes, gRes, ngRes, bmRes] = await Promise.all([
          api.dashboard(),
          api.workouts(),
          api.meals(),
          api.goals(),
          api.nutritionGoals().catch(() => ({ goals: { calories: 2200 } })),
          api.bodyMetrics({ limit: 60 }).catch(() => ({ metrics: [] })),
        ]);
        setDash(dashRes);
        setWorkouts(wRes.workouts || []);
        setMeals(mRes.meals || []);
        setGoals(gRes.goals || []);
        setNutritionGoals(ngRes.goals || { calories: 2200 });
        setMetricLogs(bmRes.metrics || []);

        const weightGoal = (gRes.goals || []).find(g => /weight/i.test(g.goal_type));
        if (weightGoal) {
          try {
            const p = await api.goalProgress(weightGoal.goal_id);
            setWeightProgress(p.progress || []);
          } catch { /* weight trend optional */ }
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ---------- period buckets ---------- */
  const buckets = useMemo(() => buildBuckets(period, refDate), [period, refDate]);
  const prevRef = useMemo(() => {
    if (period === 'Weekly') return addDays(refDate, -7);
    if (period === 'Monthly') return new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
    return new Date(refDate.getFullYear() - 1, 0, 1);
  }, [period, refDate]);
  const prevBuckets = useMemo(() => buildBuckets(period, prevRef), [period, prevRef]);

  const rangeWorkouts = list => workouts.filter(w => list.some(b => inBucket(w.workout_date, b)));
  const rangeMeals = list => meals.filter(m => list.some(b => inBucket(dmyToYmd(m.meal_date), b)));

  const workoutBuckets = useMemo(
    () => buckets.map(b => ({ ...b, items: workouts.filter(w => inBucket(w.workout_date, b)) })),
    [buckets, workouts]
  );
  const mealBuckets = useMemo(
    () => buckets.map(b => ({ ...b, items: meals.filter(m => inBucket(dmyToYmd(m.meal_date), b)) })),
    [buckets, meals]
  );

  /* ---------- KPI cards ---------- */
  const kpis = useMemo(() => {
    const cur = rangeWorkouts(buckets);
    const prv = rangeWorkouts(prevBuckets);
    const delta = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);
    const curCal = sum(cur, 'calories_burned');
    const prvCal = sum(prv, 'calories_burned');
    const curDist = sum(cur, 'distance_km');
    const prvDist = sum(prv, 'distance_km');

    const metricSeries = [...metricLogs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1));
    const lastMetric = metricSeries.length ? metricSeries[metricSeries.length - 1] : null;
    const firstMetric = metricSeries.length ? metricSeries[0] : null;
    const current = lastMetric ? num(lastMetric.weight_kg) : 0;
    const started = firstMetric ? num(firstMetric.weight_kg) : 0;
    const weightDelta = current && started ? Math.round((current - started) * 10) / 10 : null;

    const km = v => (v > 0 ? v.toFixed(1) : '0');
    return [
      { icon: 'flame', label: 'Total Calories Burned', value: fmt(curCal), delta: delta(curCal, prvCal), deltaText: 'vs. previous period' },
      { icon: 'activity', label: 'Workouts Completed', value: fmt(cur.length), delta: delta(cur.length, prv.length), deltaText: 'vs. previous period' },
      { icon: 'workout', label: 'Total Distance (km)', value: km(curDist), delta: delta(curDist, prvDist), deltaText: 'vs. previous period' },
      { icon: 'goal', label: 'Current Weight (kg)', value: current ? current.toFixed(1) : '—', delta: weightDelta, deltaText: weightDelta != null ? `vs. start (${started.toFixed(1)} kg)` : 'No weight logged' },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, buckets, prevBuckets, metricLogs]);

  /* ---------- activity chart (calories burned) ---------- */
  const burnGoal = num(dash?.settings?.daily_calorie_burn_goal) || 500;
  const activityChart = useMemo(
    () => workoutBuckets.map(b => ({ ...b, value: sum(b.items, 'calories_burned') })),
    [workoutBuckets]
  );
  const activityMax = Math.max(...activityChart.map(b => b.value), burnGoal, 1);
  const activityTotal = activityChart.reduce((a, b) => a + b.value, 0);

  /* ---------- calorie intake trend ---------- */
  const intakeGoal = num(nutritionGoals.calories) || 2200;
  const intakeChart = useMemo(
    () => mealBuckets.map(b => ({ ...b, value: sum(b.items, 'calories') })),
    [mealBuckets]
  );
  const intakeMax = Math.max(...intakeChart.map(b => b.value), intakeGoal, 1);
  const intakeTotal = intakeChart.reduce((a, b) => a + b.value, 0);
  const daysMetIntake = intakeChart.filter(b => b.value >= intakeGoal).length;

  /* ---------- nutrition macro stacked chart ---------- */
  const macroChart = useMemo(
    () => mealBuckets.map(b => ({
      ...b,
      p: sum(b.items, 'protein_g'),
      c: sum(b.items, 'carbs_g'),
      f: sum(b.items, 'fat_g'),
    })),
    [mealBuckets]
  );
  const macroMax = Math.max(1, ...macroChart.map(b => b.p + b.c + b.f));
  const avgMacro = n => (macroChart.length ? Math.round(macroChart.reduce((a, b) => a + b[n], 0) / macroChart.length) : 0);

  /* ---------- body metrics (server-backed BODY_METRIC logs) ---------- */
  const weightGoal = goals.find(g => /weight/i.test(g.goal_type));
  const weightSeries = useMemo(
    () => [...weightProgress].sort((a, b) => (dmyToYmd(a.log_date) < dmyToYmd(b.log_date) ? -1 : 1)),
    [weightProgress]
  );
  const metricSeries = useMemo(
    () => [...metricLogs].sort((a, b) => (a.log_date < b.log_date ? -1 : 1)),
    [metricLogs]
  );
  const lastMetric = metricSeries.length ? metricSeries[metricSeries.length - 1] : null;
  const firstMetric = metricSeries.length ? metricSeries[0] : null;
  const heightCm = num(dash?.user?.height_cm);
  const bmiOf = w => (heightCm > 0 ? w / ((heightCm / 100) ** 2) : null);
  const weightTarget = weightGoal ? num(weightGoal.target_value) : null;
  const weightStarted = firstMetric ? num(firstMetric.weight_kg) : (weightSeries.length ? num(weightSeries[0].value) : null);
  const weightCurrent = lastMetric ? num(lastMetric.weight_kg) : (weightSeries.length ? num(weightSeries[weightSeries.length - 1].value) : null);
  const weightPct = weightStarted != null && weightTarget != null && weightStarted !== weightTarget
    ? Math.max(0, Math.min(100, Math.round(((weightStarted - weightCurrent) / (weightStarted - weightTarget)) * 100)))
    : 0;
  const bmiCurrent = lastMetric?.bmi != null ? num(lastMetric.bmi) : (weightCurrent != null ? bmiOf(weightCurrent) : null);
  const bmiStarted = firstMetric?.bmi != null ? num(firstMetric.bmi) : (weightStarted != null ? bmiOf(weightStarted) : null);
  const fatCurrent = lastMetric?.body_fat_pct != null ? num(lastMetric.body_fat_pct) : null;
  const fatStarted = firstMetric?.body_fat_pct != null ? num(firstMetric.body_fat_pct) : null;
  const measurements = ['chest_cm', 'waist_cm', 'hips_cm', 'arms_cm']
    .map(k => ({
      key: k,
      label: k.replace('_cm', '').replace(/^./, c => c.toUpperCase()),
      current: lastMetric?.[k] != null ? num(lastMetric[k]) : null,
      started: firstMetric?.[k] != null ? num(firstMetric[k]) : null,
    }))
    .filter(m => m.current != null);
  const deltaTxt = (cur, start) => cur != null && start != null ? `${cur - start >= 0 ? '+' : ''}${(cur - start).toFixed(1)}` : null;

  /* ---------- goal completion ---------- */
  const goalRows = useMemo(() => {
    return goals.map(g => {
      const isWeight = /weight/i.test(g.goal_type);
      let cur = num(g.current_value);
      const target = num(g.target_value);
      let pct = num(g.percent_complete);
      if (isWeight && weightSeries.length) {
        const startVal = num(weightSeries[0].value);
        cur = num(weightSeries[weightSeries.length - 1].value);
        const range = startVal - target;
        if (range > 0) pct = Math.max(0, Math.min(100, Math.round(((startVal - cur) / range) * 100)));
      } else if (target > 0 && !pct) {
        pct = (cur / target) * 100;
      }
      const done = pct >= 100;
      const started = pct > 0;
      return { ...g, cur, target, pct: Math.min(100, pct), done, started };
    });
  }, [goals, weightSeries]);
  const activeGoals = goalRows.filter(g => g.status === 'Active');
  const overallPct = activeGoals.length
    ? Math.round(activeGoals.reduce((a, g) => a + g.pct, 0) / activeGoals.length)
    : 0;

  /* ---------- streaks + achievements ---------- */
  const streakInfo = useMemo(() => {
    const dates = [...new Set(workouts.map(w => w.workout_date))].sort();
    let best = 0;
    let run = 0;
    let prev = null;
    for (const iso of dates) {
      run = prev && (new Date(iso) - new Date(prev)) / 86400000 === 1 ? run + 1 : 1;
      prev = iso;
      best = Math.max(best, run);
    }
    const set = new Set(dates);
    let current = 0;
    for (let d = new Date(); set.has(toISO(d)); d = addDays(d, -1)) current++;
    return { current, best, total: workouts.length, first: dates[0] };
  }, [workouts]);

  const achievements = useMemo(() => {
    const out = [];
    if (streakInfo.total > 0) out.push({ icon: 'star', title: 'First workout logged', meta: `Started ${streakInfo.first}` });
    if (streakInfo.best >= 7) out.push({ icon: 'flame', title: '7-Day Workout Streak', meta: 'Logged activity 7+ days in a row' });
    if (streakInfo.total >= 10) out.push({ icon: 'medal', title: '10 Workouts Completed', meta: `${streakInfo.total} workouts in total` });
    if (meals.length >= 20) out.push({ icon: 'nutrition', title: '20 Meals Logged', meta: `${meals.length} meals in your diary` });
    return out;
  }, [streakInfo, meals]);

  /* ---------- weekly comparison ---------- */
  const weeklyCompare = useMemo(() => {
    const week = buildBuckets('Weekly', refDate);
    const last = buildBuckets('Weekly', addDays(refDate, -7));
    const cw = rangeWorkouts(week);
    const lw = rangeWorkouts(last);
    const cm = rangeMeals(week);
    const lm = rangeMeals(last);
    const avg = (list, key) => (list.length ? Math.round(sum(list, key) / list.length) : 0);
    const pctD = (a, b) => {
      if (b <= 0) return null;
      const p = Math.round(((a - b) / b) * 100);
      return p === 0 ? null : { text: `${p > 0 ? '↑' : '↓'}${Math.abs(p)}%`, cls: p >= 0 ? 'up' : 'down' };
    };
    const diffD = (a, b) => {
      const d = a - b;
      return d === 0 ? null : { text: `${d > 0 ? '↑' : '↓'}${Math.abs(d)}`, cls: d >= 0 ? 'up' : 'down' };
    };
    return [
      { metric: 'Calories Burned', cur: `${fmt(sum(cw, 'calories_burned'))} kcal`, prev: `${fmt(sum(lw, 'calories_burned'))} kcal`, delta: pctD(sum(cw, 'calories_burned'), sum(lw, 'calories_burned')) },
      { metric: 'Active Days', cur: `${new Set(cw.map(w => w.workout_date)).size} days`, prev: `${new Set(lw.map(w => w.workout_date)).size} days`, delta: diffD(new Set(cw.map(w => w.workout_date)).size, new Set(lw.map(w => w.workout_date)).size) },
      { metric: 'Workouts', cur: `${cw.length} sessions`, prev: `${lw.length} sessions`, delta: diffD(cw.length, lw.length) },
      { metric: 'Avg. Workout Duration', cur: `${avg(cw, 'duration_minutes')} min`, prev: `${avg(lw, 'duration_minutes')} min`, delta: pctD(avg(cw, 'duration_minutes'), avg(lw, 'duration_minutes')) },
      { metric: 'Avg. Calorie Intake', cur: `${fmt(avg(cm, 'calories'))} kcal`, prev: `${fmt(avg(lm, 'calories'))} kcal`, delta: pctD(avg(cm, 'calories'), avg(lm, 'calories')) },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, meals, refDate]);

  /* ---------- monthly overview ---------- */
  const monthlyOverview = useMemo(() => {
    const m = buildBuckets('Monthly', refDate);
    const pm = buildBuckets('Monthly', new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1));
    const c = rangeWorkouts(m);
    const p = rangeWorkouts(pm);
    const cm = rangeMeals(m);
    const pmM = rangeMeals(pm);
    const rows = [
      { label: 'Total Workouts', cur: `${c.length} sessions`, prev: `${p.length} sessions`, a: c.length, b: p.length },
      { label: 'Calories Burned', cur: `${fmt(sum(c, 'calories_burned'))} kcal`, prev: `${fmt(sum(p, 'calories_burned'))} kcal`, a: sum(c, 'calories_burned'), b: sum(p, 'calories_burned') },
      { label: 'Active Minutes', cur: `${fmt(sum(c, 'duration_minutes'))} min`, prev: `${fmt(sum(p, 'duration_minutes'))} min`, a: sum(c, 'duration_minutes'), b: sum(p, 'duration_minutes') },
      { label: 'Avg. Daily Calories', cur: `${fmt(cm.length ? Math.round(sum(cm, 'calories') / cm.length) : 0)} kcal`, prev: `${fmt(pmM.length ? Math.round(sum(pmM, 'calories') / pmM.length) : 0)} kcal`, a: cm.length ? Math.round(sum(cm, 'calories') / cm.length) : 0, b: pmM.length ? Math.round(sum(pmM, 'calories') / pmM.length) : 0 },
    ];
    return {
      rows: rows.map(r => {
        const tot = r.a + r.b;
        return { ...r, share: tot > 0 ? Math.round((r.a / tot) * 100) : 50 };
      }),
      curLabel: refDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
      prevLabel: new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, meals, refDate]);

  /* ---------- activity heatmap ---------- */
  const heatmap = useMemo(() => {
    const y = refDate.getFullYear();
    const m = refDate.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const offset = (new Date(y, m, 1).getDay() + 6) % 7; // Mon-first
    const byDate = {};
    for (const w of workouts) {
      const cal = num(w.calories_burned);
      if (!byDate[w.workout_date]) byDate[w.workout_date] = 0;
      byDate[w.workout_date] += cal;
    }
    const todayIso = toISO(new Date());
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push({ blank: true });
    for (let d = 1; d <= dim; d++) {
      const iso = toISO(new Date(y, m, d));
      const cal = byDate[iso] || 0;
      let level = 0;
      if (cal > 0) {
        if (cal < burnGoal / 2) level = 1;
        else if (cal < burnGoal) level = 2;
        else if (cal < burnGoal * 1.5) level = 3;
        else level = 4;
      }
      cells.push({ day: d, iso, level, today: iso === todayIso });
    }
    return cells;
  }, [refDate, workouts, burnGoal]);

  /* ---------- log measurement ---------- */
  const openMeasure = () => {
    setMeasureForm({
      log_date: toISO(new Date()),
      weight_kg: weightCurrent ?? '',
      body_fat_pct: fatCurrent ?? '',
      chest_cm: lastMetric?.chest_cm ?? '',
      waist_cm: lastMetric?.waist_cm ?? '',
      hips_cm: lastMetric?.hips_cm ?? '',
      arms_cm: lastMetric?.arms_cm ?? '',
    });
    setShowMeasure(true);
  };
  const setMeasure = (k, v) => setMeasureForm(f => ({ ...f, [k]: v }));

  const saveMeasurement = async () => {
    const payload = { log_date: measureForm.log_date };
    for (const k of ['weight_kg', 'body_fat_pct', 'chest_cm', 'waist_cm', 'hips_cm', 'arms_cm']) {
      const v = measureForm[k];
      payload[k] = v === '' || v == null ? null : Number(v);
    }
    if (!Object.keys(payload).some(k => k !== 'log_date' && payload[k] != null)) {
      setError('Enter at least one measurement value.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await api.logBodyMetric(payload);
      setShowMeasure(false);
      const res = await api.bodyMetrics({ limit: 60 });
      setMetricLogs(res.metrics || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- export ---------- */
  const exportCsv = () => {
    const lines = ['FitTrack Analytics Report', `Generated ${new Date().toLocaleString()}`, ''];
    lines.push('Workouts', 'Date,Activity,Type,Duration (min),Intensity,Calories Burned,Distance (km)');
    for (const w of workouts) {
      lines.push([w.workout_date, `"${String(w.activity_name || '').replace(/"/g, '""')}"`, w.workout_type, w.duration_minutes, w.intensity, w.calories_burned ?? '', w.distance_km ?? ''].join(','));
    }
    lines.push('', 'Body Metrics', 'Date,Weight (kg),BMI,Body Fat (%),Chest (cm),Waist (cm),Hips (cm),Arms (cm)');
    for (const m of metricSeries) {
      lines.push([m.log_date, m.weight_kg ?? '', m.bmi ?? '', m.body_fat_pct ?? '', m.chest_cm ?? '', m.waist_cm ?? '', m.hips_cm ?? '', m.arms_cm ?? ''].join(','));
    }
    lines.push('', 'Meals', 'Date,Meal Type,Food,Calories,Protein (g),Carbs (g),Fat (g)');
    for (const m of meals) {
      lines.push([m.meal_date, m.meal_type, `"${String(m.food_name || '').replace(/"/g, '""')}"`, m.calories, m.protein_g ?? '', m.carbs_g ?? '', m.fat_g ?? ''].join(','));
    }
    lines.push('', 'Goals', 'Goal,Target,Current,Status');
    for (const g of goals) {
      lines.push([`"${g.goal_type}"`, g.target_value, g.current_value, g.status].join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fittrack-analytics-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const periodLabel = period === 'Weekly'
    ? `${fmtShort(startOfWeek(refDate))} – ${fmtShort(addDays(startOfWeek(refDate), 6))}`
    : period === 'Monthly'
      ? refDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
      : String(refDate.getFullYear());

  const shift = dir => {
    if (period === 'Weekly') setRefDate(addDays(refDate, dir * 7));
    else if (period === 'Monthly') setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() + dir, 1));
    else setRefDate(new Date(refDate.getFullYear() + dir, 0, 1));
  };

  const isCurrentPeriod = period === 'Weekly'
    ? startOfWeek(refDate).getTime() === startOfWeek(new Date()).getTime()
    : period === 'Monthly'
      ? refDate.getFullYear() === new Date().getFullYear() && refDate.getMonth() === new Date().getMonth()
      : refDate.getFullYear() === new Date().getFullYear();

  const chartLabelEvery = period === 'Monthly' ? 5 : 1;

  return (
    <div className="app-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Progress Analytics</h1>
          <p className="page-subtitle">{fmtLong(refDate)} · Track your fitness journey and milestones</p>
        </div>

        <div className="analytics-toolbar">
          <div className="period-toggle">
            {PERIODS.map(p => (
              <button key={p} className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <div className="date-nav">
            <button title="Previous period" onClick={() => shift(-1)}><Icon name="chevronLeft" size={14} /></button>
            <span>{periodLabel}</span>
            <button title="Next period" onClick={() => shift(1)}><Icon name="chevronRight" size={14} /></button>
          </div>
          {!isCurrentPeriod && (
            <button className="button button-outline button-sm" onClick={() => setRefDate(new Date())}>Today</button>
          )}
          <button className="button button-dark button-sm" onClick={exportCsv}>
            <Icon name="download" size={13} /> Export Report
          </button>
        </div>
      </div>

      {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="alert" style={{ marginTop: 16 }}>Loading your analytics…</div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="analytics-kpis">
            {kpis.map(k => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>

          {/* CHARTS ROW */}
          <div className="analytics-grid-2">
            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Weekly Activity Overview</h2>
                  <p className="section-description">Calories burned per {period === 'Yearly' ? 'month' : 'day'}</p>
                </div>
                <div className="chart-legend">
                  <span><span className="legend-dot" style={{ background: '#0a0a0a' }} /> Calories</span>
                  <span><span className="legend-line" /> Goal ({fmt(burnGoal)})</span>
                </div>
              </div>
              <BarChart
                data={activityChart}
                goal={burnGoal}
                max={activityMax}
                labelEvery={chartLabelEvery}
                format={fmt}
                emptyText="No activity logged in this period."
              />
              <div className="chart-footer">
                <span>Period Total: <strong>{fmt(activityTotal)} kcal</strong></span>
                <span>Daily Avg: <strong>{fmt(activityChart.length ? activityTotal / activityChart.length : 0)} kcal</strong></span>
                <span>Goal: <strong>{fmt(burnGoal)} kcal/day</strong></span>
              </div>
            </section>

            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Calorie Intake Trend</h2>
                  <p className="section-description">Daily calorie intake vs. goal</p>
                </div>
                <div className="chart-legend">
                  <span><span className="legend-dot" style={{ background: '#0a0a0a' }} /> Intake</span>
                  <span><span className="legend-line" /> Goal ({fmt(intakeGoal)})</span>
                </div>
              </div>
              <BarChart
                data={intakeChart}
                goal={intakeGoal}
                max={intakeMax}
                labelEvery={chartLabelEvery}
                format={fmt}
                emptyText="Log meals to see your calorie trend."
              />
              <div className="chart-footer">
                <span>Avg: <strong>{fmt(intakeChart.length ? intakeTotal / intakeChart.length : 0)} kcal</strong></span>
                <span>Best Day: <strong>{fmt(Math.max(0, ...intakeChart.map(b => b.value)))} kcal</strong></span>
                <span>Goal Met: <strong>{daysMetIntake} / {intakeChart.length} days</strong></span>
              </div>
            </section>
          </div>

          {/* BODY METRICS + GOALS ROW */}
          <div className="analytics-grid-3">
            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Body Metrics Trends</h2>
                  <p className="section-description">Weight, BMI, body fat % and measurements from your logs</p>
                </div>
                <button className="button button-outline button-sm" onClick={openMeasure}>
                  <Icon name="plus" size={13} /> Log Measurement
                </button>
              </div>

              {!metricSeries.length ? (
                <div className="empty" style={{ marginTop: 8 }}>
                  No measurements logged yet. Use "Log Measurement" to start tracking your body metrics.
                </div>
              ) : (
                <>
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-head">
                        <span className="metric-name">Weight</span>
                        <span className="metric-delta">{deltaTxt(weightCurrent, weightStarted) != null ? `${deltaTxt(weightCurrent, weightStarted)} kg` : '—'}</span>
                      </div>
                      <span className="metric-value">{weightCurrent != null ? `${weightCurrent.toFixed(1)} kg` : '—'}</span>
                      <span className="metric-sub">{weightStarted != null ? `Started at ${weightStarted.toFixed(1)} kg` : '—'}</span>
                      <div className="tiny-track"><div style={{ width: `${weightPct}%` }} /></div>
                      <span className="metric-sub">Goal: {weightTarget != null ? `${weightTarget.toFixed(1)} kg` : '—'}</span>
                    </div>
                    <div className="metric-card">
                      <div className="metric-head">
                        <span className="metric-name">BMI</span>
                        <span className="metric-delta">{deltaTxt(bmiCurrent, bmiStarted)}</span>
                      </div>
                      <span className="metric-value">{bmiCurrent != null ? bmiCurrent.toFixed(1) : '—'}</span>
                      <span className="metric-sub">{bmiStarted != null ? `Started at ${bmiStarted.toFixed(1)}` : 'Log weight to compute BMI'}</span>
                      <div className="tiny-track"><div style={{ width: `${bmiCurrent != null ? Math.max(0, Math.min(100, Math.round((bmiCurrent / 25) * 100))) : 0}%`, background: '#737373' }} /></div>
                      <span className="metric-sub">Healthy range 18.5 – 24.9</span>
                    </div>
                    <div className="metric-card">
                      <div className="metric-head">
                        <span className="metric-name">Body Fat %</span>
                        <span className="metric-delta">{deltaTxt(fatCurrent, fatStarted) != null ? `${deltaTxt(fatCurrent, fatStarted)}%` : '—'}</span>
                      </div>
                      <span className="metric-value">{fatCurrent != null ? `${fatCurrent.toFixed(1)}%` : '—'}</span>
                      <span className="metric-sub">{fatStarted != null ? `Started at ${fatStarted.toFixed(1)}%` : '—'}</span>
                      <div className="tiny-track"><div style={{ width: `${fatCurrent != null ? Math.max(0, Math.min(100, Math.round((fatCurrent / 25) * 100))) : 0}%`, background: '#a3a3a3' }} /></div>
                      <span className="metric-sub">Athlete range 14 – 24%</span>
                    </div>
                  </div>

                  {/* Weight trend (last 8 weeks) */}
                  <div>
                    <span className="metric-sub" style={{ display: 'block', marginBottom: 8 }}>Weight Trend — {metricSeries.length} logged {metricSeries.length === 1 ? 'entry' : 'entries'}</span>
                    {metricSeries.length >= 2 ? (
                      <div className="bar-chart" style={{ height: 120 }}>
                        {metricSeries.map((pt, i) => {
                          const vals = metricSeries.map(p => num(p.weight_kg));
                          const min = Math.min(...vals);
                          const range = Math.max(...vals) - min || 1;
                          const h = 20 + (num(pt.weight_kg) - min) / range * 80;
                          return (
                            <div className="bar-col" key={i}>
                              <div className="bar-track" style={{ maxWidth: 24 }}>
                                <div className="bar-fill mid" style={{ height: `${h}%` }} />
                              </div>
                              <span className="bar-label" style={{ fontSize: 10 }}>{pt.log_date.slice(5).replace('-', '/')}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="nutrition-note">Log more measurements to build the trend.</div>
                    )}
                  </div>

                  {/* Body measurements */}
                  {measurements.length ? (
                    <div>
                      <span className="metric-sub" style={{ display: 'block', marginBottom: 8 }}>Body Measurements (cm)</span>
                      <div className="measure-grid">
                        {measurements.map(m => (
                          <div className="measure-card" key={m.key}>
                            <span>{m.label}</span>
                            <strong>{m.current.toFixed(0)} <small>cm</small></strong>
                            <span className={m.current - m.started < 0 ? 'down' : ''}>
                              {deltaTxt(m.current, m.started) != null ? `${m.current - m.started >= 0 ? '+' : ''}${(m.current - m.started).toFixed(1)} cm` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <div className="nutrition-side">
              {/* GOAL COMPLETION */}
              <section className="chart-card">
                <div className="section-head" style={{ marginBottom: 0 }}>
                  <div>
                    <h2 className="section-title">Goal Completion</h2>
                    <p className="section-description">{periodLabel}</p>
                  </div>
                </div>

                <div className="ring-wrap">
                  <div className="ring" style={{ '--pct': `${overallPct}%` }}>
                    <div className="ring-inner">
                      <strong>{overallPct}%</strong>
                      <span>Overall</span>
                    </div>
                  </div>
                  <div className="ring-copy">
                    <strong>Goal progress</strong>
                    <span>{activeGoals.length} active {activeGoals.length === 1 ? 'goal' : 'goals'}{activeGoals.length ? ` · ${activeGoals.filter(g => g.done).length} complete` : ''}</span>
                    <span>{activeGoals.filter(g => !g.done).length} still in progress</span>
                  </div>
                </div>

                {goalRows.length ? (
                  <div className="goal-progress-list">
                    {goalRows.map(g => (
                      <div className="gp-row" key={g.goal_id}>
                        <div className="gp-head">
                          <div className="gp-head-left">
                            <span className={`gp-status ${g.done ? 'done' : g.started ? 'mid' : 'todo'}`}>
                              <Icon name={g.done ? 'check' : g.started ? 'progress' : 'plus'} size={12} />
                            </span>
                            <span>{g.goal_type}</span>
                          </div>
                          <span className="gp-values">{fmt(g.cur)} / {fmt(g.target)}</span>
                        </div>
                        <div className={`gp-track ${g.done ? '' : g.started ? 'mid' : 'low'}`}>
                          <div style={{ width: `${g.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty" style={{ marginTop: 8 }}>Create goals to track completion here.</div>
                )}
              </section>

              {/* STREAKS & ACHIEVEMENTS */}
              <section className="chart-card">
                <div className="section-head" style={{ marginBottom: 0 }}>
                  <div>
                    <h2 className="section-title">Streaks & Achievements</h2>
                    <p className="section-description">Your consistency record</p>
                  </div>
                </div>
                <div className="streak-grid">
                  <div className="streak-cell">
                    <Icon name="flame" size={16} />
                    <strong>{streakInfo.current}</strong>
                    <span>Day Streak</span>
                  </div>
                  <div className="streak-cell">
                    <Icon name="medal" size={16} />
                    <strong>{streakInfo.best}</strong>
                    <span>Best Streak</span>
                  </div>
                </div>
                {achievements.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {achievements.map(a => (
                      <div className="achievement-row" key={a.title}>
                        <div className="achievement-icon"><Icon name={a.icon} size={12} /></div>
                        <div className="achievement-copy">
                          <strong>{a.title}</strong>
                          <span>{a.meta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="nutrition-note">Log workouts to unlock achievements.</div>
                )}
              </section>
            </div>
          </div>

          {/* COMPARISON ROW */}
          <div className="analytics-grid-2">
            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Weekly Comparison</h2>
                  <p className="section-description">This week vs. last week</p>
                </div>
                <span className="akpi-badge">{fmtShort(startOfWeek(refDate))}–{fmtShort(addDays(startOfWeek(refDate), 6))} vs. prior</span>
              </div>
              <div>
                <div className="compare-head-row">
                  <span>Metric</span><span>This Week</span><span>Last Week</span>
                </div>
                {weeklyCompare.map(r => (
                  <div className="compare-row" key={r.metric}>
                    <span className="metric">{r.metric}</span>
                    <span className="cur">{r.cur}</span>
                    <span className="prev">{r.prev} {r.delta && <span className={r.delta.cls}>{r.delta.text}</span>}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Monthly Progress Overview</h2>
                  <p className="section-description">{monthlyOverview.curLabel} vs. {monthlyOverview.prevLabel}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {monthlyOverview.rows.map(r => (
                  <div className="stack-row" key={r.label}>
                    <div className="stack-head">
                      <span className="label">{r.label}</span>
                      <span className="vals"><strong>{r.cur}</strong> <span>{r.prev}</span></span>
                    </div>
                    <div className="stack-bar">
                      <div className="a" style={{ width: `${r.share}%` }} />
                      <div className="b" style={{ width: `${100 - r.share}%` }} />
                    </div>
                    <div className="stack-legend-row">
                      <span>{monthlyOverview.curLabel} ({r.share}%)</span>
                      <span>{monthlyOverview.prevLabel} ({100 - r.share}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* NUTRITION + HEATMAP ROW */}
          <div className="analytics-grid-3">
            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Nutrition Analytics</h2>
                  <p className="section-description">Macro breakdown per {period === 'Yearly' ? 'month' : 'day'}</p>
                </div>
                <div className="chart-legend">
                  <span><span className="legend-dot" style={{ background: '#0a0a0a' }} /> Protein</span>
                  <span><span className="legend-dot" style={{ background: '#737373' }} /> Carbs</span>
                  <span><span className="legend-dot" style={{ background: '#d4d4d4' }} /> Fat</span>
                </div>
              </div>
              <div className={`bar-chart ${macroChart.length > 10 ? 'many' : ''}`} style={{ height: 140 }}>
                {macroChart.map((b, i) => (
                  <div className="bar-col" key={b.key}>
                    <div className="bar-track" style={{ maxWidth: 30 }}>
                      <div className="macro-stack" style={{ height: `${Math.max(6, ((b.p + b.c + b.f) / macroMax) * 100)}%` }}>
                        <div className="protein" style={{ height: `${(b.p / Math.max(1, b.p + b.c + b.f)) * 100}%` }} />
                        <div className="carbs" style={{ height: `${(b.c / Math.max(1, b.p + b.c + b.f)) * 100}%` }} />
                        <div className="fat" style={{ height: `${(b.f / Math.max(1, b.p + b.c + b.f)) * 100}%` }} />
                      </div>
                    </div>
                    {period !== 'Monthly' || (i + 1) % chartLabelEvery === 1 || i === macroChart.length - 1
                      ? <span className="bar-label" style={{ fontSize: 10 }}>{b.label}</span>
                      : <span style={{ fontSize: 10 }}>·</span>}
                  </div>
                ))}
              </div>
              <div className="metrics-grid" style={{ marginTop: 4 }}>
                <div className="metric-card"><span className="metric-name">Avg. Protein</span><span className="metric-value">{avgMacro('p')}g</span><span className="metric-sub">per {period === 'Yearly' ? 'month' : 'day'}</span></div>
                <div className="metric-card"><span className="metric-name">Avg. Carbs</span><span className="metric-value">{avgMacro('c')}g</span><span className="metric-sub">per {period === 'Yearly' ? 'month' : 'day'}</span></div>
                <div className="metric-card"><span className="metric-name">Avg. Fat</span><span className="metric-value">{avgMacro('f')}g</span><span className="metric-sub">per {period === 'Yearly' ? 'month' : 'day'}</span></div>
              </div>
            </section>

            <section className="chart-card">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <div>
                  <h2 className="section-title">Activity Heatmap</h2>
                  <p className="section-description">{refDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} — daily calories burned</p>
                </div>
              </div>
              <div>
                <div className="heat-grid">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span className="heat-dow" key={i}>{d}</span>)}
                  {heatmap.map((c, i) => c.blank
                    ? <div className="heat-day blank" key={i} />
                    : <div className={`heat-day l${c.level} ${c.today ? 'today' : ''}`} key={i}>{c.day}</div>)}
                </div>
                <div className="heat-legend">
                  <span>Less active</span>
                  <div className="heat-legend-dots">
                    <div style={{ background: '#f5f5f5' }} />
                    <div style={{ background: '#e5e5e5' }} />
                    <div style={{ background: '#a3a3a3' }} />
                    <div style={{ background: '#404040' }} />
                    <div style={{ background: '#0a0a0a' }} />
                  </div>
                  <span>More active</span>
                </div>
              </div>
            </section>
          </div>

          {/* ANNOTATION */}
          <div className="analytics-annotation">
            <strong style={{ fontSize: 12, color: '#525252', display: 'block', marginBottom: 6 }}>Screen Annotations — SAD Documentation</strong>
            <ul>
              <li>KPI summary cards aggregate calories burned, workouts, distance and weight for the selected period with a trend vs. the previous period.</li>
              <li>Weekly activity and calorie intake charts are backed by logged workouts and meals, with a dashed goal baseline from your settings.</li>
              <li>Body metrics (weight, BMI, body fat %, chest/waist/hips/arms) come from your BODY_METRIC logs — use "Log Measurement" to add one.</li>
              <li>Goal completion shows real goals with progress bars; the ring is the average completion of active goals.</li>
              <li>Streaks and achievements are derived from your logged workout history.</li>
              <li>The heatmap colours each day of the month by calories burned against your daily burn goal.</li>
              <li>Distance is stored per workout (km) and powers the Total Distance KPI and the export report.</li>
            </ul>
          </div>
        </>
      )}

      {/* LOG MEASUREMENT MODAL */}
      {showMeasure && (
        <div className="modal-backdrop" onClick={() => setShowMeasure(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Log Measurement</h3>
              <button className="icon-button" onClick={() => setShowMeasure(false)} aria-label="Close">
                <Icon name="close" size={16} />
              </button>
            </div>
            <form onSubmit={e => { e.preventDefault(); saveMeasurement(); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label className="field">
                <span className="field-label">Date</span>
                <input type="date" value={measureForm.log_date || ''} onChange={e => setMeasure('log_date', e.target.value)} />
                <small>Format: YYYY-MM-DD (e.g. 2025-06-15)</small>
              </label>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Weight (kg)</span>
                  <input type="number" step="0.1" min="20" placeholder="e.g. 74.5" value={measureForm.weight_kg ?? ''} onChange={e => setMeasure('weight_kg', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">Body Fat (%)</span>
                  <input type="number" step="0.1" min="1" max="70" placeholder="Optional" value={measureForm.body_fat_pct ?? ''} onChange={e => setMeasure('body_fat_pct', e.target.value)} />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Chest (cm)</span>
                  <input type="number" step="0.5" placeholder="Optional" value={measureForm.chest_cm ?? ''} onChange={e => setMeasure('chest_cm', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">Waist (cm)</span>
                  <input type="number" step="0.5" placeholder="Optional" value={measureForm.waist_cm ?? ''} onChange={e => setMeasure('waist_cm', e.target.value)} />
                </label>
              </div>
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Hips (cm)</span>
                  <input type="number" step="0.5" placeholder="Optional" value={measureForm.hips_cm ?? ''} onChange={e => setMeasure('hips_cm', e.target.value)} />
                </label>
                <label className="field">
                  <span className="field-label">Arms (cm)</span>
                  <input type="number" step="0.5" placeholder="Optional" value={measureForm.arms_cm ?? ''} onChange={e => setMeasure('arms_cm', e.target.value)} />
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                <button type="button" className="button button-outline" onClick={() => setShowMeasure(false)}>Cancel</button>
                <button type="submit" className="button button-dark" disabled={saving}>{saving ? 'Saving…' : 'Save Measurement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
============================================================ */

function KpiCard({ icon, label, value, delta, deltaText }) {
  const isWeight = label.includes('Weight');
  return (
    <div className="akpi">
      <div className="akpi-top">
        <div className="akpi-icon"><Icon name={icon} size={14} /></div>
        {delta != null && (
          <span className={`akpi-badge ${isWeight ? '' : delta >= 0 ? 'up' : 'down'}`}>
            {isWeight ? (delta >= 0 ? '+' : '') + delta.toFixed(1) + ' kg' : `${delta >= 0 ? '+' : ''}${delta}%`}
          </span>
        )}
      </div>
      <span className="akpi-value">{value}</span>
      <span className="akpi-label">{label}</span>
      <div className="akpi-delta">
        {delta != null && <Icon name={delta >= 0 ? 'trendUp' : 'trendDown'} size={12} />}
        <span>{deltaText}</span>
      </div>
    </div>
  );
}

function BarChart({ data, goal, max, labelEvery, format, emptyText }) {
  const hasData = data.some(b => b.value > 0);
  const goalPct = (goal / max) * 100;
  return (
    <div>
      <div className={`bar-chart ${data.length > 10 ? 'many' : ''}`}>
        <div className="goal-baseline" style={{ bottom: `${Math.max(2, Math.min(96, goalPct))}%` }} title={`Goal ${fmt(goal)}`} />
        {data.map((b, i) => (
          <div className="bar-col" key={b.key}>
            {data.length <= 7 && b.value > 0 && <span className="bar-value">{format(b.value)}</span>}
            <div className="bar-track">
              <div
                className={`bar-fill ${b.value >= goal ? '' : b.value > 0 ? 'mid' : 'low'}`}
                style={{ height: `${Math.max(2, (b.value / max) * 100)}%` }}
              />
            </div>
            {labelEvery === 1 || (i + 1) % labelEvery === 1 || i === data.length - 1
              ? <span className="bar-label">{b.label}</span>
              : <span style={{ fontSize: 10 }}>·</span>}
          </div>
        ))}
      </div>
      {!hasData && <div className="nutrition-note" style={{ textAlign: 'center', marginTop: -40 }}>{emptyText}</div>}
    </div>
  );
}
