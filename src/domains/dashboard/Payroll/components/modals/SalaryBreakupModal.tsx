import { Button, Flex, Modal, Spin, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useGetSalaryBreakup } from '../../hooks/employeeSalaryHooks/salaryRolloutHooks/useGetSalaryBreakup';
import { SalaryBreakupLineItem } from '../../types/salaryProfileTypes/salaryRolloutTypes';

const { Text } = Typography;

interface SalaryBreakupModalProps {
    open: boolean;
    onClose: () => void;
    employeeId: string | null;
}

const fmt = (amount: number) => `₹${formatNumberWithLocalString(amount)}`;

const Row = ({ label, value }: { label: string; value: string }) => (
    <Flex justify="space-between" align="center">
        <Text style={{ fontSize: 14, fontWeight: 400, color: '#4A5565', lineHeight: '22px' }}>
            {label}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: 500, color: '#101828', lineHeight: '22px' }}>
            {value}
        </Text>
    </Flex>
);

const SalaryBreakupModal = ({ open, onClose, employeeId }: SalaryBreakupModalProps) => {
    const { data, isLoading } = useGetSalaryBreakup(open ? employeeId : null);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            closable={false}
            centered
            width={520}
            styles={{
                content: {
                    borderRadius: 28,
                    padding: '28px 32px',
                },
            }}
        >
            <Flex vertical gap={22}>
                <Text style={{ fontSize: 18, fontWeight: 500, color: '#000000', lineHeight: '26px' }}>
                    Salary Breakup
                </Text>

                {isLoading ? (
                    <Flex justify="center" align="center" style={{ minHeight: 200 }}>
                        <Spin />
                    </Flex>
                ) : (
                    <Flex
                        vertical
                        gap={20}
                        style={{
                            border: '0.5px solid rgba(204,204,204,0.8)',
                            borderRadius: 20,
                            padding: '22px 24px',
                        }}
                    >
                        {/* Earnings */}
                        <Flex vertical gap={14}>
                            <Text style={{ fontSize: 15, fontWeight: 700, color: '#101828' }}>
                                Earnings
                            </Text>
                            <Flex vertical gap={12}>
                                {data?.earnings?.map((item: SalaryBreakupLineItem) => (
                                    <Row
                                        key={item.componentName}
                                        label={item.componentName}
                                        value={fmt(item.calculatedAmount)}
                                    />
                                ))}
                            </Flex>
                        </Flex>

                        <div style={{ borderTop: '0.5px solid #CBD5E1' }} />

                        {/* Deductions */}
                        <Flex vertical gap={14}>
                            <Text style={{ fontSize: 15, fontWeight: 700, color: '#101828' }}>
                                Deductions
                            </Text>
                            <Flex vertical gap={12}>
                                {data?.deductions?.map((item: SalaryBreakupLineItem) => (
                                    <Row
                                        key={item.componentName}
                                        label={item.componentName}
                                        value={fmt(item.calculatedAmount)}
                                    />
                                ))}
                            </Flex>
                        </Flex>

                        <div style={{ borderTop: '0.5px solid #CBD5E1' }} />

                        {/* Net Salary */}
                        <Flex
                            justify="space-between"
                            align="center"
                            style={{
                                background: '#ECFDF5',
                                border: '1px solid #CEF7E3',
                                borderRadius: 10,
                                padding: '12px 16px',
                            }}
                        >
                            <Text style={{ fontSize: 14, fontWeight: 500, color: '#000000' }}>
                                Net Salary
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: 600, color: '#43B75D' }}>
                                {fmt(data?.totalPayable ?? 0)}
                            </Text>
                        </Flex>
                    </Flex>
                )}
                {/* Footer button */}
                <Flex justify="end">

                    <Button
                        className="w-1/2 h-[38px] rounded-lg text-[13px] font-medium border border-[#FF4F4F] text-[#FF4F4F] bg-white"
                        onClick={onClose}
                    >
                        Close
                    </Button>

                </Flex>
            </Flex>
        </Modal>
    );
};

export default SalaryBreakupModal;
