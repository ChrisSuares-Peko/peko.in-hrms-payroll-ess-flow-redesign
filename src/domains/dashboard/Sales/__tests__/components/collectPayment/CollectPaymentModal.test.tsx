import React from 'react';

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import CollectPaymentModal from '../../../components/collectPayment/CollectPaymentModal';
import useOnboarding from '../../../hooks/useOnboarding';

vi.mock('../../../hooks/useOnboarding', () => ({ default: vi.fn() }));
vi.mock('../../../components/collectPayment/CollectPaymentOptions', () => ({
    default: () => <div data-testid="options" />,
}));
vi.mock('../../../components/collectPayment/paymentLink/SendPaymentLink', () => ({
    default: () => <div data-testid="send-link" />,
}));
vi.mock('../../../components/collectPayment/paymentLink/PaymentLinkCreated', () => ({
    default: () => <div data-testid="link-created" />,
}));
vi.mock('../../../components/collectPayment/recordManual/RecordManually', () => ({
    default: () => <div data-testid="record" />,
}));
vi.mock('../../../components/onboarding/OnboardingModal', () => ({
    default: () => null,
}));
vi.mock('../../../components/shared/Invoicesummary', () => ({
    default: ({ title }: any) => <div data-testid="invoice-summary">{title}</div>,
}));

// CollectPaymentModal calls useNavigate for the onboarding redirect, so it needs a Router.
const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

const baseInvoice: any = {
    id: 'i-1',
    name: 'Acme',
    prefix: 'INV-',
    documentNumber: '101',
    amountDue: 500,
};

beforeEach(() => {
    vi.clearAllMocks();
    (useOnboarding as any).mockReturnValue({
        checkOnboardingStatus: vi.fn().mockResolvedValue(false),
    });
});

describe('CollectPaymentModal', () => {
    it('renders Invoicesummary and CollectPaymentOptions on options step', () => {
        renderWithRouter(
            <CollectPaymentModal
                open
                onClose={() => {}}
                invoice={baseInvoice}
                step="options"
                onStepChange={() => {}}
            />
        );

        expect(screen.getByTestId('invoice-summary')).toBeInTheDocument();
        expect(screen.getByTestId('options')).toBeInTheDocument();
    });

    it('renders SendPaymentLink on send-link step', () => {
        renderWithRouter(
            <CollectPaymentModal
                open
                onClose={() => {}}
                invoice={baseInvoice}
                step="send-link"
                onStepChange={() => {}}
            />
        );

        expect(screen.getByTestId('send-link')).toBeInTheDocument();
    });

    it('renders RecordManually on record step', () => {
        renderWithRouter(
            <CollectPaymentModal
                open
                onClose={() => {}}
                invoice={baseInvoice}
                step="record"
                onStepChange={() => {}}
            />
        );

        expect(screen.getByTestId('record')).toBeInTheDocument();
    });

    it('hides Invoicesummary on payment-link-created step', () => {
        renderWithRouter(
            <CollectPaymentModal
                open
                onClose={() => {}}
                invoice={baseInvoice}
                step="payment-link-created"
                onStepChange={() => {}}
            />
        );

        expect(screen.queryByTestId('invoice-summary')).not.toBeInTheDocument();
    });
});
