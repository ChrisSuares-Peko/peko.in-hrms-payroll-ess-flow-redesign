import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';
import { formattedDateTime } from '@utils/dateFormat';

import { getTransactionDetail } from '../../../api/user/transactionsApi';
import { useTransactionDetailApi } from '../../../hooks/user/useTransactionDetailApi';
import { formatRupeesDecimal } from '../../../utils/helpers';

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../../api/user/transactionsApi', () => ({
    getTransactionDetail: vi.fn(),
}));

vi.mock('@utils/dateFormat', () => ({
    formattedDateTime: vi.fn(() => '01 Jan 2024, 12:00 PM'),
}));

vi.mock('../../../utils/helpers', () => ({
    formatRupeesDecimal: vi.fn((val: number) => `₹${val}.00`),
}));

const authState = {
    role: 'user',
    id: 1,
    roleName: 'user',
    username: 'testuser',
    subCorporateId: null,
};

const mockTransaction = {
    id: 42,
    displayId: 'TXN001',
    maskedCardNumber: '**** **** **** 1234',
    merchantName: 'Zomato',
    merchantCity: 'Mumbai',
    category: 'Food',
    transactionAmount: 500,
    status: 'Completed',
    declineReason: null,
    createdAt: '2024-01-01T12:00:00Z',
    notifiedAt: null,
    cardholder: {
        name: 'John Doe',
        email: 'john@example.com',
        team: 'Engineering',
        role: 'Employee',
    },
};

const makeApiResponse = (transaction = mockTransaction) => ({
    data: { transaction },
});

