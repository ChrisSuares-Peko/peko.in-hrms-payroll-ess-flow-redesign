import { Card, Flex, Tag, Typography } from 'antd';

import { CARD_BODY_CLASS } from '../../../constants/style';
import { PaymentDetailsData } from '../../../types/payments';
import { formatAmount, formatDate } from '../../../utils/helperFunctions';
import CopyableRow from '../../shared/CopyableRow';

const STATUS_TAG: Record<string, string> = {
    SUCCESS: 'bg-[#ECFDF5] text-[#43B75D]',
    COMPLETED: 'bg-[#ECFDF5] text-[#43B75D]',
    PENDING: 'bg-[#FFF7ED] text-[#F97316]',
    FAILED: 'bg-[#FEF2F2] text-[#EF4444]',
};

function PaymentSummary({ data }: { data: PaymentDetailsData | null }) {
    const paymentFields = [
        { label: 'Payment ID', value: data?.transactionId ?? '-' },
        { label: 'Customer', value: data?.customerName ?? '-' },
        { label: 'Invoice Reference', value: data?.invoiceRef ?? '-' },
        { label: 'Amount', value: data?.amount != null ? formatAmount(data.amount) : '-' },
        { label: 'Payment method', value: data?.paymentMethod ?? '-' },
        { label: 'Date', value: data?.dateTime ? formatDate(data.dateTime) : '-' },
        { label: 'Transaction ref', value: data?.transactionRef ?? '-' },
        { label: 'Status', value: data?.status ?? '-' },
    ];

    const statusKey = (data?.status ?? '').toUpperCase();
    const tagClass = STATUS_TAG[statusKey] ?? 'bg-[#F4F4F5] text-[#71717A]';

    return (
        <Card classNames={{ body: CARD_BODY_CLASS }} className="rounded-xl">
            <Flex justify="space-between" align="center">
                <Typography.Text className="text-base font-semibold leading-6">
                    Payment Summary
                </Typography.Text>
                {data?.status && (
                    <Tag
                        className={`rounded-full px-3 py-0.5 border-0 text-xs font-normal m-0 ${tagClass}`}
                    >
                        {data.status}
                    </Tag>
                )}
            </Flex>

            <Flex wrap gap={8} className="[&>*]:flex-[0_0_calc(50%-4px)]">
                {paymentFields.map(f => (
                    <CopyableRow
                        key={f.label}
                        title={f.label}
                        description={f.value}
                        isCopy={false}
                    />
                ))}
            </Flex>

            {/* {data?.notes && (
                <Flex vertical gap={4}>
                    <Typography.Text className="text-gray-400 text-xs font-semibold leading-5">
                        Notes
                    </Typography.Text>
                    <Typography.Text className="text-xs font-normal leading-5">
                        {data.notes}
                    </Typography.Text>
                </Flex>
            )} */}
        </Card>
    );
}

export default PaymentSummary;
