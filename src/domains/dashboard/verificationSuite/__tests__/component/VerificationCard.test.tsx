import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import VerificationCard from '../../components/VerificationCard';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
  useAppDispatch: () => mockDispatch,
}));

vi.mock('@src/slices/apiSlice', () => ({
  showToast: (payload: any) => ({ type: 'toast/show', payload }),
}));

vi.mock('../../components/PanVerifyModal', () => ({
  default: ({ title }: any) => <div data-testid="pan-verify-modal">{title}</div>,
}));

describe('VerificationCard Component', () => {
  const defaultProps = {
    title: 'PAN Verification',
    desc: 'Verify PAN details instantly',
    logo: 'logo.png',
    inputComponents: [],
    accessKeys: 'pan_verify',
    serviceName: 'pan_verify',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title, description and Verify Now button', () => {
    render(<VerificationCard {...defaultProps} />);

    expect(screen.getByText('PAN Verification')).toBeInTheDocument();
    expect(screen.getByText('Verify PAN details instantly')).toBeInTheDocument();
    expect(screen.getByText('Verify Now')).toBeInTheDocument();
    expect(screen.queryByTestId('pan-verify-modal')).not.toBeInTheDocument();
  });

  it('opens the verify modal when not exhausted and Verify Now is clicked', () => {
    render(<VerificationCard {...defaultProps} exhausted={false} />);

    fireEvent.click(screen.getByText('Verify Now'));

    expect(screen.getByTestId('pan-verify-modal')).toBeInTheDocument();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('dispatches an exhausted-limit toast instead of opening the modal when exhausted', () => {
    render(<VerificationCard {...defaultProps} exhausted maxLimit={5} />);

    fireEvent.click(screen.getByText('Verify Now'));

    expect(screen.queryByTestId('pan-verify-modal')).not.toBeInTheDocument();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'toast/show',
      payload: {
        description: "You've used all 5 verification requests. Purchase an add-on or upgrade to continue.",
        variant: 'error',
      },
    });
  });

  it('shows the plan-not-included message when exhausted with a zero max limit', () => {
    render(<VerificationCard {...defaultProps} exhausted maxLimit={0} />);

    fireEvent.click(screen.getByText('Verify Now'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'toast/show',
      payload: {
        description:
          "Your plan doesn't include verification services. Upgrade or purchase an add-on to continue.",
        variant: 'error',
      },
    });
  });
});
