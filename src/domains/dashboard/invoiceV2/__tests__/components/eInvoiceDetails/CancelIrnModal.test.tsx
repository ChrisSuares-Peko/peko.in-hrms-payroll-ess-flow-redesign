import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CancelIrnModal from '../../../components/eInvoiceDetails/CancelIrnModal';

vi.mock('../../../forms/eInvoiceDetails/CancelIrnForm', () => ({
    default: () => <div data-testid="cancel-irn-form" />,
}));

describe('CancelIrnModal', () => {
    it('renders title, warning, form and buttons when open', () => {
        render(<CancelIrnModal open onClose={vi.fn()} onConfirm={vi.fn()} />);
        // "Cancel IRN" appears in title and button — assert at least one
        expect(screen.getAllByText('Cancel IRN').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('IRN cancellation is irreversible')).toBeInTheDocument();
        expect(screen.getByTestId('cancel-irn-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Keep IRN/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel IRN/i })).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<CancelIrnModal open={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
        expect(screen.queryByText('IRN cancellation is irreversible')).toBeNull();
    });

    it('calls onClose when "Keep IRN" is clicked', () => {
        const onClose = vi.fn();
        render(<CancelIrnModal open onClose={onClose} onConfirm={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Keep IRN/i }));
        expect(onClose).toHaveBeenCalled();
    });
});
