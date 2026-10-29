import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import CollectPaymentModal from '../../../components/collectPayment/CollectPaymentModal';

vi.mock('../../../constants/collectPayment', () => ({
    COLLECT_PAYMENT_STEP_META: {
        options: { title: 'Collect Payment', subtitle: 'Choose method' },
        'send-link': { title: 'Send Payment Link', subtitle: 'desc' },
        upi: { title: 'UPI', subtitle: 'desc' },
        record: { title: 'Record', subtitle: 'desc' },
        'payment-link-created': { title: 'Created', subtitle: 'desc' },
        'payment-received': { title: 'Received', subtitle: 'desc' },
    },
    COLLECT_PAYMENT_SUCCESS_STEPS: ['payment-link-created', 'payment-received'],
}));

vi.mock('../../../components/collectPayment/CollectPaymentOptions', () => ({
    default: () => <div data-testid="options" />,
}));

vi.mock('../../../components/collectPayment/PaymentReceived', () => ({
    default: () => <div data-testid="received" />,
}));

vi.mock('../../../components/collectPayment/RecordManually', () => ({
    default: () => <div data-testid="record" />,
}));

vi.mock('../../../components/collectPayment/UpiCollect', () => ({
    default: () => <div data-testid="upi" />,
}));

vi.mock('../../../components/onboarding/OnboardingModal', () => ({
    default: () => null,
}));

vi.mock('../../../components/shared/PaymentLinkCreated', () => ({
    default: () => <div data-testid="link-created" />,
}));

vi.mock('../../../components/shared/SendPaymentLink', () => ({
    default: () => <div data-testid="send-link" />,
}));

const baseProps = {
    open: true,
    onClose: vi.fn(),
    invoice: { id: '1', invoiceNumber: 'INV-1', name: 'Arshid', amountDue: '500' } as any,
    onStepChange: vi.fn(),
    resolveOnboardingStatus: vi.fn(),
};

// CollectPaymentModal calls useNavigate for the onboarding redirect, so it needs a Router.
const renderWithRouter = (ui: JSX.Element) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('CollectPaymentModal', () => {
    it('renders LeftHeader and CollectPaymentOptions on options step', () => {
        renderWithRouter(<CollectPaymentModal {...baseProps} step="options" />);
        expect(screen.getByText('Collect Payment')).toBeInTheDocument();
        expect(screen.getByTestId('options')).toBeInTheDocument();
    });

    it('renders RecordManually when step is record', () => {
        renderWithRouter(<CollectPaymentModal {...baseProps} step="record" />);
        expect(screen.getByTestId('record')).toBeInTheDocument();
    });

    it('renders PaymentReceived without invoice card on success step', () => {
        renderWithRouter(<CollectPaymentModal {...baseProps} step="payment-received" />);
        expect(screen.getByTestId('received')).toBeInTheDocument();
        // Header is hidden on success steps
        expect(screen.queryByText('Collect Payment')).not.toBeInTheDocument();
    });
});
