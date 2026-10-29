import { ClockCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Tag, Typography } from 'antd';

import { ENACHMandateFormValues } from '../../../types/invoiceDetails';
import { formatAmount } from '../../../utils/helperFunctions';
import CopyableRow from '../../shared/CopyableRow';
import LeftHeader from '../../shared/LeftHeader';

type Props = {
    authLink: string;
    formValues: ENACHMandateFormValues;
    onResend: () => void;
    onCancel: () => void;
    isResending?: boolean;
    isCancelling?: boolean;
};

const MandateAwaitingApproval = ({ authLink, formValues, onResend, onCancel, isResending, isCancelling }: Props) => {
    const mandateRows = [
        { label: 'Customer Name', value: formValues.customer.name || 'N/A' },
        { label: 'Email', value: formValues.customer.email },
        { label: 'Mobile', value: formValues.customer.mobile },
        { label: 'Maximum Debit Amount', value: formatAmount(Number(formValues.mandate.maxAmount)) },
        { label: 'Frequency', value: formValues.mandate.frequency },
        { label: 'Start Date', value: formValues.mandate.startDate || 'N/A' },
    ];

    return (
        <Flex vertical gap={16}>
            <Flex justify="space-between" align="flex-start">
                <LeftHeader
                    title="Create eNACH Mandate"
                    description="Authorization link has been sent to the customer"
                />
                <Tag className="bg-[#fffbeb] text-[#f59e0b] border-0 rounded-full px-3 py-0.5 text-xs font-medium whitespace-nowrap">
                    Awaiting customer approval
                </Tag>
            </Flex>

            <Flex gap={10} align="flex-start" className="py-3">
                <Flex
                    align="center"
                    justify="center"
                    className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-500 flex-shrink-0"
                >
                    <ClockCircleOutlined className="text-base" />
                </Flex>
                <Flex vertical gap={2}>
                    <Typography.Text className="text-sm font-semibold">
                        Waiting for Customer Authorization
                    </Typography.Text>
                    <Typography.Text className="text-[#6a7282] text-xs">
                        Your customer needs to approve this mandate using their Net Banking or Debit
                        Card. After approval, the mandate will be activated within 1 to 2 working
                        days.
                    </Typography.Text>
                </Flex>
            </Flex>

            <CopyableRow title="Authorization Link" description={authLink} />

            <Card className="rounded-xl">
                <Typography.Text className="text-base font-semibold block pb-3">
                    Mandate Details
                </Typography.Text>
                <Flex wrap gap="12px 24px">
                    {mandateRows.map(({ label, value }) => (
                        <Flex key={label} vertical gap={2} className="w-[calc(50%-12px)]">
                            <Typography.Text className="text-xs text-[#94a3b8]">
                                {label}
                            </Typography.Text>
                            <Typography.Text className="text-sm capitalize">
                                {value}
                            </Typography.Text>
                        </Flex>
                    ))}
                    {formValues.purpose.description && (
                        <Flex vertical gap={2} className="w-full">
                            <Typography.Text className="text-xs text-[#94a3b8]">
                                Description
                            </Typography.Text>
                            <Typography.Text className="text-sm">
                                {formValues.purpose.description}
                            </Typography.Text>
                        </Flex>
                    )}
                </Flex>
            </Card>

            <Flex gap={12}>
                <Button
                    className="h-10 text-[#475569]"
                    block
                    loading={isResending}
                    onClick={onResend}
                >
                    Resend Authorization Link
                </Button>
                <Button
                    danger
                    block
                    className="h-10"
                    icon={<CloseCircleOutlined />}
                    loading={isCancelling}
                    onClick={onCancel}
                >
                    Cancel Mandate Setup
                </Button>
            </Flex>
        </Flex>
    );
};

export default MandateAwaitingApproval;
