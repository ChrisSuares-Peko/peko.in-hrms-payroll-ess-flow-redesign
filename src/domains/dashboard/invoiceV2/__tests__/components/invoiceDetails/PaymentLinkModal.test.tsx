import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import PaymentLinkModal from '../../../components/invoiceDetails/PaymentLinkModal.tsx';

vi.mock('../../../components/shared/SendPaymentLink', () => ({
    default: () => <div data-testid="send-link-form" />,
}));

vi.mock('../../../components/shared/PaymentLinkCreated', () => ({
    default: () => <div data-testid="link-created" />,
}));

describe('PaymentLinkModal', () => {
    it('renders header and SendPaymentLink form initially', () => {
        render(<PaymentLinkModal open onCancel={vi.fn()} />);
        expect(screen.getByText('Create Payment Link')).toBeInTheDocument();
        expect(screen.getByTestId('send-link-form')).toBeInTheDocument();
    });

    it('does not render any content when closed', () => {
        render(<PaymentLinkModal open={false} onCancel={vi.fn()} />);
        expect(screen.queryByText('Create Payment Link')).not.toBeInTheDocument();
    });
});
