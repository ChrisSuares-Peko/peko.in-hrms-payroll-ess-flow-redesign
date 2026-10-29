import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import UserInformation from '../../../components/Financials/UserInformations';
import { retrieveAssetData } from '../../../utils/assetDetails';
import { formatDate } from '../../../utils/helperFunctions';

// Mock dependencies
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));
vi.mock('../../../utils/assetDetails', () => ({
    retrieveAssetData: vi.fn(),
}));
vi.mock('../../../utils/helperFunctions', () => ({
    formatDate: vi.fn(),
}));
vi.mock('../../../components/Modals/ChequeLeafModal', () => ({
    __esModule: true,
    default: vi.fn(({ open, handleCancel }) =>
        open ? (
            <div>
                ChequeLeafModal{' '}
                <button onClick={handleCancel} type="button">
                    Close
                </button>
            </div>
        ) : null
    ),
}));

describe('UserInformation', () => {
    const mockSetRefState = vi.fn();
    const mockChequeLeafDetails = {
        data: {
            payeeName: 'John Doe',
            bankAccount: 'Bank of Test',
            dueDate: '2024-12-31T00:00:00Z',
            status: 'Pending',
            amount: 1500,
            signedBy: 'Jane Doe',
            chequeBookNumber: 'CB123456',
            dateOfCheque: '2024-12-30T00:00:00Z',
            chequeNumber: '1001',
            remarks: 'Test Remarks',
            voucherReferance: 'Ref123',
        },
    };
    const defaultProps = {
        chequeLeafDetails: mockChequeLeafDetails,
        setRefState: mockSetRefState,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockImplementation((num: any) => `${num}`);
        (retrieveAssetData as any).mockImplementation((data: any) => data);
        (formatDate as any).mockImplementation((date: string) => date.split('T')[0]);
    });

    it('renders component correctly', () => {
        render(<UserInformation {...defaultProps} />);
        expect(screen.getByText('Cheque Information')).toBeInTheDocument();
        expect(screen.getByText('Edit Cheque')).toBeInTheDocument();
        expect(screen.getByText('Payee Name')).toBeInTheDocument();
        expect(screen.getByText('Bank Name')).toBeInTheDocument();
        expect(screen.getByText('Due Date')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Signed by')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book No')).toBeInTheDocument();
        expect(screen.getByText('Cheque Date')).toBeInTheDocument();
        expect(screen.getByText('Cheque Number')).toBeInTheDocument();
        expect(screen.getByText('Remarks')).toBeInTheDocument();
        expect(screen.getByText('Voucher Referance')).toBeInTheDocument();
    });

    it('renders loading skeleton when isLoading is true', () => {
        const { container } = render(<UserInformation {...defaultProps} isLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(11);
    });

    it('displays cheque leaf information correctly when isLoading is false', () => {
        render(<UserInformation {...defaultProps} />);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Bank of Test')).toBeInTheDocument();
        expect(screen.getByText('2024-12-31')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('CB123456')).toBeInTheDocument();
        expect(screen.getByText('2024-12-30')).toBeInTheDocument();
        expect(screen.getByText('1001')).toBeInTheDocument();
        expect(screen.getByText('Test Remarks')).toBeInTheDocument();
        expect(screen.getByText('Ref123')).toBeInTheDocument();
    });

    it('opens ChequeLeafModal when "Edit Cheque" is clicked', () => {
        render(<UserInformation {...defaultProps} />);
        fireEvent.click(screen.getByText('Edit Cheque'));
        expect(screen.getByText('ChequeLeafModal')).toBeInTheDocument();
    });
});
