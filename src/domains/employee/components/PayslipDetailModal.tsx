import React from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

export interface PayslipEarning {
    label: string;
    amount: number;
}

export interface PayslipDeduction {
    label: string;
    amount: number;
}

export interface PayslipDetail {
    payPeriod: string;
    payslipNumber: string;
    employeeName: string;
    employeeId: string;
    designation: string;
    department: string;
    company: string;
    creditedDate: string;
    /** e.g. "29 (LOP 2)"; absent for payslips generated before paid days were recorded. */
    paidDays?: string;
    earnings: PayslipEarning[];
    grossPay: number;
    deductions: PayslipDeduction[];
    totalDeductions: number;
    netPay: number;
    ytdGross: number;
    ytdDeductions: number;
    ytdNet: number;
    downloadUrl?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    payslip: PayslipDetail | null;
    onDownload?: () => void;
    downloading?: boolean;
}

const { Text } = Typography;

const fmt = (amount: number) => `₹${formatNumberWithLocalString(amount)}`;

const InfoCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <Flex vertical gap={2}>
        <Text className="text-xs text-titleText">{label}</Text>
        <Text className="text-sm font-semibold text-valueText">{value}</Text>
    </Flex>
);

const YtdCell: React.FC<{ label: string; amount: number }> = ({ label, amount }) => (
    <Flex vertical align="center" gap={2} className="py-3">
        <Text className="text-xs text-titleText text-center">{label}</Text>
        <Text className="text-sm font-semibold text-valueText text-center">{fmt(amount)}</Text>
    </Flex>
);

const PayslipDetailModal: React.FC<Props> = ({
    open,
    onClose,
    payslip,
    onDownload,
    downloading,
}) => {
    if (!payslip) return null;

    const handleDownload = () => {
        if (onDownload) onDownload();
        else if (payslip.downloadUrl) window.open(payslip.downloadUrl, '_blank');
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={640}
            rootClassName="employee-portal-modal"
            styles={{
                content: { borderRadius: 24, overflow: 'hidden', padding: 0 },
                body: { padding: 0, maxHeight: '85vh', overflowY: 'auto' },
            }}
        >
            <div className="p-6 flex flex-col gap-5">
                <div>
                    <Text className="text-xl font-bold text-valueText block leading-tight">
                        Payslip — {payslip.payPeriod}
                    </Text>
                    <Text className="text-sm text-titleText">#{payslip.payslipNumber}</Text>
                </div>

                <div className="border border-gray-100 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <InfoCell label="Employee" value={payslip.employeeName} />
                    <InfoCell label="Employee ID" value={payslip.employeeId} />
                    <InfoCell label="Designation" value={payslip.designation} />
                    <InfoCell label="Department" value={payslip.department} />
                    <InfoCell label="Company" value={payslip.company} />
                    <InfoCell label="Pay Period" value={payslip.payPeriod} />
                    <InfoCell label="Credited Date" value={payslip.creditedDate} />
                    <InfoCell label="Payslip #" value={payslip.payslipNumber} />
                    {payslip.paidDays && <InfoCell label="Paid days" value={payslip.paidDays} />}
                </div>

                <div className="bg-bgGray rounded-2xl p-5">
                    <Text className="text-base font-bold text-valueText block mb-4">Earnings</Text>
                    <Flex vertical gap={12}>
                        {payslip.earnings.map(item => (
                            <Flex key={item.label} justify="space-between" align="center">
                                <Text className="text-sm text-titleText">{item.label}</Text>
                                <Text className="text-sm font-medium text-valueText">
                                    {fmt(item.amount)}
                                </Text>
                            </Flex>
                        ))}
                    </Flex>
                    <div className="border-t border-gray-200 my-4" />
                    <Flex justify="space-between" align="center">
                        <Text className="text-base font-bold text-valueText">Gross Pay</Text>
                        <Text className="text-base font-bold text-valueText">
                            {fmt(payslip.grossPay)}
                        </Text>
                    </Flex>
                </div>

                {payslip.deductions.length > 0 && (
                    <div className="bg-bgGray rounded-2xl p-5">
                        <Text className="text-base font-bold text-valueText block mb-4">
                            Deductions
                        </Text>
                        <Flex vertical gap={12}>
                            {payslip.deductions.map(item => (
                                <Flex key={item.label} justify="space-between" align="center">
                                    <Text className="text-sm text-titleText">{item.label}</Text>
                                    <Text className="text-sm font-medium text-valueText">
                                        {fmt(item.amount)}
                                    </Text>
                                </Flex>
                            ))}
                        </Flex>
                        <div className="border-t border-gray-200 my-4" />
                        <Flex justify="space-between" align="center">
                            <Text className="text-base font-bold text-valueText">
                                Total Deductions
                            </Text>
                            <Text className="text-base font-bold text-valueText">
                                {fmt(payslip.totalDeductions)}
                            </Text>
                        </Flex>
                    </div>
                )}

                <div className="border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        gap={4}
                        className="rounded-xl border border-textGreen bg-green-50 py-4"
                    >
                        <Text className="text-xs tracking-widest text-titleText">NET PAY</Text>
                        <Text className="text-2xl font-bold text-valueText">
                            {fmt(payslip.netPay)}
                        </Text>
                    </Flex>
                    <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                        <YtdCell label="YTD Gross" amount={payslip.ytdGross} />
                        <YtdCell label="YTD Deductions" amount={payslip.ytdDeductions} />
                        <YtdCell label="YTD Net" amount={payslip.ytdNet} />
                    </div>
                </div>

                <Flex gap={12}>
                    <Button onClick={onClose} className="flex-1 h-12 rounded-lg font-medium">
                        Back
                    </Button>
                    <Button
                        danger
                        loading={downloading}
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        className="flex-1 h-12 rounded-lg font-medium text-brandColor border-brandColor"
                    >
                        Download PDF
                    </Button>
                </Flex>
            </div>
        </Modal>
    );
};

export default PayslipDetailModal;
