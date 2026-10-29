import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import IssueCardDrawer from '../../../components/admin/IssueCardDrawer';
import { useCardUsersApi } from '../../../hooks/admin/useCardUsersApi';
import { useIssueCardApi } from '../../../hooks/admin/useIssueCardApi';
import { useMerchantCategoriesApi } from '../../../hooks/admin/useMerchantCategoriesApi';

// â”€â”€â”€ module mocks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ md: true })),
}));

vi.mock('../../../hooks/admin/useCardUsersApi', () => ({
    useCardUsersApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useIssueCardApi', () => ({
    useIssueCardApi: vi.fn(),
}));

vi.mock('../../../hooks/admin/useMerchantCategoriesApi', () => ({
    useMerchantCategoriesApi: vi.fn(),
}));

vi.mock('../../../components/common/modalProps', () => ({
    PineLabsFooter: () => <div data-testid="pinelabs-footer" />,
}));

vi.mock('../../../utils/helpers', () => ({
    formatRupeesDecimal: (value: number) => `â‚¹${value.toFixed(2)}`,
    formatRupees: (value: number) => `â‚¹${value}`,
}));

vi.mock('@ant-design/icons', () => ({
    CloseOutlined: ({ onClick }: any) => (
        <button type="button" data-testid="close-icon-btn" onClick={onClick} aria-label="close" />
    ),
    InfoCircleOutlined: () => <span data-testid="info-icon" />,
}));

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');

    const Drawer = ({ open, children, footer, title, extra }: any) => {
        if (!open) return null;
        return (
            <div data-testid="drawer">
                <div data-testid="drawer-header">
                    <span>{title}</span>
                    {extra}
                </div>
                <div data-testid="drawer-body">{children}</div>
                {footer && <div data-testid="drawer-footer">{footer}</div>}
            </div>
        );
    };

    const Button = ({ children, onClick, disabled, loading, danger }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            data-loading={loading ? 'true' : undefined}
            data-danger={danger ? 'true' : undefined}
        >
            {children}
        </button>
    );

    const Input = ({ value, onChange, placeholder, inputMode, maxLength }: any) => (
        <input
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            inputMode={inputMode}
            maxLength={maxLength}
        />
    );

    const Select = ({ value, onChange, options, placeholder, loading }: any) => (
        <select
            value={value ?? ''}
            onChange={e => onChange?.(e.target.value)}
            data-loading={loading ? 'true' : undefined}
        >
            <option value="">{placeholder ?? 'Select'}</option>
            {(options ?? []).map((opt: any) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );

    const SwitchComponent = ({ checked, onChange }: any) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange?.(!checked)}
        />
    );

    const CheckboxGroup = ({ children }: any) => <div data-testid="checkbox-group">{children}</div>;

    function Checkbox({ value, children }: any) {
        return (
            <div>
                <input type="checkbox" value={value} />
                {children}
            </div>
        );
    }
    Checkbox.Group = CheckboxGroup;

    const Typography = {
        Text: ({ children, className }: any) => <span className={className}>{children}</span>,
    };

    return {
        ...actual,
        Drawer,
        Button,
        Input,
        Select,
        Switch: SwitchComponent,
        Checkbox,
        Typography,
    };
});

// â”€â”€â”€ test helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mockDispatch = vi.fn();

const defaultMembers = [
    { key: '101', name: 'Alice Smith', email: 'alice@example.com' },
    { key: '202', name: 'Bob Jones', email: 'bob@example.com' },
];

const mockSubmitIssueCard = vi.fn();

interface MockOptions {
    members?: typeof defaultMembers;
    membersLoading?: boolean;
    issuing?: boolean;
    submitResult?: any;
}

const setupMocks = (opts: MockOptions = {}) => {
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (useCardUsersApi as Mock).mockReturnValue({
        members: opts.members ?? defaultMembers,
        isLoading: opts.membersLoading ?? false,
    });
    mockSubmitIssueCard.mockResolvedValue(
        opts.submitResult !== undefined ? opts.submitResult : { data: { controlsApplied: true } }
    );
    (useIssueCardApi as Mock).mockReturnValue({
        submitIssueCard: mockSubmitIssueCard,
        isLoading: opts.issuing ?? false,
    });
    (useMerchantCategoriesApi as Mock).mockReturnValue({
        categories: [
            { category: 'Software & SaaS', mccs: ['4816'] },
            { category: 'Travel', mccs: ['4511'] },
        ],
        isLoading: false,
    });
};

const renderDrawer = (
    props: {
        open?: boolean;
        onClose?: () => void;
        onSuccess?: () => void;
    } = {}
) => {
    const onClose = props.onClose ?? vi.fn();
    const onSuccess = props.onSuccess ?? vi.fn();
    const result = render(
        <IssueCardDrawer open={props.open ?? true} onClose={onClose} onSuccess={onSuccess} />
    );
    return { ...result, onClose, onSuccess };
};

