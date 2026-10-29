import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CancelEWaybillModal from '../../../components/eInvoiceDetails/CancelEWaybillModal';

vi.mock('../../../forms/eInvoiceDetails/CancelEWaybillForm', () => ({
    default: () => <div data-testid="cancel-ewb-form" />,
}));

describe('CancelEWaybillModal', () => {
    it('renders title, warning, form and buttons when open', () => {
        render(<CancelEWaybillModal open onClose={vi.fn()} onConfirm={vi.fn()} />);
        expect(screen.getAllByText('Cancel E-Waybill').length).toBeGreaterThanOrEqual(1);
        expect(
            screen.getByText(/E-Waybill can be cancelled only within 24 hours/)
        ).toBeInTheDocument();
        expect(screen.getByTestId('cancel-ewb-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Keep E-Waybill/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel E-Waybill/i })).toBeInTheDocument();
    });

    it('does not render the form when closed', () => {
        render(<CancelEWaybillModal open={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
        expect(screen.queryByTestId('cancel-ewb-form')).toBeNull();
    });

    it('fires onClose when Keep E-Waybill is clicked', () => {
        const onClose = vi.fn();
        render(<CancelEWaybillModal open onClose={onClose} onConfirm={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Keep E-Waybill/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
