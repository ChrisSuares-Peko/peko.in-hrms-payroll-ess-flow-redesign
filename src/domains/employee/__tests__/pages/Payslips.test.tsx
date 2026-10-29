import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { downloadMyPayslipApi } from '../../api/payslips';
import { useEmployeeProfile } from '../../hooks/useEmployeeProfile';
import { useMyPayslips } from '../../hooks/useMyPayslips';
import Payslips from '../../pages/Payslips';

const mockDispatch = vi.fn();

vi.mock('@src/hooks/store', () => ({
    useAppSelector: vi.fn(),
    useAppDispatch: vi.fn(),
}));

vi.mock('../../hooks/useEmployeeProfile', () => ({
    useEmployeeProfile: vi.fn(),
}));

vi.mock('../../hooks/useMyPayslips', () => ({
    useMyPayslips: vi.fn(),
}));

vi.mock('../../api/payslips', () => ({
    downloadMyPayslipApi: vi.fn(),
}));

vi.mock('../../components/PayslipDetailModal', () => ({
    default: (props: any) =>
        props.open ? (
            <div data-testid="payslip-detail-modal" data-pay-period={props.payslip?.payPeriod} />
        ) : null,
}));

const januaryRow = {
    id: 'sal-1',
    year: 2026,
    month: 1,
    payingDate: '2026-01-31T00:00:00.000Z',
    totalPayable: 50000,
    salaryInformation: {
        basicPay: 40000,
        epfAmount: 1800,
        esiAmount: 200,
        lwfAmount: 20,
        deductionAmount: 2020,
        tdsAmount: 0,
    },
};

const februaryRow = {
    id: 'sal-2',
    year: 2026,
    month: 2,
    payingDate: '2026-02-28T00:00:00.000Z',
    totalPayable: 52000,
    salaryInformation: {
        basicPay: 40000,
        epfAmount: 1800,
        esiAmount: 200,
        lwfAmount: 20,
        deductionAmount: 2020,
        tdsAmount: 0,
    },
};

const pendingRow = {
    id: null,
    year: 2026,
    month: 3,
    paymentStatus: 'Pending',
    totalPayable: 0,
};

const setup = (rows: any[], loading = false) => {
    (useAppDispatch as Mock).mockReturnValue(mockDispatch);
    (useAppSelector as Mock).mockImplementation((selector: Function) =>
        selector({ reducer: { auth: { role: 'employee', id: 'user-1' } } })
    );
    (useEmployeeProfile as Mock).mockReturnValue({
        loading: false,
        profile: {
            personalInformation: { fullName: 'Jane Doe' },
            employeeInformation: {
                employeeId: 'EMP-1',
                designation: 'Engineer',
                department: { departmentName: 'Tech' },
            },
            corporateUser: { companyName: 'Peko' },
        },
        reload: vi.fn(),
    });
    (useMyPayslips as Mock).mockReturnValue({ rows, loading });
};

describe('Payslips Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (globalThis as any).URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        (globalThis as any).URL.revokeObjectURL = vi.fn();
    });

    it('renders the page heading', () => {
        setup([]);

        render(<Payslips />);

        expect(screen.getByText('My Pay')).toBeInTheDocument();
        expect(screen.getByText('Payslip History')).toBeInTheDocument();
    });

    it('shows a loading indicator on the table while payslips are being fetched', () => {
        setup([], true);

        const { container } = render(<Payslips />);

        expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('shows an empty state when there are no payslips for the period', () => {
        setup([], false);

        render(<Payslips />);

        expect(screen.getByText('No payslips for this period')).toBeInTheDocument();
    });

    it('renders a masked amount for a generated payslip and reveals it on click', () => {
        setup([januaryRow]);

        render(<Payslips />);

        expect(screen.getByText('January 2026')).toBeInTheDocument();
        expect(screen.getByText('•••••')).toBeInTheDocument();

        fireEvent.click(screen.getByLabelText('Show amount'));

        expect(screen.getByText(/50,000/)).toBeInTheDocument();
        expect(screen.queryByText('•••••')).not.toBeInTheDocument();
    });

    it('shows the payment status tag instead of an amount for an ungenerated payslip', () => {
        setup([pendingRow]);

        render(<Payslips />);

        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.queryByLabelText('Show amount')).not.toBeInTheDocument();
    });

    it('filters the payslip list by the selected month', () => {
        setup([januaryRow, februaryRow]);

        const { container } = render(<Payslips />);

        expect(screen.getByText('January 2026')).toBeInTheDocument();
        expect(screen.getByText('February 2026')).toBeInTheDocument();

        const monthSelector = container.querySelectorAll('.ant-select-selector')[0] as HTMLElement;
        fireEvent.mouseDown(monthSelector);
        fireEvent.click(screen.getByText('February'));

        expect(screen.queryByText('January 2026')).not.toBeInTheDocument();
        expect(screen.getByText('February 2026')).toBeInTheDocument();
    });

    it('downloads the payslip PDF for the correct scope and salary id', async () => {
        (downloadMyPayslipApi as Mock).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }));
        setup([januaryRow]);

        render(<Payslips />);

        fireEvent.click(screen.getByTitle('Download PDF'));

        await waitFor(() =>
            expect(downloadMyPayslipApi).toHaveBeenCalledWith(
                { userType: 'employee', userId: 'user-1' },
                'sal-1'
            )
        );
    });

    it('opens the payslip detail modal for the selected row', () => {
        setup([januaryRow]);

        render(<Payslips />);

        fireEvent.click(screen.getByText('View'));

        expect(screen.getByTestId('payslip-detail-modal')).toHaveAttribute(
            'data-pay-period',
            'January 2026'
        );
    });
});
