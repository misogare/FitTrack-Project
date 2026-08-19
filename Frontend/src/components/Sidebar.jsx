import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const sidebarItems = [
  ['/dashboard', 'Dashboard', 'home'],
  ['/workouts', 'Activity', 'activity'],
  ['/plans', 'Workouts', 'workout'],
  ['/nutrition', 'Nutrition', 'nutrition'],
  ['/analytics', 'Progress', 'progress'],
  ['/goals', 'Goals', 'goal'],
  ['/settings', 'Settings', 'settings'],
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const planTier =
    user?.plan_tier ||
    user?.plan ||
    user?.subscription_tier ||
    'Standard';

  return (
    <aside className="app-sidebar">

      {/* USER PROFILE */}
      <div className="sidebar-profile">

        <button
          className="sidebar-profile-button"
          onClick={() => navigate('/profile')}
          type="button"
        >
          <span className="sidebar-avatar">
            {user?.first_name?.[0]?.toUpperCase() || 'A'}
          </span>

          <span className="sidebar-user-details">
            <strong>
              {user?.first_name || 'Account'}
            </strong>

            <span>
              {planTier} Plan
            </span>
          </span>

          <span className="sidebar-profile-arrow">
            ›
          </span>
        </button>

      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-navigation">

        <div className="sidebar-section-label">
          MENU
        </div>

        {sidebarItems.map(([to, label, icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon name={icon} size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">

        <button
          className="sidebar-logout"
          onClick={handleLogout}
          type="button"
        >
          <span className="sidebar-logout-icon">
            <Icon name="logout" size={17} />
          </span>

          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}