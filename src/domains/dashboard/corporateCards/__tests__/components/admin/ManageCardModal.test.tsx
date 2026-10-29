import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import ManageCardModal from '../../../components/admin/ManageCardModal';
import { useMerchantCategoriesApi } from '../../../hooks/admin/useMerchantCategoriesApi';
import { useTerminateCardApi } from '../../../hooks/admin/useTerminateCardApi';
import { useUpdateCardSettingsApi } from '../../../hooks/admin/useUpdateCardSettingsApi';
import { useCardStatusApi } from '../../../hooks/user/useCardStatusApi';
import { CardRecord, CardData } from '../../../utils/types';

// â”€â”€â”€ Module mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'api/showToast', payload })),
}));

vi.mock('../../../hooks/admin/useUpdateCardSettingsApi', () => ({
    useUpdateCardSettingsApi: vi.fn(),
}));

vi.mock('../../../hooks/user/useCardStatusApi', () => ({
    useCardStatusApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useTerminateCardApi', () => ({
    useTerminateCardApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useMerchantCategoriesApi', () => ({
    useMerchantCategoriesApi: vi.fn(),
}));

// Partial mock, not a replacement: the modal now renders the shared Formik inputs, which pull Form and
// Grid straight from antd. Only the controls that misbehave in jsdom (Modal's never-resolving transition)
// or that are painful to drive (Select, Switch, Segmented) are stubbed.
vi.mock('antd', async importOriginal => {
    const actual = await importOriginal<typeof import('antd')>();

    const MockCheckbox = ({ children, value }: any) => (
        <div>
            <input type="checkbox" value={value} readOnly />
            {children}
        </div>
    );
    MockCheckbox.Group = ({ children }: any) => <div data-testid="checkbox-group">{children}</div>;

    // onBlur has to reach the DOM node: it is how Formik marks a field touched, and Form.Item only
    // renders the validation message for a touched field.
    const MockInput = ({
        value,
        onChange,
        onBlur,
        name,
        placeholder,
        inputMode,
        maxLength,
    }: any) => (
        <input
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            data-inputmode={inputMode ?? ''}
            maxLength={maxLength}
        />
    );
    MockInput.TextArea = ({ value, onChange, onBlur, name, placeholder, rows, maxLength }: any) => (
        <textarea
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            rows={rows}
            maxLength={maxLength}
        />
    );

    // SelectInput renders its options as <Select.Option> children rather than an `options` prop, so the
    // stub has to accept children and expose Option.
    const MockSelect = ({ value, onChange, onBlur, name, placeholder, children }: any) => (
        <select
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
            <option value="">Select</option>
            {children}
        </select>
    );
    MockSelect.Option = ({ value, children }: any) => (
        <option value={String(value)}>{children}</option>
    );

    return {
        ...actual,
        Modal: ({ open, children }: any) =>
            open ? <div data-testid="modal">{children}</div> : null,

        Button: ({ children, onClick, disabled, loading, danger, type }: any) => (
            <button
                type="button"
                onClick={onClick}
                disabled={disabled || loading}
                data-loading={String(!!loading)}
                data-danger={String(!!danger)}
                data-type={type ?? ''}
            >
                {children}
            </button>
        ),

        Switch: ({ checked, onChange, disabled, loading }: any) => (
            <button
                type="button"
                role="switch"
                aria-checked={checked ? 'true' : 'false'}
                onClick={() => {
                    if (!disabled && !loading) onChange?.(!checked);
                }}
                disabled={disabled || loading}
            />
        ),

        Segmented: ({ value, onChange, options }: any) => (
            <div data-testid="segmented">
                {(options as { value: string; label: React.ReactNode }[]).map(opt => (
                    <button
                        type="button"
                        key={opt.value}
                        data-tab={opt.value}
                        onClick={() => onChange(opt.value)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        ),

        Tooltip: ({ children }: any) => children,

        Select: MockSelect,

        Input: MockInput,

        Checkbox: MockCheckbox,

        Typography: {
            Text: ({ children, className }: any) => <span className={className}>{children}</span>,
            Title: ({ children, level, className }: any) =>
                React.createElement(`h${level ?? 1}`, { className }, children),
        },
    };
});

vi.mock('@ant-design/icons', () => ({
    WarningOutlined: () => <span data-testid="warning-icon" />,
}));

vi.mock('../../../assets/icons/snowflake.svg', () => ({ default: 'snowflake.svg' }));

vi.mock('../../../components/common/modalProps', () => ({
    MODAL_CLOSE_ICON: null,
    ROUNDED_MODAL_CLASSNAMES: {},
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
}));

// Only the option lists are fixtures. Everything else — composeTerminateReason and the reason-note
// sanitiser/validator — comes from the real module, so these tests exercise the shipped rules rather
// than a copy of them that can drift.
vi.mock('../../../utils/cardsData', async importOriginal => ({
    ...(await importOriginal<typeof import('../../../utils/cardsData')>()),
    FREEZE_REASON_OPTIONS: [
        { value: 1, label: 'Lost' },
        { value: 2, label: 'Stolen' },
        { value: 4, label: 'Others' },
    ],
    TERMINATE_REASON_OPTIONS: [
        { value: 'Employee exited', label: 'Employee exited' },
        { value: 'Card lost', label: 'Card lost' },
        { value: 'Others', label: 'Others' },
    ],
}));

vi.mock('../../../utils/helpers', () => ({
    formatRupeesDecimal: (v: number) => `₹${v}.00`,
}));

vi.mock('../../../utils/issueCardData', () => ({
    FREQUENCY_OPTIONS: [{ value: 'monthly', label: 'Monthly' }],
    restrictedCategoryNames: (list?: any[]) =>
        (list ?? []).map((entry: any) => (typeof entry === 'string' ? entry : entry.category)),
}));

// â”€â”€â”€ Fixtures â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const activeCardRecord: CardRecord = {
    key: '101',
    last4: '1234',
    holder: 'John Doe',
    department: 'Engineering',
    avatarText: 'JD',
    type: 'Virtual',
    status: 'Active',
    cardLimit: 15000,
    perTxnLimit: 5000,
    limitFrequency: 'monthly',
    atmEnabled: false,
    restrictedCategories: [],
    spent: 3000,
    remaining: 12000,
};

const frozenCardRecord: CardRecord = {
    ...activeCardRecord,
    key: '102',
    last4: '5678',
    holder: 'Jane Smith',
    status: 'Frozen',
};

// Current backend shape: restrictedCategories resolved to { category, mccs } records.
const cardWithResolvedCategories: CardRecord = {
    ...activeCardRecord,
    key: '103',
    restrictedCategories: [{ category: 'Software & SaaS', mccs: ['4816'] }],
};

// Legacy shape: bare category-name strings, from a card saved before the mccs resolution existed.
const cardWithLegacyCategories: CardRecord = {
    ...activeCardRecord,
    key: '104',
    restrictedCategories: ['Travel'],
};

const cardDataOnly: CardData = {
    key: 'card-preview',
    holder: 'Preview User',
    last4: '9999',
    used: 500,
    limit: 10000,
};

// â”€â”€â”€ Shared mock refs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockDispatch = vi.fn();
const mockSubmitSettings = vi.fn();
const mockSubmitCardStatus = vi.fn();
const mockSubmitTerminate = vi.fn();

const MOCK_MERCHANT_CATEGORIES = [
    { category: 'Software & SaaS', mccs: ['4816'] },
    { category: 'Travel', mccs: ['4511'] },
];

function setupDefaultHooks() {
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (useUpdateCardSettingsApi as Mock).mockReturnValue({
        submitSettings: mockSubmitSettings,
        isLoading: false,
    });
    (useCardStatusApi as Mock).mockReturnValue({
        submitCardStatus: mockSubmitCardStatus,
        isLoading: false,
    });
    (useTerminateCardApi as Mock).mockReturnValue({
        submitTerminate: mockSubmitTerminate,
        isLoading: false,
    });
    (useMerchantCategoriesApi as Mock).mockReturnValue({
        categories: MOCK_MERCHANT_CATEGORIES,
        isLoading: false,
    });
}

// â”€â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function switchTab(name: string) {
    fireEvent.click(screen.getByRole('button', { name }));
}

function pickTerminateReason(reason = 'Employee exited') {
    fireEvent.change(screen.getByLabelText('Select termination reason'), {
        target: { value: reason },
    });
}

// â”€â”€â”€ Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('ManageCardModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupDefaultHooks();
    });

    // â”€â”€ Visibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('visibility', () => {
        it('renders nothing when card is null', () => {
            render(<ManageCardModal card={null} onClose={vi.fn()} />);
            expect(screen.queryByTestId('modal')).toBeNull();
        });

        it('renders the modal when a card is provided', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByTestId('modal')).toBeInTheDocument();
        });
    });

    // â”€â”€ Card header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('card header', () => {
        it('shows the last 4 digits in the title', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText(/\*\*\*\* \*\*\*\* \*\*\*\* 1234/)).toBeInTheDocument();
        });

        it('shows the cardholder name', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        });

        it('displays "virtual" for a Virtual type CardRecord', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText(/virtual/)).toBeInTheDocument();
        });

        it('displays "physical" for a CardData without a type field', () => {
            render(<ManageCardModal card={cardDataOnly} onClose={vi.fn()} />);
            expect(screen.getByText(/physical/)).toBeInTheDocument();
        });

        it('renders the PineLabsFooter', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByTestId('pine-labs-footer')).toBeInTheDocument();
        });

        // A real CardRecord has no `balance` field (only the dashboard's preview CardData does) —
        // checking 'balance' in card alone always fell through to ₹0.00 for every real card (ADO 28832).
        it("shows the CardRecord's actual remaining balance, not a ₹0.00 fallback", () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText(/balance ₹12000\.00/)).toBeInTheDocument();
        });

        it('falls back to ₹0.00 for a CardData preview with no balance set', () => {
            render(<ManageCardModal card={cardDataOnly} onClose={vi.fn()} />);
            expect(screen.getByText(/balance ₹0\.00/)).toBeInTheDocument();
        });
    });

    // â”€â”€ Tab bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('tab bar', () => {
        it('renders all three tabs', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Limits & controls' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Lifecycle' })).toBeInTheDocument();
        });

        it('defaults to the Status tab on open', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText('Freeze card')).toBeInTheDocument();
        });
    });

    // â”€â”€ Status tab â€” freeze section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Status tab â€” freeze section', () => {
        it('renders the snowflake icon', () => {
            const { container } = render(
                <ManageCardModal card={activeCardRecord} onClose={vi.fn()} />
            );
            expect(container.querySelector('img[src="snowflake.svg"]')).toBeInTheDocument();
        });

        it('shows the freeze reason select for an Active CardRecord', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByLabelText('Select reason')).toBeInTheDocument();
        });

        it('hides the freeze reason select for a Frozen CardRecord', () => {
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);
            expect(screen.queryByLabelText('Select reason')).toBeNull();
        });

        it('shows active state banner when card is not frozen', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(
                screen.getByText(/Card is active and accepting transactions/)
            ).toBeInTheDocument();
        });

        it('shows frozen state banner when card is frozen', () => {
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText(/All purchases are declined/)).toBeInTheDocument();
        });

        it('switch is disabled for an Active CardRecord until a freeze reason is selected', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByRole('switch')).toBeDisabled();
        });

        it('switch is enabled for a Frozen CardRecord (ready to unfreeze)', () => {
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);
            expect(screen.getByRole('switch')).not.toBeDisabled();
        });

        it('switch is disabled for a CardData (preview) card', () => {
            render(<ManageCardModal card={cardDataOnly} onClose={vi.fn()} />);
            expect(screen.getByRole('switch')).toBeDisabled();
        });

        it('enables the switch after a freeze reason is selected', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            fireEvent.change(screen.getByLabelText('Select reason'), {
                target: { value: '1' },
            });
            expect(screen.getByRole('switch')).not.toBeDisabled();
        });
    });

    // â”€â”€ Status tab â€” freeze / unfreeze API calls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Status tab â€” freeze / unfreeze API', () => {
        it('calls submitCardStatus with "freeze" and the selected reason', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            fireEvent.change(screen.getByLabelText('Select reason'), {
                target: { value: '1' },
            });
            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(mockSubmitCardStatus).toHaveBeenCalledWith(
                    activeCardRecord.key,
                    'freeze',
                    1,
                    undefined
                );
            });
        });

        it('calls submitCardStatus with "unfreeze" and no reason for a Frozen card', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);

            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(mockSubmitCardStatus).toHaveBeenCalledWith(
                    frozenCardRecord.key,
                    'unfreeze',
                    undefined,
                    undefined
                );
            });
        });

        // "Others" carries no information on its own, so it opens a free-text note that the backend
        // persists alongside the reason code.
        it('reveals the "Enter Reason" note only when the Others reason is picked', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.queryByPlaceholderText('Enter')).toBeNull();

            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '4' } });
            expect(screen.getByText('Enter Reason')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter')).toBeInTheDocument();

            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '1' } });
            expect(screen.queryByPlaceholderText('Enter')).toBeNull();
        });

        it('keeps the freeze switch disabled until the Others note is filled in', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '4' } });
            expect(screen.getByRole('switch')).toBeDisabled();

            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: 'Cardholder on extended leave' },
            });
            expect(screen.getByRole('switch')).not.toBeDisabled();
        });

        it('rejects a whitespace-only Others note', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '4' } });
            fireEvent.change(screen.getByPlaceholderText('Enter'), { target: { value: '   ' } });
            expect(screen.getByRole('switch')).toBeDisabled();
        });

        // Same rules as the bulk-freeze note — this is the one that also reaches Pine Labs.
        describe('Others note validation', () => {
            const openNoteField = () => {
                render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
                fireEvent.change(screen.getByLabelText('Select reason'), {
                    target: { value: '4' },
                });
                return screen.getByPlaceholderText('Enter') as HTMLTextAreaElement;
            };

            it('flags a note shorter than the minimum', async () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.blur(note);

                expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
            });

            it('does not freeze the card while the note is too short', async () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.click(screen.getByRole('switch'));

                expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
                await waitFor(() => expect(mockSubmitCardStatus).not.toHaveBeenCalled());
            });

            it('clears the error and enables the switch once the note is long enough', () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.change(note, { target: { value: 'Cardholder on extended leave' } });

                expect(screen.queryByText(/at least 10 characters/i)).toBeNull();
                expect(screen.getByRole('switch')).not.toBeDisabled();
            });

            it('strips a leading space and collapses consecutive spaces as they are typed', () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: ' Cardholder   on  leave' } });

                expect(note.value).toBe('Cardholder on leave');
            });

            it('counts length after trimming, so spaces cannot pad a short note to the minimum', async () => {
                const note = openNoteField();
                fireEvent.change(note, { target: { value: 'lost      ' } });
                fireEvent.blur(note);

                expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
            });
        });

        it('sends the trimmed Others note as the fourth argument', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '4' } });
            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: '  Cardholder on extended leave  ' },
            });
            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(mockSubmitCardStatus).toHaveBeenCalledWith(
                    activeCardRecord.key,
                    'freeze',
                    4,
                    'Cardholder on extended leave'
                );
            });
        });

        // Switching Others → Lost must not smuggle the typed note through against the new code.
        it('does not send a stale note when the reason is switched away from Others', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '4' } });
            fireEvent.change(screen.getByPlaceholderText('Enter'), {
                target: { value: 'Some note' },
            });
            fireEvent.change(screen.getByLabelText('Select reason'), { target: { value: '1' } });
            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(mockSubmitCardStatus).toHaveBeenCalledWith(
                    activeCardRecord.key,
                    'freeze',
                    1,
                    undefined
                );
            });
        });

        it('dispatches a success toast after a successful status update', async () => {
            mockSubmitCardStatus.mockResolvedValue(true);
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);

            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(mockDispatch).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.objectContaining({ variant: 'success' }),
                    })
                );
            });
        });

        it('dispatches an error toast when submitCardStatus returns falsy', async () => {
            mockSubmitCardStatus.mockResolvedValue(false);
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);

            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(mockDispatch).toHaveBeenCalledWith(
                    expect.objectContaining({
                        payload: expect.objectContaining({ variant: 'error' }),
                    })
                );
            });
        });

        it('calls onSuccess after a successful freeze/unfreeze', async () => {
            const onSuccess = vi.fn();
            mockSubmitCardStatus.mockResolvedValue(true);
            render(
                <ManageCardModal card={frozenCardRecord} onClose={vi.fn()} onSuccess={onSuccess} />
            );

            fireEvent.click(screen.getByRole('switch'));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalled();
            });
        });

        it('shows loading state on the switch while statusLoading is true', () => {
            (useCardStatusApi as Mock).mockReturnValue({
                submitCardStatus: mockSubmitCardStatus,
                isLoading: true,
            });
            render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);
            expect(screen.getByRole('switch')).toBeDisabled();
        });
    });

    // â”€â”€ Status tab â€” terminate card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Status tab â€” terminate card', () => {
        it('renders the terminate card form', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByRole('button', { name: 'Terminate card' })).toBeInTheDocument();
        });

        // ADO 28832: the terminate warning previously always showed ₹0.00 regardless of the card's
        // actual remaining balance.
        it('shows the actual remaining balance that will be returned to the wallet', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByText(/Remaining balance \(₹12000\.00\)/)).toBeInTheDocument();
        });

        it('terminate button is disabled when the input is empty', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Terminate card' })).toBeDisabled()
            );
        });

        it('terminate button remains disabled with partial text', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINAT' },
            });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Terminate card' })).toBeDisabled()
            );
        });

        it('terminate button is disabled for a CardData card even when TERMINATE is typed', () => {
            render(<ManageCardModal card={cardDataOnly} onClose={vi.fn()} />);
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            expect(screen.getByRole('button', { name: 'Terminate card' })).toBeDisabled();
        });

        it('terminate button becomes enabled after typing TERMINATE for a CardRecord', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            pickTerminateReason();
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            expect(screen.getByRole('button', { name: 'Terminate card' })).not.toBeDisabled();
        });

        it('stays disabled while TERMINATE is typed but no reason is picked', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Terminate card' })).toBeDisabled()
            );
        });

        it('offers the reason picker with no note field until a reason is chosen', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByLabelText('Select termination reason')).toBeInTheDocument();
            expect(screen.queryByPlaceholderText('Enter termination reason')).toBeNull();
            expect(screen.queryByText('Enter Reason (optional)')).toBeNull();
        });

        // The five named reasons say what happened on their own, so there is nothing to type.
        it('keeps the note field hidden for a named reason', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            pickTerminateReason('Card lost');

            expect(screen.queryByPlaceholderText('Enter termination reason')).toBeNull();
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            expect(screen.getByRole('button', { name: 'Terminate card' })).not.toBeDisabled();
        });

        it('reveals the note field only when Others is chosen', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            pickTerminateReason('Others');

            expect(screen.getByPlaceholderText('Enter termination reason')).toBeInTheDocument();
            expect(screen.getByText('Enter Reason (optional)')).toBeInTheDocument();
        });

        it('hides the note field again when the reason moves away from Others', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            pickTerminateReason('Others');
            pickTerminateReason('Employee exited');

            expect(screen.queryByPlaceholderText('Enter termination reason')).toBeNull();
        });

        // Optional under Others too: picking it without typing must still submit.
        it('submits with the reason alone when the Others note is left blank', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            pickTerminateReason('Others');
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            expect(screen.getByRole('button', { name: 'Terminate card' })).not.toBeDisabled();
        });

        // The note is optional, but once typed it lands in the audit trail, so it has to be a real
        // sentence: at least REASON_NOTE_MIN characters, no leading space, no doubled spaces.
        describe('termination note validation', () => {
            const armTerminate = () => {
                render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
                pickTerminateReason('Others');
                fireEvent.change(screen.getByPlaceholderText('Type'), {
                    target: { value: 'TERMINATE' },
                });
                return screen.getByPlaceholderText(
                    'Enter termination reason'
                ) as HTMLTextAreaElement;
            };

            it('blocks terminate when the typed note is shorter than the minimum', async () => {
                const note = armTerminate();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.blur(note);

                expect(await screen.findByText(/at least 10 characters/i)).toBeInTheDocument();
                await waitFor(() =>
                    expect(screen.getByRole('button', { name: 'Terminate card' })).toBeDisabled()
                );
            });

            it('allows terminate again once the note is long enough', () => {
                const note = armTerminate();
                fireEvent.change(note, { target: { value: 'lost' } });
                fireEvent.change(note, { target: { value: 'Employee left the company' } });

                expect(screen.queryByText(/at least 10 characters/i)).toBeNull();
                expect(screen.getByRole('button', { name: 'Terminate card' })).not.toBeDisabled();
            });

            // Optional means optional — an untouched note must not raise an error or block submit.
            it('does not flag an empty note', () => {
                armTerminate();

                expect(screen.queryByText(/at least 10 characters/i)).toBeNull();
                expect(screen.getByRole('button', { name: 'Terminate card' })).not.toBeDisabled();
            });

            it('strips a leading space and collapses consecutive spaces as they are typed', () => {
                const note = armTerminate();
                fireEvent.change(note, { target: { value: '  Employee    left the   company' } });

                expect(note.value).toBe('Employee left the company');
            });
        });

        it('calls submitTerminate with the card key converted to a number and the reason', async () => {
            mockSubmitTerminate.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            pickTerminateReason();
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Terminate card' }));

            await waitFor(() => {
                expect(mockSubmitTerminate).toHaveBeenCalledWith(
                    Number(activeCardRecord.key),
                    'Employee exited'
                );
            });
        });

        it('folds the trimmed note into the reason string when one is typed', async () => {
            mockSubmitTerminate.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            pickTerminateReason('Others');
            fireEvent.change(screen.getByPlaceholderText('Enter termination reason'), {
                target: { value: '  Fraud investigation  ' },
            });
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Terminate card' }));

            await waitFor(() => {
                expect(mockSubmitTerminate).toHaveBeenCalledWith(
                    Number(activeCardRecord.key),
                    'Others: Fraud investigation'
                );
            });
        });

        // Switching Others → a named reason must not smuggle the typed note through against it.
        it('does not send a stale note when the reason is switched away from Others', async () => {
            mockSubmitTerminate.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            pickTerminateReason('Others');
            fireEvent.change(screen.getByPlaceholderText('Enter termination reason'), {
                target: { value: 'Left the company mid-cycle' },
            });
            pickTerminateReason('Employee exited');
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Terminate card' }));

            await waitFor(() => {
                expect(mockSubmitTerminate).toHaveBeenCalledWith(
                    Number(activeCardRecord.key),
                    'Employee exited'
                );
            });
        });

        it('shows termination confirmation after successful terminate', async () => {
            mockSubmitTerminate.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

            pickTerminateReason();
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Terminate card' }));

            await waitFor(() => {
                expect(screen.getByText('Card termination request submitted')).toBeInTheDocument();
            });
        });

        it('calls onSuccess after a successful terminate', async () => {
            const onSuccess = vi.fn();
            mockSubmitTerminate.mockResolvedValue(true);
            render(
                <ManageCardModal card={activeCardRecord} onClose={vi.fn()} onSuccess={onSuccess} />
            );

            pickTerminateReason();
            fireEvent.change(screen.getByPlaceholderText('Type'), {
                target: { value: 'TERMINATE' },
            });
            fireEvent.click(screen.getByRole('button', { name: 'Terminate card' }));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalled();
            });
        });

        it('shows loading state on the terminate button while terminateLoading is true', () => {
            (useTerminateCardApi as Mock).mockReturnValue({
                submitTerminate: mockSubmitTerminate,
                isLoading: true,
            });
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.getByRole('button', { name: 'Terminate card' })).toBeDisabled();
        });

        // Regression: terminationStatus now persists server-side, so reopening the modal on a card whose
        // termination was already requested/completed must reflect that immediately (not blank defaults).
        it('shows the "submitted" banner immediately for a card with terminationStatus REQUESTED', () => {
            render(
                <ManageCardModal
                    card={{ ...frozenCardRecord, terminationStatus: 'REQUESTED' }}
                    onClose={vi.fn()}
                />
            );
            expect(screen.getByText('Card termination request submitted')).toBeInTheDocument();
            expect(screen.getByRole('switch')).toBeDisabled();
        });

        it('shows a permanent-termination banner for a card with terminationStatus COMPLETED, and locks the switch', () => {
            render(
                <ManageCardModal
                    card={{ ...frozenCardRecord, terminationStatus: 'COMPLETED' }}
                    onClose={vi.fn()}
                />
            );
            expect(screen.getByText('Card permanently terminated')).toBeInTheDocument();
            expect(screen.getByRole('switch')).toBeDisabled();
        });

        it('does not show any termination banner for a card with no terminationStatus', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            expect(screen.queryByText('Card termination request submitted')).toBeNull();
            expect(screen.queryByText('Card permanently terminated')).toBeNull();
        });
    });

    // â”€â”€ Limits & controls tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Limits & controls tab', () => {
        it('shows the limits form after clicking that tab', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            expect(screen.getByText('Card limit (INR)')).toBeInTheDocument();
            expect(screen.getByText('Per-transaction limit (INR)')).toBeInTheDocument();
        });

        it('prefills card limit from the CardRecord', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');
            // First input on the Limits tab is the card limit field
            expect((inputs[0] as HTMLInputElement).value).toBe('15000');
        });

        it('prefills per-transaction limit from the CardRecord', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');
            // Second input on the Limits tab is the per-transaction limit field
            expect((inputs[1] as HTMLInputElement).value).toBe('5000');
        });

        it('prefills the frequency select from the CardRecord', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const freqSelect = screen.getByLabelText('Select') as HTMLSelectElement;
            expect(freqSelect.value).toBe('monthly');
        });

        it('Save button is enabled when cardLimit and frequency are both set', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
        });

        it('Save button is disabled for a CardData (non-record) card', () => {
            render(<ManageCardModal card={cardDataOnly} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        });

        it('Save button is disabled after clearing the card limit', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');
            fireEvent.change(inputs[0], { target: { value: '' } });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
            );
        });

        // ADO 29067 — typing 0 into per-transaction limit was accepted with no validation error, even
        // though the backend rejects it (a 0 limit would block every transaction on the card).
        it('disables Save and shows an error when per-transaction limit is set to 0', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');

            fireEvent.change(inputs[1], { target: { value: '0' } });
            fireEvent.blur(inputs[1]);

            expect(
                await screen.findByText('Per-transaction limit must be greater than 0.')
            ).toBeInTheDocument();
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
            );
        });

        it('does not show an error when per-transaction limit is left blank (optional field)', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');

            fireEvent.change(inputs[1], { target: { value: '' } });

            expect(
                screen.queryByText('Per-transaction limit must be greater than 0.')
            ).not.toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
        });

        it('re-enables Save once an invalid per-transaction limit is corrected to a positive value', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');

            fireEvent.change(inputs[1], { target: { value: '0' } });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
            );

            fireEvent.change(screen.getAllByPlaceholderText('Type')[1], {
                target: { value: '500' },
            });

            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
            );
            expect(
                screen.queryByText('Per-transaction limit must be greater than 0.')
            ).not.toBeInTheDocument();
        });

        it('only allows digits in the card limit field', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');
            fireEvent.change(inputs[0], { target: { value: 'abc200' } });
            const updatedInputs = screen.getAllByPlaceholderText('Type');
            expect((updatedInputs[0] as HTMLInputElement).value).toBe('200');
        });

        // ADO 29066 — the card limit field had no minimum or maximum, so it accepted an arbitrarily
        // large value (e.g. a 27-digit number) with no inline feedback, even though the backend's
        // DECIMAL(12,2) column (MAX_LIMIT = 9,999,999,999.99) would reject it only after Save. Mirrors
        // the maxLength cap IssueCardDrawer already applies to the same field on the Issue-card flow.
        it('caps the card limit field at 10 digits (matches the backend DECIMAL(12,2) column)', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');
            expect(inputs[0]).toHaveAttribute('maxLength', '10');
        });

        it('caps the per-transaction limit field at 10 digits too', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');
            expect(inputs[1]).toHaveAttribute('maxLength', '10');
        });

        it('disables Save and shows an error when card limit is set to 0', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');

            fireEvent.change(inputs[0], { target: { value: '0' } });
            fireEvent.blur(inputs[0]);

            expect(
                await screen.findByText('Card limit must be greater than 0.')
            ).toBeInTheDocument();
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
            );
        });

        it('re-enables Save once an invalid card limit is corrected to a positive value', async () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            const inputs = screen.getAllByPlaceholderText('Type');

            fireEvent.change(inputs[0], { target: { value: '0' } });
            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
            );

            fireEvent.change(screen.getAllByPlaceholderText('Type')[0], {
                target: { value: '15000' },
            });

            await waitFor(() =>
                expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled()
            );
            expect(
                screen.queryByText('Card limit must be greater than 0.')
            ).not.toBeInTheDocument();
        });

        it('calls submitSettings with the correct payload on Save', async () => {
            mockSubmitSettings.mockResolvedValue(true);
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => {
                expect(mockSubmitSettings).toHaveBeenCalledWith(
                    activeCardRecord.key,
                    expect.objectContaining({
                        cardLimit: 15000,
                        frequency: 'monthly',
                        atmEnabled: false,
                        restrictedCategories: [],
                    })
                );
            });
        });

        it('prefills restricted categories from the resolved { category, mccs } shape', async () => {
            mockSubmitSettings.mockResolvedValue(true);
            render(<ManageCardModal card={cardWithResolvedCategories} onClose={vi.fn()} />);
            switchTab('Limits & controls');

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => {
                expect(mockSubmitSettings).toHaveBeenCalledWith(
                    cardWithResolvedCategories.key,
                    expect.objectContaining({ restrictedCategories: ['Software & SaaS'] })
                );
            });
        });

        it('prefills restricted categories from the legacy bare-string shape', async () => {
            mockSubmitSettings.mockResolvedValue(true);
            render(<ManageCardModal card={cardWithLegacyCategories} onClose={vi.fn()} />);
            switchTab('Limits & controls');

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => {
                expect(mockSubmitSettings).toHaveBeenCalledWith(
                    cardWithLegacyCategories.key,
                    expect.objectContaining({ restrictedCategories: ['Travel'] })
                );
            });
        });

        it('calls onSuccess and onClose after a successful Save', async () => {
            const onSuccess = vi.fn();
            const onClose = vi.fn();
            mockSubmitSettings.mockResolvedValue(true);
            render(
                <ManageCardModal card={activeCardRecord} onClose={onClose} onSuccess={onSuccess} />
            );
            switchTab('Limits & controls');

            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalled();
                expect(onClose).toHaveBeenCalled();
            });
        });

        it('shows loading state on the Save button while settingsLoading is true', () => {
            (useUpdateCardSettingsApi as Mock).mockReturnValue({
                submitSettings: mockSubmitSettings,
                isLoading: true,
            });
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
        });

        it('Cancel button calls onClose', () => {
            const onClose = vi.fn();
            render(<ManageCardModal card={activeCardRecord} onClose={onClose} />);
            switchTab('Limits & controls');
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onClose).toHaveBeenCalled();
        });

        it('renders the ATM withdrawals toggle', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            expect(screen.getByText('ATM withdrawals')).toBeInTheDocument();
            expect(screen.getByRole('switch')).toBeInTheDocument();
        });

        it('renders the Merchant categories section', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Limits & controls');
            expect(screen.getByText('Merchant categories')).toBeInTheDocument();
            expect(screen.getByTestId('checkbox-group')).toBeInTheDocument();
        });
    });

    // â”€â”€ Lifecycle tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('Lifecycle tab', () => {
        it('shows the Convert to Physical Card section', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Lifecycle');
            // Both the section heading and the button contain this text; assert at least one exists
            expect(screen.getAllByText('Convert to Physical Card').length).toBeGreaterThan(0);
        });

        it('calls onRequestPhysical and onClose when the Convert button is clicked', () => {
            const onClose = vi.fn();
            const onRequestPhysical = vi.fn();
            render(
                <ManageCardModal
                    card={activeCardRecord}
                    onClose={onClose}
                    onRequestPhysical={onRequestPhysical}
                />
            );
            switchTab('Lifecycle');
            fireEvent.click(screen.getByRole('button', { name: 'Convert to Physical Card' }));
            expect(onClose).toHaveBeenCalled();
            expect(onRequestPhysical).toHaveBeenCalled();
        });

        it('does not throw when onRequestPhysical is not provided', () => {
            render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);
            switchTab('Lifecycle');
            expect(() => {
                fireEvent.click(screen.getByRole('button', { name: 'Convert to Physical Card' }));
            }).not.toThrow();
        });

        describe('withheld when the card cannot be converted', () => {
            it('hides the tab for a frozen card', () => {
                render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);

                expect(screen.queryByRole('button', { name: 'Lifecycle' })).not.toBeInTheDocument();
            });

            it('offers no Convert action anywhere for a frozen card', () => {
                render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);

                expect(screen.queryByText('Convert to Physical Card')).not.toBeInTheDocument();
            });

            it('hides the tab for a card awaiting termination', () => {
                render(
                    <ManageCardModal
                        card={{ ...activeCardRecord, terminationStatus: 'REQUESTED' }}
                        onClose={vi.fn()}
                    />
                );

                expect(screen.queryByRole('button', { name: 'Lifecycle' })).not.toBeInTheDocument();
            });

            it('hides the tab once a termination has completed', () => {
                render(
                    <ManageCardModal
                        card={{ ...activeCardRecord, terminationStatus: 'COMPLETED' }}
                        onClose={vi.fn()}
                    />
                );

                expect(screen.queryByRole('button', { name: 'Lifecycle' })).not.toBeInTheDocument();
            });

            it('still offers it for an active virtual card', () => {
                render(<ManageCardModal card={activeCardRecord} onClose={vi.fn()} />);

                expect(screen.getByRole('button', { name: 'Lifecycle' })).toBeInTheDocument();
            });

            it('falls back to the Status tab rather than rendering an empty body', () => {
                render(<ManageCardModal card={frozenCardRecord} onClose={vi.fn()} />);

                expect(screen.getByRole('button', { name: 'Status' })).toBeInTheDocument();
                expect(screen.getAllByText(/freeze|unfreeze/i).length).toBeGreaterThan(0);
            });
        });
    });
});
