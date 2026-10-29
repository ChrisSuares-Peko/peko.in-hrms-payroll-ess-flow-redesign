import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { CardRequestItem } from '../../../api/admin/requestsApi';
import ApprovalRequests from '../../../components/approvalRequests/ApprovalRequests';
import { useApprovalRequestsApi } from '../../../hooks/admin/useApprovalRequestsApi';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const FREE_QUOTA = {
    used: 0, included: 1, purchased: 0, allowed: 1, remaining: 1,
    requiresPayment: false, unitPrice: 19, purchasable: true,
};

const PAID_QUOTA = { ...FREE_QUOTA, used: 1, remaining: 0, requiresPayment: true };

const hoisted = vi.hoisted(() => ({
    quota: null as Record<string, unknown> | null,
    startPurchase: vi.fn(),
}));

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    default: (state: unknown = {}) => state,
    showToast: vi.fn((payload: any) => ({ type: 'apiSlice/showToast', payload })),
}));

vi.mock('../../../hooks/admin/useApprovalRequestsApi', () => ({
    useApprovalRequestsApi: vi.fn(),
}));

// Cardholder filter options come from the /cardholders API (KYC-completed cardholders), keyed by
// subCorporateId — the value the server query filters on.
vi.mock('../../../hooks/user/useCardQuotaApi', () => ({
    useCardQuotaApi: () => ({
        quota: hoisted.quota,
        isLoading: false,
        refetchQuota: vi.fn(),
    }),
}));

vi.mock('../../../hooks/admin/usePhysicalCardPurchase', () => ({
    usePhysicalCardPurchase: () => ({
        startPurchase: hoisted.startPurchase,
        isPreparing: false,
    }),
}));
vi.mock('../../../hooks/admin/useCardholderOptions', () => ({
    useCardholderOptions: vi.fn(() => [
        { label: 'Alice', value: '101' },
        { label: 'Bob', value: '102' },
    ]),
}));

vi.mock('../../../hooks/admin/useAdminCardsApi', () => ({
    useAdminCardsApi: vi.fn(() => ({
        cards: [
            { key: '1', last4: '1234' },
            { key: '2', last4: '5678' },
        ],
        total: 2,
        isLoading: false,
        refetch: vi.fn(),
    })),
}));

