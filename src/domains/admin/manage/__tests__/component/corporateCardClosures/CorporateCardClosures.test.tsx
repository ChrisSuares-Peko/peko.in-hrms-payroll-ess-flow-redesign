import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { decideClosureRequest } from '../../../api/corporateCardClosures';
import CorporateCardClosures from '../../../component/corporateCardClosures/CorporateCardClosures';
import useClosureRequests from '../../../hooks/useClosureRequests';
import { ClosureRequestRow } from '../../../types/corporateCardClosures';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('../../../hooks/useClosureRequests', () => ({ default: vi.fn() }));
vi.mock('../../../api/corporateCardClosures', () => ({ decideClosureRequest: vi.fn() }));

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

const mockDispatch = vi.fn();
const refetch = vi.fn();

const baseRow: ClosureRequestRow = {
    id: '9',
    corporateId: 42,
    companyName: 'Steel & Co',
    email: 'ops@steel.test',
    status: 'PENDING',
    reason: 'NOT_USING',
    reasonLabel: 'We are no longer using Peko',
    details: 'Moving to an in-house programme',
    requestedByName: 'Aarav (Admin)',
    requestedAt: '2026-08-17T10:00:00.000Z',
    decidedAt: null,
    decisionNote: null,
    appliedResult: null,
};

const setHook = (over: Record<string, unknown> = {}) => {
    (useClosureRequests as unknown as Mock).mockReturnValue({
        isLoading: false,
        tableData: [baseRow],
        count: 1,
        refetch,
        ...over,
    });
};

const okResponse = (
    applied: unknown = { cards: { requested: 2, frozen: 2, failed: 0 }, kybReset: true }
) => ({
    data: { requestId: '9', status: 'APPROVED', applied },
});

beforeEach(() => {
    vi.clearAllMocks();
    (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
        fn({ reducer: { auth: { role: 'SYSTEM_USER', id: 9 } } })
    );
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (decideClosureRequest as unknown as Mock).mockResolvedValue(okResponse());
    setHook();
});

const openApprove = () => fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
const openReject = () => fireEvent.click(screen.getByRole('button', { name: 'Reject' }));

