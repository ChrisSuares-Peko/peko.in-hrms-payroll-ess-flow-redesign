import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getCorporateCardApplication,
    getCorporatesForApplication,
    retryVendorKybEmail,
    updateCorporateCardApplication,
} from '../../../api/corporateCardApplications';
import ManageApplicationDrawer from '../../../component/corporateCardApplications/ManageApplicationDrawer';
import { CorporateCardApplicationRow } from '../../../types/corporateCardApplications';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/hooks/useScreenSize', () => ({
    default: vi.fn(() => ({ md: true })),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'toast/show', payload })),
}));

vi.mock('../../../api/corporateCardApplications', () => ({
    getCorporateCardApplication: vi.fn(),
    getCorporatesForApplication: vi.fn(),
    retryVendorKybEmail: vi.fn(),
    updateCorporateCardApplication: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
    CloseOutlined: ({ onClick }: any) => (
        <button type="button" data-testid="close-icon-btn" onClick={onClick} aria-label="close" />
    ),
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

    const Button = ({ children, onClick, disabled, loading }: any) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            data-loading={loading ? 'true' : undefined}
        >
            {children}
        </button>
    );

    const Input = ({ value, onChange, placeholder, disabled }: any) => (
        <input
            value={value ?? ''}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
        />
    );
    Input.TextArea = ({ value, onChange, placeholder }: any) => (
        <textarea value={value ?? ''} onChange={onChange} placeholder={placeholder} />
    );

    // Mirrors antd's real contract: `parser` runs on the raw typed string and returns the
    // parsed number directly (NaN when nothing valid was typed), so a `parser` that strips
    // non-digits (as ours does) must be exercised here for the digit-only behavior to be testable.
    const InputNumber = ({ value, onChange, placeholder, parser }: any) => (
        <input
            value={value ?? ''}
            onChange={e => {
                if (parser) {
                    const parsed = parser(e.target.value);
                    onChange?.(Number.isNaN(parsed) ? null : parsed);
                    return;
                }
                onChange?.(e.target.value === '' ? null : Number(e.target.value));
            }}
            placeholder={placeholder}
        />
    );

    const Select = ({ value, onChange, options, placeholder }: any) => (
        <select value={value ?? ''} onChange={e => onChange?.(e.target.value)}>
            <option value="">{placeholder ?? 'Select'}</option>
            {(options ?? []).map((opt: any) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                </option>
            ))}
        </select>
    );

    const Tag = ({ children }: any) => <span data-testid="status-tag">{children}</span>;
    const Alert = ({ message }: any) => <div role="alert">{message}</div>;
    const Skeleton = ({ active }: any) => (active ? <div data-testid="skeleton" /> : null);
    Skeleton.Button = () => <div data-testid="skeleton-button" />;

    const Typography = {
        Text: ({ children, className }: any) => <span className={className}>{children}</span>,
        Title: ({ children }: any) => <h4>{children}</h4>,
    };

    return {
        ...actual,
        Drawer,
        Button,
        Input,
        InputNumber,
        Select,
        Tag,
        Alert,
        Skeleton,
        Typography,
    };
});

const mockDispatch = vi.fn();
const mockAuth = { reducer: { auth: { role: 'admin', id: 5 } } };

const baseRow: CorporateCardApplicationRow = {
    corporateId: 42,
    companyName: 'Steel & Co',
    entityName: null,
    fullName: 'Jane Doe',
    pekoAccountNumber: '100000726',
    email: 'jane@example.com',
    kybStatus: 'REJECTED',
    kybReference: 'KYB3F9A2B7C1D',
    cardSchemeId: null,
    svcCardNumberLast4: null,
    beneficiaryName: null,
    virtualAccountNumberLast4: null,
    virtualAccountIfsc: null,
    bankName: null,
    vendorEmailStatus: null,
    updatedAt: '2026-07-10T10:00:00.000Z',
};

const baseDetail = {
    corporateId: 42,
    kybStatus: 'REJECTED' as const,
    kybReference: 'KYB-99',
    rejectionReason: 'Blurry PAN card.',
    cardSchemeId: 175491,
    svcCardNumberLast4: '3456',
    virtualAccount: {
        beneficiaryName: 'Steel & Co',
        accountNumber: '1234567890',
        ifsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
        bankAddress: 'Mumbai',
        paymentReference: 'REF-1',
    },
    vendorEmail: { status: null, sentAt: null },
    updatedAt: '2026-07-10T10:00:00.000Z',
};