vi.mock('../../../components/landingPage/transactions/TransactionsSection', () => ({
    default: function TransactionsSectionMock({
        hideHeader,
        hideActions,
        variant,
        onOptionsChange,
        approvalHandlers,
    }: any) {
        // Call once on mount — onOptionsChange is an inline fn that changes every render,
        // so depending on it causes an infinite loop.
        React.useEffect(() => {
            onOptionsChange?.({ cardholderOptions: [], cardOptions: [] });
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);
        return (
            <div
                data-testid="transactions-section"
                data-hide-header={String(hideHeader)}
                data-hide-actions={String(hideActions)}
                data-variant={variant}
            >
                <button type="button" onClick={() => approvalHandlers?.onApprove(99)}>
                    Approve
                </button>
                <button type="button" onClick={() => approvalHandlers?.onReject(99)}>
                    Reject
                </button>
            </div>
        );
    },
}));

vi.mock('../../../components/common/PageTabs', () => ({
    default: ({ tabs, activeKey, onChange }: any) => (
        <div data-testid="page-tabs">
            {tabs.map((t: any) => (
                <button
                    type="button"
                    key={t.key}
                    data-testid={`tab-${t.key}`}
                    data-active={String(activeKey === t.key)}
                    onClick={() => onChange(t.key)}
                >
                    {t.label}
                </button>
            ))}
        </div>
    ),
}));

vi.mock('@components/atomic/GenericTable', () => ({
    default: ({ columns, dataSource, loading }: any) => (
        <div data-testid="generic-table" data-loading={String(loading)}>
            {(dataSource ?? []).map((row: any) => (
                <div key={row.key} data-testid={`row-${row.key}`}>
                    {columns.map((col: any) => {
                        const val = row[col.dataIndex];
                        return (
                            <span key={col.key} data-testid={`cell-${col.key}-${row.key}`}>
                                {col.render ? col.render(val, row) : String(val ?? '')}
                            </span>
                        );
                    })}
                </div>
            ))}
        </div>
    ),
}));

vi.mock('../../../assets/cardImage.jpg', () => ({ default: 'card.jpg' }));

vi.mock('@ant-design/icons', () => ({
    CloseCircleOutlined: () => <span />,
    InfoCircleOutlined: () => <span />,
    SearchOutlined: () => <span />,
}));

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
        ...actual,
        // Real antd Modal unmounts after a CSS transition that never resolves in jsdom (no
        // transitionend), hanging any waitFor on its removal. Every other modal test in this repo
        // stubs Modal the same way (see ManageCardModal.test.tsx) rather than fight that.
        Modal: ({ open, children }: any) => (open ? <div>{children}</div> : null),
        DatePicker: {
            ...actual.DatePicker,
            RangePicker: ({ onChange }: any) => (
                <input data-testid="range-picker" onChange={() => onChange?.(null)} readOnly />
            ),
        },
        Select: ({ onChange, value, placeholder, options }: any) => (
            <select
                data-testid="approval-select"
                value={value ?? ''}
                onChange={e => onChange?.(e.target.value || undefined)}
            >
                <option value="">{placeholder}</option>
                {(options ?? []).map((opt: any) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        ),
        Tooltip: ({ title, children }: any) => (
            <span data-testid="tooltip" data-title={title ?? ''}>
                {children}
            </span>
        ),
    };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// A complete CardRequestItem, so a row can be handed straight to makeHook, whose `rows` is typed.
// `shipping` is absent rather than null because the backend omits the key entirely for a request with
// no delivery address (cardRequests.js builds the payload with `...(shipping ? { shipping } : {})`);
// formatShippingAddress treats both as "-".
const ROW_DEFAULTS: CardRequestItem = {
    id: 1,
    date: new Date().toISOString(),
    requestType: 'CARD_ISSUANCE',
    member: 'Alice',
    holderId: null,
    status: 'PENDING',
    reason: 'Need card',
    decisionNote: null,
    decidedAt: null,
    cardIssuanceId: null,
    payload: {
        cardType: 'Virtual',
        requestedLimit: 50000,
        currentLimit: 10000,
        requestedAmount: 5000,
    },
    result: {},
    cardLast4: '1234',
};

// `overrides` stays loosely typed on purpose: several filtering tests model "field not sent" by passing
// an explicit null for an optional numeric payload field, which RequestPayload does not accept.
const makeRow = (overrides: Record<string, unknown> = {}) =>
    ({ ...ROW_DEFAULTS, ...overrides }) as CardRequestItem;

const makeHook = (overrides: Partial<ReturnType<typeof useApprovalRequestsApi>> = {}) => ({
    rows: [],
    total: 0,
    isLoading: false,
    approvingIds: [] as number[],
    rejectingIds: [] as number[],
    approve: vi.fn().mockResolvedValue(true),
    reject: vi.fn().mockResolvedValue(true),
    refetch: vi.fn(),
    ...overrides,
});

const setupHooks = (cardReqOverrides = {}, limitOverrides = {}, physOverrides = {}) => {
    const cardReqHook = makeHook(cardReqOverrides);
    const limitHook = makeHook(limitOverrides);
    const physHook = makeHook(physOverrides);

    // Must use mockImplementation (not Once) â€” component re-renders on tab switch call hooks again.
    (useApprovalRequestsApi as Mock).mockImplementation(
        (requestType: string, _page: number, _pageSize: number, cardType?: string) => {
            if (requestType === 'LIMIT_INCREASE') return limitHook;
            if (cardType === 'Physical') return physHook;
            return cardReqHook; // CARD_ISSUANCE Virtual (and fallback)
        }
    );

    return { cardReqHook, limitHook, physHook };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ApprovalRequests', () => {
    let mockDispatch: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        hoisted.quota = FREE_QUOTA;
        hoisted.startPurchase.mockResolvedValue(true);
        mockDispatch = vi.fn();
        (useAppDispatch as Mock).mockReturnValue(mockDispatch);
        (useAppSelector as Mock).mockImplementation((selector: (s: unknown) => unknown) =>
            selector({ reducer: { auth: { role: 'corporate', id: 1 } } })
        );
    });

    describe('initial render', () => {
        it('renders the page heading', () => {
            setupHooks();
            render(<ApprovalRequests />);
            expect(screen.getByText('Approval Requests')).toBeInTheDocument();
        });

        it('renders five tab buttons', () => {
            setupHooks();
            render(<ApprovalRequests />);
            expect(screen.getByTestId('tab-transactions')).toBeInTheDocument();
            expect(screen.getByTestId('tab-card-requests')).toBeInTheDocument();
            expect(screen.getByTestId('tab-limit-increases')).toBeInTheDocument();
            expect(screen.getByTestId('tab-physical-cards')).toBeInTheDocument();
            expect(screen.getByTestId('tab-unfreeze-requests')).toBeInTheDocument();
        });

        it('shows the Transactions tab as active by default', () => {
            setupHooks();
            render(<ApprovalRequests />);
            expect(screen.getByTestId('tab-transactions').dataset.active).toBe('true');
        });

        it('renders TransactionsSection with hideHeader=true and hideActions=true by default', () => {
            setupHooks();
            render(<ApprovalRequests />);
            const section = screen.getByTestId('transactions-section');
            expect(section.dataset.hideHeader).toBe('true');
            expect(section.dataset.hideActions).toBe('true');
        });

        it('renders TransactionsSection with variant="admin"', () => {
            setupHooks();
            render(<ApprovalRequests />);
            expect(screen.getByTestId('transactions-section').dataset.variant).toBe('admin');
        });

        it('shows a filter bar on the transactions tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            // The transactions tab ApprovalFilters renders RangePicker and Selects
            expect(screen.getAllByTestId('range-picker').length).toBeGreaterThan(0);
        });
    });

    describe('tab switching', () => {
        it('hides TransactionsSection when a different tab is selected', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));
            expect(screen.queryByTestId('transactions-section')).not.toBeInTheDocument();
        });

        it('shows GenericTable when card-requests tab is selected', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('shows a filter bar on the card-requests tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));
            expect(screen.getAllByTestId('range-picker').length).toBeGreaterThan(0);
        });

        it('shows an info note on the card-requests tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));
            expect(screen.getByText(/Card issuance requests/i)).toBeInTheDocument();
        });

        it('shows GenericTable on limit-increases tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-limit-increases'));
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('does NOT show a filter bar on the limit-increases tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-limit-increases'));
            expect(screen.queryByTestId('range-picker')).not.toBeInTheDocument();
        });

        it('shows an info note on the limit-increases tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-limit-increases'));
            expect(screen.getByText(/Limit-increase requests/i)).toBeInTheDocument();
        });

        it('shows GenericTable on physical-cards tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));
            expect(screen.getByTestId('generic-table')).toBeInTheDocument();
        });

        it('does NOT show a filter bar on the physical-cards tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));
            expect(screen.queryByTestId('range-picker')).not.toBeInTheDocument();
        });

        it('shows an info note on the physical-cards tab', () => {
            setupHooks();
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));
            expect(screen.getByText(/physical companion/i)).toBeInTheDocument();
        });
    });

    describe('mapStatus rendering in card-requests table', () => {
        const renderCardRequestsTab = (status: string) => {
            setupHooks({ rows: [makeRow({ id: 42, status })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));
        };

        it('renders "Approved" tag for status APPROVED', () => {
            renderCardRequestsTab('APPROVED');
            expect(screen.getByText('Approved')).toBeInTheDocument();
        });

        it('renders "Rejected" tag for status REJECTED', () => {
            renderCardRequestsTab('REJECTED');
            expect(screen.getByText('Rejected')).toBeInTheDocument();
        });

        it('renders "Rejected" tag for status CANCELLED', () => {
            renderCardRequestsTab('CANCELLED');
            expect(screen.getByText('Rejected')).toBeInTheDocument();
        });

        it('renders "Pending" tag for status PENDING', () => {
            renderCardRequestsTab('PENDING');
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });

        it('renders "Pending" tag for an unknown status', () => {
            renderCardRequestsTab('UNKNOWN');
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });
    });

    describe('approve action on card-requests tab', () => {
        it('opens a confirmation (not an instant approve) when Approve is clicked (ADO 29146)', () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 7, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Approve'));

            expect(screen.getByText('Approve Card Request?')).toBeInTheDocument();
            expect(cardReqHook.approve).not.toHaveBeenCalled();
        });

        it('calls hook.approve with the numeric id once the confirmation is confirmed', async () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 7, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Approve'));
            fireEvent.click(screen.getByText('Approve request'));

            await waitFor(() => expect(cardReqHook.approve).toHaveBeenCalledWith(7));
        });

        it('dispatches showToast with success variant when approve returns truthy', async () => {
            setupHooks({ rows: [makeRow({ id: 7, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Approve'));
            fireEvent.click(screen.getByText('Approve request'));

            await waitFor(() =>
                expect(mockDispatch).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.objectContaining({ variant: 'success' }),
                    })
                )
            );
        });

        it('shows "Request approved." in the toast message', async () => {
            setupHooks({ rows: [makeRow({ id: 7, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Approve'));
            fireEvent.click(screen.getByText('Approve request'));

            await waitFor(() =>
                expect(showToast).toHaveBeenCalledWith(
                    expect.objectContaining({ description: 'Request approved successfully' })
                )
            );
        });

        it('does NOT dispatch toast when approve returns falsy', async () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 7, status: 'PENDING' })] });
            (cardReqHook.approve as Mock).mockResolvedValue(false);
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Approve'));
            fireEvent.click(screen.getByText('Approve request'));

            await waitFor(() => expect(cardReqHook.approve).toHaveBeenCalled());
            expect(mockDispatch).not.toHaveBeenCalled();
        });

        it('closes the confirmation without approving when Cancel is clicked', () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 7, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Approve'));
            fireEvent.click(screen.getByText('Cancel'));

            expect(screen.queryByText('Approve Card Request?')).not.toBeInTheDocument();
            expect(cardReqHook.approve).not.toHaveBeenCalled();
        });
    });

    describe('approve/reject confirmation on limit-increases tab (ADO 29146)', () => {
        it('opens a confirmation and only calls hook.approve once confirmed', async () => {
            const { limitHook } = setupHooks(
                {},
                { rows: [makeRow({ id: 11, status: 'PENDING' })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-limit-increases'));

            fireEvent.click(screen.getByText('Approve'));
            expect(screen.getByText('Approve Limit Increase?')).toBeInTheDocument();
            expect(limitHook.approve).not.toHaveBeenCalled();

            fireEvent.click(screen.getByText('Approve request'));
            await waitFor(() => expect(limitHook.approve).toHaveBeenCalledWith(11));
        });

        it('opens a confirmation and only calls hook.reject once confirmed', async () => {
            const { limitHook } = setupHooks(
                {},
                { rows: [makeRow({ id: 12, status: 'PENDING' })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-limit-increases'));

            fireEvent.click(screen.getByText('Reject'));
            expect(screen.getByText('Reject Limit Increase?')).toBeInTheDocument();
            expect(limitHook.reject).not.toHaveBeenCalled();

            fireEvent.click(screen.getByText('Reject request'));
            await waitFor(() => expect(limitHook.reject).toHaveBeenCalledWith(12, undefined));
        });
    });

    describe('approve/reject confirmation on physical-cards tab (ADO 29146)', () => {
        it('opens a confirmation and only calls hook.approve once confirmed', async () => {
            const { physHook } = setupHooks(
                {},
                {},
                { rows: [makeRow({ id: 21, status: 'PENDING' })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));

            fireEvent.click(screen.getByText('Approve'));
            expect(screen.getByText('Approve Physical Card Request?')).toBeInTheDocument();
            expect(physHook.approve).not.toHaveBeenCalled();

            fireEvent.click(screen.getByText('Approve request'));
            await waitFor(() => expect(physHook.approve).toHaveBeenCalledWith(21));
        });

        it('opens a confirmation and only calls hook.reject once confirmed', async () => {
            const { physHook } = setupHooks(
                {},
                {},
                { rows: [makeRow({ id: 22, status: 'PENDING' })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));

            fireEvent.click(screen.getByText('Reject'));
            expect(screen.getByText('Reject Physical Card Request?')).toBeInTheDocument();
            expect(physHook.reject).not.toHaveBeenCalled();

            fireEvent.click(screen.getByText('Reject request'));
            await waitFor(() => expect(physHook.reject).toHaveBeenCalledWith(22, undefined));
        });
    });

    describe('approving a physical card the plan does not cover', () => {
        const openPaidApproval = (rowOverrides = {}) => {
            hoisted.quota = PAID_QUOTA;
            const hooks = setupHooks(
                {},
                {},
                { rows: [makeRow({ id: 21, status: 'PENDING', cardIssuanceId: 8, ...rowOverrides })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));
            fireEvent.click(screen.getByText('Approve & pay'));
            return hooks;
        };

        it('says payment is next instead of warning the action cannot be undone', () => {
            openPaidApproval();

            expect(screen.getByText(/redirected to the payment screen/i)).toBeInTheDocument();
            expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
            expect(screen.getByText('Continue to payment')).toBeInTheDocument();
        });

        it('starts the purchase for the request rather than calling approve', async () => {
            const { physHook } = openPaidApproval();

            fireEvent.click(screen.getByText('Continue to payment'));

            await waitFor(() =>
                expect(hoisted.startPurchase).toHaveBeenCalledWith({
                    cardIssuanceId: '8',
                    holderName: 'Alice',
                    cardRequestId: 21,
                })
            );
            expect(physHook.approve).not.toHaveBeenCalled();
        });

        it('refuses a request with no source card instead of starting a payment', async () => {
            openPaidApproval({ cardIssuanceId: null });

            fireEvent.click(screen.getByText('Continue to payment'));

            await waitFor(() => expect(mockDispatch).toHaveBeenCalled());
            expect(hoisted.startPurchase).not.toHaveBeenCalled();
            expect(showToast).toHaveBeenCalledWith(
                expect.objectContaining({ variant: 'error' })
            );
        });

        it('keeps the confirmation open when the purchase could not be prepared', async () => {
            hoisted.startPurchase.mockResolvedValue(false);
            openPaidApproval();

            fireEvent.click(screen.getByText('Continue to payment'));

            await waitFor(() => expect(hoisted.startPurchase).toHaveBeenCalled());
            expect(screen.getByText('Continue to payment')).toBeInTheDocument();
        });

        it('still approves free of charge while the plan has a card left', async () => {
            const { physHook } = setupHooks(
                {},
                {},
                { rows: [makeRow({ id: 21, status: 'PENDING', cardIssuanceId: 8 })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));
            fireEvent.click(screen.getByText('Approve'));
            fireEvent.click(screen.getByText('Approve request'));

            await waitFor(() => expect(physHook.approve).toHaveBeenCalledWith(21));
            expect(hoisted.startPurchase).not.toHaveBeenCalled();
        });
    });

    describe('approve/reject confirmation on transactions tab (ADO 29146)', () => {
        it('opens a confirmation instead of deciding instantly when Approve is clicked', () => {
            setupHooks();
            render(<ApprovalRequests />);

            fireEvent.click(screen.getByText('Approve'));

            expect(screen.getByText('Approve Transaction?')).toBeInTheDocument();
        });

        it('opens a confirmation instead of deciding instantly when Reject is clicked', () => {
            setupHooks();
            render(<ApprovalRequests />);

            fireEvent.click(screen.getByText('Reject'));

            expect(screen.getByText('Reject Transaction?')).toBeInTheDocument();
        });
    });

    describe('reject action on card-requests tab', () => {
        it('opens a reason modal (not an instant reject) when Reject is clicked', () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 9, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Reject'));

            expect(screen.getByText('Reject card request')).toBeInTheDocument();
            expect(cardReqHook.reject).not.toHaveBeenCalled();
        });

        it('calls hook.reject with the numeric id and no note when confirmed blank (ADO 28852)', async () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 9, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Reject'));
            fireEvent.click(screen.getByText('Reject request'));

            await waitFor(() => expect(cardReqHook.reject).toHaveBeenCalledWith(9, undefined));
        });

        it('passes the typed reason through to hook.reject as the note (ADO 28852)', async () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 9, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Reject'));
            fireEvent.change(screen.getByPlaceholderText('Enter a reason (optional)'), {
                target: { value: 'Exceeds department budget' },
            });
            fireEvent.click(screen.getByText('Reject request'));

            await waitFor(() =>
                expect(cardReqHook.reject).toHaveBeenCalledWith(9, 'Exceeds department budget')
            );
        });

        it('shows "Request rejected successfully" in the toast message after confirming', async () => {
            setupHooks({ rows: [makeRow({ id: 9, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Reject'));
            fireEvent.click(screen.getByText('Reject request'));

            await waitFor(() =>
                expect(showToast).toHaveBeenCalledWith(
                    expect.objectContaining({ description: 'Request rejected successfully' })
                )
            );
        });

        it('closes the modal without rejecting when Cancel is clicked', async () => {
            const { cardReqHook } = setupHooks({ rows: [makeRow({ id: 9, status: 'PENDING' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            fireEvent.click(screen.getByText('Reject'));
            fireEvent.click(screen.getByText('Cancel'));

            // antd's Modal unmounts after its close transition, not synchronously on click.
            await waitFor(() =>
                expect(screen.queryByText('Reject card request')).not.toBeInTheDocument()
            );
            expect(cardReqHook.reject).not.toHaveBeenCalled();
        });

        it('does NOT render Approve/Reject buttons for non-Pending rows', () => {
            setupHooks({ rows: [makeRow({ id: 3, status: 'APPROVED' })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.queryByText('Approve')).not.toBeInTheDocument();
            expect(screen.queryByText('Reject')).not.toBeInTheDocument();
        });
    });

    describe('server-side filtering on card-requests tab', () => {
        const rows = [
            makeRow({
                id: 1,
                member: 'Alice',
                holderId: 101,
                status: 'PENDING',
                payload: {
                    cardType: 'Virtual',
                    requestedLimit: 10000,
                    currentLimit: null,
                    requestedAmount: null,
                    shipping: null,
                },
                reason: 'work',
            }),
            makeRow({
                id: 2,
                member: 'Bob',
                holderId: 102,
                status: 'PENDING',
                payload: {
                    cardType: 'Physical',
                    requestedLimit: 20000,
                    currentLimit: null,
                    requestedAmount: null,
                    shipping: null,
                },
                reason: 'travel',
            }),
        ];

        // Latest filters object passed as the 5th arg of the CARD_ISSUANCE/Virtual hook call.
        const latestCardReqFilters = () => {
            const calls = (useApprovalRequestsApi as Mock).mock.calls.filter(
                c => c[0] === 'CARD_ISSUANCE' && c[3] === 'Virtual'
            );
            return calls.length ? calls[calls.length - 1][4] : undefined;
        };

        it('renders the rows returned by the server (no client-side filtering)', () => {
            setupHooks({ rows });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.getByTestId('row-1')).toBeInTheDocument();
            expect(screen.getByTestId('row-2')).toBeInTheDocument();
        });

        it('passes the selected cardholder (by subCorporateId) to the server query', () => {
            setupHooks({ rows });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            // Cardholder option values are the member's holderId (subCorporateId), not the name.
            const selects = screen.getAllByTestId('approval-select');
            fireEvent.change(selects[0], { target: { value: '101' } });

            expect(latestCardReqFilters()?.cardholder).toBe('101');
        });

        it('passes the (debounced) search text to the server query', async () => {
            setupHooks({ rows });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            const searchInput = screen.getByPlaceholderText('Search');
            fireEvent.change(searchInput, { target: { value: 'travel' } });

            await waitFor(() => {
                expect(latestCardReqFilters()?.searchText).toBe('travel');
            });
        });
    });

    describe('mapCardRequest â€” column values', () => {
        it('falls back to "-" when member is null', () => {
            setupHooks({ rows: [makeRow({ id: 5, member: null })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.getByTestId('cell-member-5').textContent).toBe('-');
        });

        it('formats the requested limit in rupees', () => {
            setupHooks({
                rows: [
                    makeRow({
                        id: 6,
                        payload: {
                            cardType: 'Virtual',
                            requestedLimit: 50000,
                            currentLimit: null,
                            requestedAmount: null,
                            shipping: null,
                        },
                    }),
                ],
            });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            const limitCell = screen.getByTestId('cell-limit-6').textContent ?? '';
            expect(limitCell).toContain('50,000');
        });

        it('shows "-" for limit when requestedLimit is null', () => {
            setupHooks({
                rows: [
                    makeRow({
                        id: 7,
                        payload: {
                            cardType: 'Virtual',
                            requestedLimit: null,
                            currentLimit: null,
                            requestedAmount: null,
                            shipping: null,
                        },
                    }),
                ],
            });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.getByTestId('cell-limit-7').textContent).toBe('-');
        });
    });

    describe('mapPhysicalRequest â€” shipping address formatting', () => {
        it('renders full shipping address from payload', () => {
            const shipping = {
                addressLine1: '12 Main St',
                addressLine2: 'Apt 3',
                city: 'Bengaluru',
                state: 'Karnataka',
                pinCode: '560001',
            };
            setupHooks(
                {},
                {},
                {
                    rows: [
                        makeRow({
                            id: 20,
                            payload: {
                                cardType: null,
                                requestedLimit: null,
                                currentLimit: null,
                                requestedAmount: null,
                                shipping,
                            },
                        }),
                    ],
                }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));

            const addrCell = screen.getByTestId('cell-shippingAddress-20').textContent ?? '';
            expect(addrCell).toContain('Bengaluru, Karnataka');
            expect(addrCell).toContain('560001');
        });

        it('renders "-" when shipping is null', () => {
            setupHooks({}, {}, { rows: [makeRow({ id: 21 })] });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));

            expect(screen.getByTestId('cell-shippingAddress-21').textContent).toBe('-');
        });
    });

    describe('rejection reason visibility', () => {
        it('shows the decision note as a tooltip title on a Rejected card-request row', () => {
            setupHooks({
                rows: [makeRow({ id: 50, status: 'REJECTED', decisionNote: 'Budget exceeded' })],
            });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            const tooltip = screen.getByTestId('tooltip');
            expect(tooltip.dataset.title).toBe('Budget exceeded');
            expect(tooltip).toHaveTextContent('Rejected');
        });

        it('does NOT attach a tooltip on a non-Rejected row even when a decision note is present', () => {
            setupHooks({
                rows: [makeRow({ id: 51, status: 'APPROVED', decisionNote: 'Should not show' })],
            });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('does NOT attach a tooltip on a Rejected row when decisionNote is null', () => {
            setupHooks({
                rows: [makeRow({ id: 52, status: 'REJECTED', decisionNote: null })],
            });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
        });

        it('shows the decision note as a tooltip on a Rejected limit-increase row', () => {
            setupHooks(
                {},
                { rows: [makeRow({ id: 60, status: 'REJECTED', decisionNote: 'Limit too high' })] }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-limit-increases'));

            expect(screen.getByTestId('tooltip').dataset.title).toBe('Limit too high');
        });

        it('shows the decision note as a tooltip on a Rejected physical-card row', () => {
            setupHooks(
                {},
                {},
                {
                    rows: [
                        makeRow({
                            id: 70,
                            status: 'REJECTED',
                            decisionNote: 'Address unverifiable',
                        }),
                    ],
                }
            );
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-physical-cards'));

            expect(screen.getByTestId('tooltip').dataset.title).toBe('Address unverifiable');
        });
    });

    describe('loading state', () => {
        it('passes isLoading from hook to GenericTable on card-requests tab', () => {
            setupHooks({ isLoading: true });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.getByTestId('generic-table').dataset.loading).toBe('true');
        });

        it('passes isLoading=false to GenericTable once loaded', () => {
            setupHooks({ isLoading: false });
            render(<ApprovalRequests />);
            fireEvent.click(screen.getByTestId('tab-card-requests'));

            expect(screen.getByTestId('generic-table').dataset.loading).toBe('false');
        });
    });
});

// hookForTab's default arm returns physReq, so a missing branch would POST the right id but spin and refetch
// the PHYSICAL-CARDS list — the row would sit "Pending" with no error.
describe('ApprovalRequests — unfreeze requests tab', () => {
    it('renders the unfreeze queue with its own rows and explanatory note', () => {
        setupHooks({ rows: [makeRow({ id: 31, status: 'PENDING' })] });
        render(<ApprovalRequests />);
        fireEvent.click(screen.getByTestId('tab-unfreeze-requests'));

        expect(screen.getByText(/card their admin froze to be unfrozen/i)).toBeInTheDocument();
    });

    it('routes an approval through the UNFREEZE hook, not the physical-cards one', async () => {
        const unfreezeHook = makeHook({ rows: [makeRow({ id: 31, status: 'PENDING' })] });
        const physHook = makeHook({ rows: [makeRow({ id: 99, status: 'PENDING' })] });
        (useApprovalRequestsApi as Mock).mockImplementation((requestType: string) => {
            if (requestType === 'UNFREEZE') return unfreezeHook;
            return physHook;
        });

        render(<ApprovalRequests />);
        fireEvent.click(screen.getByTestId('tab-unfreeze-requests'));
        fireEvent.click(screen.getByText('Approve'));

        expect(screen.getByText('Approve Unfreeze Request?')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Approve request'));

        await waitFor(() => expect(unfreezeHook.approve).toHaveBeenCalledWith(31));
        expect(physHook.approve).not.toHaveBeenCalled();
    });

    it('titles the reject modal for an unfreeze request', () => {
        setupHooks({ rows: [makeRow({ id: 31, status: 'PENDING' })] });
        render(<ApprovalRequests />);
        fireEvent.click(screen.getByTestId('tab-unfreeze-requests'));
        fireEvent.click(screen.getByText('Reject'));

        expect(screen.getByText('Reject unfreeze request')).toBeInTheDocument();
    });
});
