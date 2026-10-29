import React from 'react';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import RequestPhysicalCardModal from '../../../components/admin/RequestPhysicalCardModal';

// â”€â”€ antd stubs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
        ...actual,
        Modal: ({ open, onCancel, children }: any) =>
            open ? (
                <div data-testid="modal">
                    <button type="button" data-testid="modal-close-btn" onClick={onCancel}>
                        Close
                    </button>
                    {children}
                </div>
            ) : null,
        Button: ({ onClick, disabled, children }: any) => (
            <button type="button" onClick={onClick} disabled={disabled}>
                {children}
            </button>
        ),
        Input: ({ value, onChange, placeholder, disabled, maxLength, inputMode }: any) => (
            <input
                value={value ?? ''}
                onChange={onChange}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                data-inputmode={inputMode}
            />
        ),
        Select: ({ value, onChange, placeholder, options }: any) => (
            <select
                data-testid="state-select"
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
            >
                <option value="">{placeholder}</option>
                {(options ?? []).map((o: any) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        ),
        Typography: {
            Title: ({ children }: any) => <div data-testid="typography-title">{children}</div>,
            Text: ({ children }: any) => <span>{children}</span>,
        },
    };
});

// â”€â”€ Ant Design icon stubs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('@ant-design/icons', () => ({
    InfoCircleOutlined: () => <span data-testid="info-icon" />,
    CloseCircleOutlined: () => <span data-testid="close-icon" />,
    CheckOutlined: () => <span data-testid="check-icon" />,
}));

// â”€â”€ Store hooks â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

// â”€â”€ API slice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn(),
}));

// â”€â”€ Internal utility & common modules â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
vi.mock('../../../utils/requestPhysicalCardData', () => ({
    REQUEST_PHYSICAL_CARD_COPY: {
        title: 'Request Physical Card',
        subtitle: 'Review and edit the delivery address before placing the order.',
        nameHelper: 'This name will be the same as your virtual card.',
        freeBanner: '1 free physical card remaining.',
        reviewHeading: 'Review & Confirm',
        reviewSubtitle: 'Please check the details below.',
        dispatchNote: 'Your card will be dispatched within 2 business days.',
        successTitle: 'Card Request Submitted!',
        successMessage: 'Your physical card request has been placed successfully.',
    },
}));

vi.mock('@hooks/useIndianStates', () => ({
    default: () => ({
        stateOptions: [
            { label: 'Kerala', value: 'Kerala' },
            { label: 'Karnataka', value: 'Karnataka' },
        ],
        isLoading: false,
    }),
}));

vi.mock('../../../components/common/modalProps', () => ({
    MODAL_CLOSE_ICON: null,
    PineLabsFooter: () => <div data-testid="pine-labs-footer" />,
    ROUNDED_MODAL_CLASSNAMES: {},
}));

vi.mock('../../../components/common/SuccessCheck', () => ({
    default: () => <div data-testid="success-check" />,
}));

// â”€â”€ Test helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const mockDispatch = vi.fn();
const DEFAULT_HOLDER = 'Alice Sharma';

const renderModal = (
    props: Partial<{
        open: boolean;
        onClose: () => void;
        holderName: string;
        cardIssuanceId: string;
        last4: string;
        cardLimit: number;
    }> = {}
) =>
    render(
        <RequestPhysicalCardModal
            open={props.open ?? true}
            onClose={props.onClose ?? vi.fn()}
            holderName={props.holderName ?? DEFAULT_HOLDER}
            cardIssuanceId={props.cardIssuanceId ?? 'card-123'}
            last4={props.last4 ?? '1234'}
            cardLimit={props.cardLimit ?? 5000}
        />
    );

/**
 * Fill all mandatory delivery-address fields so that canProceed becomes true.
 * Input order in the DOM: addr1 [0], addr2 [1], city [2], pin [3], mobile [4].
 */
