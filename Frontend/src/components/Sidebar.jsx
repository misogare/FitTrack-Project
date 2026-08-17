// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const links = [
  { to: '/dashboard', icon: 'home', label: 'Dashboard' },
  { to: '/workouts', icon: 'activity', label: 'Activity Tracking' },
  { to: '/plans', icon: 'workout', label: 'Workout Plans' },
  { to: '/nutrition', icon: 'nutrition', label: 'Nutrition Tracking' },
  { to: '/analytics', icon: 'progress', label: 'Progress Analytics' },
];

const bottomLinks = [
  { to: '/goals', icon: 'goal', label: 'Goals' },
  { to: '/profile', icon: 'user', label: 'Profile' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-label">NAVIGATION</div>
      {links.map(link => (
        <Link key={link.to} className={`sidebar-link ${isActive(link.to)}`} to={link.to}>
          <Icon name={link.icon}/> {link.label}
        </Link>
      ))}
      <div className="sidebar-divider"/>
      {bottomLinks.map(link => (
        <Link key={link.to} className={`sidebar-link ${isActive(link.to)}`} to={link.to}>
          <Icon name={link.icon}/> {link.label}
        </Link>
      ))}
      <div className="sidebar-user">
        <span className="avatar">{user?.first_name?.[0] || 'A'}</span>
        <div>
          <strong>{user?.first_name || 'Account'}</strong>
          <span>Active member</span>
        </div>
      </div>
    </aside>
  );
}