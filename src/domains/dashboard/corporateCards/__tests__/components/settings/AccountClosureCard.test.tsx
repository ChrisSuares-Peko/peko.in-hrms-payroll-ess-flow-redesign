import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import AccountClosureCard from '../../../components/settings/AccountClosureCard';
import { useAccountClosureApi } from '../../../hooks/admin/useAccountClosureApi';

vi.mock('../../../hooks/admin/useAccountClosureApi', () => ({
    useAccountClosureApi: vi.fn(),
}));

vi.mock('../../../components/common/modalProps', () => ({
    ROUNDED_MODAL_CLASSNAMES: {},
    MODAL_CLOSE_ICON: null,
}));

vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');

    const MockSelect = ({ value, onChange, onBlur, name, placeholder, children }: any) => (
        <select
            data-testid="reason-select"
            name={name}
            aria-label={placeholder}
            onBlur={onBlur}
            value={value ?? ''}
            onChange={e => onChange(e.target.value || undefined)}
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
        Select: MockSelect,
    };
});

const REASONS = [
    { value: 'NOT_USING', label: 'We are no longer using Peko' },
    { value: 'OTHERS', label: 'Others' },
];

const hook = (overrides: Record<string, unknown> = {}) => ({
    request: null,
    reasons: REASONS,
    isLoading: false,
    submit: vi.fn().mockResolvedValue(true),
    submitLoading: false,
    hasPendingRequest: false,
    ...overrides,
});

const openModal = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Request account closure' }));

beforeEach(() => {
    vi.clearAllMocks();
    (useAccountClosureApi as Mock).mockReturnValue(hook());
});

describe('AccountClosureCard', () => {
    it('names the company in the heading and spells out the consequences', () => {
        render(<AccountClosureCard companyName="Peko Payment Services LLC" />);

        expect(
            screen.getByText("Close Peko Payment Services LLC's Peko Account")
        ).toBeInTheDocument();
        expect(screen.getByText(/all the Corporate cards will be terminated/)).toBeInTheDocument();
    });

    it('does not open the modal until the button is clicked', () => {
        render(<AccountClosureCard companyName="Acme" />);

        expect(screen.queryByTestId('modal')).toBeNull();
        openModal();
        expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('warns inside the modal that the closure is irreversible once confirmed', () => {
        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        expect(
            screen.getByText(/All users will lose access, company data will be deleted/)
        ).toBeInTheDocument();
    });

    it('keeps submit disabled until a reason is chosen', async () => {
        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        const submit = () => screen.getByRole('button', { name: 'Submit closure request' });
        await waitFor(() => expect(submit()).toBeDisabled());

        fireEvent.change(screen.getByTestId('reason-select'), { target: { value: 'NOT_USING' } });
        await waitFor(() => expect(submit()).not.toBeDisabled());
    });

    it('requires details when the reason is Others', async () => {
        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        fireEvent.change(screen.getByTestId('reason-select'), { target: { value: 'OTHERS' } });
        const submit = () => screen.getByRole('button', { name: 'Submit closure request' });
        await waitFor(() => expect(submit()).toBeDisabled());

        fireEvent.change(screen.getByPlaceholderText('Enter'), {
            target: { value: 'Acquired by another group' },
        });
        await waitFor(() => expect(submit()).not.toBeDisabled());
    });

    it('marks the details field optional for every other reason', async () => {
        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        expect(screen.getByText('Additional details (optional)')).toBeInTheDocument();

        fireEvent.change(screen.getByTestId('reason-select'), { target: { value: 'OTHERS' } });
        await waitFor(() => expect(screen.queryByText('Additional details (optional)')).toBeNull());
    });

    it('submits the chosen reason and details', async () => {
        const submit = vi.fn().mockResolvedValue(true);
        (useAccountClosureApi as Mock).mockReturnValue(hook({ submit }));

        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        fireEvent.change(screen.getByTestId('reason-select'), { target: { value: 'NOT_USING' } });
        fireEvent.change(screen.getByPlaceholderText('Enter'), {
            target: { value: 'Moving the programme in-house' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Submit closure request' }));

        await waitFor(() =>
            expect(submit).toHaveBeenCalledWith(
                expect.objectContaining({
                    reason: 'NOT_USING',
                    details: 'Moving the programme in-house',
                })
            )
        );
    });

    it('closes the modal after a successful submission', async () => {
        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        fireEvent.change(screen.getByTestId('reason-select'), { target: { value: 'NOT_USING' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit closure request' }));

        await waitFor(() => expect(screen.queryByTestId('modal')).toBeNull());
    });

    // A failed submission must leave the form open with the values intact, not look like it worked.
    it('keeps the modal open when the submission fails', async () => {
        const submit = vi.fn().mockResolvedValue(false);
        (useAccountClosureApi as Mock).mockReturnValue(hook({ submit }));

        render(<AccountClosureCard companyName="Acme" />);
        openModal();

        fireEvent.change(screen.getByTestId('reason-select'), { target: { value: 'NOT_USING' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit closure request' }));

        await waitFor(() => expect(submit).toHaveBeenCalled());
        expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    // A second request must not be queued while support is still reviewing the first.
    it('blocks a second request while one is awaiting review, and says so', () => {
        (useAccountClosureApi as Mock).mockReturnValue(
            hook({
                hasPendingRequest: true,
                request: {
                    id: '9',
                    status: 'PENDING',
                    reason: 'NOT_USING',
                    reasonLabel: 'We are no longer using Peko',
                    details: null,
                    requestedByName: 'Aarav (Admin)',
                    requestedAt: '2026-08-17T10:00:00.000Z',
                    decidedAt: null,
                    decisionNote: null,
                },
            })
        );

        render(<AccountClosureCard companyName="Acme" />);

        expect(screen.getByText('Awaiting support review')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Request account closure' })).toBeDisabled();
    });

    it('shows a skeleton rather than an enabled button while loading', () => {
        (useAccountClosureApi as Mock).mockReturnValue(hook({ isLoading: true }));

        render(<AccountClosureCard companyName="Acme" />);

        expect(screen.queryByRole('button', { name: 'Request account closure' })).toBeNull();
    });
});
