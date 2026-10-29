import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UserInformation from '../../../components/AssetDetails/UserInformation';
import { retrieveVehicleData } from '../../../utils/fleet/fleetManagementData';
import { formatDate } from '../../../utils/helperFunctions';

// Mock dependencies
vi.mock('../../../utils/fleet/fleetManagementData', () => ({
    retrieveVehicleData: vi.fn(),
}));
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));

describe('UserInformation', () => {
    const mockSetRefState = vi.fn();
    const mockData = {
        data: {
            cloud_employee: {
                employeeName: 'John Doe',
                employeeID: 'EMP123',
                department: 'Engineering',
                joiningDate: '2022-01-01',
            },
            assignDate: '2024-01-01',
        },
    };
    const defaultProps = {
        data: mockData,
        setRefState: mockSetRefState,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (retrieveVehicleData as any).mockImplementation((data: any) => data);
        (formatDate as any).mockImplementation((date: any) => new Date(date).toLocaleDateString());
    });

    it('renders component correctly', () => {
        render(<UserInformation {...defaultProps} />);
        expect(screen.getByText('User Information')).toBeInTheDocument();
        expect(screen.getByText('Used by')).toBeInTheDocument();
        expect(screen.getByText('Employee ID')).toBeInTheDocument();
        expect(screen.getByText('Used')).toBeInTheDocument();
        expect(screen.getByText('Department')).toBeInTheDocument();
        expect(screen.getByText('Joining Date')).toBeInTheDocument();
    });

    it('renders loading skeleton when isLoading is true', () => {
        const { container } = render(<UserInformation {...defaultProps} isLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(5);
    });

    it('displays user information correctly when isLoading is false', () => {
        render(<UserInformation {...defaultProps} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('EMP123')).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('1/1/2022')).toBeInTheDocument();
        expect(screen.getByText(/days/i)).toBeInTheDocument();
    });
});