describe('useTransactionDetailApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
            fn({ reducer: { auth: authState } })
        );
    });

    describe('when transactionId is null', () => {
        it('does not call getTransactionDetail', async () => {
            renderHook(() => useTransactionDetailApi(null));

            await act(async () => {});

            expect(getTransactionDetail).not.toHaveBeenCalled();
        });

        it('returns detail as null and isLoading as false', async () => {
            const { result } = renderHook(() => useTransactionDetailApi(null));

            await act(async () => {});

            expect(result.current.detail).toBeNull();
            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('when transactionId is provided', () => {
        it('calls getTransactionDetail with role, id, and transactionId', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() =>
                expect(getTransactionDetail).toHaveBeenCalledWith('user', 1, 'TXN001')
            );
        });

        it('uses the role and id sourced from the auth selector', async () => {
            (useAppSelector as unknown as Mock).mockImplementation((fn: any) =>
                fn({
                    reducer: {
                        auth: {
                            role: 'admin',
                            id: 99,
                            roleName: 'admin',
                            username: 'adminuser',
                            subCorporateId: null,
                        },
                    },
                })
            );
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            renderHook(() => useTransactionDetailApi('TXN999'));

            await waitFor(() =>
                expect(getTransactionDetail).toHaveBeenCalledWith('admin', 99, 'TXN999')
            );
        });
    });

    describe('on a successful fetch', () => {
        it('sets merchantName from the transaction', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.merchantName).toBe('Zomato');
        });

        it('sets maskedCardNumber from the transaction', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.maskedCardNumber).toBe('**** **** **** 1234');
        });

        it('sets transactionAmount through formatRupeesDecimal', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(formatRupeesDecimal).toHaveBeenCalledWith(500);
            expect(result.current.detail?.transactionAmount).toBe('₹500.00');
        });

        it('sets totalCharged equal to transactionAmount', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.totalCharged).toBe('₹500.00');
        });

        it('sets internationalFee to the formatted value of 0', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(formatRupeesDecimal).toHaveBeenCalledWith(0);
            expect(result.current.detail?.internationalFee).toBe('₹0.00');
        });

        it('sets timestamp via formattedDateTime when createdAt is present', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(formattedDateTime).toHaveBeenCalled();
            expect(result.current.detail?.timestamp).toBe('01 Jan 2024, 12:00 PM');
        });

        it('sets timestamp to empty string when createdAt is absent', async () => {
            const txNoDate = { ...mockTransaction, createdAt: '' };
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txNoDate));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.timestamp).toBe('');
        });

        it('falls back merchantName to "Transaction" when API returns null', async () => {
            const txNoMerchant = { ...mockTransaction, merchantName: null } as any;
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txNoMerchant));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.merchantName).toBe('Transaction');
        });
    });

    describe('when cardholder is present', () => {
        it('prepends a "Cardholder Details" section with correct fields', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            const { sections } = result.current.detail!;
            expect(sections[0].title).toBe('Cardholder Details');
            expect(sections[0].fields).toEqual([
                { label: 'Name', value: 'John Doe' },
                { label: 'Email', value: 'john@example.com' },
                { label: 'Role', value: 'Employee' },
                { label: 'Team', value: 'Engineering' },
            ]);
        });

        it('renders "—" placeholders for null cardholder sub-fields', async () => {
            const txNullTeam = {
                ...mockTransaction,
                cardholder: { name: '', email: '', team: null, role: '' } as any,
            };
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txNullTeam));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            const cardholderSection = result.current.detail!.sections[0];
            expect(cardholderSection.fields).toEqual([
                { label: 'Name', value: '—' },
                { label: 'Email', value: '—' },
                { label: 'Role', value: '—' },
                { label: 'Team', value: '—' },
            ]);
        });

        it('produces two sections total (Cardholder + Transaction)', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail!.sections).toHaveLength(2);
        });
    });

    describe('when cardholder is null', () => {
        it('omits the Cardholder Details section', async () => {
            const txNoCardholder = { ...mockTransaction, cardholder: null } as any;
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txNoCardholder));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            const { sections } = result.current.detail!;
            expect(sections).toHaveLength(1);
            expect(sections[0].title).toBe('Transaction Details');
        });
    });

    describe('Transaction Details section', () => {
        it('contains the standard fields from the transaction', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            const txSection = result.current.detail!.sections.find(
                s => s.title === 'Transaction Details'
            )!;

            expect(txSection.fields).toEqual(
                expect.arrayContaining([
                    { label: 'Transaction ID', value: 'TXN001' },
                    { label: 'Status', value: 'Completed' },
                    { label: 'Category', value: 'Food' },
                    { label: 'Merchant', value: 'Zomato' },
                    { label: 'City', value: 'Mumbai' },
                ])
            );
        });
    });

    describe('declineReason', () => {
        it('adds "Decline reason" field to Transaction Details when present', async () => {
            const txDeclined = { ...mockTransaction, declineReason: 'Insufficient funds' } as any;
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txDeclined));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            const txSection = result.current.detail!.sections.find(
                s => s.title === 'Transaction Details'
            )!;
            const declineField = txSection.fields.find(f => f.label === 'Decline reason');

            expect(declineField).toEqual({ label: 'Decline reason', value: 'Insufficient funds' });
        });

        it('omits "Decline reason" field when declineReason is null', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            const txSection = result.current.detail!.sections.find(
                s => s.title === 'Transaction Details'
            )!;
            const declineField = txSection.fields.find(f => f.label === 'Decline reason');

            expect(declineField).toBeUndefined();
        });
    });

    describe('when the fetch returns a falsy value', () => {
        it('keeps detail null when API returns false', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.detail).toBeNull();
        });

        it('keeps detail null when API response has no transaction', async () => {
            (getTransactionDetail as Mock).mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.detail).toBeNull();
        });
    });

    describe('isLoading transitions', () => {
        it('is true while the fetch is in flight and false once it resolves', async () => {
            let resolveFn!: (val: any) => void;
            const deferred = new Promise<any>(res => {
                resolveFn = res;
            });
            (getTransactionDetail as Mock).mockReturnValue(deferred);

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.isLoading).toBe(true));

            await act(async () => {
                resolveFn(makeApiResponse());
            });

            expect(result.current.isLoading).toBe(false);
        });

        it('is false after a failed fetch resolves', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(false);

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.isLoading).toBe(false));

            expect(result.current.isLoading).toBe(false);
        });
    });

    describe('maskedCardNumber', () => {
        it('is null when the API returns null for maskedCardNumber', async () => {
            const txNullCard = { ...mockTransaction, maskedCardNumber: null } as any;
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txNullCard));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.maskedCardNumber).toBeNull();
        });

        it('preserves a non-null maskedCardNumber from the API', async () => {
            const txWithCard = { ...mockTransaction, maskedCardNumber: '**** **** **** 9999' };
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse(txWithCard));

            const { result } = renderHook(() => useTransactionDetailApi('TXN001'));

            await waitFor(() => expect(result.current.detail).not.toBeNull());

            expect(result.current.detail?.maskedCardNumber).toBe('**** **** **** 9999');
        });
    });

    describe('when transactionId changes', () => {
        it('fetches again with the new transactionId', async () => {
            (getTransactionDetail as Mock).mockResolvedValue(makeApiResponse());

            const { result, rerender } = renderHook(
                ({ txId }: { txId: string | null }) => useTransactionDetailApi(txId),
                { initialProps: { txId: 'TXN001' } }
            );

            await waitFor(() => expect(result.current.detail).not.toBeNull());
            expect(getTransactionDetail).toHaveBeenCalledWith('user', 1, 'TXN001');

            rerender({ txId: 'TXN002' });

            await waitFor(() =>
                expect(getTransactionDetail).toHaveBeenCalledWith('user', 1, 'TXN002')
            );
        });
    });
});
