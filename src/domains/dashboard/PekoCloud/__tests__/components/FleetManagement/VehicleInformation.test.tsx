import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import VehicleInformation from '../../../components/FleetManagement/VehicleInformation';
import { retrieveVehicleData } from '../../../utils/fleet/fleetManagementData';
import { formatDate } from '../../../utils/helperFunctions';

// Mock dependencies
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));
vi.mock('../../../utils/fleet/fleetManagementData', () => ({
    retrieveVehicleData: vi.fn(),
}));
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));
vi.mock('../../../components/Modals/VehicleInformationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>VehicleInformationModal</div>),
}));

describe('VehicleInformation', () => {
    const mockSetRefState = vi.fn();
    const mockVehicleData = {
        data: {
            purchasedDate: '2024-01-01',
            assetType: 'Sedan',
            vehicleNumber: 'VN123456',
            vendor: 'VendorName',
            amount: 20000,
            amountRecurring: 'Yearly',
            modelYear: '2024',
            chassisNumber: 'CH123456',
            engineTransmission: 'Automatic',
            odoMeter: '15000 km',
            dateOfRenewal: '2024-06-01',
            status: 'Active',
        },
    };
    const defaultProps = {
        vehicleData: mockVehicleData,
        setRefState: mockSetRefState,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockImplementation((num: any) => `${num}`);
        (retrieveVehicleData as any).mockImplementation((data: any) => data);
        (formatDate as any).mockImplementation((date: any) => date.split('T')[0]);
    });

    it('renders component correctly', () => {
        render(<VehicleInformation {...defaultProps} />);
        expect(screen.getByText('Vehicle Information')).toBeInTheDocument();
        expect(screen.getByText('Edit Info')).toBeInTheDocument();
        expect(screen.getByText('Purchased Date')).toBeInTheDocument();
        expect(screen.getByText('Asset Type')).toBeInTheDocument();
        expect(screen.getByText('Vehicle Number')).toBeInTheDocument();
        expect(screen.getByText('Vendor')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Amount Recurring')).toBeInTheDocument();
        expect(screen.getByText('Model Year')).toBeInTheDocument();
        expect(screen.getByText('Chassis Number')).toBeInTheDocument();
        expect(screen.getByText('Engine Transmission')).toBeInTheDocument();
        expect(screen.getByText('ODO Meter')).toBeInTheDocument();
        expect(screen.getByText('Registration Renewal Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders loading skeleton when isLoading is true', () => {
        const { container } = render(<VehicleInformation {...defaultProps} isLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(13);
    });

    it('displays vehicle information correctly when isLoading is false', () => {
        render(<VehicleInformation {...defaultProps} />);
        screen.debug(undefined, 10000);

        expect(screen.getByText('2024-01-01')).toBeInTheDocument();
        expect(screen.getByText('Sedan')).toBeInTheDocument();
        expect(screen.getByText('VN123456')).toBeInTheDocument();
        expect(screen.getByText('VendorName')).toBeInTheDocument();
        expect(screen.getByText('20000')).toBeInTheDocument();
        expect(screen.getByText('Yearly')).toBeInTheDocument();
        expect(screen.getByText('2024')).toBeInTheDocument();
        expect(screen.getByText('CH123456')).toBeInTheDocument();
        expect(screen.getByText('Automatic')).toBeInTheDocument();
        expect(screen.getByText('15000 km')).toBeInTheDocument();
        expect(screen.getByText('2024-06-01')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('opens VehicleInformationModal when "Edit Info" is clicked', () => {
        render(<VehicleInformation {...defaultProps} />);
        fireEvent.click(screen.getByText('Edit Info'));
        expect(screen.getByText('VehicleInformationModal')).toBeInTheDocument();
    });
});
