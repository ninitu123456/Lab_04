import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PeopleLayout from './PeopleLayout';
import { people } from '../data/people';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/people" element={<PeopleLayout people={people} />}>
          <Route index element={<p>Index outlet</p>} />
          <Route path=":id" element={<p>Detail outlet</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('PeopleLayout', () => {
  it('renders one NavLink per person pointing to /people/:id', () => {
    renderAt('/people');
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(people.length);
    expect(links[0]).toHaveAttribute('href', `/people/${people[0].id}`);
  });

  it('marks the current person link as active', () => {
    renderAt(`/people/${people[1].id}`);
    const active = screen.getByRole('link', { name: people[1].name });
    expect(active).toHaveClass('active-link');
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: people[0].name })).toHaveClass('link');
  });

  it('renders child routes through <Outlet />', () => {
    renderAt(`/people/${people[0].id}`);
    expect(screen.getByText('Detail outlet')).toBeInTheDocument();
  });
});