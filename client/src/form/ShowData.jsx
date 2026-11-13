import { useId } from 'react';

// Semantic JSON state inspector — thay cho việc dump JSON.stringify không có cấu trúc
export const ShowData = ({ data = {} }) => {
  const headingId = useId();

  return (
    <section className="inspector" aria-labelledby={headingId}>
      <h2 id={headingId}>Submitted data</h2>
      <dl className="json-inspector">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="data-row">
            <dt>{key}</dt>
            <dd>{String(val)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};