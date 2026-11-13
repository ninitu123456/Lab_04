import { Link } from 'react-router';

export default function NotFoundState({ id = '' }) {
  return (
    <div role="alert" className="not-found-state">
      <p><strong>404: Person Not Found</strong></p>
      <p>No record matches id “{id}”.</p>
      <Link to="/people">Back to directory</Link>
    </div>
  );
}