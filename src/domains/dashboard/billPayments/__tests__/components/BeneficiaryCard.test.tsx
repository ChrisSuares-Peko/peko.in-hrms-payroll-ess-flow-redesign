import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import BeneficiaryCard from '../../components/BeneficiaryCard';
import useFetchBillApi from '../../hooks/useFetchBillApi';
import { Beneficiary } from '../../types/index';

// Mock the custom hook used in the component
vi.mock('../../hooks/useFetchBillApi', () => ({
    __esModule: true,
    default: vi.fn(),
}));

describe('BeneficiaryCard Component', () => {
    const mockHandleEdit = vi.fn();
    const mockHandlePayment = vi.fn();

    beforeEach(() => {
        (useFetchBillApi as Mock).mockReturnValue({
            handlePayment: mockHandlePayment,
            isLoading: false,
        });
    });

    const beneficiary: Beneficiary = {
        name: 'John Doe',
        billerId: '1',
        accessKey: 'testAccessKey',
        serviceProvider: 'Electricity',
        serviceOperator: { serviceProvider: 'Electricity', serviceImage: 'Electricity.svg' },
        customerParams: [
            { name: 'param1', value: 'value1' },
            { name: 'param2', value: 'value2' },
        ],
        id: 0,
        phoneNo: '',
        providerCircle: '',
        isActive: false,
        createdAt: '',
        updatedAt: '',
        credentialId: 0,
    };

    it('should render the beneficiary card with correct data', () => {
        render(<BeneficiaryCard beneficiary={beneficiary} handleEdit={mockHandleEdit} />);

        // Check if the beneficiary name and service provider are displayed
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Electricity')).toBeInTheDocument();

        // Check if the customer param is rendered
        expect(screen.getByText('value1 (Electricity)')).toBeInTheDocument();
    });

    it('should call handleEdit when edit button is clicked', () => {
        render(<BeneficiaryCard beneficiary={beneficiary} handleEdit={mockHandleEdit} />);

        // Simulate clicking the edit button
        fireEvent.click(screen.getByText('Edit'));

        // Ensure that the handleEdit function is called
        expect(mockHandleEdit).toHaveBeenCalledTimes(1);
    });

    it('should call handlePayment with correct values when pay now button is clicked', async () => {
        render(<BeneficiaryCard beneficiary={beneficiary} handleEdit={mockHandleEdit} />);

        // Simulate clicking the Pay Now button
        fireEvent.click(screen.getByText('Pay Now'));

        // Ensure that handlePayment is called with the correct values
        await waitFor(() => {
            expect(mockHandlePayment).toHaveBeenCalledWith(
                {
                    serviceProvider: '1',
                    param1: 'value1',
                    param2: 'value2',
                },
                'testAccessKey'
            );
        });
    });

    it('should show loading state when isLoading is true', () => {
        // Simulate the loading state
        (useFetchBillApi as Mock).mockReturnValue({
            handlePayment: mockHandlePayment,
            isLoading: true,
        });

        render(<BeneficiaryCard beneficiary={beneficiary} handleEdit={mockHandleEdit} />);

        // Ensure the Pay Now button shows a loading spinner
        const payNowButton = screen.getByRole('button', { name: /pay now/i });
        expect(payNowButton).toHaveClass('ant-btn-loading');
    });

    it('should display default image if serviceImage is not provided', () => {
        render(<BeneficiaryCard beneficiary={beneficiary} handleEdit={mockHandleEdit} />);
        screen.debug(undefined, 200000);
        // Ensure the default service image is displayed
        expect(screen.getByRole('img')).toHaveAttribute(
            'src',
            expect.stringContaining('Electricity.svg')
        );
    });

    it('renders a Traffic Challan beneficiary with its vehicle number and a fetch action', () => {
        const mockHandleBeneficiaryPayment = vi.fn();
        (useFetchBillApi as Mock).mockReturnValue({
            handleBeneficiaryPayment: mockHandleBeneficiaryPayment,
            isLoading: false,
            billerPlans: [],
            isPlanDrawerOpen: false,
            setIsPlanDrawerOpen: vi.fn(),
            handlePlanSelect: vi.fn(),
        });
        const challanBeneficiary: Beneficiary = {
            ...beneficiary,
            accessKey: 'droom_traffic_challan',
            billerId: null,
            serviceProvider: '',
            serviceOperator: { serviceProvider: '', serviceImage: '' },
            customerParams: [{ name: 'vehicleNumber', value: 'BR28S5870' }],
        };

        render(<BeneficiaryCard beneficiary={challanBeneficiary} handleEdit={mockHandleEdit} />);

        expect(screen.getByText('Traffic Challan')).toBeInTheDocument();
        expect(screen.getByText('BR28S5870')).toBeInTheDocument();
        expect(screen.queryByText(/\(\)/)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /fetch challans/i }));
        expect(mockHandleBeneficiaryPayment).toHaveBeenCalledWith(challanBeneficiary);
    });
});
