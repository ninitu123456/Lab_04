import { describe, it, expect } from 'vitest';
import { validateForm, INITIAL_VALUES } from './validation';

const VALID = {
  fullName: 'Nguyễn Ngọc Thiên Tú',
  email: 'tu@example.com',
  age: '20',
  password: 'secret123',
  confirmPassword: 'secret123',
};

describe('validateForm (synchronous, pure)', () => {
  it('returns no errors for a fully valid form', () => {
    expect(validateForm(VALID)).toEqual({});
  });

  it('flags every field as required on the initial empty form', () => {
    expect(validateForm(INITIAL_VALUES)).toEqual({
      fullName: 'Full name is required',
      email: 'Email is required',
      age: 'Age is required',
      password: 'Password is required',
      confirmPassword: 'Please confirm your password',
    });
  });

  it('rejects a full name shorter than 2 characters after trimming', () => {
    expect(validateForm({ ...VALID, fullName: '  A ' }).fullName)
      .toBe('Full name must be at least 2 characters');
  });

  it('rejects a malformed email', () => {
    expect(validateForm({ ...VALID, email: 'tu@' }).email).toBe('Email is invalid');
  });

  it.each(['15', '101', '20.5', 'abc'])('rejects age "%s"', (age) => {
    expect(validateForm({ ...VALID, age }).age)
      .toBe('Age must be an integer between 16 and 100');
  });

  it('rejects a weak password', () => {
    const message = 'Password must be at least 8 characters and contain a number';
    expect(validateForm({ ...VALID, password: 'abcdefgh', confirmPassword: 'abcdefgh' }).password).toBe(message);
    expect(validateForm({ ...VALID, password: 'abc1', confirmPassword: 'abc1' }).password).toBe(message);
  });

  it('cross-validates confirmPassword against password', () => {
    expect(validateForm({ ...VALID, confirmPassword: 'secret124' }).confirmPassword)
      .toBe('Passwords do not match');
  });

  it('does not mutate its input', () => {
    const input = { ...VALID };
    validateForm(input);
    expect(input).toEqual(VALID);
  });
});