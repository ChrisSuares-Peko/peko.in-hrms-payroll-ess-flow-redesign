import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import CheckBookUserInformations from '../../../components/Financials/ChequeBookUserInformations';
import { retrieveChequeBookData } from '../../../utils/financial';

// Mock dependencies
vi.mock('react-svg', () => ({
    ReactSVG: (props: any) => <div {...props} />,
}));
vi.mock('@utils/priceFormat', () => ({
    formatNumberWithLocalString: vi.fn(),
}));
vi.mock('../../../utils/financial', () => ({
    retrieveChequeBookData: vi.fn(),
}));
vi.mock('../../../components/Modals/ChequeBookModal', () => ({
    __esModule: true,
    default: vi.fn(() => <div>ChequeBookModal</div>),
}));

describe('CheckBookUserInformations', () => {
    const mockSetRefState = vi.fn();
    const mockChequeBookData = {
        data: {
            bookId: 'CB123456',
            accountName: 'John Doe',
            accountNumber: '1234567890',
            bankName: 'Bank of Test',
            currency: 'USD',
            currencyDivision: 'Cent',
            chequeStarting: '1001',
            numberOfLeaves: '50',
            accountBalance: 1500,
            status: 'Active',
        },
    };
    const defaultProps = {
        chequeBookData: mockChequeBookData,
        setRefState: mockSetRefState,
        isLoading: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (formatNumberWithLocalString as any).mockImplementation((num: any) => `${num}`);
        (retrieveChequeBookData as any).mockImplementation((data: any) => data);
    });

    it('renders component correctly', () => {
        render(<CheckBookUserInformations {...defaultProps} />);
        expect(screen.getByText('Cheque Book Information')).toBeInTheDocument();
        expect(screen.getByText('Edit Info')).toBeInTheDocument();
        expect(screen.getByText('Cheque Book ID')).toBeInTheDocument();
        expect(screen.getByText('Account Name')).toBeInTheDocument();
        expect(screen.getByText('Account Number')).toBeInTheDocument();
        expect(screen.getByText('Bank Name')).toBeInTheDocument();
        expect(screen.getByText('Currency')).toBeInTheDocument();
        expect(screen.getByText('Currency Division')).toBeInTheDocument();
        expect(screen.getByText('Cheque Number Starting')).toBeInTheDocument();
        expect(screen.getByText('Number of Leafs')).toBeInTheDocument();
        expect(screen.getByText('Account Balance')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders loading skeleton when isLoading is true', () => {
        const { container } = render(<CheckBookUserInformations {...defaultProps} isLoading />);
        const skeletons = container.querySelectorAll('div.ant-skeleton');
        expect(skeletons.length).toBe(11);
    });

    it('displays cheque book information correctly when isLoading is false', () => {
        render(<CheckBookUserInformations {...defaultProps} />);
        expect(screen.getByText('CB123456')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('1234567890')).toBeInTheDocument();
        expect(screen.getByText('Bank of Test')).toBeInTheDocument();
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('Cent')).toBeInTheDocument();
        expect(screen.getByText('1001')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('opens ChequeBookModal when "Edit Info" is clicked', () => {
        render(<CheckBookUserInformations {...defaultProps} />);
        fireEvent.click(screen.getByText('Edit Info'));
        expect(screen.getByText('ChequeBookModal')).toBeInTheDocument();
    });
});
