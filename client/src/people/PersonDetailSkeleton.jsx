import { PERSON_FIELDS } from './personFields';

// Default parameter thay cho defaultProps (deprecated)
export default function PersonDetailSkeleton({ rows = PERSON_FIELDS.length }) {
  return (
    <div className="person-card skeleton" role="status" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading person details…</span>
      <span className="skeleton-bar skeleton-title" aria-hidden="true" />
      <div className="person-details" aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton-row">
            <span className="skeleton-bar skeleton-term" />
            <span className="skeleton-bar skeleton-value" />
          </div>
        ))}
      </div>
    </div>
  );
}