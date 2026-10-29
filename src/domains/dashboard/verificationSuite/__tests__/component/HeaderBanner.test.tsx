import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import HeaderBanner from '../../components/HeaderBanner';

describe('HeaderBanner Component', () => {
  it('renders the heading and descriptive text', () => {
    render(<HeaderBanner />);

    expect(
      screen.getByText('One Click Instant Verification. Operate with Trust.')
    ).toBeInTheDocument();
    expect(screen.getByText(/comprehensive suite of verification/i)).toBeInTheDocument();
  });

  it('renders the header image', () => {
    render(<HeaderBanner />);

    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
  });
});
