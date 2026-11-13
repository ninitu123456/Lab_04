import { Fragment, useId } from 'react';
import { useParams } from 'react-router';
import NotFoundState from './NotFoundState';
import { PERSON_FIELDS } from './personFields';

export default function PersonDetail({ people = [] }) {
  // Safe URL param extraction
  const { id } = useParams();
  const titleId = useId();
  const person = people.find((p) => p.id === id);

  // Explicit 404 boundary guard
  if (!person) {
    return <NotFoundState id={id} />;
  }

  // Semantic definition list
  return (
    <article className="person-card" aria-labelledby={titleId}>
      <h2 id={titleId} className="detail-title">{person.name}</h2>
      <dl className="person-details">
        {PERSON_FIELDS.map(({ key, label }) => (
          <Fragment key={key}>
            <dt>{label}</dt>
            <dd>{person[key]}</dd>
          </Fragment>
        ))}
      </dl>
    </article>
  );
}