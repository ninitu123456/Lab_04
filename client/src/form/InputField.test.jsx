import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormContext } from './FormContext';
import { InputField } from './InputField';

function renderField(ctx = {}) {
  const value = {
    values: { email: '' },
    errors: {},
    touched: {},
    submitAttempted: false,
    handleChange: vi.fn(),
    handleBlur: vi.fn(),
    ...ctx,
  };
  render(
    <FormContext.Provider value={value}>
      <InputField name="email" label="Email" type="email" />
    </FormContext.Provider>
  );
  return value;
}

describe('InputField', () => {
  it('binds <label> and <input> with a useId() generated id', () => {
    renderField();
    const input = screen.getByLabelText('Email');
    expect(input.id).not.toBe('');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('hides the error until the field is touched', () => {
    renderField({ errors: { email: 'Email is required' } });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });

  it('links a visible error with aria-invalid and aria-describedby once touched', () => {
    renderField({ errors: { email: 'Email is required' }, touched: { email: true } });
    const input = screen.getByLabelText('Email');
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Email is required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', alert.id);
  });

  it('reveals the error after a submit attempt even if untouched', () => {
    renderField({ errors: { email: 'Email is required' }, submitAttempted: true });
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
  });

  it('delegates change and blur events to the form context', async () => {
    const user = userEvent.setup();
    const ctx = renderField();
    await user.type(screen.getByLabelText('Email'), 'a');
    await user.tab();
    expect(ctx.handleChange).toHaveBeenCalled();
    expect(ctx.handleBlur).toHaveBeenCalled();
  });
});