/**
 * Fill in the three required fields (member, cardLimit, frequency).
 * Uses querySelectorAll to locate <select> elements in DOM order rather than
 * relying on ARIA role mapping which varies across testing-library versions.
 */
const fillRequiredFields = (container: HTMLElement) => {
    const selects = container.querySelectorAll('select');
    // selects[0] = member select, selects[1] = frequency select (DOM order)
    fireEvent.change(selects[0], { target: { value: '101' } });
    fireEvent.change(selects[1], { target: { value: 'monthly' } });

    const typeInputs = screen.getAllByPlaceholderText('Type');
    // typeInputs[0] = name on card, typeInputs[1] = card limit, typeInputs[2] = per-txn limit (DOM order)
    fireEvent.change(typeInputs[1], { target: { value: '5000' } });
};

// â”€â”€â”€ tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

describe('IssueCardDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupMocks();
    });

    // â”€â”€ visibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('visibility', () => {
        it('does not render the drawer when open is false', () => {
            renderDrawer({ open: false });
            expect(screen.queryByTestId('drawer')).toBeNull();
        });

        it('renders the drawer when open is true', () => {
            renderDrawer();
            expect(screen.getByTestId('drawer')).toBeInTheDocument();
        });
    });

    // â”€â”€ static content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('static content', () => {
        it('renders the drawer title', () => {
            renderDrawer();
            expect(screen.getByText('Issue a card')).toBeInTheDocument();
        });

        it('renders the info icon in the banner', () => {
            renderDrawer();
            expect(screen.getByTestId('info-icon')).toBeInTheDocument();
        });

        it('renders the close icon button', () => {
            renderDrawer();
            expect(screen.getByTestId('close-icon-btn')).toBeInTheDocument();
        });

        it('renders the PineLabsFooter', () => {
            renderDrawer();
            expect(screen.getByTestId('pinelabs-footer')).toBeInTheDocument();
        });
    });

    // â”€â”€ form fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('form fields', () => {
        it('renders member options from the hook', () => {
            renderDrawer();
            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Jones')).toBeInTheDocument();
        });

        it('renders two selects (member and frequency) in DOM order', () => {
            const { container } = renderDrawer();
            const selects = container.querySelectorAll('select');
            expect(selects.length).toBe(2);
        });

        it('renders the name-on-card input', () => {
            renderDrawer();
            // name on card, card limit, and per-transaction limit all share the "Type" placeholder.
            expect(screen.getAllByPlaceholderText('Type')).toHaveLength(3);
        });

        it('renders card limit and per-transaction limit inputs', () => {
            renderDrawer();
            const typeInputs = screen.getAllByPlaceholderText('Type');
            expect(typeInputs).toHaveLength(3);
        });

        it('renders frequency options in the select', () => {
            renderDrawer();
            expect(screen.getByText('Monthly')).toBeInTheDocument();
        });

        it('preselects Monthly as the frequency, and offers no other option', () => {
            const { container } = renderDrawer();
            const frequency = container.querySelectorAll('select')[1] as HTMLSelectElement;
            expect(frequency.value).toBe('monthly');
            expect([...frequency.options].map(o => o.value).filter(Boolean)).toEqual(['monthly']);
        });

        it('submits the default frequency without the user touching the field', async () => {
            const { container } = renderDrawer();
            const selects = container.querySelectorAll('select');
            fireEvent.change(selects[0], { target: { value: '101' } });
            fireEvent.change(screen.getAllByPlaceholderText('Type')[1], {
                target: { value: '5000' },
            });

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalledWith(
                    expect.objectContaining({ frequency: 'monthly' })
                );
            });
        });

        it('renders the merchant categories checkbox group', () => {
            renderDrawer();
            expect(screen.getByTestId('checkbox-group')).toBeInTheDocument();
        });

        it('renders the ATM toggle switch', () => {
            renderDrawer();
            expect(screen.getByRole('switch')).toBeInTheDocument();
        });

        it('shows loading indicator on member select when members are loading', () => {
            setupMocks({ membersLoading: true });
            const { container } = renderDrawer();
            const selects = container.querySelectorAll('select');
            expect(selects[0]).toHaveAttribute('data-loading', 'true');
        });
    });

    // â”€â”€ submit button state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('submit button state', () => {
        it('renders the Issue card button (no explicit disabled state gating in component)', () => {
            renderDrawer();
            const btn = screen.getByRole('button', { name: 'Issue card' });
            // Component has no form-state disabled logic; button is always clickable
            expect(btn).not.toBeDisabled();
        });

        it('Issue card button remains enabled when all required fields are filled', () => {
            const { container } = renderDrawer();
            fillRequiredFields(container);
            expect(screen.getByRole('button', { name: 'Issue card' })).not.toBeDisabled();
        });

        it('renders the Issue card button as disabled and marked loading when submission is in progress', () => {
            setupMocks({ issuing: true });
            renderDrawer();
            const btn = screen.getByRole('button', { name: 'Issue card' });
            expect(btn).toBeDisabled();
            expect(btn).toHaveAttribute('data-loading', 'true');
        });

        it('renders the Cancel button as a danger button', () => {
            renderDrawer();
            const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
            expect(cancelBtn).toHaveAttribute('data-danger', 'true');
        });
    });

    // â”€â”€ cancel / close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('cancel / close', () => {
        it('calls onClose when the Cancel button is clicked', () => {
            const onClose = vi.fn();
            renderDrawer({ onClose });
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when the close icon button in the header is clicked', () => {
            const onClose = vi.fn();
            renderDrawer({ onClose });
            fireEvent.click(screen.getByTestId('close-icon-btn'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('resets the form on close (re-opening clears fields and restores the default frequency)', () => {
            const onClose = vi.fn();
            const { container, rerender } = render(<IssueCardDrawer open onClose={onClose} />);
            fillRequiredFields(container);

            // Simulate closing
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

            // Re-open the drawer
            rerender(<IssueCardDrawer open onClose={onClose} />);

            const selects = container.querySelectorAll('select');
            expect((selects[0] as HTMLSelectElement).value).toBe('');
            expect((selects[1] as HTMLSelectElement).value).toBe('monthly');

            const typeInputs = screen.getAllByPlaceholderText('Type');
            // typeInputs[1] = card limit, the field fillRequiredFields actually populated above.
            expect((typeInputs[1] as HTMLInputElement).value).toBe('');
        });
    });

    // â”€â”€ form submission â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('form submission', () => {
        it('calls submitIssueCard with the correct base payload', async () => {
            const { container } = renderDrawer();
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId: 101,
                        cardLimit: 5000,
                        frequency: 'monthly',
                        atmEnabled: false,
                    })
                );
            });
        });

        it('does not include nameOnCard in the payload when the field is blank', async () => {
            const { container } = renderDrawer();
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalled();
            });

            const payload = mockSubmitIssueCard.mock.calls[0][0];
            expect(payload).not.toHaveProperty('nameOnCard');
        });

        it('includes nameOnCard in the payload when a name is entered', async () => {
            const { container } = renderDrawer();
            // typeInputs[0] = name on card (DOM order: name on card, card limit, per-txn limit).
            fireEvent.change(screen.getAllByPlaceholderText('Type')[0], {
                target: { value: 'Alice Smith' },
            });
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalledWith(
                    expect.objectContaining({ nameOnCard: 'Alice Smith' })
                );
            });
        });

        it('includes perTxnLimit in the payload when a per-transaction limit is entered', async () => {
            const { container } = renderDrawer();
            fillRequiredFields(container);

            const typeInputs = screen.getAllByPlaceholderText('Type');
            fireEvent.change(typeInputs[2], { target: { value: '2000' } });

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalledWith(
                    expect.objectContaining({ perTxnLimit: 2000 })
                );
            });
        });

        it('sends atmEnabled=true when the ATM toggle is switched on', async () => {
            const { container } = renderDrawer();
            fillRequiredFields(container);
            fireEvent.click(screen.getByRole('switch'));

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalledWith(
                    expect.objectContaining({ atmEnabled: true })
                );
            });
        });

        it('strips non-digit characters from card limit input', async () => {
            const { container } = renderDrawer();
            const selects = container.querySelectorAll('select');
            fireEvent.change(selects[0], { target: { value: '101' } });
            fireEvent.change(selects[1], { target: { value: 'monthly' } });

            const typeInputs = screen.getAllByPlaceholderText('Type');
            fireEvent.change(typeInputs[1], { target: { value: 'abc1000xyz' } });

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalledWith(
                    expect.objectContaining({ cardLimit: 1000 })
                );
            });
        });

        it('calls onSuccess and onClose after successful card issuance', async () => {
            const onClose = vi.fn();
            const onSuccess = vi.fn();
            const { container } = renderDrawer({ onClose, onSuccess });
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(onSuccess).toHaveBeenCalledTimes(1);
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });

        it('dispatches a success toast when controlsApplied is true', async () => {
            setupMocks({ submitResult: { data: { controlsApplied: true } } });
            const { container } = renderDrawer();
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockDispatch).toHaveBeenCalled();
            });

            const arg = mockDispatch.mock.calls[0][0];
            expect(arg.payload).toMatchObject({ variant: 'success' });
        });

        it('dispatches a warning toast when controlsApplied is false', async () => {
            setupMocks({ submitResult: { data: { controlsApplied: false } } });
            const { container } = renderDrawer();
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockDispatch).toHaveBeenCalled();
            });

            const arg = mockDispatch.mock.calls[0][0];
            expect(arg.payload).toMatchObject({ variant: 'warning' });
        });

        it('does not call onSuccess or onClose when submitIssueCard returns falsy', async () => {
            setupMocks({ submitResult: null });
            const onClose = vi.fn();
            const onSuccess = vi.fn();
            const { container } = renderDrawer({ onClose, onSuccess });
            fillRequiredFields(container);

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await waitFor(() => {
                expect(mockSubmitIssueCard).toHaveBeenCalled();
            });

            expect(onSuccess).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });

        it('does not call submitIssueCard when required fields are missing', async () => {
            renderDrawer();
            // Button has no disabled prop; validateFields() rejects when fields are empty, guarding submitIssueCard
            const btn = screen.getByRole('button', { name: 'Issue card' });
            expect(btn).not.toBeDisabled();
            fireEvent.click(btn);
            // validateFields rejects async; submitIssueCard is never reached
            await new Promise(r => setTimeout(r, 100));
            expect(mockSubmitIssueCard).not.toHaveBeenCalled();
        });
    });

    // â”€â”€ character limit validation (ADO 28856) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Previously none of these inputs had any bound at all — a long-enough string of repeated
    // characters would overflow the field indefinitely (see the reported screenshot).

    describe('character limit validation', () => {
        // DOM order for the "Type"-placeholder inputs: name on card, card limit, per-txn limit.
        it('caps the name-on-card input at 50 characters', () => {
            renderDrawer();
            const typeInputs = screen.getAllByPlaceholderText('Type') as HTMLInputElement[];
            expect(typeInputs[0].maxLength).toBe(50);
        });

        it('caps the card limit input at 10 digits', () => {
            renderDrawer();
            const typeInputs = screen.getAllByPlaceholderText('Type') as HTMLInputElement[];
            expect(typeInputs[1].maxLength).toBe(10);
        });

        it('caps the per-transaction limit input at 10 digits', () => {
            renderDrawer();
            const typeInputs = screen.getAllByPlaceholderText('Type') as HTMLInputElement[];
            expect(typeInputs[2].maxLength).toBe(10);
        });

        it('does not call submitIssueCard when card limit is 0', async () => {
            const { container } = renderDrawer();
            const selects = container.querySelectorAll('select');
            fireEvent.change(selects[0], { target: { value: '101' } });
            fireEvent.change(selects[1], { target: { value: 'monthly' } });
            const typeInputs = screen.getAllByPlaceholderText('Type');
            fireEvent.change(typeInputs[1], { target: { value: '0' } });

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await new Promise(r => setTimeout(r, 100));
            expect(mockSubmitIssueCard).not.toHaveBeenCalled();
        });

        it('does not call submitIssueCard when per-transaction limit is 0', async () => {
            const { container } = renderDrawer();
            fillRequiredFields(container);
            const typeInputs = screen.getAllByPlaceholderText('Type');
            fireEvent.change(typeInputs[2], { target: { value: '0' } });

            fireEvent.click(screen.getByRole('button', { name: 'Issue card' }));

            await new Promise(r => setTimeout(r, 100));
            expect(mockSubmitIssueCard).not.toHaveBeenCalled();
        });
    });

    // â”€â”€ ATM toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('ATM toggle', () => {
        it('hides ATM withdrawal limit details when the toggle is off', () => {
            renderDrawer();
            // The conditional list item "per calendar month" is only rendered when enabled
            expect(screen.queryByText(/per calendar month/i)).toBeNull();
        });

        it('shows ATM withdrawal limit details when the toggle is switched on', () => {
            renderDrawer();
            fireEvent.click(screen.getByRole('switch'));
            expect(screen.getByText(/per calendar month/i)).toBeInTheDocument();
        });

        it('sets aria-checked=false on the switch by default', () => {
            renderDrawer();
            expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
        });

        it('sets aria-checked=true after toggling the switch on', () => {
            renderDrawer();
            fireEvent.click(screen.getByRole('switch'));
            expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
        });
    });

    // â”€â”€ empty members state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    describe('empty members state', () => {
        it('renders the member select with no member options when list is empty', () => {
            setupMocks({ members: [] });
            const { container } = renderDrawer();
            const memberSelect = container.querySelectorAll('select')[0];
            // Only the placeholder option should be present
            expect(memberSelect.querySelectorAll('option')).toHaveLength(1);
        });
    });
});
