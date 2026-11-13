import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PersonDetailSkeleton from './PersonDetailSkeleton';
import { PERSON_FIELDS } from './personFields';

describe('PersonDetailSkeleton', () => {
  it('announces the loading state accessibly', () => {
    render(<PersonDetailSkeleton />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('renders one placeholder row per detail field by default', () => {
    const { container } = render(<PersonDetailSkeleton />);
    expect(container.querySelectorAll('.skeleton-row')).toHaveLength(PERSON_FIELDS.length);
  });
});