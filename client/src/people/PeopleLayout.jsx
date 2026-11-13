import { NavLink, Outlet } from 'react-router';

export default function PeopleLayout({ people = [] }) {
  return (
    <div className="people-frame">
      <nav className="sidebar" aria-label="People directory">
        {people.map((p) => (
          <NavLink
            key={p.id}
            to={`/people/${p.id}`}
            className={({ isActive }) => (isActive ? 'active-link' : 'link')}
          >
            {p.name}
          </NavLink>
        ))}
      </nav>

      {/* Layout frame: child routes render here */}
      <section className="content-area">
        <Outlet />
      </section>
    </div>
  );
}