describe('ManageApplicationDrawer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (getCorporateCardApplication as Mock).mockResolvedValue(baseDetail);
        (getCorporatesForApplication as Mock).mockResolvedValue([]);
        (updateCorporateCardApplication as Mock).mockResolvedValue({
            application: { ...baseDetail },
        });
        (retryVendorKybEmail as Mock).mockResolvedValue({ application: { ...baseDetail } });
    });

    it('does not render when open is false', () => {
        render(
            <ManageApplicationDrawer
                open={false}
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        expect(screen.queryByTestId('drawer')).toBeNull();
    });

    it('shows "Add Application" as the title in create mode', () => {
        render(
            <ManageApplicationDrawer
                open
                mode="create"
                row={null}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        expect(screen.getByText('Add Application')).toBeInTheDocument();
    });

    it('loads the corporate picker on open in create mode', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="create"
                row={null}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() =>
            expect(getCorporatesForApplication).toHaveBeenCalledWith('admin', 5, undefined)
        );
    });

    it('shows the company name and status tag as the title in edit mode', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        await waitFor(() => expect(screen.getByText('Steel & Co')).toBeInTheDocument());
        expect(screen.getByTestId('status-tag')).toHaveTextContent('Rejected');
    });

    it('fetches the application detail and populates the form in edit mode', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        expect(getCorporateCardApplication).toHaveBeenCalledWith('admin', 5, 42);
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
        expect(screen.getByDisplayValue('KYB-99')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
    });

    it('shows the rejection reason field when the KYB status is REJECTED', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        await waitFor(() =>
            expect(screen.getByDisplayValue('Blurry PAN card.')).toBeInTheDocument()
        );
    });

    it('hides the rejection reason field when the KYB status is not REJECTED', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            kybStatus: 'VERIFIED',
            rejectionReason: null,
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={{ ...baseRow, kybStatus: 'VERIFIED' }}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
        expect(
            screen.queryByPlaceholderText('Shown to the corporate on the KYB rejected screen')
        ).not.toBeInTheDocument();
    });

    it('disables the Completed and Verified status options while required provisioning fields are missing', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            cardSchemeId: null,
            svcCardNumberLast4: null,
            virtualAccount: { ...baseDetail.virtualAccount, accountNumber: '', ifsc: '' },
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
        const verifiedOption = screen.getByRole('option', {
            name: 'Verified',
        }) as HTMLOptionElement;
        expect(verifiedOption.disabled).toBe(true);
    });

    /**
     * Completed is what the corporate writes when it opens its dashboard; offering it here let an admin
     * close the application out from under them.
     */
    it('never offers Completed as an admin-settable status', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        expect(screen.queryByRole('option', { name: 'Completed' })).not.toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Under review' })).toBeInTheDocument();
    });

    it('disables KYB Reference once the backend has already generated one', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        expect(screen.getByDisplayValue('KYB-99')).toBeDisabled();
    });

    it('leaves KYB Reference editable when the backend has not generated one yet', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            kybReference: null,
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        expect(
            screen.getByPlaceholderText('Auto-generated once the corporate submits KYB')
        ).not.toBeDisabled();
    });

    it('leaves KYB Reference editable in create mode', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="create"
                row={null}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );

        expect(
            screen.getByPlaceholderText('Auto-generated once the corporate submits KYB')
        ).not.toBeDisabled();
    });

    it('still validates KYB Reference when it is editable and given an invalid value', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            kybReference: null,
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(
            screen.getByPlaceholderText('Auto-generated once the corporate submits KYB'),
            { target: { value: ' KYB-1' } }
        );
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(screen.getByText(/A KYB reference looks like KYB4A9F2C1B0E/)).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it.each(['done', 'KYB-99', 'kyb3f9a2b7c1d'])(
        'refuses %s as a hand-typed KYB reference',
        async value => {
            (getCorporateCardApplication as Mock).mockResolvedValue({
                ...baseDetail,
                kybReference: null,
            });
            render(
                <ManageApplicationDrawer
                    open
                    mode="edit"
                    row={baseRow}
                    onClose={vi.fn()}
                    onSaved={vi.fn()}
                />
            );
            await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

            fireEvent.change(
                screen.getByPlaceholderText('Auto-generated once the corporate submits KYB'),
                { target: { value } }
            );
            fireEvent.click(screen.getByRole('button', { name: 'Save' }));

            await waitFor(() =>
                expect(
                    screen.getByText(/A KYB reference looks like KYB4A9F2C1B0E/)
                ).toBeInTheDocument()
            );
            expect(updateCorporateCardApplication).not.toHaveBeenCalled();
        }
    );

    it('still saves an application whose stored reference predates the generated format', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            kybStatus: 'SUBMITTED',
            kybReference: 'done',
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
    });

    it('requires a rejection reason before saving when the KYB status is REJECTED', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(
            screen.getByPlaceholderText('Shown to the corporate on the KYB rejected screen'),
            {
                target: { value: '' },
            }
        );
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(
                screen.getByText('Tell the corporate why the KYB was rejected.')
            ).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('shows a validation message on each missing mandatory field when saving as Verified with fields blank', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            kybStatus: 'VERIFIED',
            cardSchemeId: null,
            svcCardNumberLast4: null,
            virtualAccount: { ...baseDetail.virtualAccount, accountNumber: '', ifsc: '' },
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={{ ...baseRow, kybStatus: 'VERIFIED' }}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(
                screen.getByText(
                    'Card scheme ID is required to mark this application Verified or Completed.'
                )
            ).toBeInTheDocument()
        );
        expect(
            screen.getByText(
                'SVC card number is required to mark this application Verified or Completed.'
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Account number is required to mark this application Verified or Completed.'
            )
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'IFSC code is required to mark this application Verified or Completed.'
            )
        ).toBeInTheDocument();
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('strips spaces and letters typed into Card Scheme ID and SVC Card Number', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), {
            target: { value: '1 111a11' },
        });
        fireEvent.change(screen.getByPlaceholderText('Enter to replace (16 digits)'), {
            target: { value: '1234 5678 abcd 9012' },
        });
        expect(screen.getByPlaceholderText('e.g. 12345')).toHaveValue('111111');
        expect(screen.getByPlaceholderText('Enter to replace (16 digits)')).toHaveValue(
            '123456789012'
        );
    });

    it('keeps letters in the Account Number and upper-cases them', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Account number'), {
            target: { value: 'peko1234567' },
        });

        expect(screen.getByPlaceholderText('Account number')).toHaveValue('PEKO1234567');
    });

    it('rejects a Card Scheme ID with fewer than 4 digits', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(screen.getByText('Card scheme ID must be 4 to 9 digits.')).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('stops a Card Scheme ID at 9 digits as it is typed', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), {
            target: { value: '123456789012345' },
        });

        expect(screen.getByPlaceholderText('e.g. 12345')).toHaveValue('123456789');
    });

    it('rejects a stored Card Scheme ID longer than 9 digits', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            cardSchemeId: 1234567890,
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(screen.getByText('Card scheme ID must be 4 to 9 digits.')).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('accepts a Card Scheme ID at the maximum', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('e.g. 12345'), {
            target: { value: '999999999' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        const [, , , payload] = (updateCorporateCardApplication as Mock).mock.calls[0];
        expect(payload.cardSchemeId).toBe(999999999);
    });

    it.each([
        ['a', 'Enter at least 2 characters.'],
        [' ab', 'Remove the leading or trailing spaces.'],
        ['ab ', 'Remove the leading or trailing spaces.'],
        ['ab  cd', 'Remove the consecutive spaces.'],
        ['abc123', "Only letters, spaces, and ' - & . are allowed."],
    ])('rejects Beneficiary Name %j with "%s"', async (value, message) => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Account holder name'), { target: { value } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('rejects a Bank Address containing disallowed special characters', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Bank branch address'), {
            target: { value: '@@invalid@@' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(
                screen.getByText(
                    'Only letters, numbers, spaces, line breaks, and , . / # : & - are allowed.'
                )
            ).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('accepts a Bank Address written over several lines with an ampersand', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Bank branch address'), {
            target: { value: 'Steel & Co Tower\n12 Marine Drive\nMumbai 400020' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        const [, , , payload] = (updateCorporateCardApplication as Mock).mock.calls[0];
        expect(payload.virtualAccount.bankAddress).toBe(
            'Steel & Co Tower\n12 Marine Drive\nMumbai 400020'
        );
    });

    it('still rejects double spaces inside one line of a Bank Address', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Bank branch address'), {
            target: { value: 'Steel & Co Tower\n12  Marine Drive' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(screen.getByText('Remove the consecutive spaces.')).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('rejects a blank line inside a Bank Address', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Bank branch address'), {
            target: { value: 'Steel & Co Tower\n\nMumbai 400020' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(screen.getByText('Remove the blank lines.')).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('rejects a Payment Reference that is a single character', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Payment reference / remark'), {
            target: { value: 'a' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(screen.getByText('Enter at least 2 characters.')).toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('accepts valid free-text values and saves successfully', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Account holder name'), {
            target: { value: "O'Brien & Sons" },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        expect(screen.queryByText(/are allowed\.$/)).not.toBeInTheDocument();
    });

    it('saves without a svcCardNumber when none was entered, and shows the update toast on success', async () => {
        const onSaved = vi.fn();
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={onSaved}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        const [, , corporateId, payload] = (updateCorporateCardApplication as Mock).mock.calls[0];
        expect(corporateId).toBe(42);
        expect(payload).not.toHaveProperty('svcCardNumber');
        expect(payload.virtualAccount.accountNumber).toBe('1234567890');
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ description: 'Application updated.' }),
            })
        );
        expect(onSaved).toHaveBeenCalled();
    });

    it('includes svcCardNumber in the payload when a new one is entered', async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.change(screen.getByPlaceholderText('Enter to replace (16 digits)'), {
            target: { value: '9876543210123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        const [, , , payload] = (updateCorporateCardApplication as Mock).mock.calls[0];
        expect(payload.svcCardNumber).toBe('9876543210123456');
    });
});

describe('ManageApplicationDrawer — vendor review email', () => {
    const openDrawer = async (vendorEmail: any, kybStatus = 'UNDER_REVIEW') => {
        (getCorporateCardApplication as Mock).mockResolvedValue({
            ...baseDetail,
            kybStatus,
            vendorEmail,
        });
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (getCorporatesForApplication as Mock).mockResolvedValue([]);
        (retryVendorKybEmail as Mock).mockResolvedValue({
            application: { ...baseDetail, vendorEmail: { status: true, sentAt: '2026-08-01' } },
        });
    });

    it('shows the send as failed and offers a retry', async () => {
        await openDrawer({ status: false, sentAt: null });

        expect(screen.getByText('Not sent')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('shows the send as successful with the date it went out', async () => {
        await openDrawer({ status: true, sentAt: '2026-08-01T09:00:00.000Z' });

        expect(screen.getByText('Sent')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send again' })).toBeInTheDocument();
    });

    it('is absent for an application that is not under review', async () => {
        await openDrawer({ status: false, sentAt: null }, 'SUBMITTED');

        expect(screen.queryByTestId('vendor-email-state')).not.toBeInTheDocument();
    });

    it('sends again when the admin retries', async () => {
        await openDrawer({ status: false, sentAt: null });

        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

        await waitFor(() => expect(retryVendorKybEmail).toHaveBeenCalledWith('admin', 5, 42));
        await waitFor(() => expect(screen.getByText('Sent')).toBeInTheDocument());
    });

    it('tells the admin why the retry failed instead of reporting success', async () => {
        (retryVendorKybEmail as Mock).mockResolvedValue({
            application: { ...baseDetail, vendorEmail: { status: false, sentAt: null } },
            vendorEmailError: 'Mailbox unavailable',
        });
        await openDrawer({ status: false, sentAt: null });

        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    variant: 'error',
                    description: expect.stringContaining('Mailbox unavailable'),
                })
            )
        );
    });

    it('reports a failed vendor send on save rather than a plain success toast', async () => {
        (updateCorporateCardApplication as Mock).mockResolvedValue({
            application: { ...baseDetail, vendorEmail: { status: false, sentAt: null } },
            vendorEmailError: 'No vendor email address is configured for Corporate Cards.',
        });
        await openDrawer({ status: null, sentAt: null });

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() =>
            expect(showToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    variant: 'error',
                    description: expect.stringContaining('No vendor email address is configured'),
                })
            )
        );
        expect(showToast).not.toHaveBeenCalledWith(
            expect.objectContaining({ variant: 'success' })
        );
    });
});

