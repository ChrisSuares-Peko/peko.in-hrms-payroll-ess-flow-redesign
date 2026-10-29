import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import VerificationCountTag from '../../components/VerificationCountTag';

describe('VerificationCountTag Component', () => {
  it('renders the verification count', () => {
    render(<VerificationCountTag count={5} onClick={vi.fn()} selected={false} />);

    expect(screen.getByText('5 Verifications')).toBeInTheDocument();
  });

  it('applies the selected styling class when selected is true', () => {
    render(<VerificationCountTag count={10} onClick={vi.fn()} selected />);

    expect(screen.getByText('10 Verifications')).toHaveClass('border-red-500');
  });

  it('calls onClick when the tag is clicked', () => {
    const onClick = vi.fn();
    render(<VerificationCountTag count={1} onClick={onClick} selected={false} />);

    fireEvent.click(screen.getByText('1 Verifications'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
