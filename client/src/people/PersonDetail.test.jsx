import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import PersonDetail from './PersonDetail';
import { people } from '../data/people';

function renderDetail(id) {
  return render(
    <MemoryRouter initialEntries={[`/people/${id}`]}>
      <Routes>
        <Route path="/people/:id" element={<PersonDetail people={people} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('PersonDetail', () => {
  it('extracts the id with useParams and renders a semantic <dl>', () => {
    const person = people[2];
    const { container } = renderDetail(person.id);
    const dl = container.querySelector('dl.person-details');
    expect(dl).not.toBeNull();
    expect(within(dl).getByText('Name').tagName).toBe('DT');
    expect(within(dl).getByText(person.name).tagName).toBe('DD');
    expect(within(dl).getByText(person.role)).toBeInTheDocument();
    expect(within(dl).getByText(person.email)).toBeInTheDocument();
  });

  it('renders a 404 alert when the id does not exist', () => {
    renderDetail('khong-ton-tai');
    expect(screen.getByRole('alert')).toHaveTextContent('404');
  });
});