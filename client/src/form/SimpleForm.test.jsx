import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimpleForm } from './SimpleForm';
import simpleFormSource from './SimpleForm.jsx?raw';
import inputFieldSource from './InputField.jsx?raw';

const VALID = {
  'Full name': 'Nguyễn Ngọc Thiên Tú',
  Email: 'tu@example.com',
  Age: '20',
  Password: 'secret123',
  'Confirm password': 'secret123',
};

async function fill(user, overrides = {}) {
  for (const [label, value] of Object.entries({ ...VALID, ...overrides })) {
    await user.type(screen.getByLabelText(label), value);
  }
}

describe('SimpleForm (context-driven engine)', () => {
  it('shows no errors before the user interacts', () => {
    render(<SimpleForm />);
    expect(screen.queryAllByRole('alert')).toHaveLength(0);
  });

  it('validates a field synchronously after it is blurred', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await user.click(screen.getByLabelText('Email'));
    await user.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');

    // tab() đã đưa focus sang Age rồi blur → Age touched và hiện lỗi đúng contract §7.4,
    // nên chỉ kiểm tra lỗi của Email biến mất
    await user.type(screen.getByLabelText('Email'), 'tu@example.com');
    expect(screen.queryByText('Email is required')).toBeNull();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('reveals every error when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getAllByRole('alert')).toHaveLength(5);
    expect(screen.queryByRole('heading', { name: /submitted data/i })).toBeNull();
  });

  it('cross-validates confirm password against password', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await fill(user, { 'Confirm password': 'secret124' });
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Passwords do not match');
  });

  it('renders the <ShowData /> inspector on valid submit without leaking the password', async () => {
    const user = userEvent.setup();
    render(<SimpleForm />);
    await fill(user);
    await user.click(screen.getByRole('button', { name: /submit/i }));

    const heading = screen.getByRole('heading', { name: /submitted data/i });
    const inspector = heading.closest('section');
    expect(within(inspector).getByText('tu@example.com')).toBeInTheDocument();
    expect(within(inspector).queryByText('secret123')).toBeNull();
    expect(within(inspector).queryByText('confirmPassword')).toBeNull();
  });

  it('contains zero useEffect calls (synchronous derived validation)', () => {
    expect(simpleFormSource).not.toMatch(/useEffect/);
    expect(inputFieldSource).not.toMatch(/useEffect/);
  });
});