describe('CorporateCardClosures', () => {
    it('shows the queue with the corporate, reason and who asked', () => {
        render(<CorporateCardClosures />);

        expect(screen.getByText('Account Closure Requests')).toBeInTheDocument();
        expect(screen.getByText('Steel & Co')).toBeInTheDocument();
        expect(screen.getByText('We are no longer using Peko')).toBeInTheDocument();
        expect(screen.getByText('Aarav (Admin)')).toBeInTheDocument();
    });

    describe('status filter', () => {
        const statusOptions = () => {
            render(<CorporateCardClosures />);
            fireEvent.mouseDown(screen.getByRole('combobox'));
            return [...document.querySelectorAll('.ant-select-item-option-content')].map(
                node => node.textContent
            );
        };

        it('offers All plus exactly the statuses a request can actually reach', () => {
            expect(statusOptions()).toEqual(['All', 'Awaiting review', 'Closed', 'Rejected']);
        });

        it('does not offer Cancelled, which nothing can produce', () => {
            expect(statusOptions()).not.toContain('Cancelled');
        });

        it('opens on Awaiting review, so the queue starts on what needs a decision', () => {
            render(<CorporateCardClosures />);

            expect(useClosureRequests).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'PENDING' })
            );
        });

        it('asks the hook for every status when All is chosen', async () => {
            render(<CorporateCardClosures />);
            fireEvent.mouseDown(screen.getByRole('combobox'));
            fireEvent.click(screen.getByTitle('All'));

            await waitFor(() =>
                expect(useClosureRequests).toHaveBeenLastCalledWith(
                    expect.objectContaining({ status: '', page: 1 })
                )
            );
        });
    });

    it('renders the empty state when the queue is clear', () => {
        setHook({ tableData: [], count: 0 });
        render(<CorporateCardClosures />);

        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
        expect(screen.getByText('No open account closure requests.')).toBeInTheDocument();
    });

    it('does not blame a filter for the empty state when All is selected', async () => {
        setHook({ tableData: [], count: 0 });
        render(<CorporateCardClosures />);
        fireEvent.mouseDown(screen.getByRole('combobox'));
        fireEvent.click(screen.getByTitle('All'));

        await waitFor(() =>
            expect(screen.getByText('No account closure requests yet.')).toBeInTheDocument()
        );
    });

    // The reviewer is about to freeze cards and wipe KYB progress; the modal has to say so.
    it('spells out the consequences before approving', () => {
        render(<CorporateCardClosures />);
        openApprove();

        expect(
            screen.getByText(/All their cards will be frozen and KYB reset/)
        ).toBeInTheDocument();
        expect(screen.getByText(/documents and agreement details are\s+kept/)).toBeInTheDocument();
    });

    it('does not show that warning when rejecting', () => {
        render(<CorporateCardClosures />);
        openReject();

        expect(screen.queryByText(/All their cards will be frozen/)).toBeNull();
        expect(screen.getByText(/keeps full access/)).toBeInTheDocument();
    });

    describe('decision note', () => {
        const typeNote = (value: string) => {
            render(<CorporateCardClosures />);
            openApprove();
            fireEvent.change(screen.getByPlaceholderText('Why this was approved or rejected'), {
                target: { value },
            });
        };

        const approveButton = () => screen.getByRole('button', { name: 'Approve closure' });

        it('blocks a note shorter than the minimum', async () => {
            typeNote('too short');

            await waitFor(() =>
                expect(
                    screen.getByText('The decision note must be at least 10 characters')
                ).toBeInTheDocument()
            );
            expect(approveButton()).toBeDisabled();
        });

        it('blocks a note with consecutive spaces', async () => {
            typeNote('Confirmed by  phone');

            await waitFor(() =>
                expect(
                    screen.getByText('The decision note cannot contain consecutive whitespaces')
                ).toBeInTheDocument()
            );
            expect(approveButton()).toBeDisabled();
        });

        it('blocks a note with a trailing space', async () => {
            typeNote('Confirmed by phone ');

            await waitFor(() =>
                expect(
                    screen.getByText('The decision note cannot end with whitespace')
                ).toBeInTheDocument()
            );
            expect(approveButton()).toBeDisabled();
        });

        it('allows a decision with no note at all, since it stays optional', () => {
            render(<CorporateCardClosures />);
            openApprove();

            expect(approveButton()).toBeEnabled();
        });

        it('allows a clean note', async () => {
            typeNote('Confirmed by phone with the finance team');

            await waitFor(() => expect(approveButton()).toBeEnabled());
        });
    });

    it('sends approve with the decision note', async () => {
        render(<CorporateCardClosures />);
        openApprove();

        fireEvent.change(screen.getByPlaceholderText('Why this was approved or rejected'), {
            target: { value: 'Confirmed by phone' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await waitFor(() =>
            expect(decideClosureRequest).toHaveBeenCalledWith(
                'SYSTEM_USER',
                9,
                '9',
                'approve',
                'Confirmed by phone'
            )
        );
    });

    it('sends reject when the reject action is used', async () => {
        render(<CorporateCardClosures />);
        openReject();
        fireEvent.click(screen.getByRole('button', { name: 'Reject request' }));

        await waitFor(() =>
            expect(decideClosureRequest).toHaveBeenCalledWith(
                'SYSTEM_USER',
                9,
                '9',
                'reject',
                undefined
            )
        );
    });

    it('refreshes the queue after a decision', async () => {
        render(<CorporateCardClosures />);
        openApprove();
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await waitFor(() => expect(refetch).toHaveBeenCalled());
    });

    const expectToastContaining = (text: string) =>
        waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        description: expect.stringContaining(text),
                    }),
                })
            )
        );

    it('reports how many cards were frozen', async () => {
        render(<CorporateCardClosures />);
        openApprove();
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await expectToastContaining(
            'Account closed successfully. 2 cards were frozen, and KYB has been reset.'
        );
    });

    it('reads as singular when exactly one card was frozen', async () => {
        (decideClosureRequest as unknown as Mock).mockResolvedValue(
            okResponse({ cards: { requested: 1, frozen: 1, failed: 0 }, kybReset: true })
        );
        render(<CorporateCardClosures />);
        openApprove();
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await expectToastContaining('1 card was frozen, and KYB has been reset.');
    });

    it('still confirms the closure when no cards needed freezing', async () => {
        (decideClosureRequest as unknown as Mock).mockResolvedValue(
            okResponse({ cards: { requested: 0, frozen: 0, failed: 0 }, kybReset: true })
        );
        render(<CorporateCardClosures />);
        openApprove();
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await expectToastContaining(
            'Account closed successfully. 0 cards were frozen, and KYB has been reset.'
        );
    });

    // The KYB reset succeeded but the cards did not freeze — the reviewer must be told to act.
    it('warns the reviewer when the cards could not be frozen', async () => {
        (decideClosureRequest as unknown as Mock).mockResolvedValue(
            okResponse({
                cards: { requested: 2, frozen: 0, failed: 2, vendorUnavailable: true },
                kybReset: true,
            })
        );
        render(<CorporateCardClosures />);
        openApprove();
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({
                        variant: 'warning',
                        description: expect.stringContaining('freeze them manually'),
                    }),
                })
            )
        );
    });

    it('keeps the modal open and does not refetch when the decision fails', async () => {
        (decideClosureRequest as unknown as Mock).mockResolvedValue(false);
        render(<CorporateCardClosures />);
        openApprove();
        fireEvent.click(screen.getByRole('button', { name: 'Approve closure' }));

        await waitFor(() =>
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: expect.objectContaining({ variant: 'error' }),
                })
            )
        );
        expect(refetch).not.toHaveBeenCalled();
    });

    it('offers no actions on a request that was already decided', () => {
        setHook({
            tableData: [{ ...baseRow, status: 'REJECTED', decisionNote: 'Spoke to the CFO' }],
        });
        render(<CorporateCardClosures />);

        expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
        expect(screen.getByText('Spoke to the CFO')).toBeInTheDocument();
    });

    it('shows a loading table while fetching', () => {
        setHook({ isLoading: true });
        render(<CorporateCardClosures />);

        expect(screen.getByTestId('table-loading')).toBeInTheDocument();
    });
});
