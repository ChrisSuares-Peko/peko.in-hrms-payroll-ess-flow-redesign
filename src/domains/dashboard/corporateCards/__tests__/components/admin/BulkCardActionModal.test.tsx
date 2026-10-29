import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import BulkCardActionModal from '../../../components/admin/BulkCardActionModal';
import { useAdminCardsApi } from '../../../hooks/admin/useAdminCardsApi';
import { useBulkCardStateApi } from '../../../hooks/admin/useBulkCardStateApi';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'apiSlice/showToast', payload })),
}));

vi.mock('../../../hooks/admin/useAdminCardsApi', () => ({
    useAdminCardsApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useBulkCardStateApi', () => ({
    useBulkCardStateApi: vi.fn(),
}));

// Only the option list is a fixture — the reason-note sanitiser/validator come from the real module so
// these tests exercise the shipped rules rather than a copy of them that can drift.
vi.mock('../../../utils/cardsData', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../utils/cardsData')>()),
    FREEZE_REASON_OPTIONS: [
        { value: 1, label: 'Lost' },
        { value: 2, label: 'Stolen' },
        { value: 4, label: 'Others' },
    ],
}));

// Stub antd Modal: render children when open=true, nothing when open=false.
vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');

    // SelectInput renders its options as <Select.Option> children rather than an `options` prop, so the
    // stub has to accept children and expose Option.
    const MockSelect = ({ value, onChange, onBlur, name, placeholder, children }: any) => (
        <select
            data-testid="reason-select"
            name={name}
            aria-label={placeholder}
            onBlur={onBlur}
            value={value ?? ''}
            onChange={e => {
                const raw = e.target.value;
                if (!raw) {
                    onChange(undefined);
                    return;
                }
                const num = Number(raw);
                onChange(Number.isNaN(num) ? raw : num);
            }}
        >
            <option value="">Select a reason</option>
            {children}
        </select>
    );
    MockSelect.Option = ({ value, children }: any) => (
        <option value={String(value)}>{children}</option>
    );

    return {
        ...actual,
        Modal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
            open ? <div data-testid="modal">{children}</div> : null,
        Spin: () => <div data-testid="spin" />,
        Select: MockSelect,
    };
});

