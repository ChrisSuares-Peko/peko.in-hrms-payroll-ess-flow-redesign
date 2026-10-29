import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import RecordManually from '../../../components/collectPayment/RecordManually';

vi.mock('../../../hooks/collectPayment/useRecordManually', () => ({
    default: () => ({ savePayment: vi.fn(), isLoading: false }),
}));

vi.mock('../../../forms/collectPayment/RecordManuallyForm', () => ({
    default: () => <div data-testid="record-form" />,
}));

describe('RecordManually', () => {
    it('renders form and action buttons', () => {
        render(<RecordManually onCancel={vi.fn()} invoice={null} />);
        expect(screen.getByTestId('record-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Save Payment/i })).toBeInTheDocument();
    });

    it('calls onCancel when Cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<RecordManually onCancel={onCancel} invoice={null} />);
        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCancel).toHaveBeenCalled();
    });
});
