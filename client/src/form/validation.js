export const INITIAL_VALUES = {
  fullName: '',
  email: '',
  age: '',
  password: '',
  confirmPassword: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INTEGER_PATTERN = /^\d+$/;

// Mỗi rule nhận (value, allValues) và trả về message lỗi hoặc '' nếu hợp lệ.
export const FORM_RULES = {
  fullName: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Full name is required';
    if (trimmed.length < 2) return 'Full name must be at least 2 characters';
    return '';
  },

  email: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email is required';
    if (!EMAIL_PATTERN.test(trimmed)) return 'Email is invalid';
    return '';
  },

  age: (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Age is required';
    const age = Number(trimmed);
    if (!INTEGER_PATTERN.test(trimmed) || age < 16 || age > 100) {
      return 'Age must be an integer between 16 and 100';
    }
    return '';
  },

  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8 || !/\d/.test(value)) {
      return 'Password must be at least 8 characters and contain a number';
    }
    return '';
  },

  // Cross-field rule: phụ thuộc vào password, vẫn tính đồng bộ, không cần useEffect
  confirmPassword: (value, allValues) => {
    if (!value) return 'Please confirm your password';
    if (value !== allValues.password) return 'Passwords do not match';
    return '';
  },
};

/**
 * Pure, synchronous validation — safe to call during render.
 * @returns {Record<string, string>} chỉ chứa các field đang lỗi
 */
export function validateForm(values, rules = FORM_RULES) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule(values[field] ?? '', values);
    if (message) errors[field] = message;
  }
  return errors;
}