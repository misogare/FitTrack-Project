import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const navItems = [
  ['/dashboard', 'Dashboard', 'home'],
  ['/workouts', 'Activity', 'activity'],
  ['/plans', 'Workouts', 'workout'],
  ['/nutrition', 'Nutrition', 'nutrition'],
  ['/analytics', 'Progress', 'progress'],
  ['/goals', 'Goals', 'goal'],
];

export default function Navbar({ publicPage = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/');
  };

  if (publicPage) {
    return (
      <header className="site-header public-header">
        <div className="site-header-inner">

          <Link className="brand" to="/">
            <span className="brand-mark">ϟ</span>
            <span>FitTrack</span>
          </Link>

          <nav className="public-nav">
            <a href="/#features">Features</a>
            <a href="/#how-it-works">How It Works</a>
            <a href="/#pricing">Pricing</a>
            <a href="/#about">About</a>
          </nav>

          <div className="header-actions">
            <Link
              className="button button-light button-sm"
              to="/login"
            >
              <Icon name="user" size={13} />
              Log In
            </Link>

            <Link
              className="button button-dark button-sm"
              to="/register"
            >
              <Icon name="plus" size={13} />
              Sign Up
            </Link>
          </div>

        </div>
      </header>
    );
  }

  const firstName = user?.first_name || 'Account';
  const lastName = user?.last_name || '';

  const initials =
    `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`
      .toUpperCase() || 'A';

  return (
    <header className="site-header app-header">

      <div className="site-header-inner">

        {/* BRAND */}
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">ϟ</span>
          <span>FitTrack</span>
        </Link>

        {/* TOP NAVIGATION */}
        <nav className="app-nav">
          {navItems.map(([to, label, icon]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? 'active' : ''
              }
            >
              <Icon name={icon} size={15} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* USER AREA */}
        <div className="user-area" ref={profileRef}>

          <button
            type="button"
            className={`user-chip ${profileOpen ? 'open' : ''}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >

            <span className="avatar">
              {initials}
            </span>

            <span className="user-name">
              {firstName}
            </span>

            <span
              className={`chevron ${
                profileOpen ? 'chevron-up' : ''
              }`}
            >
            
            </span>

          </button>

          {/* DROPDOWN */}
          {profileOpen && (
            <div className="profile-dropdown">

              <div className="profile-dropdown-header">

                <div className="avatar avatar-large">
                  {initials}
                </div>

                <div className="profile-summary">
                  <strong>
                    {firstName} {lastName}
                  </strong>

                  <span>
                    {user?.email || 'Account'}
                  </span>

                  <small>
                    {user?.plan_tier || 'FitTrack Member'}
                  </small>
                </div>

              </div>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
              >
                <Icon name="user" size={16} />
                <span>My Profile</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
              >
                <Icon name="settings" size={16} />
                <span>Settings</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings#privacy-policy');
                }}
              >
                <Icon name="lock" size={16} />
                <span>Privacy & Data</span>
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item logout-item"
                onClick={handleLogout}
              >
                <Icon name="logout" size={16} />
                <span>Log out</span>
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}