import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

import { useAppDispatch } from '@src/hooks/store';

import TransactionDetailModal from '../../../../components/landingPage/transactions/TransactionDetailModal';
import { useTransactionCommentsApi } from '../../../../hooks/user/useTransactionCommentsApi';
import { useTransactionDetailApi } from '../../../../hooks/user/useTransactionDetailApi';
import { useTransactionReceiptsApi } from '../../../../hooks/user/useTransactionReceiptsApi';
import { TransactionRow } from '../../../../utils/types';

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('@src/slices/apiSlice', () => ({
    showToast: vi.fn((payload: any) => ({ type: 'api/showToast', payload })),
}));

// The real antd Select's virtual-list rendering trips a jsdom/nwsapi selector-parsing bug when it
// mounts alongside this modal's other CSS-in-class utilities (unrelated to this component's logic —
// only the admin variant's "Upload as" dropdown renders a Select at all). Swap in a plain native
// <select> for these tests only; every other antd component here renders for real.
vi.mock('antd', async () => {
    const actual = await vi.importActual<typeof import('antd')>('antd');
    return {
        ...actual,
        Select: ({ value, onChange, options }: any) => (
            <select value={value} onChange={e => onChange?.(e.target.value)}>
                {(options ?? []).map((opt: { value: string; label: string }) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        ),
    };
});

vi.mock('../../../../hooks/user/useTransactionDetailApi', () => ({
    useTransactionDetailApi: vi.fn(),
}));
vi.mock('../../../../hooks/user/useTransactionCommentsApi', () => ({
    useTransactionCommentsApi: vi.fn(),
}));
vi.mock('../../../../hooks/user/useTransactionReceiptsApi', () => ({
    useTransactionReceiptsApi: vi.fn(),
}));

const mockTransaction: TransactionRow = {
    key: 'txn-1',
    cardLast4: '**** **** **** 1294',
    date: 'July 23, 2026',
    merchant: 'PinePerk_Test_MerchantT',
    member: 'Faris Ahammedali',
    status: 'Completed',
    approval: 'Auto-approved',
    fee: 0,
    amount: 1000,
};

describe('TransactionDetailModal', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAppDispatch as unknown as Mock).mockReturnValue(mockDispatch);
        (useTransactionDetailApi as ReturnType<typeof vi.fn>).mockReturnValue({
            detail: null,
            isLoading: false,
        });
        (useTransactionReceiptsApi as ReturnType<typeof vi.fn>).mockReturnValue({
            receipts: [],
            isLoading: false,
            isUploading: false,
            upload: vi.fn(),
            deleteReceipt: vi.fn(),
        });
        (useTransactionCommentsApi as ReturnType<typeof vi.fn>).mockReturnValue({
            comments: [],
            isLoading: false,
            isPosting: false,
            post: vi.fn(),
        });
    });

    // ADO 29116 — a multi-line comment was rendered as a single continuous line because the
    // message <Text> had no white-space CSS to preserve newlines (the backend stores them intact).
    it('preserves multi-line formatting when rendering a posted comment', () => {
        (useTransactionCommentsApi as ReturnType<typeof vi.fn>).mockReturnValue({
            comments: [
                {
                    key: 'comment-1',
                    author: 'Faris Ahammedali',
                    role: 'user',
                    message: 'line one\nline two\nline three',
                    timestamp: 'July 29, 2026 at 11:57 AM',
                },
            ],
            isLoading: false,
            isPosting: false,
            post: vi.fn(),
        });

        render(<TransactionDetailModal transaction={mockTransaction} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Comments'));

        const message = screen.getByText(
            (_, element) => element?.textContent === 'line one\nline two\nline three'
        );
        expect(message).toBeInTheDocument();
        expect(message).toHaveClass('whitespace-pre-line');
    });

    // ADO 29115 — the delete button was shown for every receipt regardless of who uploaded it, and the
    // backend's own ownership check was bypassable via a separate session bug (now fixed), letting a
    // sub-user delete an admin-uploaded receipt. The frontend should mirror the backend's real rule:
    // a cardholder viewer may only delete their own (Cardholder-uploaded) receipts; an admin may delete any.
    describe('receipt delete permissions', () => {
        const mockReceipts = [
            {
                key: '1',
                id: 1,
                fileName: 'admin-receipt.png',
                date: 'July 29, 2026',
                uploadedBy: 'Admin',
            },
            {
                key: '2',
                id: 2,
                fileName: 'cardholder-receipt.png',
                date: 'July 29, 2026',
                uploadedBy: 'Cardholder',
            },
        ];

        it("shows delete only for the cardholder's own receipt when viewed as a cardholder", () => {
            (useTransactionReceiptsApi as ReturnType<typeof vi.fn>).mockReturnValue({
                receipts: mockReceipts,
                isLoading: false,
                isUploading: false,
                upload: vi.fn(),
                deleteReceipt: vi.fn(),
            });

            render(
                <TransactionDetailModal
                    transaction={mockTransaction}
                    onClose={vi.fn()}
                    variant="user"
                />
            );
            fireEvent.click(screen.getByText('Receipts'));

            expect(screen.queryAllByRole('button', { name: 'Delete receipt' })).toHaveLength(1);
        });

        it('shows delete for every receipt when viewed as an admin', () => {
            (useTransactionReceiptsApi as ReturnType<typeof vi.fn>).mockReturnValue({
                receipts: mockReceipts,
                isLoading: false,
                isUploading: false,
                upload: vi.fn(),
                deleteReceipt: vi.fn(),
            });

            render(
                <TransactionDetailModal
                    transaction={mockTransaction}
                    onClose={vi.fn()}
                    variant="admin"
                />
            );
            fireEvent.click(screen.getByText('Receipts'));

            expect(screen.queryAllByRole('button', { name: 'Delete receipt' })).toHaveLength(2);
        });
    });

    // ADO 29079 — the Receipts tab gave no indication of the maximum allowed file size, so an
    // oversized upload only ever failed later against the backend's incidental global body-size cap.
    describe('receipt upload max file size', () => {
        it('shows the max file size hint on the Receipts tab', () => {
            render(<TransactionDetailModal transaction={mockTransaction} onClose={vi.fn()} />);
            fireEvent.click(screen.getByText('Receipts'));

            expect(screen.getByText('PDF, JPG, PNG · Max 5 MB')).toBeInTheDocument();
        });

        it('rejects a file over 5 MB with an error toast, without calling upload', () => {
            const upload = vi.fn();
            (useTransactionReceiptsApi as ReturnType<typeof vi.fn>).mockReturnValue({
                receipts: [],
                isLoading: false,
                isUploading: false,
                upload,
                deleteReceipt: vi.fn(),
            });

            render(<TransactionDetailModal transaction={mockTransaction} onClose={vi.fn()} />);
            fireEvent.click(screen.getByText('Receipts'));

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });
            Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024, configurable: true });
            Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input);

            expect(upload).not.toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalledWith(
                expect.objectContaining({
                    payload: { variant: 'error', description: 'File size must not exceed 5 MB' },
                })
            );
        });

        it('accepts a file at the 5 MB limit and uploads it without an error toast', () => {
            const upload = vi.fn();
            (useTransactionReceiptsApi as ReturnType<typeof vi.fn>).mockReturnValue({
                receipts: [],
                isLoading: false,
                isUploading: false,
                upload,
                deleteReceipt: vi.fn(),
            });

            render(<TransactionDetailModal transaction={mockTransaction} onClose={vi.fn()} />);
            fireEvent.click(screen.getByText('Receipts'));

            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            const file = new File(['x'], 'receipt.pdf', { type: 'application/pdf' });
            Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024, configurable: true });
            Object.defineProperty(input, 'files', { value: [file] });
            fireEvent.change(input);

            expect(upload).toHaveBeenCalledWith(file, expect.any(String));
            expect(mockDispatch).not.toHaveBeenCalled();
        });
    });
});
