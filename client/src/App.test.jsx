import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App';
import { people } from './data/people';

const renderApp = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );

describe('App routes (React Router v7)', () => {
  it('renders the home page at /', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: /lab 04/i })).toBeInTheDocument();
  });

  it('renders the about page at /about', () => {
    renderApp('/about');
    expect(screen.getByRole('heading', { level: 1, name: /about/i })).toBeInTheDocument();
  });

  it('renders the people index at /people', () => {
    renderApp('/people');
    expect(screen.getByText(/select a person/i)).toBeInTheDocument();
  });

  it('renders a person dossier at /people/:id', async () => {
    renderApp(`/people/${people[0].id}`);
    expect(
      await screen.findByRole('heading', { level: 2, name: people[0].name })
    ).toBeInTheDocument();
  });

  it('renders a global 404 page for unknown paths', () => {
    renderApp('/khong-ton-tai');
    expect(screen.getByRole('heading', { level: 1, name: /404/ })).toBeInTheDocument();
  });

  it('renders the context form engine at /form', () => {
    renderApp('/form');
    expect(screen.getByRole('heading', { level: 1, name: /form engine/i })).toBeInTheDocument();
  });
});