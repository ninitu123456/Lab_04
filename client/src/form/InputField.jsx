import { useId } from 'react';
import { useFormContext } from './FormContext';

export const InputField = ({ name, label, type = 'text', ...props }) => {
  // 1. Stable unique id cho label ↔ input ↔ error message
  const id = useId();
  const errorId = `${id}-error`;

  // 2. Đọc state từ context — không giữ state cục bộ, không đồng bộ ngược lên cha
  const { values, errors, touched, submitAttempted, handleChange, handleBlur } = useFormContext();

  // 3. Lỗi hiển thị là derived value, tính ngay trong render
  const error = touched[name] || submitAttempted ? errors[name] : undefined;

  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        value={values[name] ?? ''}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <span id={errorId} className="field-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};