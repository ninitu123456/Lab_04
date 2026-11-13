import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { ShowData } from './ShowData';

describe('ShowData', () => {
  it('renders each key/value pair as <dt>/<dd> inside a semantic <dl>', () => {
    const { container } = render(
      <ShowData data={{ fullName: 'Tú', age: 20, active: true }} />
    );
    expect(screen.getByRole('heading', { name: /submitted data/i })).toBeInTheDocument();

    const dl = container.querySelector('dl.json-inspector');
    expect(dl).not.toBeNull();
    expect(dl.querySelectorAll('.data-row')).toHaveLength(3);
    expect(within(dl).getByText('fullName').tagName).toBe('DT');
    expect(within(dl).getByText('20').tagName).toBe('DD');
    expect(within(dl).getByText('true').tagName).toBe('DD');
  });
});