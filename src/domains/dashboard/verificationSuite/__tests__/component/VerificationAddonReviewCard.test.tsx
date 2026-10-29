import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import VerificationAddonReviewCard from '../../components/VerificationAddonReviewCard';

const handlePaytmPaymentRequest = vi.fn();
const loadCheckoutScript = vi.fn();

vi.mock('../../../payments/hooks/usePaymentApi', () => ({
  default: () => ({
    handlePaytmPaymentRequest,
    isLoading: false,
    loadCheckoutScript,
  }),
}));

vi.mock('../../../payments/hooks/useGetAllPaymentMode', () => ({
  default: () => ({ availablePgOptions: { gateway: { provider: null } } }),
}));

let mockPaymentState: any;

vi.mock('@src/hooks/store', () => ({
  useAppSelector: (selector: any) =>
    selector({
      reducer: {
        payment: mockPaymentState,
      },
    }),
}));

describe('VerificationAddonReviewCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPaymentState = {
      paymentSummary: [{ key: 'Discount', value: '₹ 10.00' }],
      totalAmount: 990,
      title: 'Verification Add-on',
      payload: { quantity: 5, amount: 1000 },
    };
  });

  it('renders the title, quantity and amounts', () => {
    render(<VerificationAddonReviewCard />);

    expect(screen.getByText('Verification Add-on')).toBeInTheDocument();
    expect(screen.getByText('5 Verifications')).toBeInTheDocument();
    expect(screen.getAllByText('₹ 1,000.00')).not.toHaveLength(0);
    expect(screen.getByText('Discount')).toBeInTheDocument();
    expect(screen.getByText('₹ 990.00')).toBeInTheDocument();
  });

  it('falls back to the default title when none is provided', () => {
    mockPaymentState.title = '';
    render(<VerificationAddonReviewCard />);

    expect(screen.getByText('Verification Suite')).toBeInTheDocument();
  });

  it('calls loadCheckoutScript on mount', () => {
    render(<VerificationAddonReviewCard />);

    expect(loadCheckoutScript).toHaveBeenCalled();
  });

  it('calls handlePaytmPaymentRequest when Pay Now is clicked', () => {
    render(<VerificationAddonReviewCard />);

    fireEvent.click(screen.getByText('Pay Now'));

    expect(handlePaytmPaymentRequest).toHaveBeenCalledWith({
      isChecked: false,
      balance: 0,
      gateway: null,
    });
  });
});
