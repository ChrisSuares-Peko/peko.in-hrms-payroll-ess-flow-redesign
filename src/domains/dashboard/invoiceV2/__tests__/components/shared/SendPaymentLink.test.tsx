import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SendPaymentLink from '../../../components/shared/SendPaymentLink';

vi.mock('../../../hooks/collectPayment/useSendPaymentLink', () => ({
    default: () => ({ generatePaymentLink: vi.fn(), isLoading: false }),
}));

vi.mock('../../../forms/collectPayment/SendPaymentLinkForm', () => ({
    default: () => <div data-testid="send-form" />,
}));

describe('SendPaymentLink', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the form and action buttons', () => {
        render(<SendPaymentLink onCancel={vi.fn()} onSuccess={vi.fn()} />);

        expect(screen.getByTestId('send-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Generate Payment Link/i })).toBeInTheDocument();
    });
});
