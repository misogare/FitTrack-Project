import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { api } from '../services/api';
import './Nutrition.css';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const MEAL_ICONS = { Breakfast: 'sun', Lunch: 'utensils', Dinner: 'moon', Snack: 'cookie' };
const MEAL_GOAL_SHARE = { Breakfast: 0.25, Lunch: 0.32, Dinner: 0.30, Snack: 0.13 };
const DEFAULT_GOALS = { calories: 2200, protein: 150, carbs: 275, fat: 73 };
const GOALS_KEY = 'fittrack_nutrition_goals';
const HYDRATION_KEY = 'fittrack_hydration';
const GLASS_ML = 250;
const WATER_CHOICES = [250, 500, 1000];

/* ---------- date / number helpers ---------- */
const pad = n => String(n).padStart(2, '0');
const toDMY = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const fmtLong = d => d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtShort = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = s => {
  if (!s) return '';
  const m = String(s).match(/(\d{1,2}):(\d{2})/);
  if (!m) return '';
  let h = Number(m[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m[2]} ${ampm}`;
};
const nowTime = () => new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/* ---------- localStorage fallbacks (used only when the nutrition endpoints are unreachable) ---------- */
function loadLocalGoals() {
  try { return { ...DEFAULT_GOALS, ...JSON.parse(localStorage.getItem(GOALS_KEY) || '{}') }; }
  catch { return { ...DEFAULT_GOALS }; }
}
function loadLocalWater() {
  try {
    const raw = JSON.parse(localStorage.getItem(HYDRATION_KEY) || '{}');
    const map = {};
    for (const [key, list] of Object.entries(raw)) {
      map[key] = (list || []).map((e, i) => ({
        id: e.id || `local-${key}-${i}`,
        amount_ml: num(e.amount),
        time: e.time || 'Water',
      }));
    }
    return map;
  }
  catch { return {}; }
}
function saveLocalWater(map) {
  const out = {};
  for (const [key, list] of Object.entries(map)) {
    out[key] = (list || []).map(e => ({ time: e.time, amount: e.amount_ml, id: e.id }));
  }
  try { localStorage.setItem(HYDRATION_KEY, JSON.stringify(out)); } catch { /* storage unavailable */ }
}

const EMPTY_ADD = { food_name: '', meal_type: 'Breakfast', calories: '', protein_g: '', carbs_g: '', fat_g: '' };
const EMPTY_CUSTOM = { name: '', barcode: '', category: '', serving_size: '', serving_unit: 'g', calories: '', protein_g: '', carbs_g: '', fat_g: '' };

export default function Nutrition() {
  const [meals, setMeals] = useState([]);
  const [dash, setDash] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const [goals, setGoals] = useState(loadLocalGoals);
  const [goalsServer, setGoalsServer] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({ ...DEFAULT_GOALS });

  const [waterByDate, setWaterByDate] = useState(loadLocalWater);
  const [waterServer, setWaterServer] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);

  const [addForm, setAddForm] = useState(EMPTY_ADD);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);

  const [mealFilter, setMealFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [weeklyView, setWeeklyView] = useState(false);
  const [recIndex, setRecIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addRef = useRef(null);

  const flash = (msg, ok = true) => {
    if (ok) setSuccess(msg); else setError(msg);
    setTimeout(() => { setSuccess(''); setError(''); }, 3500);
  };

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [mealsRes, dashRes] = await Promise.all([
        api.meals(),
        api.dashboard().catch(() => null),
      ]);
      setMeals(mealsRes.meals || []);
      setDash(dashRes);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWater = async () => {
    try {
      const res = await api.waterLog();
      const map = {};
      for (const e of res.entries || []) {
        const key = e.log_date;
        if (!map[key]) map[key] = [];
        map[key].push({
          id: e.water_log_id,
          amount_ml: num(e.amount_ml),
          time: e.logged_time ? fmtTime(e.logged_time) : 'Water',
        });
      }
      setWaterByDate(map);
      setWaterServer(true);
    } catch {
      setWaterByDate(loadLocalWater());
      setWaterServer(false);
    }
  };

  const loadGoals = async () => {
    try {
      const res = await api.nutritionGoals();
      setGoals(res.goals || { ...DEFAULT_GOALS });
      setGoalsServer(true);
    } catch {
      setGoals(loadLocalGoals());
      setGoalsServer(false);
    }
  };

  useEffect(() => {
    load();
    loadWater();
    loadGoals();
  }, []);

  const isToday = isSameDay(selectedDate, new Date());
  const hydrationGoal = num(dash?.settings?.daily_hydration_litres) || 2.5;
  const burnedToday = isToday ? num(dash?.today_summary?.calories_today) : 0;

  /* ---------- selected day ---------- */
  const dayMeals = useMemo(
    () => meals.filter(m => m.meal_date === toDMY(selectedDate)),
    [meals, selectedDate]
  );

  const totals = useMemo(
    () => dayMeals.reduce(
      (a, m) => ({
        cal: a.cal + num(m.calories),
        p: a.p + num(m.protein_g),
        c: a.c + num(m.carbs_g),
        f: a.f + num(m.fat_g),
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    ),
    [dayMeals]
  );

  const remaining = {
    cal: Math.max(0, goals.calories - totals.cal),
    p: Math.max(0, goals.protein - totals.p),
    c: Math.max(0, goals.carbs - totals.c),
    f: Math.max(0, goals.fat - totals.f),
  };

  const pct = (value, goal) => (goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0);

  /* ---------- meal grouping + filters ---------- */
  const q = search.trim().toLowerCase();
  const visibleTypes = mealFilter === 'All' ? MEAL_TYPES : [mealFilter];

  const grouped = useMemo(
    () => MEAL_TYPES.map(type => {
      const all = dayMeals.filter(m => m.meal_type === type);
      const items = q ? all.filter(m => m.food_name.toLowerCase().includes(q)) : all;
      const t = all.reduce(
        (a, m) => ({ cal: a.cal + num(m.calories), p: a.p + num(m.protein_g), c: a.c + num(m.carbs_g), f: a.f + num(m.fat_g) }),
        { cal: 0, p: 0, c: 0, f: 0 }
      );
      return { type, all, items, t };
    }),
    [dayMeals, q]
  );

  /* ---------- weekly chart (7 days ending at selected date) ---------- */
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(selectedDate, i - 6);
      const dm = meals.filter(m => m.meal_date === toDMY(d));
      return {
        date: d,
        cal: dm.reduce((a, m) => a + num(m.calories), 0),
        count: dm.length,
      };
    });
  }, [meals, selectedDate]);
  const maxCal = Math.max(...weekData.map(d => d.cal), 1);

  /* ---------- weekly averages / stats ---------- */
  const weekStats = useMemo(() => {
    const days = weekData.map(d => {
      const dm = meals.filter(m => m.meal_date === toDMY(d.date));
      return {
        cal: dm.reduce((a, m) => a + num(m.calories), 0),
        p: dm.reduce((a, m) => a + num(m.protein_g), 0),
        count: dm.length,
      };
    });
    const logged = days.filter(d => d.count > 0);
    let streak = 0;
    for (const d of days) { if (d.count > 0) streak++; else break; }
    const avgCal = logged.length ? Math.round(logged.reduce((a, d) => a + d.cal, 0) / logged.length) : 0;
    const avgP = logged.length ? Math.round(logged.reduce((a, d) => a + d.p, 0) / logged.length) : 0;
    const wd = days.map((d, i) => ({ d, date: weekData[i].date })).filter(x => (waterByDate[toISO(x.date)] || []).length > 0);
    const avgWater = wd.length
      ? (wd.reduce((a, x) => a + (waterByDate[toISO(x.date)] || []).reduce((s, e) => s + num(e.amount_ml), 0), 0) / wd.length / 1000).toFixed(1)
      : '0.0';
    return { daysLogged: logged.length, avgCal, avgP, streak, avgWater };
  }, [meals, weekData, waterByDate]);

  /* ---------- hydration (server-backed with local fallback) ---------- */
  const waterEntries = waterByDate[toISO(selectedDate)] || [];
  const waterLoggedMl = waterEntries.reduce((a, e) => a + num(e.amount_ml), 0);
  const waterPct = Math.min(100, Math.round((waterLoggedMl / (hydrationGoal * 1000)) * 100));
  const waterLeft = Math.max(0, hydrationGoal * 1000 - waterLoggedMl) / 1000;
  const glassCount = Math.max(5, Math.ceil((hydrationGoal * 1000) / GLASS_ML));
  const filledGlasses = Math.floor(waterLoggedMl / GLASS_ML);

  const addWater = async amount => {
    const dateKey = toISO(selectedDate);
    if (waterServer) {
      try {
        await api.logWater({ log_date: dateKey, amount_ml: amount });
        await loadWater();
        flash('Water logged.');
        return;
      } catch {
        setWaterServer(false); // server unreachable — fall back to browser storage
      }
    }
    const entry = { id: `local-${dateKey}-${Date.now()}`, amount_ml: amount, time: isToday ? nowTime() : 'Water' };
    setWaterByDate(prev => {
      const next = { ...prev, [dateKey]: [...(prev[dateKey] || []), entry] };
      saveLocalWater(next);
      return next;
    });
    flash('Water logged (saved in this browser).');
  };

  const deleteWater = async entry => {
    const dateKey = toISO(selectedDate);
    if (waterServer && !String(entry.id || '').startsWith('local-')) {
      try {
        await api.deleteWater(entry.id);
        await loadWater();
        return;
      } catch { /* fall through to local removal */ }
    }
    setWaterByDate(prev => {
      const next = { ...prev, [dateKey]: (prev[dateKey] || []).filter(x => x !== entry) };
      saveLocalWater(next);
      return next;
    });
  };

  /* ---------- goals editor ---------- */
  const openGoals = () => { setGoalForm({ ...goals }); setShowGoals(true); };
  const saveGoals = async () => {
    const g = {
      calories: Math.max(0, num(goalForm.calories)),
      protein: Math.max(0, num(goalForm.protein)),
      carbs: Math.max(0, num(goalForm.carbs)),
      fat: Math.max(0, num(goalForm.fat)),
    };
    if (goalsServer) {
      try {
        const res = await api.updateNutritionGoals(g);
        setGoals(res.goals || g);
        setShowGoals(false);
        flash('Nutrition goals updated.');
        return;
      } catch {
        // server unreachable — fall back to browser storage
      }
    }
    try { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); } catch { /* storage unavailable */ }
    setGoals(g);
    setShowGoals(false);
    flash('Nutrition goals updated (saved in this browser).');
  };

  /* ---------- quick add ---------- */
  const openAdd = (mealType = 'Breakfast') => {
    setAddForm({ ...EMPTY_ADD, meal_type: mealType });
    setTimeout(() => addRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const submitAdd = async e => {
    e.preventDefault();
    setError('');
    if (!addForm.food_name.trim()) { setError('Food name is required.'); return; }
    if (addForm.calories === '' || num(addForm.calories) < 0) { setError('Calories must be a valid number.'); return; }
    try {
      await api.createMeal({
        meal_type: addForm.meal_type,
        food_name: addForm.food_name.trim(),
        calories: Math.round(num(addForm.calories)),
        protein_g: addForm.protein_g === '' ? undefined : num(addForm.protein_g),
        carbs_g: addForm.carbs_g === '' ? undefined : num(addForm.carbs_g),
        fat_g: addForm.fat_g === '' ? undefined : num(addForm.fat_g),
        meal_date: toISO(selectedDate),
      });
      setAddForm(EMPTY_ADD);
      flash('Meal added to your food diary.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteMeal = async id => {
    if (!window.confirm('Remove this food item from your diary?')) return;
    try {
      await api.deleteMeal(id);
      flash('Food item removed.');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  /* ---------- food database + barcode ---------- */
  const recentFoods = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const m of meals) {
      if (seen.has(m.food_name)) continue;
      seen.add(m.food_name);
      out.push(m.food_name);
      if (out.length >= 10) break;
    }
    return out;
  }, [meals]);

  const handleBarcodeFood = food => {
    setBarcodeOpen(false);
    setAddForm({
      food_name: food.name,
      meal_type: addForm.meal_type,
      calories: String(Math.round(num(food.calories))),
      protein_g: num(food.protein_g) ? String(num(food.protein_g)) : '',
      carbs_g: num(food.carbs_g) ? String(num(food.carbs_g)) : '',
      fat_g: num(food.fat_g) ? String(num(food.fat_g)) : '',
    });
    setTimeout(() => addRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    flash(`Barcode matched: ${food.name} — review and add to your log.`);
  };

  /* ---------- recommended next meal ---------- */
  const recSuggestions = useMemo(
    () => meals.filter(m => m.meal_date !== toDMY(selectedDate) && num(m.protein_g) >= 30),
    [meals, selectedDate]
  );

  const rec = useMemo(() => {
    if (recSuggestions.length) {
      const m = recSuggestions[recIndex % recSuggestions.length];
      return {
        title: m.food_name,
        desc: 'From your food diary · high in protein',
        kcal: Math.round(num(m.calories)),
        p: Math.round(num(m.protein_g)),
      };
    }
    if (remaining.p > 30) return { title: 'High-Protein Meal', desc: `Based on remaining protein goal (${Math.round(remaining.p)}g needed)`, kcal: 400, p: 45 };
    if (remaining.c > 50) return { title: 'Carb Recharge', desc: `Based on remaining carbohydrate goal (${Math.round(remaining.c)}g needed)`, kcal: 350, p: 12 };
    if (remaining.f > 20) return { title: 'Healthy Fat Option', desc: `Based on remaining fat goal (${Math.round(remaining.f)}g needed)`, kcal: 300, p: 10 };
    return { title: "Today's targets met", desc: 'All macro goals reached — great work!', kcal: 0, p: 0 };
  }, [recSuggestions, recIndex, remaining]);

  const intakeRows = [
    { label: 'Calories', value: totals.cal, goal: goals.calories, unit: 'kcal', barClass: '' },
    { label: 'Protein', value: totals.p, goal: goals.protein, unit: 'g', barClass: '' },
    { label: 'Carbohydrates', value: totals.c, goal: goals.carbs, unit: 'g', barClass: 'carbs' },
    { label: 'Fats', value: totals.f, goal: goals.fat, unit: 'g', barClass: 'fat' },
  ];

  const macroCards = [
    { label: 'Protein', value: totals.p, goal: goals.protein, unit: 'g', icon: 'nutrition', barClass: '' },
    { label: 'Carbohydrates', value: totals.c, goal: goals.carbs, unit: 'g', icon: 'activity', barClass: 'carbs' },
    { label: 'Fats', value: totals.f, goal: goals.fat, unit: 'g', icon: 'droplet', barClass: 'fat' },
  ];

  return (
    <div className="app-page">

      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Nutrition Tracking</h1>
          <p className="page-subtitle">{fmtLong(selectedDate)} · Log meals and monitor your daily intake</p>
        </div>

        <div className="nutrition-toolbar">
          <div className="date-nav">
            <button title="Previous day" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
              <Icon name="chevronLeft" size={14} />
            </button>
            <span>{fmtShort(selectedDate)}</span>
            <button title="Next day" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
          {!isToday && (
            <button className="button button-outline button-sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </button>
          )}
          <button className="button button-dark button-sm" onClick={() => openAdd()}>
            <Icon name="plus" size={13} /> Log Meal
          </button>
        </div>
      </div>

      {/* FEEDBACK */}
      {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}
      {success && (
        <div className="alert" style={{ marginBottom: 16, background: '#ecfdf5', color: '#047857' }}>
          {success}
        </div>
      )}

      {loading ? (
        <div className="alert" style={{ marginTop: 16 }}>Loading your nutrition diary…</div>
      ) : (
        <>
          {/* DAILY CALORIE SUMMARY BANNER */}
          <div className="calorie-banner">
            <div className="calorie-banner-left">
              <div className="calorie-banner-icon">
                <Icon name="flame" size={20} />
              </div>
              <div>
                <div>
                  <span className="calorie-banner-badge">Today's Summary</span>{' '}
                  <span style={{ fontSize: 12, color: '#a3a3a3' }}>{fmtShort(selectedDate)}</span>
                </div>
                <h2 className="calorie-banner-title">Daily Calorie Goal</h2>
                <p className="calorie-banner-sub">
                  Caloric target: {goals.calories.toLocaleString()} kcal · Remaining: {remaining.cal.toLocaleString()} kcal
                </p>
              </div>
            </div>

            <div className="calorie-banner-stats">
              <div className="calorie-stat">
                <div className="calorie-stat-value">{totals.cal.toLocaleString()}</div>
                <div className="calorie-stat-label">Consumed (kcal)</div>
                <div className="calorie-stat-progress"><div style={{ width: `${pct(totals.cal, goals.calories)}%` }} /></div>
              </div>
              <div className="calorie-stat">
                <div className="calorie-stat-value">{goals.calories.toLocaleString()}</div>
                <div className="calorie-stat-label">Goal (kcal)</div>
              </div>
              <div className="calorie-stat">
                <div className="calorie-stat-value">{remaining.cal.toLocaleString()}</div>
                <div className="calorie-stat-label">Remaining</div>
              </div>
              <div className="calorie-stat">
                <div className="calorie-stat-value">{burnedToday ? burnedToday.toLocaleString() : '—'}</div>
                <div className="calorie-stat-label">Burned (Exercise)</div>
              </div>
            </div>

            <div className="calorie-banner-actions">
              <button
                className={`banner-btn ${weeklyView ? 'solid' : ''}`}
                onClick={() => setWeeklyView(v => !v)}
              >
                <Icon name="chart" size={13} /> Weekly View
              </button>
              <button className="banner-btn solid" onClick={() => openAdd()}>
                <Icon name="plus" size={13} /> Add Food
              </button>
            </div>
          </div>

          {/* WEEKLY CHART TOGGLE */}
          {weeklyView && (
            <section className="card weekly-chart-card">
              <div className="section-head">
                <div>
                  <h2 className="section-title">Last 7 Days · Calories Consumed</h2>
                  <p className="section-description">Daily intake ending {fmtShort(selectedDate)}</p>
                </div>
              </div>
              <div className="weekly-chart">
                {weekData.map(d => {
                  const isSel = isSameDay(d.date, selectedDate);
                  return (
                    <div className="weekly-chart-col" key={toISO(d.date)}>
                      <div className="weekly-chart-bar-wrap">
                        {d.cal > 0 && <span className="weekly-chart-value">{d.cal}</span>}
                        <div
                          className={`weekly-chart-bar ${d.cal > 0 ? 'filled' : ''} ${isSel ? 'today-bar' : ''}`}
                          style={{ height: `${Math.max(4, (d.cal / maxCal) * 70)}px` }}
                        />
                      </div>
                      <span className={`weekly-chart-label ${isSel ? 'today' : ''}`}>
                        {d.date.toLocaleDateString('en-AU', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* MACRO + HYDRATION ROW */}
          <div className="macro-row">
            {macroCards.map(m => (
              <MacroCard key={m.label} {...m} remaining={remaining} pct={pct} />
            ))}

            <div className="macro-card">
              <div className="macro-card-head">
                <div className="macro-card-title">
                  <div className="macro-card-icon"><Icon name="water" size={14} /></div>
                  Hydration
                </div>
                <button className="hydration-add-btn" onClick={() => setWaterOpen(o => !o)}>+ Add</button>
              </div>
              <div className="macro-card-main">
                <span className="macro-card-value">{(waterLoggedMl / 1000).toFixed(1)}</span>
                <span className="macro-card-goal">/ {hydrationGoal}L goal</span>
              </div>
              <div className="macro-card-bar hydration"><div style={{ width: `${waterPct}%` }} /></div>
              <div className="hydration-dots">
                {Array.from({ length: glassCount }, (_, i) => (
                  <span key={i} className={`hydration-dot ${i < filledGlasses ? 'filled' : ''}`}>
                    <Icon name="droplet" size={8} />
                  </span>
                ))}
                <span className="macro-card-remaining" style={{ marginLeft: 4 }}>
                  {waterLeft.toFixed(1)}L left
                </span>
              </div>
              {waterOpen && (
                <div className="water-amounts">
                  {WATER_CHOICES.map(ml => (
                    <button key={ml} className="water-amount-btn" onClick={() => addWater(ml)}>
                      + {ml}ml
                    </button>
                  ))}
                  {!waterServer && <span className="water-logged-note">saved in this browser</span>}
                </div>
              )}
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="nutrition-layout">

            {/* LEFT COLUMN */}
            <div className="nutrition-main">
              <div className="meals-head">
                <h2>Today's Meals</h2>
                <div className="meals-tools">
                  <select value={mealFilter} onChange={e => setMealFilter(e.target.value)}>
                    <option value="All">All Meals</option>
                    {MEAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="search-food">
                    <Icon name="search" size={13} />
                    <input placeholder="Search food" value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>
              </div>

              {visibleTypes.map(type => {
                const g = grouped.find(x => x.type === type);
                const mealGoal = Math.round(goals.calories * MEAL_GOAL_SHARE[type]);
                const time = g.all[0] ? String(g.all[0].created_at || '').slice(0, 10) === toISO(selectedDate) ? fmtTime(g.all[0].created_at) : '' : '';
                return (
                  <MealCard
                    key={type}
                    type={type}
                    items={g.items}
                    allCount={g.all.length}
                    totals={g.t}
                    mealGoal={mealGoal}
                    time={time}
                    isToday={isToday}
                    onAdd={() => openAdd(type)}
                    onDelete={deleteMeal}
                  />
                );
              })}

              {/* QUICK ADD */}
              <div ref={addRef} className="quick-add" id="quick-add">
                <div>
                  <h3 className="quick-add-title"><Icon name="plus" size={14} /> Quick Add Food Item</h3>
                  <p className="nutrition-note" style={{ marginTop: 4 }}>Logged straight to your food diary for {fmtShort(selectedDate)}.</p>
                </div>

                {/* FOOD DATABASE SEARCH */}
                <FoodSearch
                  dateISO={toISO(selectedDate)}
                  mealType={addForm.meal_type}
                  onLogged={msg => { flash(msg); load(); }}
                />

                {recentOpen && recentFoods.length > 0 && (
                  <div className="recent-foods">
                    <span className="recent-foods-label">Recently logged</span>
                    {recentFoods.map(name => (
                      <button
                        key={name}
                        type="button"
                        className="recent-food"
                        onClick={() => { setAddForm({ ...addForm, food_name: name }); setRecentOpen(false); }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={submitAdd}>
                  <div className="quick-add-grid" style={{ marginBottom: 12 }}>
                    <label>
                      Food Name
                      <input
                        type="text"
                        placeholder="e.g. Grilled Chicken Breast"
                        value={addForm.food_name}
                        onChange={e => setAddForm({ ...addForm, food_name: e.target.value })}
                        required
                      />
                    </label>
                    <label>
                      Meal Type
                      <select value={addForm.meal_type} onChange={e => setAddForm({ ...addForm, meal_type: e.target.value })}>
                        {MEAL_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="quick-add-grid four" style={{ marginBottom: 12 }}>
                    <label>
                      Calories (kcal)
                      <input type="number" min="0" placeholder="0" value={addForm.calories} onChange={e => setAddForm({ ...addForm, calories: e.target.value })} required />
                    </label>
                    <label>
                      Protein (g)
                      <input type="number" min="0" step=".1" placeholder="0" value={addForm.protein_g} onChange={e => setAddForm({ ...addForm, protein_g: e.target.value })} />
                    </label>
                    <label>
                      Carbs (g)
                      <input type="number" min="0" step=".1" placeholder="0" value={addForm.carbs_g} onChange={e => setAddForm({ ...addForm, carbs_g: e.target.value })} />
                    </label>
                    <label>
                      Fat (g)
                      <input type="number" min="0" step=".1" placeholder="0" value={addForm.fat_g} onChange={e => setAddForm({ ...addForm, fat_g: e.target.value })} />
                    </label>
                  </div>
                  <div className="quick-add-foot">
                    <button className="button button-outline" type="button" onClick={() => setBarcodeOpen(true)}>
                      <Icon name="search" size={13} /> Scan Barcode
                    </button>
                    <button className="button button-outline" type="button" onClick={() => setRecentOpen(o => !o)}>
                      <Icon name="bookmark" size={13} /> Recent Foods
                    </button>
                    <button className="button button-dark" type="submit">
                      <Icon name="plus" size={13} /> Add to Log
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="nutrition-side">

              {/* DAILY INTAKE */}
              <section className="card card-pad">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Daily Intake</h2>
                    <p className="section-description">Progress against your goals</p>
                  </div>
                  <button className="button button-outline button-sm" onClick={openGoals}>Edit Goals</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {intakeRows.map(r => (
                    <div className="intake-row" key={r.label}>
                      <div className="intake-row-head">
                        <span>{r.label}</span>
                        <span>{Math.round(r.value).toLocaleString()} / {r.goal.toLocaleString()} {r.unit}</span>
                      </div>
                      <div className={`intake-bar ${r.barClass}`}>
                        <div style={{ width: `${pct(r.value, r.goal)}%` }} />
                      </div>
                      <span className="intake-remaining">
                        {pct(r.value, r.goal)}% · {Math.max(0, r.goal - r.value).toLocaleString()} {r.unit} remaining
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* HYDRATION LOG */}
              <section className="card card-pad">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Hydration Log</h2>
                    <p className="section-description">Daily water intake</p>
                  </div>
                  <button className="button button-dark button-sm" onClick={() => setWaterOpen(o => !o)}>
                    <Icon name="plus" size={12} /> Log Water
                  </button>
                </div>

                <div className="hydration-summary">
                  <div className="hydration-summary-icon"><Icon name="water" size={18} /></div>
                  <div className="hydration-summary-copy">
                    <div className="hydration-summary-value">
                      {(waterLoggedMl / 1000).toFixed(1)} <span>L of {hydrationGoal}L</span>
                    </div>
                    <div className="hydration-summary-bar"><div style={{ width: `${waterPct}%` }} /></div>
                  </div>
                </div>

                {waterOpen && (
                  <div className="water-amounts" style={{ marginTop: 10 }}>
                    {WATER_CHOICES.map(ml => (
                      <button key={ml} className="water-amount-btn" onClick={() => addWater(ml)}>+ {ml}ml</button>
                    ))}
                    {!waterServer && <span className="water-logged-note">saved in this browser</span>}
                  </div>
                )}

                <div className="hydration-list" style={{ marginTop: 6 }}>
                  {waterEntries.length ? waterEntries.slice().reverse().map(e => (
                    <div className="hydration-entry" key={e.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name="droplet" size={12} />
                        <span>{e.time} — Water</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{e.amount_ml}ml</span>
                        <button className="food-item-delete" title="Remove" onClick={() => deleteWater(e)}>
                          <Icon name="trash" size={11} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="nutrition-note" style={{ padding: '10px 0' }}>
                      No water logged for this day yet.
                    </div>
                  )}
                </div>
              </section>

              {/* NUTRITION SUMMARY */}
              <section className="card card-pad">
                <div className="section-head">
                  <div>
                    <h2 className="section-title">Nutrition Summary</h2>
                    <p className="section-description">Weekly averages</p>
                  </div>
                </div>
                <div className="stat-grid-2">
                  <div className="stat-cell"><span>Avg. Calories</span><strong>{weekStats.avgCal.toLocaleString()} kcal</strong></div>
                  <div className="stat-cell"><span>Days Logged</span><strong>{weekStats.daysLogged} / 7</strong></div>
                  <div className="stat-cell"><span>Avg. Protein</span><strong>{weekStats.avgP} g</strong></div>
                  <div className="stat-cell"><span>Avg. Water</span><strong>{weekStats.avgWater} L</strong></div>
                  <div className="stat-cell"><span>Goal Streak</span><strong>{weekStats.streak} day{weekStats.streak === 1 ? '' : 's'}</strong></div>
                  <div className="stat-cell">
                    <span>Net Calories</span>
                    <strong>{Math.max(0, weekStats.avgCal - burnedToday).toLocaleString()} kcal</strong>
                  </div>
                </div>
                <Link to="/analytics" className="button button-outline button-full" style={{ marginTop: 12 }}>
                  <Icon name="chart" size={13} /> View Full Nutrition Report
                </Link>
              </section>

              {/* RECOMMENDED NEXT MEAL */}
              <section className="card card-pad">
                <div className="section-head">
                  <div>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="lightbulb" size={14} /> Recommended Next Meal
                    </h2>
                  </div>
                </div>
                <div className="recommendation-box">
                  <div className="recommendation-icon"><Icon name="utensils" size={14} /></div>
                  <div className="recommendation-copy">
                    <strong>{rec.title}</strong>
                    <span>{rec.desc}</span>
                    <div className="recommendation-meta">
                      <span>~{rec.kcal} kcal</span>
                      <span>·</span>
                      <span>{rec.p}g protein</span>
                    </div>
                  </div>
                </div>
                <button
                  className="button button-outline button-full"
                  style={{ marginTop: 12 }}
                  onClick={() => setRecIndex(i => i + 1)}
                >
                  <Icon name="sparkles" size={13} /> Get More Suggestions
                </button>
              </section>

            </div>
          </div>

          {/* BACKEND COVERAGE NOTE — only shown when server endpoints are unavailable */}
          {(!goalsServer || !waterServer) && (
            <div className="alert" style={{ marginTop: 20 }}>
              <Icon name="info" size={14} /> Meal logging is stored on the server.
              {!goalsServer && ' Daily calorie/macro goals are saved in this browser because the nutrition-goals endpoint is unavailable.'}
              {!waterServer && ' Water tracking is saved in this browser because the water-log endpoint is unavailable.'}
            </div>
          )}
        </>
      )}

      {/* GOALS MODAL */}
      {showGoals && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowGoals(false); }}>
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Nutrition Goals</h3>
              <button className="modal-close" onClick={() => setShowGoals(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="nutrition-note" style={{ margin: 0 }}>
                These targets drive your daily calorie and macro progress.
                {!goalsServer && ' They are stored in this browser because the nutrition-goals endpoint is unavailable.'}
              </p>
              <div className="quick-add-grid four">
                <label className="field">
                  <span className="field-label">Calories (kcal)</span>
                  <input type="number" min="0" value={goalForm.calories} onChange={e => setGoalForm({ ...goalForm, calories: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Protein (g)</span>
                  <input type="number" min="0" value={goalForm.protein} onChange={e => setGoalForm({ ...goalForm, protein: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Carbs (g)</span>
                  <input type="number" min="0" value={goalForm.carbs} onChange={e => setGoalForm({ ...goalForm, carbs: e.target.value })} />
                </label>
                <label className="field">
                  <span className="field-label">Fat (g)</span>
                  <input type="number" min="0" value={goalForm.fat} onChange={e => setGoalForm({ ...goalForm, fat: e.target.value })} />
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button button-outline" onClick={() => setShowGoals(false)}>Cancel</button>
              <button className="button button-dark" onClick={saveGoals}>Save Goals</button>
            </div>
          </div>
        </div>
      )}

      {/* BARCODE SCAN MODAL */}
      {barcodeOpen && (
        <BarcodeScanModal
          onClose={() => setBarcodeOpen(false)}
          onFoodFound={handleBarcodeFood}
        />
      )}
    </div>
  );
}

/* ============================================================
   SUB-COMPONENTS
============================================================ */

function MacroCard({ label, value, goal, unit, icon, barClass, remaining, pct }) {
  return (
    <div className="macro-card">
      <div className="macro-card-head">
        <div className="macro-card-title">
          <div className="macro-card-icon"><Icon name={icon} size={14} /></div>
          {label}
        </div>
        <span className="macro-card-unit">{unit}</span>
      </div>
      <div className="macro-card-main">
        <span className="macro-card-value">{Math.round(value)}</span>
        <span className="macro-card-goal">/ {goal}{unit} goal</span>
      </div>
      <div className={`macro-card-bar ${barClass}`}><div style={{ width: `${pct(value, goal)}%` }} /></div>
      <span className="macro-card-remaining">
        {Math.round(remaining[label === 'Carbohydrates' ? 'c' : label === 'Fats' ? 'f' : 'p'])}g remaining
      </span>
    </div>
  );
}

function MealCard({ type, items, allCount, totals, mealGoal, time, isToday, onAdd, onDelete }) {
  const icon = MEAL_ICONS[type];
  const p = pctOf(totals.cal, mealGoal);
  return (
    <div className={`meal-card ${type === 'Snack' ? 'snacks' : ''}`}>
      <div className="meal-card-head">
        <div className="meal-card-title">
          <div className="meal-card-icon"><Icon name={icon} size={15} /></div>
          <div>
            <h3 className="meal-card-name">{type}</h3>
            <p className="meal-card-meta">
              {isToday && time ? `${time} · ` : ''}{allCount} item{allCount === 1 ? '' : 's'} logged
            </p>
          </div>
        </div>
        <div className="meal-card-right">
          <div className="meal-card-cal">
            <strong>{Math.round(totals.cal)} kcal</strong>
            <span>of {mealGoal} goal</span>
          </div>
          <button className="button button-outline button-sm" onClick={onAdd}>
            <Icon name="plus" size={12} /> Add
          </button>
        </div>
      </div>
      <div className={`meal-card-progress ${p < 100 ? (p < 40 ? 'low' : 'mid') : ''}`}>
        <div style={{ width: `${p}%` }} />
      </div>

      {allCount ? (
        <>
          <div className="food-list">
            {items.length ? items.map(m => (
              <div className="food-item" key={m.meal_id}>
                <div className="food-item-icon"><Icon name="nutrition" size={12} /></div>
                <span className="food-item-name">{m.food_name}</span>
                <div className="food-item-macros">
                  <span>P: {num(m.protein_g)}g</span>
                  <span>C: {num(m.carbs_g)}g</span>
                  <span>F: {num(m.fat_g)}g</span>
                </div>
                <span className="food-item-cal">{num(m.calories)} kcal</span>
                <button className="food-item-delete" title="Remove" onClick={() => onDelete(m.meal_id)}>
                  <Icon name="trash" size={12} />
                </button>
              </div>
            )) : (
              <div className="snacks-empty" style={{ margin: '8px 0' }}>
                No items match your search.
              </div>
            )}
          </div>
          <div className="meal-macro-footer">
            <div className="meal-macro-cell"><span>Protein</span><strong>{Math.round(totals.p)}g</strong></div>
            <div className="meal-macro-cell"><span>Carbs</span><strong>{Math.round(totals.c)}g</strong></div>
            <div className="meal-macro-cell"><span>Fat</span><strong>{Math.round(totals.f)}g</strong></div>
          </div>
        </>
      ) : (
        <div className="snacks-empty">
          {type === 'Snack' ? 'No snacks logged yet' : `No ${type.toLowerCase()} logged yet`}
        </div>
      )}
    </div>
  );
}

function pctOf(value, goal) {
  return goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
}

/* ============================================================
   FOOD DATABASE SEARCH + BARCODE SCAN
============================================================ */

function FoodSearch({ dateISO, mealType, onLogged }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [servings, setServings] = useState(1);
  const [err, setErr] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [custom, setCustom] = useState(EMPTY_CUSTOM);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return undefined; }
    setLoading(true);
    setErr('');
    const t = setTimeout(async () => {
      try {
        const res = await api.foods({ q: term });
        setResults(res.foods || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const logFood = async (food, servingsCount) => {
    const s = Math.max(1, num(servingsCount));
    try {
      await api.createMeal({
        meal_type: mealType,
        food_name: food.name,
        calories: Math.round(num(food.calories) * s),
        protein_g: num(food.protein_g) * s,
        carbs_g: num(food.carbs_g) * s,
        fat_g: num(food.fat_g) * s,
        meal_date: dateISO,
      });
      onLogged(`Added "${food.name}" (${s} × ${food.serving_size}${food.serving_unit || ''}) to ${mealType}.`);
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveCustom = async e => {
    e.preventDefault();
    setErr('');
    if (!custom.name.trim() || num(custom.calories) <= 0) {
      setErr('Custom food needs a name and a calorie value.');
      return;
    }
    try {
      const payload = {
        name: custom.name.trim(),
        barcode: custom.barcode.trim() || undefined,
        category: custom.category.trim() || undefined,
        serving_size: custom.serving_size === '' ? undefined : num(custom.serving_size),
        serving_unit: custom.serving_unit.trim() || undefined,
        calories: Math.round(num(custom.calories)),
        protein_g: custom.protein_g === '' ? undefined : num(custom.protein_g),
        carbs_g: custom.carbs_g === '' ? undefined : num(custom.carbs_g),
        fat_g: custom.fat_g === '' ? undefined : num(custom.fat_g),
      };
      await api.createFood(payload);
      await logFood({
        name: payload.name,
        serving_size: payload.serving_size ?? null,
        serving_unit: payload.serving_unit ?? null,
        calories: payload.calories,
        protein_g: payload.protein_g ?? 0,
        carbs_g: payload.carbs_g ?? 0,
        fat_g: payload.fat_g ?? 0,
      }, 1);
      setShowCustom(false);
      setCustom(EMPTY_CUSTOM);
      setQ(payload.name);
    } catch (e2) {
      setErr(e2.message);
    }
  };

  const showResults = q.trim().length >= 2;

  return (
    <div className="food-search">
      <div className="food-search-head">
        <div className="search-food food-search-input">
          <Icon name="search" size={13} />
          <input
            placeholder="Search the food database…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <label className="food-servings">
          Servings
          <input type="number" min="1" value={servings} onChange={e => setServings(e.target.value)} />
        </label>
      </div>

      {loading && <div className="nutrition-note" style={{ marginTop: 8 }}>Searching…</div>}
      {err && <div className="nutrition-note food-search-error" style={{ marginTop: 8 }}>{err}</div>}

      {showResults && !loading && (
        results.length ? (
          <div className="food-results">
            {results.map(f => (
              <div className="food-result" key={f.food_id}>
                <div className="food-result-main">
                  <strong>{f.name}</strong>
                  <span className="food-result-meta">
                    {f.category || 'Food'} · {f.serving_size}{f.serving_unit || ''} · {f.calories} kcal ·
                    P {num(f.protein_g)}g · C {num(f.carbs_g)}g · F {num(f.fat_g)}g
                  </span>
                </div>
                <button className="button button-dark button-sm" type="button" onClick={() => logFood(f, servings)}>
                  <Icon name="plus" size={12} /> Add
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="nutrition-note" style={{ marginTop: 8 }}>
            No foods match “{q}”.{' '}
            <button className="link-btn" type="button" onClick={() => setShowCustom(true)}>
              Add it as a custom food
            </button>
          </div>
        )
      )}

      {showCustom && (
        <form className="custom-food-form" onSubmit={saveCustom}>
          <div className="quick-add-grid" style={{ marginBottom: 10 }}>
            <label>
              Name
              <input type="text" placeholder="e.g. My Protein Bar" value={custom.name} onChange={e => setCustom({ ...custom, name: e.target.value })} required />
            </label>
            <label>
              Barcode (optional)
              <input type="text" placeholder="e.g. 9300633554015" value={custom.barcode} onChange={e => setCustom({ ...custom, barcode: e.target.value })} />
            </label>
          </div>
          <div className="quick-add-grid four" style={{ marginBottom: 10 }}>
            <label>
              Calories
              <input type="number" min="0" placeholder="0" value={custom.calories} onChange={e => setCustom({ ...custom, calories: e.target.value })} required />
            </label>
            <label>
              Protein (g)
              <input type="number" min="0" step=".1" placeholder="0" value={custom.protein_g} onChange={e => setCustom({ ...custom, protein_g: e.target.value })} />
            </label>
            <label>
              Carbs (g)
              <input type="number" min="0" step=".1" placeholder="0" value={custom.carbs_g} onChange={e => setCustom({ ...custom, carbs_g: e.target.value })} />
            </label>
            <label>
              Fat (g)
              <input type="number" min="0" step=".1" placeholder="0" value={custom.fat_g} onChange={e => setCustom({ ...custom, fat_g: e.target.value })} />
            </label>
          </div>
          <div className="quick-add-foot">
            <button className="button button-dark button-sm" type="submit">
              <Icon name="plus" size={12} /> Save & Add to Log
            </button>
            <button className="button button-outline button-sm" type="button" onClick={() => setShowCustom(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function BarcodeScanModal({ onClose, onFoodFound }) {
  const videoRef = useRef(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('Starting camera…');
  const [camError, setCamError] = useState('');
  const [lookup, setLookup] = useState('idle'); // idle | searching | found | notfound | error
  const [food, setFood] = useState(null);

  const searchCode = async value => {
    const c = (value || '').trim();
    if (!c) return;
    setCode(c);
    setLookup('searching');
    try {
      const res = await api.foodByBarcode(c);
      setFood(res.food);
      setLookup('found');
    } catch (e) {
      setFood(null);
      setLookup(e.status === 404 ? 'notfound' : 'error');
    }
  };

  useEffect(() => {
    let reader = null;
    let controls = null;
    let finished = false;
    const el = videoRef.current;
    if (!el) return undefined;

    (async () => {
      try {
        // Loaded lazily so the barcode decoder only downloads when scanning.
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } },
          el,
          (result) => {
            if (result && !finished) {
              finished = true;
              try { controls && controls.stop(); } catch { /* already stopped */ }
              setStatus('Barcode detected — looking up food…');
              searchCode(result.getText());
            }
          }
        );
        setStatus('Point the camera at a barcode…');
      } catch (e) {
        setCamError('Camera unavailable — use the manual barcode field below instead.');
        setStatus('');
      }
    })();

    return () => {
      finished = true;
      try { reader && reader.reset(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const manualSubmit = e => {
    e.preventDefault();
    searchCode(code);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <h3>Scan Barcode</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <video ref={videoRef} className="barcode-video" muted playsInline />
          {status && <div className="barcode-status">{status}</div>}
          {camError && <div className="barcode-status barcode-error">{camError}</div>}

          <form onSubmit={manualSubmit}>
            <label className="field">
              <span className="field-label">Or type the barcode</span>
              <div className="barcode-manual">
                <input
                  type="text"
                  placeholder="e.g. 9300633554015"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
                <button className="button button-outline button-sm" type="submit">Look up</button>
              </div>
            </label>
          </form>

          {lookup === 'searching' && <div className="nutrition-note">Looking up barcode…</div>}
          {lookup === 'notfound' && (
            <div className="barcode-status barcode-error">
              No food in the database matches this barcode.
            </div>
          )}
          {lookup === 'error' && (
            <div className="barcode-status barcode-error">
              Could not look up this barcode. Please try again.
            </div>
          )}
          {lookup === 'found' && food && (
            <div className="barcode-found">
              <div className="food-result-main">
                <strong>{food.name}</strong>
                <span className="food-result-meta">
                  {food.category || 'Food'} · {food.serving_size}{food.serving_unit || ''} · {food.calories} kcal ·
                  P {num(food.protein_g)}g · C {num(food.carbs_g)}g · F {num(food.fat_g)}g
                </span>
              </div>
              <button className="button button-dark button-full" type="button" onClick={() => onFoodFound(food)}>
                <Icon name="plus" size={13} /> Add to Log
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
