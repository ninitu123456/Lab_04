import { NavLink, Outlet } from 'react-router';
import { navClass } from '../utils/navClass';

export default function RootLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <span className="brand">UIT · Lab 04</span>
        <nav aria-label="Primary">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/people" className={navClass}>People</NavLink>
          <NavLink to="/form" className={navClass}>Form</NavLink>
          <NavLink to="/forum" className={navClass}>Forum</NavLink>
          <NavLink to="/about" className={navClass}>About</NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}