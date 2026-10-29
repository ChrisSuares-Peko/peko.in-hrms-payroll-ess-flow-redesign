import '@testing-library/jest-dom/vitest';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Mock, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { retryAllFailedJournals, retryJournal } from '../../api/orderJournal';
import JournalStatusBreakdown from '../../components/OrderJournal/JournalStatusBreakdown';

vi.mock('@src/hooks/store', () => ({ useAppSelector: vi.fn(), useAppDispatch: vi.fn() }));

vi.mock('../../api/orderJournal', () => ({
    retryJournal: vi.fn(),
    retryAllFailedJournals: vi.fn(),
}));

const STATE = { reducer: { auth: { role: 'system_user', id: 7 } } };

const LINES = [
    { accountId: 'A1', direction: 'debit', amount: 100 },
    { accountId: 'A2', direction: 'credit', amount: 100 },
];

const PAUSED = 'Journal recording is currently paused';

const realGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
    window.getComputedStyle = ((element: Element) =>
        realGetComputedStyle(element)) as typeof window.getComputedStyle;
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((selector: any) => selector(STATE));
    (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
    (retryJournal as Mock).mockResolvedValue({ success: true });
});

const renderBreakdown = (
    status: Record<string, boolean | undefined>,
    journalData: Record<string, any>
) =>
    render(
        <MemoryRouter>
            <JournalStatusBreakdown
                status={status}
                journalData={journalData}
                corporateTxnId="TXN-1"
                resolveAccounts={vi.fn().mockResolvedValue({})}
            />
        </MemoryRouter>
    );

const rowOf = (label: string) => screen.getByText(label).closest('tr') as HTMLElement;

describe('JournalStatusBreakdown', () => {
    it('reads an entry held back before it was sent as skipped, and still lets it be retried', async () => {
        renderBreakdown(
            { transaction: false },
            { transaction: { skipped: true, reason: PAUSED, lineItems: LINES } }
        );

        const transaction = rowOf('Transaction');
        expect(within(transaction).getByText('Skipped')).toBeInTheDocument();
        expect(within(transaction).queryByText('Failed')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry Skipped Journals/ })).toBeInTheDocument();

        fireEvent.click(within(transaction).getByRole('button', { name: 'reload' }));

        await waitFor(() =>
            expect(retryJournal).toHaveBeenCalledWith({
                userId: 7,
                userType: 'system_user',
                corporateTxnId: 'TXN-1',
                journalKey: 'transaction',
            })
        );
    });

    it('reads an entry the books refused as failed', () => {
        renderBreakdown(
            { transaction: false },
            { transaction: { reason: 'Account not found', lineItems: LINES } }
        );

        expect(within(rowOf('Transaction')).getByText('Failed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry Failed Journals/ })).toBeInTheDocument();
    });

    it('names both kinds on the retry button when an order has one of each', () => {
        renderBreakdown(
            { transaction: false, refund: false },
            { transaction: { skipped: true, reason: PAUSED }, refund: { reason: 'Bad account' } }
        );

        expect(
            screen.getByRole('button', { name: /Retry Failed & Skipped Journals/ })
        ).toBeInTheDocument();
    });

    it('offers no retry once every entry is in the books', () => {
        renderBreakdown({ transaction: true }, { transaction: { lineItems: LINES } });

        expect(within(rowOf('Transaction')).getByText('Recorded')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Retry/ })).not.toBeInTheDocument();
    });

    it('titles the journal view of a held back entry as skipped', async () => {
        renderBreakdown(
            { transaction: false },
            { transaction: { skipped: true, reason: PAUSED, lineItems: LINES } }
        );

        fireEvent.click(within(rowOf('Transaction')).getByRole('button', { name: 'eye' }));

        const dialog = await screen.findByRole('dialog');
        expect(within(dialog).getByText('Skipped')).toBeInTheDocument();
        expect(within(dialog).queryByText('Failed')).not.toBeInTheDocument();
        expect(
            within(dialog).queryByRole('button', { name: 'Edit amounts' })
        ).not.toBeInTheDocument();
        expect(
            within(dialog).getByRole('link', { name: 'Fix in Manual Operations' })
        ).toHaveAttribute(
            'href',
            '/system-user/accounting/manual-operations/journal/TXN-1?event=transaction'
        );
    });

    it('links every event not yet in the books to the manual journal page, and offers nothing for one that is', () => {
        renderBreakdown(
            { transaction: true, refund: false },
            { transaction: { lineItems: LINES }, refund: { reason: 'x' } }
        );

        expect(within(rowOf('Transaction')).queryByRole('link')).not.toBeInTheDocument();
        expect(
            within(rowOf('Refund')).getByRole('link', { name: 'Record Refund by hand' })
        ).toHaveAttribute(
            'href',
            '/system-user/accounting/manual-operations/journal/TXN-1?event=refund'
        );
        expect(
            within(rowOf('Cashback')).getByRole('link', { name: 'Record Cashback by hand' })
        ).toBeInTheDocument();
    });

    describe('a retry held back because a commission or platform fee is not marked as configured', () => {
        const REASON = `Commission for "Electricity Bill" is still not marked as configured. Mark the service's commission as configured, then retry.`;
        const toastOf = (dispatch: Mock) => dispatch.mock.calls.map(([action]) => action.payload);

        it('shows the reason on a single retry', async () => {
            const dispatch = vi.fn();
            (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
            (retryJournal as Mock).mockResolvedValue({
                success: false,
                skipped: true,
                reason: REASON,
            });
            renderBreakdown(
                { transaction: false },
                {
                    transaction: {
                        skipped: true,
                        reason: 'Commission not configured for "Electricity Bill"',
                    },
                }
            );

            fireEvent.click(within(rowOf('Transaction')).getByRole('button', { name: 'reload' }));

            await waitFor(() =>
                expect(toastOf(dispatch)).toContainEqual({ description: REASON, variant: 'error' })
            );
        });

        it('adds the reason to the count when retrying everything', async () => {
            const dispatch = vi.fn();
            (useAppDispatch as unknown as Mock).mockReturnValue(dispatch);
            (retryAllFailedJournals as Mock).mockResolvedValue({
                results: { transaction: { success: false, skipped: true, reason: REASON } },
            });
            renderBreakdown(
                { transaction: false },
                {
                    transaction: {
                        skipped: true,
                        reason: 'Commission not configured for "Electricity Bill"',
                    },
                }
            );

            fireEvent.click(screen.getByRole('button', { name: /Retry Skipped Journals/ }));

            await waitFor(() =>
                expect(toastOf(dispatch)).toContainEqual({
                    description: `0 of 1 retried successfully. ${REASON}`,
                    variant: 'error',
                })
            );
        });
    });
});
