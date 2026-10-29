import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { describe, it, expect, vi } from 'vitest';

import BeneficiaryCard from '../../components/BeneficiaryCard';
import { Beneficiary } from '../../types/index';

const mockStore = configureStore();
const store = mockStore({
    reducer: {
        auth: { role: 'admin', id: '123' },
    },
});

const mockHandleBeneficiaryPay = vi.fn();

vi.mock('../../hooks/usePayment', () => ({
    default: () => ({
        handleBeneficiaryPay: mockHandleBeneficiaryPay,
        isLoading: false,
    }),
}));

describe('BeneficiaryCard Component', () => {
    const mockHandleEdit = vi.fn();

    const mockBeneficiary: Beneficiary = {
        name: 'John Doe',
        phoneNo: '9876543210',
        serviceProvider: 'Airtel',
        serviceOperator: {
            serviceProvider: 'Airtel',
            serviceImage: 'https://example.com/airtel.png',
        },
        customerParams: [{ value: '9876543210', name: '' }],
        id: 0,
        accessKey: '',
        billerId: null,
        providerCircle: '',
        isActive: false,
        createdAt: '',
        updatedAt: '',
        credentialId: 0,
    };

    it('renders correctly', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    {' '}
                    {/* ✅ Wrap in MemoryRouter */}
                    <BeneficiaryCard beneficiary={mockBeneficiary} handleEdit={mockHandleEdit} />
                </MemoryRouter>
            </Provider>
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pay now/i })).toBeInTheDocument();
        expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('calls handleEdit when Edit is clicked', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <BeneficiaryCard beneficiary={mockBeneficiary} handleEdit={mockHandleEdit} />
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByText('Edit'));
        expect(mockHandleEdit).toHaveBeenCalled();
    });

    it('calls handleBeneficiaryPay when Pay Now is clicked', () => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <BeneficiaryCard beneficiary={mockBeneficiary} />
                </MemoryRouter>
            </Provider>
        );

        fireEvent.click(screen.getByRole('button', { name: /pay now/i }));
        expect(mockHandleBeneficiaryPay).toHaveBeenCalledWith(mockBeneficiary, '/');
    });
});