vi.mock('../../../components/common/modalProps', () => ({
    ROUNDED_MODAL_CLASSNAMES: {},
    MODAL_CLOSE_ICON: null,
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeCard = (
    overrides: Partial<{ key: string; last4: string; holder: string; type: string }> = {}
) => ({
    key: 'card-1',
    last4: '1234',
    holder: 'Alice Smith',
    type: 'Virtual',
    status: 'Active',
    department: 'Engineering',
    avatarText: 'AS',
    cardLimit: 10000,
    perTxnLimit: 10000,
    spent: 0,
    remaining: 10000,
    ...overrides,
});

const mockDispatch = vi.fn();

const defaultAdminCardsApi = {
    cards: [],
    total: 0,
    isLoading: false,
    refetch: vi.fn(),
};

const defaultBulkCardStateApi = {
    submitBulkCardState: vi.fn(),
    isLoading: false,
};

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (useAdminCardsApi as Mock).mockReturnValue(defaultAdminCardsApi);
    (useBulkCardStateApi as Mock).mockReturnValue({ ...defaultBulkCardStateApi });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BulkCardActionModal', () => {
    // -------------------------------------------------------------------------
    // Modal visibility
    // -------------------------------------------------------------------------
    describe('visibility', () => {
        it('does not render when open=false', () => {
            render(<BulkCardActionModal open={false} mode="freeze" onClose={vi.fn()} />);
            expect(screen.queryByTestId('modal')).toBeNull();
        });

        it('renders modal content when open=true', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.getByTestId('modal')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Loading state
    // -------------------------------------------------------------------------
    describe('loading state', () => {
        it('shows spinner while cards are loading', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultAdminCardsApi,
                isLoading: true,
            });
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.getByTestId('spin')).toBeInTheDocument();
        });

        it('hides spinner once cards have loaded', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultAdminCardsApi,
                isLoading: false,
                cards: [makeCard()],
                total: 1,
            });
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.queryByTestId('spin')).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // Empty states
    // -------------------------------------------------------------------------
    describe('empty states', () => {
        it('shows "No active cards to freeze" empty message for freeze mode', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.getByText('No active cards to freeze.')).toBeInTheDocument();
        });

        it('shows "No frozen cards to unfreeze" empty message for unfreeze mode', () => {
            render(<BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} />);
            expect(screen.getByText('No frozen cards to unfreeze.')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Title / description copy
    // -------------------------------------------------------------------------
    describe('mode-specific copy', () => {
        it('renders freeze title and description in freeze mode', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.getByText('Bulk freeze cards')).toBeInTheDocument();
            expect(screen.getByText(/Choose which active cards to freeze/)).toBeInTheDocument();
        });

        it('renders unfreeze title and description in unfreeze mode', () => {
            render(<BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} />);
            expect(screen.getByText('Bulk unfreeze cards')).toBeInTheDocument();
            expect(screen.getByText(/Choose which frozen cards to reactivate/)).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Card list rendering
    // -------------------------------------------------------------------------
    describe('card list', () => {
        it('renders each eligible card with last4 and holder', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultAdminCardsApi,
                cards: [
                    makeCard({ key: 'c1', last4: '1111', holder: 'Alice Smith' }),
                    makeCard({ key: 'c2', last4: '2222', holder: 'Bob Jones' }),
                ],
                total: 2,
            });
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.getByText(/•• 1111 · Alice Smith/)).toBeInTheDocument();
            expect(screen.getByText(/•• 2222 · Bob Jones/)).toBeInTheDocument();
        });

        it('shows batch-limit warning when total exceeds MAX_BULK (100)', () => {
            const cards = Array.from({ length: 100 }, (_, i) =>
                makeCard({ key: `c${i}`, last4: String(i).padStart(4, '0'), holder: `User ${i}` })
            );
            (useAdminCardsApi as Mock).mockReturnValue({ cards, total: 150, isLoading: false });
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(screen.getByText(/Showing the first 100 of 150 cards/)).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------------------------
    // Card selection
    // -------------------------------------------------------------------------
    describe('card selection', () => {
        const cards = [
            makeCard({ key: 'c1', last4: '1111', holder: 'Alice Smith' }),
            makeCard({ key: 'c2', last4: '2222', holder: 'Bob Jones' }),
        ];

        beforeEach(() => {
            (useAdminCardsApi as Mock).mockReturnValue({ cards, total: 2, isLoading: false });
        });

        it('CTA button is disabled when no card is selected', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            const freezeBtn = screen.getByRole('button', { name: 'Freeze cards' });
            expect(freezeBtn).toBeDisabled();
        });

        it('CTA button is enabled after selecting a card', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            const checkboxes = screen.getAllByRole('checkbox');
            // First checkbox is "Select all"; second is the first card.
            fireEvent.click(checkboxes[1]);
            const freezeBtn = screen.getByRole('button', { name: 'Freeze cards' });
            expect(freezeBtn).not.toBeDisabled();
        });

        it('Select all checkbox selects every card', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            const [selectAll] = screen.getAllByRole('checkbox');
            fireEvent.click(selectAll);
            const freezeBtn = screen.getByRole('button', { name: 'Freeze cards' });
            expect(freezeBtn).not.toBeDisabled();
        });
    });

    // -------------------------------------------------------------------------
    // Freeze flow — confirm step
    // -------------------------------------------------------------------------
    describe('freeze confirm step', () => {
        const cards = [makeCard({ key: 'c1', last4: '9999', holder: 'Test User' })];

        beforeEach(() => {
            (useAdminCardsApi as Mock).mockReturnValue({ cards, total: 1, isLoading: false });
        });

        const selectCardAndAdvance = () => {
            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));
        };

        it('advances to confirm step when Freeze cards is clicked with selection', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();
            expect(screen.getByText('Confirm freeze')).toBeInTheDocument();
        });

        it('shows correct selected count on confirm step', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();
            expect(screen.getByText(/You are about to freeze 1 card/)).toBeInTheDocument();
        });

        it('submit button on confirm step is disabled without reason and confirm text', async () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Freeze cards' })).toBeDisabled()
            );
        });

        it('submit button remains disabled if only FREEZE text is entered (no reason)', async () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Freeze cards' })).toBeDisabled()
            );
        });

        it('submit button is enabled when reason selected and FREEZE typed', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();

            const select = screen.getByTestId('reason-select');
            fireEvent.change(select, { target: { value: '1' } });

            const input = screen.getByPlaceholderText('Type');
            fireEvent.change(input, { target: { value: 'FREEZE' } });

            expect(screen.getByRole('button', { name: 'Freeze cards' })).not.toBeDisabled();
        });

        it('calls submitBulkCardState with action=freeze and selected card ids', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            const onClose = vi.fn();
            const onSuccess = vi.fn();
            render(
                <BulkCardActionModal open mode="freeze" onClose={onClose} onSuccess={onSuccess} />
            );
            selectCardAndAdvance();

            const select = screen.getByTestId('reason-select');
            fireEvent.change(select, { target: { value: '2' } });

            const input = screen.getByPlaceholderText('Type');
            fireEvent.change(input, { target: { value: 'FREEZE' } });

            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                expect(submitBulkCardState).toHaveBeenCalledWith({
                    action: 'freeze',
                    cardIds: ['c1'],
                    reason: 2,
                });
            });
        });

        // Figma 1218-31870: the confirm screen names the count, points at the type-to-confirm field,
        // and carries the Pine Labs attribution the select step already had.
        it('matches the confirm-screen copy and keeps the Pine Labs footer', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();

            expect(
                screen.getByText(/You are about to freeze 1 card\. Type FREEZE below to confirm\./)
            ).toBeInTheDocument();
            expect(screen.getByText('Select Reason')).toBeInTheDocument();
            expect(screen.getByTestId('pine-labs-footer')).toBeInTheDocument();
        });

        // The note is always offered so any freeze can carry detail, and the backend stores it for every
        // reason code. It only becomes mandatory for "Others", which says nothing on its own.
        it('always offers the note field, and marks it optional until Others is picked', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();
            expect(screen.getByPlaceholderText('Enter')).toBeInTheDocument();
            expect(screen.getByText('Enter Reason (optional)')).toBeInTheDocument();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '4' } });
            expect(screen.getByText('Enter Reason')).toBeInTheDocument();
            expect(screen.queryByText('Enter Reason (optional)')).toBeNull();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '1' } });
            expect(screen.getByText('Enter Reason (optional)')).toBeInTheDocument();
        });

        it('keeps the submit button disabled until the Others note is filled in', async () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '4' } });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Freeze cards' })).toBeDisabled()
            );

            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: 'Vendor audit in progress' },
            });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Freeze cards' })).not.toBeDisabled()
            );
        });

        // The note reaches the audit trail and the vendor, so it has to be a real sentence: at least
        // REASON_NOTE_MIN characters, no leading space, no run of two or more spaces.
        describe('Others note validation', () => {
            const openNoteField = () => {
                render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
                selectCardAndAdvance();
                fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '4' } });
                fireEvent.change(screen.getByPlaceholderText('Type'), {
                    target: { value: 'FREEZE' },
                });
                return screen.getByPlaceholderText('Enter') as HTMLTextAreaElement;
            };

            it('flags a note shorter than the minimum and keeps submit disabled', async () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.blur(note);

                expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: 'Freeze cards' })).toBeDisabled();
            });

            it('clears the error and enables submit once the note is long enough', async () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.blur(note);
                fireEvent.change(note, { target: { value: 'Card reported lost' } });

                await waitFor(() =>
                    expect(screen.queryByText(/at least 10 characters/i)).toBeNull()
                );
                expect(screen.getByRole('button', { name: 'Freeze cards' })).not.toBeDisabled();
            });

            it('strips a leading space as it is typed', () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: '   Card reported lost' } });

                expect(note.value).toBe('Card reported lost');
            });

            it('collapses consecutive spaces as they are typed', () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'Card    reported     lost' } });

                expect(note.value).toBe('Card reported lost');
            });

            // A trailing space has to survive typing — it is how you reach the next word — so it is
            // removed by the trim on submit rather than blocked at the keystroke.
            it('keeps a single trailing space while typing', () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'Card reported ' } });

                expect(note.value).toBe('Card reported ');
            });

            it('counts length after trimming, so spaces cannot pad a short note to the minimum', async () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost      ' } });
                fireEvent.blur(note);

                expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
                expect(screen.getByRole('button', { name: 'Freeze cards' })).toBeDisabled();
            });
        });

        it('sends the trimmed Others note alongside the reason code', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '4' } });
            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: '  Vendor audit in progress  ' },
            });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                expect(submitBulkCardState).toHaveBeenCalledWith({
                    action: 'freeze',
                    cardIds: ['c1'],
                    reason: 4,
                    reasonNote: 'Vendor audit in progress',
                });
            });
        });

        it('sends an optional note alongside a self-describing reason code', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: 'Left in the airport lounge' },
            });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                expect(submitBulkCardState).toHaveBeenCalledWith({
                    action: 'freeze',
                    cardIds: ['c1'],
                    reason: 1,
                    reasonNote: 'Left in the airport lounge',
                });
            });
        });

        it('omits reasonNote entirely when the optional note is left blank', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '2' } });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                expect(submitBulkCardState).toHaveBeenCalledWith({
                    action: 'freeze',
                    cardIds: ['c1'],
                    reason: 2,
                });
            });
        });

        it('calls onSuccess and onClose after a successful freeze', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            const onClose = vi.fn();
            const onSuccess = vi.fn();
            render(
                <BulkCardActionModal open mode="freeze" onClose={onClose} onSuccess={onSuccess} />
            );
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledTimes(1);
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });

        it('does not call onSuccess when API returns falsy (failure)', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue(null);
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            const onClose = vi.fn();
            const onSuccess = vi.fn();
            render(
                <BulkCardActionModal open mode="freeze" onClose={onClose} onSuccess={onSuccess} />
            );
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => expect(submitBulkCardState).toHaveBeenCalled());
            expect(onSuccess).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });

        it('dispatches a warning toast when some cards fail', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 2 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            render(
                <BulkCardActionModal open mode="freeze" onClose={vi.fn()} onSuccess={vi.fn()} />
            );
            selectCardAndAdvance();

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                const { calls } = mockDispatch.mock;
                const warningCall = calls.find(
                    ([action]: any[]) => action?.payload?.variant === 'warning'
                );
                expect(warningCall).toBeDefined();
            });
        });
    });

    // -------------------------------------------------------------------------
    // Unfreeze flow — direct submit (no confirm step)
    // -------------------------------------------------------------------------
    describe('unfreeze flow', () => {
        const frozenCards = [
            makeCard({ key: 'f1', last4: '3333', holder: 'Frozen User', type: 'Physical' }),
        ];

        beforeEach(() => {
            (useAdminCardsApi as Mock).mockReturnValue({
                cards: frozenCards,
                total: 1,
                isLoading: false,
            });
        });

        it('calls submitBulkCardState directly (no confirm step) for unfreeze', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            const onClose = vi.fn();
            const onSuccess = vi.fn();
            render(
                <BulkCardActionModal open mode="unfreeze" onClose={onClose} onSuccess={onSuccess} />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(screen.getByRole('button', { name: 'Unfreeze cards' }));

            await waitFor(() => {
                expect(submitBulkCardState).toHaveBeenCalledWith({
                    action: 'unfreeze',
                    cardIds: ['f1'],
                });
            });
            expect(screen.queryByText('Confirm bulk freeze')).toBeNull();
        });

        it('calls onSuccess and onClose after successful unfreeze', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            const onClose = vi.fn();
            const onSuccess = vi.fn();
            render(
                <BulkCardActionModal open mode="unfreeze" onClose={onClose} onSuccess={onSuccess} />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(screen.getByRole('button', { name: 'Unfreeze cards' }));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledTimes(1);
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });

        it('unfreeze payload does not include reason field', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 0, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            render(<BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} />);

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(screen.getByRole('button', { name: 'Unfreeze cards' }));

            await waitFor(() => expect(submitBulkCardState).toHaveBeenCalled());
            const [payload] = submitBulkCardState.mock.calls[0];
            expect(payload).not.toHaveProperty('reason');
        });
    });

    // -------------------------------------------------------------------------
    // Cancel / close
    // -------------------------------------------------------------------------
    describe('cancel behaviour', () => {
        it('calls onClose when Cancel is clicked on the select step', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                cards: [makeCard()],
                total: 1,
                isLoading: false,
            });
            const onClose = vi.fn();
            render(<BulkCardActionModal open mode="freeze" onClose={onClose} />);
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when Cancel is clicked on the confirm step', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                cards: [makeCard()],
                total: 1,
                isLoading: false,
            });
            const onClose = vi.fn();
            render(<BulkCardActionModal open mode="freeze" onClose={onClose} />);

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    // -------------------------------------------------------------------------
    // Toast dispatching
    // -------------------------------------------------------------------------
    describe('toast dispatch', () => {
        it('dispatches success toast with correct card count after freeze', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 2, skipped: 1, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            const cards = [
                makeCard({ key: 'c1', last4: '1111', holder: 'Alice' }),
                makeCard({ key: 'c2', last4: '2222', holder: 'Bob' }),
            ];
            (useAdminCardsApi as Mock).mockReturnValue({ cards, total: 2, isLoading: false });

            render(
                <BulkCardActionModal open mode="freeze" onClose={vi.fn()} onSuccess={vi.fn()} />
            );

            const [selectAll] = screen.getAllByRole('checkbox');
            fireEvent.click(selectAll);
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            fireEvent.change(screen.getByTestId('reason-select'), { target: { value: '1' } });
            fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value: 'FREEZE' } });
            fireEvent.click(screen.getByRole('button', { name: 'Freeze cards' }));

            await waitFor(() => {
                const { calls } = mockDispatch.mock;
                const successCall = calls.find(
                    ([action]: any[]) =>
                        action?.payload?.variant === 'success' &&
                        action?.payload?.description?.includes('2 Card(s) frozen')
                );
                expect(successCall).toBeDefined();
            });
        });

        it('dispatches success toast after unfreeze (skipped count not included in message)', async () => {
            const submitBulkCardState = vi.fn().mockResolvedValue({
                data: { summary: { succeeded: 1, skipped: 3, failed: 0 } },
            });
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState,
                isLoading: false,
            });

            (useAdminCardsApi as Mock).mockReturnValue({
                cards: [makeCard({ key: 'c1' })],
                total: 1,
                isLoading: false,
            });

            render(
                <BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} onSuccess={vi.fn()} />
            );

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);
            fireEvent.click(screen.getByRole('button', { name: 'Unfreeze cards' }));

            await waitFor(() => {
                const { calls } = mockDispatch.mock;
                const successCall = calls.find(
                    ([action]: any[]) =>
                        action?.payload?.variant === 'success' &&
                        action?.payload?.description?.includes('1 Card(s) unfrozen')
                );
                expect(successCall).toBeDefined();
            });
        });
    });

    // -------------------------------------------------------------------------
    // Submitting loading state (unfreeze path where spinner is shown on CTA)
    // -------------------------------------------------------------------------
    describe('submitting state', () => {
        it('CTA button shows loading state while submitting (unfreeze)', () => {
            (useBulkCardStateApi as Mock).mockReturnValue({
                submitBulkCardState: vi.fn(),
                isLoading: true,
            });
            (useAdminCardsApi as Mock).mockReturnValue({
                cards: [makeCard({ key: 'c1' })],
                total: 1,
                isLoading: false,
            });

            render(<BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} />);

            const checkboxes = screen.getAllByRole('checkbox');
            fireEvent.click(checkboxes[1]);

            // antd loading Button adds aria-label="loading" to the spinner icon, making the
            // accessible name "loading Unfreeze cards" — use a regex to match partially.
            const unfreezeBtn = screen.getByRole('button', { name: /unfreeze cards/i });
            // antd v5 Button with loading=true adds ant-btn-loading class (no aria-busy/disabled)
            expect(unfreezeBtn).toHaveClass('ant-btn-loading');
        });
    });

    // -------------------------------------------------------------------------
    // useAdminCardsApi receives correct status filter per mode
    // -------------------------------------------------------------------------
    describe('API filter per mode', () => {
        it('requests status=Active cards for freeze mode', () => {
            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);
            expect(useAdminCardsApi).toHaveBeenCalledWith(1, 100, undefined, undefined, 'Active');
        });

        it('requests status=Frozen cards for unfreeze mode', () => {
            render(<BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} />);
            expect(useAdminCardsApi).toHaveBeenCalledWith(1, 100, undefined, undefined, 'Frozen');
        });
    });

    // -------------------------------------------------------------------------
    // Termination-locked cards. The server answers 409 for these, so listing one only lets an admin pick
    // a card guaranteed to come back in the "could not be updated" count.
    // -------------------------------------------------------------------------
    describe('cards awaiting termination', () => {
        const setCards = (cards: unknown[]) =>
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultAdminCardsApi,
                cards,
                total: cards.length,
            });

        const openUnfreeze = () =>
            render(<BulkCardActionModal open mode="unfreeze" onClose={vi.fn()} />);

        it('does not list a frozen card with a termination requested', () => {
            setCards([
                makeCard({ key: 'c1', last4: '1111', holder: 'Alice Smith' }),
                {
                    ...makeCard({ key: 'c2', last4: '2222', holder: 'Bob Jones' }),
                    terminationStatus: 'REQUESTED',
                },
            ]);

            openUnfreeze();

            expect(screen.getByText(/1111/)).toBeInTheDocument();
            expect(screen.queryByText(/2222/)).not.toBeInTheDocument();
        });

        // The server locks a completed termination too, so the list must not stop at REQUESTED.
        it('does not list a frozen card whose termination already completed', () => {
            setCards([
                { ...makeCard({ key: 'c1', last4: '1111' }), terminationStatus: 'COMPLETED' },
            ]);

            openUnfreeze();

            expect(screen.queryByText(/1111/)).not.toBeInTheDocument();
        });

        // Select-all reads the same list, so a hidden card must not reach the API through it either.
        it('leaves a hidden card out of Select all, and out of the request', () => {
            const submitBulkCardState = vi.fn();
            (useBulkCardStateApi as Mock).mockReturnValue({
                ...defaultBulkCardStateApi,
                submitBulkCardState,
            });
            setCards([
                makeCard({ key: 'c1', last4: '1111' }),
                { ...makeCard({ key: 'c2', last4: '2222' }), terminationStatus: 'REQUESTED' },
            ]);

            openUnfreeze();
            fireEvent.click(screen.getAllByRole('checkbox')[0]);
            fireEvent.click(screen.getByRole('button', { name: /unfreeze cards/i }));

            expect(submitBulkCardState).toHaveBeenCalledWith({
                action: 'unfreeze',
                cardIds: ['c1'],
            });
        });

        it('counts only the listed cards in the header count', () => {
            setCards([
                makeCard({ key: 'c1', last4: '1111' }),
                { ...makeCard({ key: 'c2', last4: '2222' }), terminationStatus: 'REQUESTED' },
                { ...makeCard({ key: 'c3', last4: '3333' }), terminationStatus: 'REQUESTED' },
            ]);

            openUnfreeze();

            expect(screen.getByText('(1)')).toBeInTheDocument();
        });

        // Hiding rows silently reads as cards having gone missing from the Cards table.
        it('says how many were withheld and why', () => {
            setCards([
                makeCard({ key: 'c1', last4: '1111' }),
                { ...makeCard({ key: 'c2', last4: '2222' }), terminationStatus: 'REQUESTED' },
            ]);

            openUnfreeze();

            expect(
                screen.getByText(/1 frozen card awaiting termination is not listed/i)
            ).toBeInTheDocument();
        });

        it('pluralises the withheld notice', () => {
            setCards([
                { ...makeCard({ key: 'c1', last4: '1111' }), terminationStatus: 'REQUESTED' },
                { ...makeCard({ key: 'c2', last4: '2222' }), terminationStatus: 'COMPLETED' },
            ]);

            openUnfreeze();

            expect(
                screen.getByText(/2 frozen cards awaiting termination are not listed/i)
            ).toBeInTheDocument();
        });

        it('says nothing when every frozen card can be unfrozen', () => {
            setCards([makeCard({ key: 'c1', last4: '1111' })]);

            openUnfreeze();

            expect(screen.queryByText(/awaiting termination/i)).not.toBeInTheDocument();
        });

        it('falls back to the empty state when every frozen card is locked', () => {
            setCards([
                { ...makeCard({ key: 'c1', last4: '1111' }), terminationStatus: 'REQUESTED' },
            ]);

            openUnfreeze();

            expect(screen.getByText('No frozen cards to unfreeze.')).toBeInTheDocument();
        });

        // Freezing is a different rule — those cards are Active, and the freeze list must not shrink.
        it('does not filter the freeze list', () => {
            (useAdminCardsApi as Mock).mockReturnValue({
                ...defaultAdminCardsApi,
                cards: [
                    { ...makeCard({ key: 'c1', last4: '1111' }), terminationStatus: 'REQUESTED' },
                ],
                total: 1,
            });

            render(<BulkCardActionModal open mode="freeze" onClose={vi.fn()} />);

            expect(screen.getByText(/1111/)).toBeInTheDocument();
            expect(screen.queryByText(/awaiting termination/i)).not.toBeInTheDocument();
        });
    });
});
