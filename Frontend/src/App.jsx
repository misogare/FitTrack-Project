import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import Login from './pages/Login';
import Nutrition from './pages/Nutrition';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Workouts from './pages/Workouts';
import Plans from './pages/Plans';
import Analytics from './pages/Analytics';
import ForgotPassword from './pages/ForgotPassword';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
