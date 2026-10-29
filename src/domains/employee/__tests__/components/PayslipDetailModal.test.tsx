import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import PayslipDetailModal, { PayslipDetail } from '../../components/PayslipDetailModal';

const fmt = (amount: number) => `₹${formatNumberWithLocalString(amount)}`;

const payslip: PayslipDetail = {
    payPeriod: 'June 2024',
    payslipNumber: 'PS-2024-06',
    employeeName: 'Jane Doe',
    employeeId: 'EMP-001',
    designation: 'Software Engineer',
    department: 'Engineering',
    company: 'Peko Inc',
    creditedDate: '01 Jul 2024',
    earnings: [
        { label: 'Basic Pay', amount: 40000 },
        { label: 'HRA', amount: 10000 },
    ],
    grossPay: 50000,
    deductions: [{ label: 'PF', amount: 1800 }],
    totalDeductions: 1800,
    netPay: 48200,
    ytdGross: 300000,
    ytdDeductions: 10800,
    ytdNet: 289200,
    downloadUrl: 'https://example.com/payslip.pdf',
};

describe('PayslipDetailModal', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders nothing when payslip is null', () => {
        const { container } = render(
            <PayslipDetailModal open onClose={vi.fn()} payslip={null} />
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('renders payslip header, info grid, earnings and net pay', () => {
        render(<PayslipDetailModal open onClose={vi.fn()} payslip={payslip} />);

        expect(screen.getByText(/Payslip.*June 2024/)).toBeInTheDocument();
        expect(screen.getByText('#PS-2024-06')).toBeInTheDocument();
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('EMP-001')).toBeInTheDocument();
        expect(screen.getByText('Software Engineer')).toBeInTheDocument();
        expect(screen.getByText('Engineering')).toBeInTheDocument();
        expect(screen.getByText('Peko Inc')).toBeInTheDocument();

        expect(screen.getByText('Basic Pay')).toBeInTheDocument();
        expect(screen.getByText(fmt(40000))).toBeInTheDocument();
        expect(screen.getByText('HRA')).toBeInTheDocument();
        expect(screen.getByText(fmt(10000))).toBeInTheDocument();
        expect(screen.getByText('Gross Pay')).toBeInTheDocument();
        expect(screen.getByText(fmt(50000))).toBeInTheDocument();

        expect(screen.getByText('NET PAY')).toBeInTheDocument();
        expect(screen.getByText(fmt(48200))).toBeInTheDocument();

        expect(screen.getByText('YTD Gross')).toBeInTheDocument();
        expect(screen.getByText(fmt(300000))).toBeInTheDocument();
        expect(screen.getByText('YTD Deductions')).toBeInTheDocument();
        expect(screen.getByText('YTD Net')).toBeInTheDocument();
        expect(screen.getByText(fmt(289200))).toBeInTheDocument();
    });

    it('renders the deductions block when deductions are present', () => {
        render(<PayslipDetailModal open onClose={vi.fn()} payslip={payslip} />);

        expect(screen.getByText('Deductions')).toBeInTheDocument();
        expect(screen.getByText('PF')).toBeInTheDocument();
        expect(screen.getByText('Total Deductions')).toBeInTheDocument();
        // The PF line item and the Total Deductions both equal 1800, so two amounts render.
        expect(screen.getAllByText(fmt(1800))).toHaveLength(2);
    });

    it('hides the deductions block when there are no deductions', () => {
        render(
            <PayslipDetailModal
                open
                onClose={vi.fn()}
                payslip={{ ...payslip, deductions: [], totalDeductions: 0 }}
            />
        );

        expect(screen.queryByText('Deductions')).not.toBeInTheDocument();
    });

    it('calls onClose when Back is clicked', () => {
        const onClose = vi.fn();
        render(<PayslipDetailModal open onClose={onClose} payslip={payslip} />);

        fireEvent.click(screen.getByRole('button', { name: 'Back' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls the provided onDownload instead of opening downloadUrl', () => {
        const onDownload = vi.fn();
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(
            <PayslipDetailModal open onClose={vi.fn()} payslip={payslip} onDownload={onDownload} />
        );

        fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));

        expect(onDownload).toHaveBeenCalledTimes(1);
        expect(openSpy).not.toHaveBeenCalled();
    });

    it('opens downloadUrl in a new tab when onDownload is not provided', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(<PayslipDetailModal open onClose={vi.fn()} payslip={payslip} />);

        fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));

        expect(openSpy).toHaveBeenCalledWith('https://example.com/payslip.pdf', '_blank');
    });

    it('shows a loading state on the download button when downloading', () => {
        render(<PayslipDetailModal open onClose={vi.fn()} payslip={payslip} downloading />);

        expect(document.querySelector('.ant-btn-loading')).toBeInTheDocument();
    });
});
