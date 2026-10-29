import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import VerificationTextCard from '../../components/VerificationTextCard';

describe('VerificationTextCard Component', () => {
  it('renders both label and value when provided', () => {
    render(<VerificationTextCard label="Status" value="Active" />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('does not render a label when label is omitted', () => {
    render(<VerificationTextCard value="Active" />);

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders nothing crash-worthy when value is omitted', () => {
    const { container } = render(<VerificationTextCard label="Status" />);

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(container).toBeInTheDocument();
  });
});
