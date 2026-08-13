import './App.css';

function App() {
  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">FitTrack</p>
        <h1>Track your health, workouts, and goals.</h1>
        <p className="subtitle">
          A starter app for fitness planning with Australian-friendly formatting and a responsive dashboard.
        </p>
        <div className="cta-row">
          <button type="button">Get Started</button>
          <button type="button" className="secondary">View Dashboard</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Workouts</span>
          <strong>12</strong>
        </div>
        <div className="stat-card">
          <span>Calories</span>
          <strong>1,420</strong>
        </div>
        <div className="stat-card">
          <span>Goals</span>
          <strong>4 active</strong>
        </div>
      </section>
    </main>
  );
}

export default App;
