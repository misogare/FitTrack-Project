const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let data = {};
  try { data = await response.json(); } catch { /* empty response */ }
  if (!response.ok) {
    const message = data.message || data.errors?.[0]?.msg || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (payload) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  dashboard: () => request('/dashboard'),
  workouts: (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/workouts${suffix}`);
},

dailyWorkoutSummary: () => request('/workouts/daily-summary'),

createWorkout: (payload) => request('/workouts', { method: 'POST', body: JSON.stringify(payload) }),
updateWorkout: (id, payload) => request(`/workouts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
deleteWorkout: (id) => request(`/workouts/${id}`, { method: 'DELETE' }),
  meals: () => request('/meals'),
  createMeal: (payload) => request('/meals', { method: 'POST', body: JSON.stringify(payload) }),
  deleteMeal: (id) => request(`/meals/${id}`, { method: 'DELETE' }),
  // Nutrition goals (server-backed)
  nutritionGoals: () => request('/nutrition/goals'),
  updateNutritionGoals: (payload) => request('/nutrition/goals', { method: 'PUT', body: JSON.stringify(payload) }),
  // Water / hydration log (server-backed)
  waterLog: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/nutrition/water${suffix}`);
  },
  logWater: (payload) => request('/nutrition/water', { method: 'POST', body: JSON.stringify(payload) }),
  deleteWater: (id) => request(`/nutrition/water/${id}`, { method: 'DELETE' }),
  // Food database (search + barcode)
  foods: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request(`/foods${suffix}`);
  },
  foodByBarcode: (code) => request(`/foods/barcode/${encodeURIComponent(code)}`),
  createFood: (payload) => request('/foods', { method: 'POST', body: JSON.stringify(payload) }),
  deleteFood: (id) => request(`/foods/${id}`, { method: 'DELETE' }),
  goals: () => request('/goals'),
  createGoal: (payload) => request('/goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoalProgress: (payload) => request('/goals/progress', { method: 'POST', body: JSON.stringify(payload) }),
  goalProgress: (id) => request(`/goals/${id}/progress`),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
  plans:        () => request('/plans'),
activePlan:   () => request('/plans/active'),
getPlan:      (id) => request(`/plans/${id}`),
createPlan:   (payload) => request('/plans', { method: 'POST', body: JSON.stringify(payload) }),
activatePlan: (id) => request(`/plans/${id}/activate`, { method: 'PATCH' }),
updatePlanStatus: (id, status) =>
  request(`/plans/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
deletePlan:   (id) => request(`/plans/${id}`, { method: 'DELETE' }),
startPlanWorkout: (planItemId, payload = {}) =>
  request(`/plans/${planItemId}/start`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
planStats:    (id) => request(`/plans/${id}/stats`),
// Exercise library
exerciseLibrary: (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return request(`/plans/exercises/library${suffix}`);
},
muscleGroups: () => request('/plans/exercises/muscle-groups'),

// Plan item exercises
planExercises: (planItemId) => request(`/plans/${planItemId}/exercises`),
addPlanExercise: (planItemId, payload) =>
  request(`/plans/${planItemId}/exercises`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }),
updatePlanExercise: (id, payload) =>
  request(`/plans/exercise/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }),
swapPlanExercise: (id, exerciseId) =>
  request(`/plans/exercise/${id}/swap`, {
    method: 'PATCH',
    body: JSON.stringify({ exercise_id: exerciseId }),
  }),
  updatePlan: (id, payload) =>
  request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
deletePlanExercise: (id) =>
  request(`/plans/exercise/${id}`, { method: 'DELETE' }),
};
