import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector, useAppDispatch } from '@src/hooks/store';

import { exportCardAudit } from '../../../api/admin/cardLimitsApi';
import AuditTrailModal from '../../../components/admin/AuditTrailModal';
import { useAuditTrailApi } from '../../../hooks/admin/useAuditTrailApi';
import { CardAuditEvent } from '../../../utils/types';

// â”€â”€â”€ Module mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: unknown) => ({ type: 'apiSlice/showToast', payload })),
}));

vi.mock('../../../hooks/admin/useAuditTrailApi', () => ({
    useAuditTrailApi: vi.fn(),
}));

vi.mock('../../../api/admin/cardLimitsApi', () => ({
    exportCardAudit: vi.fn(),
}));

// SVG icon assets
vi.mock('../../../assets/icons/control.svg', () => ({ default: 'control.svg' }));
vi.mock('../../../assets/icons/lifeCycle.svg', () => ({ default: 'lifeCycle.svg' }));
vi.mock('../../../assets/icons/limit.svg', () => ({ default: 'limit.svg' }));
vi.mock('../../../assets/icons/security.svg', () => ({ default: 'security.svg' }));

// modalProps â€“ stub PineLabsFooter so it is detectable in assertions
vi.mock('../../../components/common/modalProps', () => ({
    ROUNDED_MODAL_CLASSNAMES: { content: 'rounded-3xl' },
    MODAL_CLOSE_ICON: null,
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

vi.mock('@ant-design/icons', () => ({
    DownloadOutlined: () => <span />,
    CloseCircleOutlined: () => <span />,
}));

// Antd stubs
vi.mock('antd', () => ({
    Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
        open ? <div data-testid="audit-modal">{children}</div> : null,

    Segmented: ({
        value,
        onChange,
        options,
    }: {
        value: string;
        onChange: (v: string) => void;
        options: string[];
    }) => (
        <div data-testid="segmented">
            {options.map((opt: string) => (
                <button
                    type="button"
                    key={opt}
                    data-testid={`filter-${opt.replace(/\s+/g, '-').toLowerCase()}`}
                    aria-pressed={value === opt}
                    onClick={() => onChange(opt)}
                >
                    {opt}
                </button>
            ))}
        </div>
    ),

    Button: ({
        children,
        onClick,
        loading,
        disabled,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        loading?: boolean;
        disabled?: boolean;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={!!disabled || !!loading}
            data-loading={loading ? 'true' : 'false'}
        >
            {children}
        </button>
    ),

    Typography: {
        Title: ({ children }: { children: React.ReactNode }) => <h4>{children}</h4>,
        Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
    },
}));

// â”€â”€â”€ Fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const makeEvent = (overrides: Partial<CardAuditEvent> = {}): CardAuditEvent => ({
    key: 'e1',
    title: 'Card frozen',
    description: 'Manual freeze via admin panel',
    timestamp: '2024-10-15 11:00',
    actor: 'Admin User',
    category: 'Lifecycle',
    ...overrides,
});

const mockAuth = { role: 'admin', id: 1 };

const defaultProps = {
    open: true,
    onClose: vi.fn(),
    last4: '1234',
    cardIssuanceId: 'ci-abc-123',
};

// â”€â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('AuditTrailModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: (s: unknown) => unknown) =>
            fn({ reducer: { auth: mockAuth } })
        );
        (useAppDispatch as unknown as Mock).mockReturnValue(vi.fn());
        (useAuditTrailApi as Mock).mockReturnValue({ events: [], isLoading: false });
    });

    // â”€â”€ Visibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('visibility', () => {
        it('does not render modal content when open=false', () => {
            render(<AuditTrailModal {...defaultProps} open={false} />);
            expect(screen.queryByTestId('audit-modal')).toBeNull();
        });

        it('renders modal content when open=true', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByTestId('audit-modal')).toBeInTheDocument();
        });
    });

    // â”€â”€ Title & subtitle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('title', () => {
        it('shows a card-specific title when last4 is provided', () => {
            render(<AuditTrailModal {...defaultProps} last4="1234" />);
            expect(screen.getByText('Audit trail · •• 1234')).toBeInTheDocument();
        });

        it('shows generic "Audit Trail" when last4 is not provided', () => {
            render(<AuditTrailModal {...defaultProps} last4={undefined} />);
            expect(screen.getByText('Audit Trail')).toBeInTheDocument();
        });

        it('renders the subtitle text', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(
                screen.getByText(
                    'Chronological log of every change and action performed on this card.'
                )
            ).toBeInTheDocument();
        });
    });

    // â”€â”€ Filter pills â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('filter pills', () => {
        it('renders all five filter buttons', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByTestId('filter-all-events')).toBeInTheDocument();
            expect(screen.getByTestId('filter-lifecycle')).toBeInTheDocument();
            expect(screen.getByTestId('filter-limits')).toBeInTheDocument();
            expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
            expect(screen.getByTestId('filter-security')).toBeInTheDocument();
        });

        it('"All events" is selected by default', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByTestId('filter-all-events')).toHaveAttribute('aria-pressed', 'true');
        });
    });

    // â”€â”€ Loading state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('loading state', () => {
        it('shows "Loadingâ€¦" when isLoading=true', () => {
            (useAuditTrailApi as Mock).mockReturnValue({ events: [], isLoading: true });
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByText('Loading…')).toBeInTheDocument();
        });

        it('does not render event rows while loading', () => {
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [makeEvent()],
                isLoading: true,
            });
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.queryByText('Card frozen')).toBeNull();
        });
    });

    // â”€â”€ Empty state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('empty state', () => {
        it('shows "No audit events found." when there are no events and not loading', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByText('No audit events found.')).toBeInTheDocument();
        });
    });

    // â”€â”€ Event list rendering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('event list', () => {
        const events: CardAuditEvent[] = [
            makeEvent({
                key: 'e1',
                title: 'Card frozen',
                description: 'Manual freeze',
                timestamp: '2024-10-15 11:00',
                actor: 'Admin User',
                category: 'Lifecycle',
            }),
            makeEvent({
                key: 'e2',
                title: 'Per-transaction limit updated',
                description: 'Changed to â‚¹15,000',
                timestamp: '2024-10-16 09:00',
                actor: 'Finance Admin',
                category: 'Limits',
            }),
            makeEvent({
                key: 'e3',
                title: 'ATM category blocked',
                description: 'Blocked ATM & Cash',
                timestamp: '2024-10-17 08:00',
                actor: 'System',
                category: 'Controls',
            }),
            makeEvent({
                key: 'e4',
                title: 'PIN changed',
                description: 'User-initiated PIN update',
                timestamp: '2024-10-18 07:00',
                actor: 'Cardholder',
                category: 'Security',
            }),
        ];

        beforeEach(() => {
            (useAuditTrailApi as Mock).mockReturnValue({ events, isLoading: false });
        });

        it('renders the title of every event', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByText('Card frozen')).toBeInTheDocument();
            expect(screen.getByText('Per-transaction limit updated')).toBeInTheDocument();
            expect(screen.getByText('ATM category blocked')).toBeInTheDocument();
            expect(screen.getByText('PIN changed')).toBeInTheDocument();
        });

        it('renders the actor for each event', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByText(/Admin User/)).toBeInTheDocument();
            expect(screen.getByText(/Finance Admin/)).toBeInTheDocument();
            expect(screen.getByText(/System/)).toBeInTheDocument();
            expect(screen.getByText(/Cardholder/)).toBeInTheDocument();
        });

        it('renders timestamp Â· actor line for each event', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByText(/2024-10-15 11:00 · Admin User/)).toBeInTheDocument();
            expect(screen.getByText(/2024-10-16 09:00 · Finance Admin/)).toBeInTheDocument();
        });

        it('renders the category pill for every event', () => {
            render(<AuditTrailModal {...defaultProps} />);
            // The Segmented filter buttons also render these labels, so use getAllByText
            expect(screen.getAllByText('Lifecycle').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Limits').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Controls').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Security').length).toBeGreaterThan(0);
        });

        it('renders the description of each event', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByText('Manual freeze')).toBeInTheDocument();
            expect(screen.getByText('Changed to â‚¹15,000')).toBeInTheDocument();
        });
    });

    // â”€â”€ Category filtering â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('category filtering', () => {
        const events: CardAuditEvent[] = [
            makeEvent({ key: 'e1', title: 'Card issued', category: 'Lifecycle' }),
            makeEvent({ key: 'e2', title: 'Limit raised', category: 'Limits' }),
            makeEvent({ key: 'e3', title: 'Merchant blocked', category: 'Controls' }),
            makeEvent({ key: 'e4', title: 'PIN reset', category: 'Security' }),
        ];

        beforeEach(() => {
            (useAuditTrailApi as Mock).mockReturnValue({ events, isLoading: false });
        });

        it('shows only Lifecycle events when Lifecycle filter is clicked', () => {
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-lifecycle'));
            expect(screen.getByText('Card issued')).toBeInTheDocument();
            expect(screen.queryByText('Limit raised')).toBeNull();
            expect(screen.queryByText('Merchant blocked')).toBeNull();
            expect(screen.queryByText('PIN reset')).toBeNull();
        });

        it('shows only Limits events when Limits filter is clicked', () => {
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-limits'));
            expect(screen.getByText('Limit raised')).toBeInTheDocument();
            expect(screen.queryByText('Card issued')).toBeNull();
            expect(screen.queryByText('Merchant blocked')).toBeNull();
            expect(screen.queryByText('PIN reset')).toBeNull();
        });

        it('shows only Controls events when Controls filter is clicked', () => {
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-controls'));
            expect(screen.getByText('Merchant blocked')).toBeInTheDocument();
            expect(screen.queryByText('Card issued')).toBeNull();
            expect(screen.queryByText('Limit raised')).toBeNull();
            expect(screen.queryByText('PIN reset')).toBeNull();
        });

        it('shows only Security events when Security filter is clicked', () => {
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-security'));
            expect(screen.getByText('PIN reset')).toBeInTheDocument();
            expect(screen.queryByText('Card issued')).toBeNull();
            expect(screen.queryByText('Limit raised')).toBeNull();
            expect(screen.queryByText('Merchant blocked')).toBeNull();
        });

        it('restores all events when "All events" is clicked after a category filter', () => {
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-lifecycle'));
            fireEvent.click(screen.getByTestId('filter-all-events'));
            expect(screen.getByText('Card issued')).toBeInTheDocument();
            expect(screen.getByText('Limit raised')).toBeInTheDocument();
            expect(screen.getByText('Merchant blocked')).toBeInTheDocument();
            expect(screen.getByText('PIN reset')).toBeInTheDocument();
        });

        it('shows empty state when no events match the active filter', () => {
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [makeEvent({ key: 'e1', title: 'Card issued', category: 'Lifecycle' })],
                isLoading: false,
            });
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-limits'));
            expect(screen.getByText('No audit events found.')).toBeInTheDocument();
        });
    });

    // â”€â”€ Export CSV button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Export CSV button', () => {
        it('is disabled when there are no events', () => {
            render(<AuditTrailModal {...defaultProps} />);
            const btn = screen.getByText('Export CSV').closest('button');
            expect(btn).toBeDisabled();
        });

        it('is enabled when events are present', () => {
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [makeEvent()],
                isLoading: false,
            });
            render(<AuditTrailModal {...defaultProps} />);
            const btn = screen.getByText('Export CSV').closest('button');
            expect(btn).not.toBeDisabled();
        });

        it('remains enabled when a category filter hides all results but underlying events exist', () => {
            // The component disables Export CSV based on the filtered events count (events.length === 0),
            // not allEvents.length. So filtering to a category with no matches disables the button.
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [makeEvent({ key: 'e1', category: 'Lifecycle' })],
                isLoading: false,
            });
            render(<AuditTrailModal {...defaultProps} />);
            fireEvent.click(screen.getByTestId('filter-limits'));
            const btn = screen.getByText('Export CSV').closest('button');
            expect(btn).toBeDisabled();
        });

        it('calls exportCardAudit with role, id, and cardIssuanceId on click', async () => {
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [makeEvent()],
                isLoading: false,
            });
            const blob = new Blob(['a,b'], { type: 'text/csv' });
            (exportCardAudit as Mock).mockResolvedValue(blob);

            const createObjectURL = vi.fn(() => 'blob:http://localhost/fake');
            const revokeObjectURL = vi.fn();
            Object.defineProperty(window, 'URL', {
                value: { createObjectURL, revokeObjectURL },
                writable: true,
            });

            render(<AuditTrailModal {...defaultProps} cardIssuanceId="ci-abc-123" />);
            fireEvent.click(screen.getByText('Export CSV').closest('button')!);

            await waitFor(() => {
                expect(exportCardAudit).toHaveBeenCalledWith('admin', 1, 'ci-abc-123');
            });
        });

        it('does not call exportCardAudit when cardIssuanceId is undefined', async () => {
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [makeEvent()],
                isLoading: false,
            });
            render(<AuditTrailModal {...defaultProps} cardIssuanceId={undefined} />);
            fireEvent.click(screen.getByText('Export CSV').closest('button')!);

            await waitFor(() => {
                expect(exportCardAudit).not.toHaveBeenCalled();
            });
        });
    });

    // â”€â”€ Close button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Close button', () => {
        it('calls onClose when the Close button is clicked', () => {
            const onClose = vi.fn();
            render(<AuditTrailModal {...defaultProps} onClose={onClose} />);
            fireEvent.click(screen.getByText('Close'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('resets the active filter to "All events" after closing and re-opening', () => {
            (useAuditTrailApi as Mock).mockReturnValue({
                events: [
                    makeEvent({ key: 'e1', title: 'Card issued', category: 'Lifecycle' }),
                    makeEvent({ key: 'e2', title: 'Limit raised', category: 'Limits' }),
                ],
                isLoading: false,
            });

            const onClose = vi.fn();
            const { rerender } = render(<AuditTrailModal {...defaultProps} onClose={onClose} />);

            // Apply a category filter
            fireEvent.click(screen.getByTestId('filter-lifecycle'));
            expect(screen.queryByText('Limit raised')).toBeNull();

            // Click Close â€” this should call onClose and reset the filter internally
            fireEvent.click(screen.getByText('Close'));
            expect(onClose).toHaveBeenCalledTimes(1);

            // Simulate parent re-opening the modal
            rerender(<AuditTrailModal {...defaultProps} onClose={onClose} open />);

            // After re-open, "All events" should be selected and both events visible
            expect(screen.getByTestId('filter-all-events')).toHaveAttribute('aria-pressed', 'true');
            expect(screen.getByText('Card issued')).toBeInTheDocument();
            expect(screen.getByText('Limit raised')).toBeInTheDocument();
        });
    });

    // â”€â”€ useAuditTrailApi arguments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('useAuditTrailApi call arguments', () => {
        it('passes cardIssuanceId to the hook when open=true', () => {
            render(<AuditTrailModal {...defaultProps} open cardIssuanceId="ci-xyz" />);
            expect(useAuditTrailApi).toHaveBeenCalledWith('ci-xyz');
        });

        it('passes null to the hook when open=false', () => {
            render(<AuditTrailModal {...defaultProps} open={false} cardIssuanceId="ci-xyz" />);
            expect(useAuditTrailApi).toHaveBeenCalledWith(null);
        });

        it('passes null to the hook when cardIssuanceId is undefined and open=true', () => {
            render(<AuditTrailModal {...defaultProps} open cardIssuanceId={undefined} />);
            expect(useAuditTrailApi).toHaveBeenCalledWith(null);
        });
    });

    // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('PineLabsFooter', () => {
        it('renders the Pine Labs footer inside the modal', () => {
            render(<AuditTrailModal {...defaultProps} />);
            expect(screen.getByTestId('pine-labs-footer')).toBeInTheDocument();
        });
    });
});
