import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FormContext, useFormContext } from './FormContext';

describe('FormContext', () => {
  it('exposes the provider value through useFormContext()', () => {
    const value = { values: {}, errors: {} };
    const wrapper = ({ children }) => (
      <FormContext.Provider value={value}>{children}</FormContext.Provider>
    );
    const { result } = renderHook(() => useFormContext(), { wrapper });
    expect(result.current).toBe(value);
  });

  it('throws a descriptive error when used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useFormContext())).toThrow(/useFormContext must be used within/);
    spy.mockRestore();
  });
});