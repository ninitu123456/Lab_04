import { Link } from 'react-router';

export default function Home() {
  return (
    <section>
      <h1>Lab 04 — Multi-Route SPA</h1>
      <p>React 19 + React Router v7 master-detail directory.</p>
      <p><Link to="/people">Open the people directory →</Link></p>
    </section>
  );
}