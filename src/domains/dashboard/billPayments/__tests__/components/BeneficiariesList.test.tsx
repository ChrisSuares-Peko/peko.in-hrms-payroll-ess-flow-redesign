import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Grid } from 'antd';
import { vi, describe, it, expect, Mock } from 'vitest';

import { useAppSelector } from '@src/hooks/store';

import BeneficiariesList from '../../components/BeneficiariesList';
import { setFormInitialValues } from '../../slices/beneficiary';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppDispatch: () => mockDispatch,
    useAppSelector: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));
vi.mock('antd', async importOriginal => {
    const actual = (await importOriginal()) as typeof import('antd');
    return {
        ...actual,
        Grid: {
            ...actual.Grid,
            useBreakpoint: vi.fn(),
        },
    };
});
const mockUseAppSelector = useAppSelector as Mock;
// const mockUseAppSelector = useBreakpoint as Mock;

describe('BeneficiariesList Component', () => {
    const accessKeyName = 'testAccessKey';

    it('should render loading skeleton while data is being fetched', () => {
        mockUseAppSelector.mockReturnValue({ beneficiaryData: [], isLoading: true });

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        const skeletonElements = document.querySelectorAll('.ant-skeleton');
        expect(skeletonElements.length).toBe(5); // 5 skeleton elements should be rendered
    });

    it('should render beneficiaries data when available', async () => {
        const mockBeneficiaries = [
            {
                accessKey: 'key1',
                name: 'John Doe',
                billerId: '1',
                customerParams: [{ value: 'Param1' }],
            },
            {
                accessKey: 'key2',
                name: 'Jane Doe',
                billerId: '2',
                customerParams: [{ value: 'Param2' }],
            },
        ];

        mockUseAppSelector.mockReturnValue({
            beneficiaryData: mockBeneficiaries,
            isLoading: false,
        });
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true }); // Simulating xs screen

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        mockBeneficiaries.forEach(beneficiary => {
            const elements = screen.getAllByText(beneficiary.name);
            expect(elements.length).toBeGreaterThan(0); // Ensure at least one instance of the name is rendered

            // Also, check if the customerParams values are rendered
            // expect(screen.getByText(beneficiary.customerParams[1]?.value)).toBeInTheDocument();
        });
    });

    it('should display "No Beneficiaries found" when no data is available', () => {
        mockUseAppSelector.mockReturnValue({ beneficiaryData: [], isLoading: false });
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true }); // Simulating xs screen

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        expect(screen.getByText('No Beneficiaries found.')).toBeInTheDocument();
    });

    it('should open the modal with empty data when "Add Beneficiary" button is clicked', async () => {
        render(<BeneficiariesList accessKeyName={accessKeyName} />);
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true });

        const addButton = screen.getByText('Add Beneficiary');
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(
                setFormInitialValues({
                    accessKey: '',
                    name: '',
                    billerId: '',
                })
            );
        });
    });

    it('should open the modal with existing data when an edit button is clicked', async () => {
        const mockBeneficiary = { accessKey: 'key1', name: 'John Doe', billerId: '1' };

        mockUseAppSelector.mockReturnValue({
            beneficiaryData: [mockBeneficiary],
            isLoading: false,
        });
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true });

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(
                setFormInitialValues({
                    accessKey: mockBeneficiary.accessKey,
                    name: mockBeneficiary.name,
                    billerId: mockBeneficiary.billerId,
                })
            );
        });
    });

    it('should show the modal with correct action type and values when editing a beneficiary', async () => {
        const mockBeneficiary = { accessKey: 'key1', name: 'John Doe', billerId: '1' };

        mockUseAppSelector.mockReturnValue({
            beneficiaryData: [mockBeneficiary],
            isLoading: false,
        });
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true });

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
        expect(screen.getByText('Edit Beneficiary Details')).toBeInTheDocument();
    });

    it('should handle modal close correctly', async () => {
        render(<BeneficiariesList accessKeyName={accessKeyName} />);
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true });

        const addButton = screen.getByText('Add Beneficiary');
        fireEvent.click(addButton);

        const closeButton = screen.getByText('Cancel');
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText('Beneficiary Modal')).not.toBeInTheDocument();
        });
    });

    it('should switch between carousel and list views based on screen size', () => {
        const mockBeneficiaries = [
            { accessKey: 'key1', name: 'John Doe', billerId: '1' },
            { accessKey: 'key2', name: 'Jane Doe', billerId: '2' },
        ];

        mockUseAppSelector.mockReturnValue({
            beneficiaryData: mockBeneficiaries,
            isLoading: false,
        });
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: false });

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        const listItems = screen.getAllByText(/Doe/);
        expect(listItems.length).toBe(2);
    });

    it('should render the carousel for xs screens', () => {
        const mockBeneficiaries = [
            { accessKey: 'key1', name: 'John Doe', billerId: '1' },
            { accessKey: 'key2', name: 'Jane Doe', billerId: '2' },
        ];

        mockUseAppSelector.mockReturnValue({
            beneficiaryData: mockBeneficiaries,
            isLoading: false,
        });
        (Grid.useBreakpoint as Mock).mockReturnValue({ xs: true });

        render(<BeneficiariesList accessKeyName={accessKeyName} />);

        const carouselItems = screen.getAllByText(/Doe/);
        expect(carouselItems.length).toBe(5);
    });
});
