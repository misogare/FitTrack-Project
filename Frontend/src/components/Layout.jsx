// src/components/Layout.jsx
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="app-page dashboard-content">
        <Navbar />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}