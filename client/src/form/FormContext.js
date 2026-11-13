import { createContext, useContext } from 'react';

// 1. Context initialization
export const FormContext = createContext(null);

// 2. Custom hook abstraction — chặn việc dùng sai ngoài Provider
export function useFormContext() {
  const ctx = useContext(FormContext);
  if (ctx === null) {
    throw new Error('useFormContext must be used within <FormContext.Provider>');
  }
  return ctx;
}