import { useMemo, useState } from 'react';
import { FormContext } from './FormContext';
import { InputField } from './InputField';
import { ShowData } from './ShowData';
import { FORM_FIELDS } from './formFields';
import { INITIAL_VALUES, validateForm } from './validation';

// Snapshot an toàn để hiển thị: ẩn password, bỏ confirmPassword
const toSubmittedSnapshot = (values) => ({
  fullName: values.fullName.trim(),
  email: values.email.trim(),
  age: Number(values.age),
  password: '•'.repeat(values.password.length),
});

export const SimpleForm = () => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

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
    if (!isValid) {
      setSubmittedData(null);
      return;
    }
    setSubmittedData(toSubmittedSnapshot(values));
  };

  return (
    <section className="form-page">
      <h1>Context Form Engine</h1>
      <p className="placeholder">Validation runs synchronously during render — one keystroke, one render pass.</p>

      <FormContext.Provider
        value={{ values, errors, touched, submitAttempted, handleChange, handleBlur }}
      >
        <form className="simple-form" noValidate onSubmit={handleSubmit}>
          {FORM_FIELDS.map((field) => (
            <InputField key={field.name} {...field} />
          ))}
          <button type="submit">Submit</button>
        </form>
      </FormContext.Provider>

      {submittedData && <ShowData data={submittedData} />}
    </section>
  );
};