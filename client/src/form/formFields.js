// Single source of truth cho các field của form.
// Mỗi phần tử: name (khớp key trong values/FORM_RULES), label, và các props HTML bổ sung.
export const FORM_FIELDS = [
  { name: 'fullName', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'age', label: 'Age', inputMode: 'numeric' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
];