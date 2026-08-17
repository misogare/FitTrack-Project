import { Link, NavLink, useNavigate } from 'react-router-dom';
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
  const handleLogout = async () => { await logout(); navigate('/'); };

  if (publicPage) {
    return (
      <header className="site-header public-header">
        <div className="site-header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark">ϟ</span><span>FitTrack</span>
          </Link>
          <nav className="public-nav">
            <a href="/#features">Features</a><a href="/#how-it-works">How It Works</a><a href="/#pricing">Pricing</a><a href="/#about">About</a>
          </nav>
          <div className="header-actions"><Link className="button button-light button-sm" to="/login"><Icon name="user" size={13}/> Log In</Link><Link className="button button-dark button-sm" to="/register"><Icon name="plus" size={13}/> Sign Up</Link></div>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header app-header">
      <div className="site-header-inner">
        <Link className="brand" to="/dashboard"><span className="brand-mark">ϟ</span><span>FitTrack</span></Link>
        <nav className="app-nav">
          {navItems.map(([to, label, icon]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>{label}</NavLink>)}
        </nav>
        <div className="user-menu"><button className="user-chip" onClick={() => navigate('/profile')}><span className="avatar">{user?.first_name?.[0] || 'A'}</span><span>{user?.first_name || 'Account'}</span><span className="chevron">⌄</span></button><button className="icon-button" title="Log out" onClick={handleLogout}><Icon name="logout" size={15}/></button></div>
      </div>
    </header>
  );
}
