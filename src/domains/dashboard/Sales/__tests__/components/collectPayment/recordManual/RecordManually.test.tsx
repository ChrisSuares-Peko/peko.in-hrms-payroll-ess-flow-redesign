import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import RecordManually from '../../../../components/collectPayment/recordManual/RecordManually';
import useRecordManually from '../../../../hooks/collectPayment/useRecordManually';

vi.mock('../../../../hooks/collectPayment/useRecordManually', () => ({ default: vi.fn() }));
vi.mock('../../../../forms/collectPayment/RecordManuallyForm', () => ({
    default: () => <div data-testid="record-form" />,
}));

const savePayment = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useRecordManually as any).mockReturnValue({ savePayment, isLoading: false });
});

describe('RecordManually', () => {
    it('renders the form and Save Payment / Cancel actions', () => {
        render(<RecordManually onCancel={() => {}} invoice={null} />);

        expect(screen.getByTestId('record-form')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /save payment/i })).toBeInTheDocument();
    });

    it('triggers onCancel from the Cancel button', () => {
        const onCancel = vi.fn();
        render(<RecordManually onCancel={onCancel} invoice={null} />);

        fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
        expect(onCancel).toHaveBeenCalled();
    });

    it('shows loading state on Save Payment when isLoading', () => {
        (useRecordManually as any).mockReturnValue({ savePayment, isLoading: true });

        render(<RecordManually onCancel={() => {}} invoice={null} />);
        const btn = screen.getByRole('button', { name: /save payment/i });
        expect(btn.className).toContain('ant-btn-loading');
    });
});
