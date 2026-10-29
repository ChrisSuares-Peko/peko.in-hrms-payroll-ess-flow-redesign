import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import UPICollectForm from '../../../../components/invoiceDetails/upiCollect/UPICollectForm';

vi.mock('../../../../forms/collectPayment/SendUPICollectForm', () => ({
    default: () => <div data-testid="upi-form" />,
}));

describe('UPICollectForm', () => {
    it('renders header, child form and action buttons', () => {
        render(<UPICollectForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Send UPI Collect')).toBeInTheDocument();
        expect(screen.getByTestId('upi-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send UPI Request/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('fires onCancel when Cancel button clicked', () => {
        const onCancel = vi.fn();
        render(<UPICollectForm onSubmit={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});
