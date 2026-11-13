import { useMemo, useState } from 'react';
import { FormContext } from './FormContext';
import { InputField } from './InputField';
import { INITIAL_VALUES, validateForm } from './validation';

export const SimpleForm = () => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Synchronous derived validation in the render pass — zero effect waterfalls
  const errors = useMemo(() => validateForm(values), [values]);
  const isValid = Object.keys(errors).length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!isValid) return;
  };

  return (
    <section className="form-page">
      <h1>Context Form Engine</h1>
      <p className="placeholder">Validation runs synchronously during render — one keystroke, one render pass.</p>

      <FormContext.Provider
        value={{ values, errors, touched, submitAttempted, handleChange, handleBlur }}
      >
        <form className="simple-form" noValidate onSubmit={handleSubmit}>
          <InputField name="fullName" label="Full name" autoComplete="name" />
          <InputField name="email" label="Email" type="email" autoComplete="email" />
          <InputField name="age" label="Age" inputMode="numeric" />
          <InputField name="password" label="Password" type="password" autoComplete="new-password" />
          <InputField name="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" />
          <button type="submit">Submit</button>
        </form>
      </FormContext.Provider>
    </section>
  );
};