describe('ManageApplicationDrawer completed applications', () => {
    const completedDetail = { ...baseDetail, kybStatus: 'COMPLETED' as const };
    const completedRow = { ...baseRow, kybStatus: 'COMPLETED' as const };

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) => fn(mockAuth));
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (getCorporateCardApplication as Mock).mockResolvedValue(completedDetail);
        (getCorporatesForApplication as Mock).mockResolvedValue([]);
        (updateCorporateCardApplication as Mock).mockResolvedValue({
            application: { ...completedDetail },
        });
    });

    const openCompleted = async () => {
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={completedRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());
    };

    const payloadOfFirstSave = () =>
        (updateCorporateCardApplication as Mock).mock.calls[0][3];

    it('names the current status instead of falling back to the raw enum', async () => {
        await openCompleted();

        const completed = screen.getByRole('option', { name: 'Completed' }) as HTMLOptionElement;
        expect(completed.disabled).toBe(true);
    });

    it('leaves kybStatus out of the payload so an unrelated edit still saves', async () => {
        await openCompleted();

        fireEvent.change(screen.getByPlaceholderText('Bank name'), {
            target: { value: 'ICICI Bank' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        expect(payloadOfFirstSave()).not.toHaveProperty('kybStatus');
        expect(payloadOfFirstSave().virtualAccount.bankName).toBe('ICICI Bank');
    });

    it('still sends kybStatus for an application that is not completed', async () => {
        (getCorporateCardApplication as Mock).mockResolvedValue(baseDetail);
        render(
            <ManageApplicationDrawer
                open
                mode="edit"
                row={baseRow}
                onClose={vi.fn()}
                onSaved={vi.fn()}
            />
        );
        await waitFor(() => expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        expect(payloadOfFirstSave().kybStatus).toBe('REJECTED');
    });

    it('asks before taking an application back off Completed, saving nothing yet', async () => {
        await openCompleted();

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REJECTED' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(
            await screen.findByText('Take this application back from Completed?')
        ).toBeInTheDocument();
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('holds the confirmation until the target status is typed exactly', async () => {
        await openCompleted();

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REJECTED' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await screen.findByText('Take this application back from Completed?');

        const confirmButton = screen.getByRole('button', { name: /Change status/ });
        expect(confirmButton).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('REJECTED'), {
            target: { value: 'REJECT' },
        });
        expect(confirmButton).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('REJECTED'), {
            target: { value: 'rejected' },
        });
        expect(confirmButton).toBeEnabled();
    });

    it('sends the new status once the change is verified', async () => {
        await openCompleted();

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REJECTED' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await screen.findByText('Take this application back from Completed?');

        fireEvent.change(screen.getByPlaceholderText('REJECTED'), {
            target: { value: 'REJECTED' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Change status/ }));

        await waitFor(() => expect(updateCorporateCardApplication).toHaveBeenCalled());
        expect(payloadOfFirstSave().kybStatus).toBe('REJECTED');
    });

    it('abandons the change when the confirmation is cancelled', async () => {
        await openCompleted();

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'REJECTED' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await screen.findByText('Take this application back from Completed?');

        const dialog = screen.getByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: /Cancel/ }));

        await waitFor(() =>
            expect(
                screen.queryByText('Take this application back from Completed?')
            ).not.toBeInTheDocument()
        );
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });

    it('still asks about the vendor email when moving Completed to Under review', async () => {
        await openCompleted();

        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'UNDER_REVIEW' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save' }));
        await screen.findByText('Take this application back from Completed?');

        fireEvent.change(screen.getByPlaceholderText('UNDER_REVIEW'), {
            target: { value: 'UNDER_REVIEW' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Change status/ }));

        expect(
            await screen.findByText('Send this application to the vendor?')
        ).toBeInTheDocument();
        expect(updateCorporateCardApplication).not.toHaveBeenCalled();
    });
});
