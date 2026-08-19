import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div className="app-layout">

      <Navbar />

      <div className="app-body">

        <Sidebar />

        <main className="app-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
}