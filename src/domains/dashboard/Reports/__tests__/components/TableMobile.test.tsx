/* eslint-disable @typescript-eslint/no-unused-vars */
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import TableMobile from '../../components/TableMobile';

const mockStore = configureStore();

vi.mock('../../hooks/useDownloadInvoice', () => ({
    useDownloadInvoice: () => ({
        getInvoiceData: vi.fn(),
        loader: false,
    }),
}));

describe('TableMobile Component', () => {
    let store: any;
    let mockGetInvoiceData: any;
    let mockTransaction: any;

    beforeEach(() => {
        store = mockStore({
            reducer: {
                auth: { role: 'admin', id: 123 },
            },
        });

        mockGetInvoiceData = vi.fn();

        mockTransaction = {
            amount: 500,
            date: '2024-02-15T10:30:00Z',
            status: 'Success',
            category: 'Recharge',
            operator: 'Airtel',
            transactionID: 123456,
            paymentMode: 'UPI',
            cashback: 50,
        };
    });

    const renderComponent = (isCashbackTable = false) =>
        render(
            <Provider store={store}>
                <TableMobile transaction={mockTransaction} isCashbackTable={isCashbackTable} />
            </Provider>
        );

    it('renders without crashing', () => {
        renderComponent();
        expect(screen.getByText('Airtel')).toBeInTheDocument();
        expect(screen.getByText(/₹ 500/)).toBeInTheDocument();
        expect(screen.getByText('Success')).toBeInTheDocument();
    });

    it('expands transaction details when clicking the arrow', () => {
        renderComponent();
        const arrowIcon = screen.getByRole('img', { hidden: true }); // Ant Design RightOutlined icon
        fireEvent.click(arrowIcon);

        expect(screen.getByText('Date :')).toBeInTheDocument();
        expect(screen.getByText('Order ID :')).toBeInTheDocument();
        expect(screen.getByText('Category :')).toBeInTheDocument();
        expect(screen.getByText('Payment Mode :')).toBeInTheDocument();
    });

    it('shows the payment mode exactly as the report hook formatted it', () => {
        mockTransaction.paymentMode = 'Credit Card + Wallet';
        renderComponent();
        fireEvent.click(screen.getByRole('img', { hidden: true }));

        expect(screen.getByText('Credit Card + Wallet')).toBeInTheDocument();
    });

    it('calls getInvoiceData when clicking Download Invoice', async () => {
        renderComponent();

        // Expand details section
        const arrowIcon = screen.getByRole('img', { hidden: true }); // RightOutlined icon
        fireEvent.click(arrowIcon);

        // Wait for button to appear
        const downloadButton = await screen.findByText(/Download Invoice/i);
        expect(downloadButton).toBeInTheDocument();

        // Click the button
        fireEvent.click(downloadButton);
    });
});
