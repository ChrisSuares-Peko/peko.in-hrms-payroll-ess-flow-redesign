import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { completeTermination } from '../../../api/corporateCardTerminations';
import CorporateCardTerminations from '../../../component/corporateCardTerminations/CorporateCardTerminations';
import useTerminationRequests from '../../../hooks/useTerminationRequests';
import { TerminationRequestRow } from '../../../types/corporateCardTerminations';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('../../../hooks/useTerminationRequests', () => ({
    default: vi.fn(),
}));

vi.mock('../../../api/corporateCardTerminations', () => ({
    completeTermination: vi.fn(),
}));

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource, loading, locale }: any) => {
        if (loading) return <div data-testid="table-loading" />;
        if (!dataSource?.length) return <div data-testid="empty-state">{locale?.emptyText}</div>;
        return (
            <div data-testid="generic-table">
                {dataSource.map((row: any) => (
                    <div key={row.id} data-testid={`row-${row.id}`}>
                        {columns.map((col: any) => (
                            <div key={col.key} data-testid={`cell-${col.key}-${row.id}`}>
                                {col.render
                                    ? col.render(row[col.dataIndex], row)
                                    : row[col.dataIndex]}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
}));

const mockAuth = { role: 'SYSTEM_USER', id: 9 };
const mockDispatch = vi.fn();

const baseRow: TerminationRequestRow = {
    id: 1,
    corporateId: 42,
    companyName: 'Steel & Co',
    cardholder: 'Jane Doe',
    holderId: 99,
    cardIssuanceId: 5,
    cardLast4: '1234',
    reason: 'lost',
    requestedAt: '2026-07-10T10:00:00.000Z',
    status: 'PENDING',
};

const mockHook = (overrides: Partial<ReturnType<typeof useTerminationRequests>> = {}) => {
    (useTerminationRequests as Mock).mockReturnValue({
        isLoading: false,
        tableData: [],
        count: 0,
        refetch: vi.fn(),
        ...overrides,
    });
};

describe('CorporateCardTerminations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: mockAuth } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    });

    it('renders the page header', () => {
        mockHook();
        render(<CorporateCardTerminations />);
        expect(screen.getByText('Card Termination Requests')).toBeInTheDocument();
    });

    it('shows a "Mark Completed" action only for a PENDING (Requested) row', () => {
        mockHook({ tableData: [baseRow], count: 1 });
        render(<CorporateCardTerminations />);
        expect(screen.getByRole('button', { name: 'Mark Completed' })).toBeInTheDocument();
    });

    it('does not show "Mark Completed" for an already-APPROVED (Completed) row', () => {
        mockHook({ tableData: [{ ...baseRow, status: 'APPROVED' }], count: 1 });
        render(<CorporateCardTerminations />);
        expect(screen.queryByRole('button', { name: 'Mark Completed' })).not.toBeInTheDocument();
        expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('opens a confirm modal, calls completeTermination, toasts success, and refetches', async () => {
        const refetch = vi.fn();
        mockHook({ tableData: [baseRow], count: 1, refetch });
        (completeTermination as Mock).mockResolvedValue({
            data: { requestId: 1, status: 'APPROVED' },
        });

        render(<CorporateCardTerminations />);
        fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));

        const dialog = screen.getByRole('dialog');
        expect(within(dialog).getByText(/Confirm the vendor-side closure/)).toBeInTheDocument();
        fireEvent.click(within(dialog).getByRole('button', { name: 'Mark Completed' }));

        await waitFor(() => {
            expect(completeTermination).toHaveBeenCalledWith('SYSTEM_USER', 9, 1);
            expect(refetch).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ variant: 'success' }),
                })
            );
        });
    });

    it('toasts an error and does not refetch when completeTermination fails', async () => {
        const refetch = vi.fn();
        mockHook({ tableData: [baseRow], count: 1, refetch });
        (completeTermination as Mock).mockResolvedValue(false);

        render(<CorporateCardTerminations />);
        fireEvent.click(screen.getByRole('button', { name: 'Mark Completed' }));
        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Mark Completed' }));

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({ payload: expect.objectContaining({ variant: 'error' }) })
            );
        });
        expect(refetch).not.toHaveBeenCalled();
    });
});
