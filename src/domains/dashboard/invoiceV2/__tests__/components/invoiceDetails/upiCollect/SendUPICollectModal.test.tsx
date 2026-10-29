import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import SendUPICollectModal from '../../../../components/invoiceDetails/upiCollect/SendUPICollectModal';

vi.mock('../../../../hooks/invoiceDetails/useUpiCollect', () => ({
    default: () => ({
        sendUpiRequest: vi.fn(),
        cancelRequest: vi.fn(),
        sendReminder: vi.fn(),
        retryPayment: vi.fn(),
        pollPaymentStatus: vi.fn(),
    }),
}));

vi.mock('../../../../components/invoiceDetails/upiCollect/UPICollectForm', () => ({
    default: () => <div data-testid="upi-form-step" />,
}));

vi.mock('../../../../components/invoiceDetails/upiCollect/PaymentRequest', () => ({
    default: () => <div data-testid="upi-pending-step" />,
}));

vi.mock('../../../../components/invoiceDetails/upiCollect/PaymentSuccess', () => ({
    default: () => <div data-testid="upi-success-step" />,
}));

vi.mock('../../../../components/invoiceDetails/upiCollect/PaymentFailed', () => ({
    default: () => <div data-testid="upi-failed-step" />,
}));

describe('SendUPICollectModal', () => {
    it('renders the form step initially when open', () => {
        render(<SendUPICollectModal open onCancel={vi.fn()} onSuccess={vi.fn()} />);
        expect(screen.getByTestId('upi-form-step')).toBeInTheDocument();
    });

    it('does not render any step when closed', () => {
        render(<SendUPICollectModal open={false} onCancel={vi.fn()} onSuccess={vi.fn()} />);
        expect(screen.queryByTestId('upi-form-step')).not.toBeInTheDocument();
    });
});
