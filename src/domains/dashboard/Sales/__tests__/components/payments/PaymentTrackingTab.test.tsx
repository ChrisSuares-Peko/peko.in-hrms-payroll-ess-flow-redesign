import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';

import PaymentTrackingTab from '../../../components/payments/PaymentTrackingTab';
import usePaymentTracking from '../../../hooks/usePaymentTracking';

vi.mock('@src/hooks/hooks', () => ({ useAppDispatch: vi.fn() }));
vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn() }));
vi.mock('@src/slices/apiSlice', () => ({ showToast: vi.fn(p => p) }));
vi.mock('../../../api/payments', () => ({ downloadPaymentReceiptApi: vi.fn() }));
vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('../../../hooks/usePaymentTracking', () => ({ default: vi.fn() }));
vi.mock('@src/hooks/useDebounceSearch', () => ({
    default: (setFilters: any) => ({
        searchText: '',
        updateSearchText: (e: any) => setFilters((p: any) => ({ ...p, searchText: e.target.value })),
    }),
}));
vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ dataSource }: any) => (
        <div data-testid="payment-table">{(dataSource ?? []).length} rows</div>
    ),
}));
vi.mock('../../../components/payments/PaymentDetails', () => ({
    default: ({ id, onBack }: any) => (
        <div>
            <span>Detail of {id}</span>
            <button type="button" onClick={onBack}>
                Back
            </button>
        </div>
    ),
}));
vi.mock('../../../components/collectPayment/recordManual/UpdatePaymentStatus', () => ({
    default: () => null,
}));
vi.mock('../../../utils/table_column/paymentTrackingColumns', () => ({
    default: () => [],
}));

const handleExport = vi.fn();
const mockDispatch = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as any).mockReturnValue(mockDispatch);
    (useAppSelector as any).mockReturnValue({ id: 'u', role: 'merchant' });
    (usePaymentTracking as any).mockReturnValue({
        rows: [{ id: '1' }, { id: '2' }],
        total: 2,
        isLoading: false,
        exportingType: null,
        handleExport,
    });
});

describe('PaymentTrackingTab', () => {
    it('renders header, export buttons, and the table', () => {
        render(<PaymentTrackingTab />);

        expect(screen.getByText('Payment Records')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /excel/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/search customers/i)).toBeInTheDocument();
        expect(screen.getByTestId('payment-table')).toHaveTextContent('2 rows');
    });

    it('triggers handleExport with the selected format', () => {
        render(<PaymentTrackingTab />);

        fireEvent.click(screen.getByRole('button', { name: /excel/i }));
        fireEvent.click(screen.getByRole('button', { name: /csv/i }));
        fireEvent.click(screen.getByRole('button', { name: /pdf/i }));

        expect(handleExport).toHaveBeenNthCalledWith(1, 'excel');
        expect(handleExport).toHaveBeenNthCalledWith(2, 'csv');
        expect(handleExport).toHaveBeenNthCalledWith(3, 'pdf');
    });

    it('shows loading state on the active export button', () => {
        (usePaymentTracking as any).mockReturnValue({
            rows: [],
            total: 0,
            isLoading: false,
            exportingType: 'pdf',
            handleExport,
        });

        render(<PaymentTrackingTab />);

        const pdfBtn = screen.getByRole('button', { name: /pdf/i });
        expect(pdfBtn.className).toContain('ant-btn-loading');
    });
});
