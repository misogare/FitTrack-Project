import { useEffect, useState } from 'react';
import Icon from '../components/Icon';
import { api } from '../services/api';

export default function ExerciseTable({ planItemId, canEdit = true }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [showSwap, setShowSwap] = useState(null);
  const [library, setLibrary] = useState([]);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [filterMG, setFilterMG] = useState('All');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.planExercises(planItemId);
      setExercises(data.exercises || []);
    } catch { setExercises([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [planItemId]);

  useEffect(() => {
    if (showAdd || showSwap) {
      api.exerciseLibrary({ muscle_group: filterMG, q: query })
        .then(d => setLibrary(d.exercises || []))
        .catch(() => {});
      api.muscleGroups().then(d => setMuscleGroups(d.muscle_groups || [])).catch(() => {});
    }
  }, [filterMG, query, showAdd, showSwap]);

  const startEdit = (ex) => {
    setEditingId(ex.plan_exercise_id);
    setDraft({
      sets: ex.sets ?? '',
      reps: ex.reps ?? '',
      weight_kg: ex.weight_kg ?? '',
      rest_seconds: ex.rest_seconds ?? '',
    });
  };

  const saveEdit = async (id) => {
    try {
      setSaving(true);
      await api.updatePlanExercise(id, {
        sets: draft.sets === '' ? null : Number(draft.sets),
        reps: draft.reps || null,
        weight_kg: draft.weight_kg === '' ? null : Number(draft.weight_kg),
        rest_seconds: draft.rest_seconds === '' ? null : Number(draft.rest_seconds),
      });
      setEditingId(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this exercise?')) return;
    try { await api.deletePlanExercise(id); await load(); }
    catch (e) { alert(e.message); }
  };

  const addExercise = async (exerciseId) => {
    try {
      setSaving(true);
      await api.addPlanExercise(planItemId, { exercise_id: exerciseId });
      setShowAdd(false);
      await load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const doSwap = async (exerciseId) => {
    try {
      setSaving(true);
      await api.swapPlanExercise(showSwap, exerciseId);
      setShowSwap(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="exercise-empty">Loading exercises…</div>;

  if (!exercises.length) {
    return (
      <div className="exercise-empty">
        No exercises in this session yet.{' '}
        {canEdit && (
          <button className="button button-outline button-sm" onClick={() => { setFilterMG('All'); setQuery(''); setShowAdd(true); }}>
            <Icon name="plus" /> Add Exercise
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="exercise-table">
      <div className="exercise-row header">
        <div>#</div>
        <div>Exercise</div>
        <div>Sets</div>
        <div>Reps</div>
        <div>Weight</div>
        <div>Rest</div>
        <div style={{ textAlign: 'right' }}>Status</div>
      </div>

      {exercises.map((ex, i) => (
        <div className="exercise-row data" key={ex.plan_exercise_id}>
          <div className="exercise-index">{String(i + 1).padStart(2, '0')}</div>

          <div className="exercise-name">
            <div className="exercise-name-icon"><Icon name="activity" size={14} /></div>
            <div className="exercise-name-text">
              <span className="exercise-name-title">{ex.name}</span>
              <span className="exercise-name-meta">{ex.category} · {ex.muscle_group}</span>
            </div>
          </div>

          {editingId === ex.plan_exercise_id ? (
            <>
              <input
                className="exercise-input"
                type="number" min="1"
                value={draft.sets}
                onChange={e => setDraft({ ...draft, sets: e.target.value })}
              />
              <input
                className="exercise-input"
                type="text"
                value={draft.reps}
                onChange={e => setDraft({ ...draft, reps: e.target.value })}
              />
              <input
                className="exercise-input"
                type="number" step="0.5"
                value={draft.weight_kg}
                onChange={e => setDraft({ ...draft, weight_kg: e.target.value })}
              />
              <input
                className="exercise-input"
                type="number"
                value={draft.rest_seconds}
                onChange={e => setDraft({ ...draft, rest_seconds: e.target.value })}
              />
              <div className="exercise-cell actions">
                <button className="icon-button" disabled={saving} onClick={() => saveEdit(ex.plan_exercise_id)}>
                  <Icon name="check" size={13} />
                </button>
                <button className="icon-button" onClick={() => setEditingId(null)}>
                  ✕
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="exercise-cell" data-label="Sets">{ex.sets ?? '—'}</div>
              <div className="exercise-cell" data-label="Reps">{ex.reps ?? '—'}</div>
              <div className="exercise-cell" data-label="Weight">{ex.weight_kg != null ? `${ex.weight_kg} kg` : 'Bodyweight'}</div>
              <div className="exercise-cell" data-label="Rest">{ex.rest_seconds != null ? `${ex.rest_seconds} sec` : '—'}</div>
              <div className="exercise-cell actions">
                {canEdit && (
                  <>
                    <button className="icon-button" title="Edit" onClick={() => startEdit(ex)}>
                      <Icon name="edit" size={13} />
                    </button>
                    <button className="icon-button" title="Swap" onClick={() => { setShowSwap(ex.plan_exercise_id); setFilterMG('All'); setQuery(''); }}>
                      ⇄
                    </button>
                    <button className="icon-button" title="Remove" onClick={() => remove(ex.plan_exercise_id)}>
                      <Icon name="trash" size={13} />
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {canEdit && (
        <div style={{ marginTop: 8 }}>
          <button className="button button-outline button-sm" onClick={() => { setFilterMG('All'); setQuery(''); setShowAdd(true); }}>
            <Icon name="plus" /> Add Exercise
          </button>
        </div>
      )}

      {(showAdd || showSwap) && (
        <LibraryPicker
          title={showAdd ? 'Add Exercise' : 'Swap Exercise'}
          library={library}
          muscleGroups={muscleGroups}
          filterMG={filterMG}
          setFilterMG={setFilterMG}
          query={query}
          setQuery={setQuery}
          onClose={() => { setShowAdd(false); setShowSwap(null); }}
          onPick={showAdd ? addExercise : doSwap}
          saving={saving}
        />
      )}
    </div>
  );
}

function LibraryPicker({ title, library, muscleGroups, filterMG, setFilterMG, query, setQuery, onClose, onPick, saving }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="section-title">{title}</h3>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <select value={filterMG} onChange={e => setFilterMG(e.target.value)}>
              <option value="All">All</option>
              {muscleGroups.map(mg => <option key={mg} value={mg}>{mg}</option>)}
            </select>
          </div>

          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {library.length ? library.map(ex => (
              <div
                key={ex.exercise_id}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', borderBottom: '1px solid #f0f1f3', cursor: 'pointer',
                }}
                onClick={() => !saving && onPick(ex.exercise_id)}
              >
                <div>
                  <strong style={{ fontSize: 13 }}>{ex.name}</strong>
                  <div style={{ fontSize: 11, color: '#a3a3a3' }}>{ex.category} · {ex.muscle_group}</div>
                </div>
                <Icon name="plus" size={13} />
              </div>
            )) : <div className="exercise-empty">No exercises found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}