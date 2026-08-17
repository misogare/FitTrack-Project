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
  workouts: () => request('/workouts'),
  createWorkout: (payload) => request('/workouts', { method: 'POST', body: JSON.stringify(payload) }),
  deleteWorkout: (id) => request(`/workouts/${id}`, { method: 'DELETE' }),
  meals: () => request('/meals'),
  createMeal: (payload) => request('/meals', { method: 'POST', body: JSON.stringify(payload) }),
  deleteMeal: (id) => request(`/meals/${id}`, { method: 'DELETE' }),
  goals: () => request('/goals'),
  createGoal: (payload) => request('/goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoalProgress: (payload) => request('/goals/progress', { method: 'POST', body: JSON.stringify(payload) }),
  goalProgress: (id) => request(`/goals/${id}/progress`),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),
};
