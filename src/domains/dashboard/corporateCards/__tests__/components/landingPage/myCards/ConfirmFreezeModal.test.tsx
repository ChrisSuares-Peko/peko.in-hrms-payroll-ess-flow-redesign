import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ConfirmFreezeModal from '../../../../components/landingPage/myCards/ConfirmFreezeModal';
import { MyCard } from '../../../../utils/types';

// Only the option list is a fixture — the reason-note sanitiser/validator come from the real module so
// these tests exercise the shipped rules rather than a copy of them that can drift.
vi.mock('../../../../utils/cardsData', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../../utils/cardsData')>()),
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
        Select: MockSelect,
    };
});

vi.mock('../../../../components/common/modalProps', () => ({
    ROUNDED_MODAL_CLASSNAMES: {},
    MODAL_CLOSE_ICON: null,
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

const card = { key: 'c1', last4: '1861', status: 'Active' } as unknown as MyCard;

const onConfirm = vi.fn();
const onClose = vi.fn();

const open = (props: Partial<React.ComponentProps<typeof ConfirmFreezeModal>> = {}) =>
    render(<ConfirmFreezeModal card={card} onClose={onClose} onConfirm={onConfirm} {...props} />);

const freezeButton = () => screen.getByRole('button', { name: /Freeze card/ });
const pickReason = (value: string) =>
    fireEvent.change(screen.getByTestId('reason-select'), { target: { value } });
const typeConfirm = (value = 'FREEZE') =>
    fireEvent.change(screen.getByPlaceholderText('Type'), { target: { value } });

beforeEach(() => {
    vi.clearAllMocks();
});

describe('ConfirmFreezeModal', () => {
    it('renders nothing when no card is selected', () => {
        render(<ConfirmFreezeModal card={null} onClose={onClose} onConfirm={onConfirm} />);
        expect(screen.queryByTestId('modal')).toBeNull();
    });

    it('asks for a reason alongside the type-to-confirm field', () => {
        open();
        expect(screen.getByTestId('reason-select')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Type')).toBeInTheDocument();
        expect(
            screen.getByText(/You are about to freeze 1 card\. Type FREEZE below to confirm\./)
        ).toBeInTheDocument();
    });

    describe('the free-text reason is for Others only', () => {
        it('is hidden until Others is picked', () => {
            open();
            expect(screen.queryByPlaceholderText('Enter')).toBeNull();
        });

        it('stays hidden for a self-describing reason', () => {
            open();
            pickReason('1');
            expect(screen.queryByPlaceholderText('Enter')).toBeNull();
        });

        it('appears when Others is picked', () => {
            open();
            pickReason('4');
            expect(screen.getByPlaceholderText('Enter')).toBeInTheDocument();
        });

        it('disappears again when the reason changes away from Others', () => {
            open();
            pickReason('4');
            pickReason('2');
            expect(screen.queryByPlaceholderText('Enter')).toBeNull();
        });
    });

    describe('submit gating', () => {
        it('is disabled on open', async () => {
            open();
            await waitFor(() => expect(freezeButton()).toBeDisabled());
        });

        it('stays disabled with FREEZE typed but no reason', async () => {
            open();
            typeConfirm();
            await waitFor(() => expect(freezeButton()).toBeDisabled());
        });

        it('stays disabled with a reason but no FREEZE', async () => {
            open();
            pickReason('1');
            await waitFor(() => expect(freezeButton()).toBeDisabled());
        });

        it('stays disabled when the confirm word is misspelled', async () => {
            open();
            pickReason('1');
            typeConfirm('freeze');
            await waitFor(() => expect(freezeButton()).toBeDisabled());
        });

        it('stays disabled when Others carries no note', async () => {
            open();
            pickReason('4');
            typeConfirm();
            await waitFor(() => expect(freezeButton()).toBeDisabled());
        });

        it('stays disabled when the Others note is shorter than the minimum', async () => {
            open();
            pickReason('4');
            typeConfirm();
            fireEvent.change(screen.getByPlaceholderText('Enter'), { target: { value: 'lost' } });
            await waitFor(() => expect(freezeButton()).toBeDisabled());
        });

        it('enables once a self-describing reason and FREEZE are in place', async () => {
            open();
            pickReason('1');
            typeConfirm();
            await waitFor(() => expect(freezeButton()).not.toBeDisabled());
        });

        it('enables when the reason is picked last, with no blur in between', async () => {
            open();
            typeConfirm();
            pickReason('1');
            await waitFor(() => expect(freezeButton()).not.toBeDisabled());
        });
    });

    describe('confirming', () => {
        it('reports the reason code with no note for a self-describing reason', async () => {
            open();
            pickReason('2');
            typeConfirm();
            fireEvent.click(freezeButton());

            await waitFor(() =>
                expect(onConfirm).toHaveBeenCalledWith(card, {
                    reason: 2,
                    reasonNote: undefined,
                })
            );
        });

        it('reports the trimmed note with Others', async () => {
            open();
            pickReason('4');
            typeConfirm();
            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: 'Left it in a cab ' },
            });
            fireEvent.click(freezeButton());

            await waitFor(() =>
                expect(onConfirm).toHaveBeenCalledWith(card, {
                    reason: 4,
                    reasonNote: 'Left it in a cab',
                })
            );
        });

        it('drops a note typed under Others when the reason changes away from it', async () => {
            open();
            pickReason('4');
            typeConfirm();
            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: 'Left it in a cab' },
            });
            pickReason('1');
            fireEvent.click(freezeButton());

            await waitFor(() =>
                expect(onConfirm).toHaveBeenCalledWith(card, {
                    reason: 1,
                    reasonNote: undefined,
                })
            );
        });

        it('does not confirm while the freeze is in flight', () => {
            open({ isLoading: true });
            pickReason('1');
            typeConfirm();
            fireEvent.click(freezeButton());

            expect(onConfirm).not.toHaveBeenCalled();
        });
    });

    it('calls onClose from Cancel', () => {
        open();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalled();
    });
});
