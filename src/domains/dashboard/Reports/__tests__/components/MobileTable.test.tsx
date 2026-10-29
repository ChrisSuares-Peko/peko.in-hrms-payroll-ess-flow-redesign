import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import MobileTable from '../../components/MobileTable';
import { transactionType } from '../../types/index';

const mockStore = configureStore();

describe('MobileTable Component', () => {
    let store: any;
    let mockHandlePageChange: any;
    let testData: transactionType[];

    beforeEach(() => {
        store = mockStore({
            reducer: {
                auth: { role: 'admin', id: 123 }, // Mock user auth data
                transactions: [], // Mock transactions state
            },
        });

        mockHandlePageChange = vi.fn();

        testData = [
            {
                transactionID: 123,
                operator: 'Test Operator',
                amount: 100,
                status: 'Success',
                cashback: '10',
                date: '',
                category: '',
                paymentMode: '',
                download: '',
                accountNumber: '',
                subCorporateName: '',
            },
            {
                transactionID: 456,
                operator: 'Second Operator',
                amount: 200,
                status: 'Failed',
                cashback: '20',
                date: '',
                category: '',
                paymentMode: '',
                download: '',
                accountNumber: '',
                subCorporateName: '',
            },
        ];
    });

    const renderComponent = () =>
        render(
            <Provider store={store}>
                <MobileTable
                    isLoading={false}
                    data={testData}
                    isCashbackTable={false}
                    count={2}
                    page={1}
                    handlePageChange={mockHandlePageChange}
                />
            </Provider>
        );

    it('renders table headers correctly', () => {
        renderComponent();
        expect(screen.getByText('Operator')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('renders transaction data correctly', () => {
        renderComponent();
        expect(screen.getByText('Test Operator')).toBeInTheDocument();
        expect(screen.getByText('Second Operator')).toBeInTheDocument();
        expect(screen.getByText(/₹\s*100\.00/i)).toBeInTheDocument();
        expect(screen.getByText(/₹\s*200\.00/i)).toBeInTheDocument();

        expect(screen.getByText('Success')).toBeInTheDocument();
        expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('displays empty state when there is no data', () => {
        render(
            <Provider store={store}>
                <MobileTable
                    isLoading={false}
                    data={[]}
                    isCashbackTable={false}
                    count={0}
                    page={1}
                    handlePageChange={mockHandlePageChange}
                />
            </Provider>
        );

        expect(screen.getByText(/No data found/i)).toBeInTheDocument();
    });
});
