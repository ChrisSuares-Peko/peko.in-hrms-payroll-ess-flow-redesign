import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import AssetInformation from '../../../components/AssetDetails/AssetInformation';
import { retrieveAssetData } from '../../../utils/assetDetails';
import { formatDate } from '../../../utils/helperFunctions';

// Mock dependencies
vi.mock('react-svg', () => ({
    ReactSVG: (props: any) => <div {...props} />,
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));
vi.mock('../../../utils/assetDetails', () => ({
    retrieveAssetData: vi.fn(),
}));
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));
vi.mock('../../../components/Modals/AssetInformationModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>AssetInformationModal</div>),
}));

describe('AssetInformation', () => {
    const mockSetRefState = vi.fn();
    const mockAssetData = {
        data: {
            purchasedDate: '2024-01-01',
            assetType: 'Laptop',
            serialNumber: 'SN123456',
            vendor: 'VendorName',
            amount: 1000,
            amountRecurring: 'Monthly',
            warranty: '2 years',
            batchNumber: 'Batch123',
            status: 'Active',
        },
    };
    const defaultProps = {
        assetData: mockAssetData,
        setRefState: mockSetRefState,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockImplementation((num: any) => `${num}`);
        (retrieveAssetData as any).mockImplementation((data: any) => data);
        (formatDate as any).mockImplementation((date: any) => new Date(date).toLocaleDateString());
    });

    it('renders component correctly', () => {
        render(<AssetInformation {...defaultProps} />);
        expect(screen.getByText('Device Information')).toBeInTheDocument();
        expect(screen.getByText('Edit Info')).toBeInTheDocument();
        expect(screen.getByText('Purchased Date')).toBeInTheDocument();
        expect(screen.getByText('Asset Type')).toBeInTheDocument();
        expect(screen.getByText('Serial Number')).toBeInTheDocument();
        expect(screen.getByText('Vendor')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Amount Recurring')).toBeInTheDocument();
        expect(screen.getByText('Warranty')).toBeInTheDocument();
        expect(screen.getByText('Batch No')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders loading skeleton when isLoading is true', () => {
        const { container } = render(<AssetInformation {...defaultProps} isLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(10);
    });

    it('displays asset information correctly when isLoading is false', () => {
        render(<AssetInformation {...defaultProps} />);
        expect(screen.getByText('1/1/2024')).toBeInTheDocument();
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('SN123456')).toBeInTheDocument();
        expect(screen.getByText('VendorName')).toBeInTheDocument();
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('Monthly')).toBeInTheDocument();
        expect(screen.getByText('2 years')).toBeInTheDocument();
        expect(screen.getByText('Batch123')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('opens AssetInformationModal when "Edit Info" is clicked', () => {
        render(<AssetInformation {...defaultProps} />);
        fireEvent.click(screen.getByText('Edit Info'));
        expect(screen.getByText('AssetInformationModal')).toBeInTheDocument();
    });
});