const fillForm = () => {
    const inputs = screen.getAllByPlaceholderText('Enter');
    fireEvent.change(inputs[0], { target: { value: '123 Main Street' } }); // addr1
    fireEvent.change(inputs[2], { target: { value: 'Mumbai' } }); // city
    fireEvent.change(inputs[3], { target: { value: '400001' } }); // PIN (6 digits)
    fireEvent.change(inputs[4], { target: { value: '9876543210' } }); // mobile (10 digits)
    fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'Kerala' } });
};

// â”€â”€ Setup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
beforeEach(() => {
    vi.clearAllMocks();
    (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
    (showToast as unknown as Mock).mockReturnValue({ type: 'api/showToast', payload: {} });
});

// â”€â”€ Test suites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('RequestPhysicalCardModal', () => {
    // â”€â”€ visibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('visibility', () => {
        it('renders nothing when open is false', () => {
            renderModal({ open: false });
            expect(screen.queryByTestId('modal')).toBeNull();
        });

        it('renders the modal container when open is true', () => {
            renderModal();
            expect(screen.getByTestId('modal')).toBeInTheDocument();
        });
    });

    // â”€â”€ form step â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('form step', () => {
        it('renders the modal title', () => {
            renderModal();
            expect(screen.getByText('Request Physical Card')).toBeInTheDocument();
        });

        it('displays holderName in a disabled Name on Card input', () => {
            renderModal({ holderName: 'Bob Tester' });
            const nameInput = screen.getByDisplayValue('Bob Tester');
            expect(nameInput).toBeDisabled();
        });

        it('renders five delivery address input fields', () => {
            renderModal();
            // addr1, addr2, city, pin, mobile all share placeholder "Enter"
            expect(screen.getAllByPlaceholderText('Enter')).toHaveLength(5);
        });

        it('renders the state select dropdown', () => {
            renderModal();
            expect(screen.getByTestId('state-select')).toBeInTheDocument();
        });

        it('renders the free-card banner text', () => {
            renderModal();
            expect(screen.getByText('1 free physical card remaining.')).toBeInTheDocument();
        });

        it('renders a Pine Labs footer in the form step', () => {
            renderModal();
            expect(screen.getAllByTestId('pine-labs-footer').length).toBeGreaterThan(0);
        });

        it('"Confirm & order" button is always enabled (no disabled prop on component button)', () => {
            renderModal();
            const btn = screen.getByRole('button', { name: /Confirm & order/i });
            expect(btn).not.toBeDisabled();
        });

        it('"Confirm & order" button is enabled once all required fields are filled', () => {
            renderModal();
            fillForm();
            const btn = screen.getByRole('button', { name: /Confirm & order/i });
            expect(btn).not.toBeDisabled();
        });
    });

    // â”€â”€ address validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('address validation', () => {
        it('shows an error for an address line 1 that contains a tab character', async () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[0], { target: { value: 'Invalid\tAddress' } });
            await waitFor(() => {
                expect(screen.getByText('Enter a valid address')).toBeInTheDocument();
            });
        });

        it('does not show an error for a valid address line 1', () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[0], { target: { value: '45 Church Road' } });
            expect(screen.queryByText('Enter a valid address')).toBeNull();
        });

        it('shows an error for an invalid address line 2 when filled', async () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[1], { target: { value: 'BadÂ Char' } }); // non-breaking space
            await waitFor(() => {
                expect(screen.getByText('Enter a valid address')).toBeInTheDocument();
            });
        });

        it('"Confirm & order" button is not disabled even when addr1 is invalid (button has no disabled prop)', () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[0], { target: { value: 'Bad\tAddr' } }); // invalid
            fireEvent.change(inputs[2], { target: { value: 'Mumbai' } });
            fireEvent.change(inputs[3], { target: { value: '400001' } });
            fireEvent.change(inputs[4], { target: { value: '9876543210' } });
            fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'Kerala' } });
            expect(screen.getByRole('button', { name: /Confirm & order/i })).not.toBeDisabled();
        });

        it('"Confirm & order" button is not disabled even when PIN is fewer than 6 digits (button has no disabled prop)', () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[0], { target: { value: '123 Main Street' } });
            fireEvent.change(inputs[2], { target: { value: 'Mumbai' } });
            fireEvent.change(inputs[3], { target: { value: '123' } }); // only 3 digits
            fireEvent.change(inputs[4], { target: { value: '9876543210' } });
            fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'Kerala' } });
            expect(screen.getByRole('button', { name: /Confirm & order/i })).not.toBeDisabled();
        });

        it('"Confirm & order" button is not disabled even when mobile is fewer than 10 digits (button has no disabled prop)', () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[0], { target: { value: '123 Main Street' } });
            fireEvent.change(inputs[2], { target: { value: 'Mumbai' } });
            fireEvent.change(inputs[3], { target: { value: '400001' } });
            fireEvent.change(inputs[4], { target: { value: '98765' } }); // only 5 digits
            fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'Kerala' } });
            expect(screen.getByRole('button', { name: /Confirm & order/i })).not.toBeDisabled();
        });
    });

    // â”€â”€ form submission â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('form submission', () => {
        it('dispatches showToast with success variant when order is placed', async () => {
            renderModal();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /Confirm & order/i }));
            await waitFor(() => {
                expect(showToast).toHaveBeenCalledWith({
                    variant: 'success',
                    description: 'Physical card request placed.',
                });
                expect(mockDispatch).toHaveBeenCalledWith({ type: 'api/showToast', payload: {} });
            });
        });

        it('transitions to the success step and shows the success check icon', async () => {
            renderModal();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /Confirm & order/i }));
            await waitFor(() => {
                expect(screen.getByTestId('success-check')).toBeInTheDocument();
            });
        });

        it('shows the success title after placing the order', async () => {
            renderModal();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /Confirm & order/i }));
            await waitFor(() => {
                expect(screen.getByText('Card Request Submitted!')).toBeInTheDocument();
            });
        });

        it('shows the success message after placing the order', async () => {
            renderModal();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /Confirm & order/i }));
            await waitFor(() => {
                expect(
                    screen.getByText('Your physical card request has been placed successfully.')
                ).toBeInTheDocument();
            });
        });

        it('hides the delivery address form after a successful order', async () => {
            renderModal();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /Confirm & order/i }));
            await waitFor(() => {
                expect(screen.queryAllByPlaceholderText('Enter')).toHaveLength(0);
            });
        });

        it('shows a Pine Labs footer on the success step', async () => {
            renderModal();
            fillForm();
            fireEvent.click(screen.getByRole('button', { name: /Confirm & order/i }));
            await waitFor(() => {
                expect(screen.getAllByTestId('pine-labs-footer').length).toBeGreaterThan(0);
            });
        });
    });

    // â”€â”€ cancel / close â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    describe('cancel / close', () => {
        it('calls onClose when the Cancel button is clicked', () => {
            const onClose = vi.fn();
            renderModal({ onClose });
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when the modal close button is triggered', () => {
            const onClose = vi.fn();
            renderModal({ onClose });
            fireEvent.click(screen.getByTestId('modal-close-btn'));
            expect(onClose).toHaveBeenCalledTimes(1);
        });

        it('resets addr1 to empty after Cancel is clicked', async () => {
            renderModal();
            const inputs = screen.getAllByPlaceholderText('Enter');
            fireEvent.change(inputs[0], { target: { value: '999 Some Street' } });
            expect(inputs[0]).toHaveValue('999 Some Street');
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            // Re-query after reset â€” antd remounts Field nodes on resetFields, making prior refs stale
            await waitFor(() => {
                expect(screen.getAllByPlaceholderText('Enter')[0]).toHaveValue('');
            });
        });

        it('resets the state select to empty after Cancel is clicked', async () => {
            renderModal();
            fireEvent.change(screen.getByTestId('state-select'), { target: { value: 'Kerala' } });
            expect(screen.getByTestId('state-select')).toHaveValue('Kerala');
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            await waitFor(() => {
                expect(screen.getByTestId('state-select')).toHaveValue('');
            });
        });
    });
});
