import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import PeopleLayout from './people/PeopleLayout';
import PeopleIndex from './people/PeopleIndex';
import PersonDetailSkeleton from './people/PersonDetailSkeleton';
import { SimpleForm } from './form/SimpleForm';
import { people } from './data/people';

// Route-level code splitting (Ex 1.2)
const PersonDetail = lazy(() => import('./people/PersonDetail'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="people" element={<PeopleLayout people={people} />}>
          <Route index element={<PeopleIndex />} />
          <Route
            path=":id"
            element={
              <Suspense fallback={<PersonDetailSkeleton />}>
                <PersonDetail people={people} />
              </Suspense>
            }
          />
        </Route>
        <Route path="form" element={<SimpleForm />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}