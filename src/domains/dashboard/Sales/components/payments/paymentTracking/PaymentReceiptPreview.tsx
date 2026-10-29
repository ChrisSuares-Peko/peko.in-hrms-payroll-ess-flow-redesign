import { FileTextOutlined } from '@ant-design/icons';
import { Card, Divider, Flex, Tag, Typography } from 'antd';

import { PAYMENT_STATUS_LABEL } from '../../../constants/payments';
import { CARD_BODY_CLASS, PAYMENT_STATUS_STYLE } from '../../../constants/style';
import { PaymentDetailsData } from '../../../types/payments';
import { formatAmount, formatDate } from '../../../utils/helperFunctions';
import ReceiptRow from '../../shared/ReceiptRow';

function PaymentReceiptPreview({ data }: { data: PaymentDetailsData | null }) {
    const statusKey = (data?.status ?? '').toUpperCase();
    const statusLabel = PAYMENT_STATUS_LABEL[statusKey] ?? data?.status ?? '-';
    const statusStyle = PAYMENT_STATUS_STYLE[statusKey] ?? 'bg-[#F4F4F5] text-[#71717A]';

    const receiptDetails = [
        { label: 'Receipt No', value: data?.transactionId ?? '-' },
        { label: 'Customer', value: data?.customerName ?? '-' },
        { label: 'Invoice', value: data?.invoiceRef ?? '-' },
        { label: 'Date', value: data?.dateTime ? formatDate(data.dateTime) : '-' },
    ];

    return (
        <Card className="rounded-xl" classNames={{ body: CARD_BODY_CLASS }}>
            <Typography.Text className="text-base font-semibold leading-6">
                Payment Receipt Preview
            </Typography.Text>
            <Flex
                vertical
                className="rounded-2xl overflow-hidden outline outline-1 outline-black/5"
            >
                {/* Red header */}
                <Flex align="center" justify="center" className="h-32 bg-[#B91C1C]">
                    <Flex vertical align="center" gap={6}>
                        <Flex
                            align="center"
                            justify="center"
                            className="w-10 h-10 bg-white/20 rounded-xl"
                        >
                            <FileTextOutlined className="text-white text-lg" />
                        </Flex>
                        <Flex vertical align="center">
                            <Typography.Text className="text-white text-xs font-medium uppercase tracking-wide">
                                PEKO
                            </Typography.Text>
                            {data?.customerGst && (
                                <Typography.Text className="text-white/60 text-[10px] font-medium">
                                    GST: {data.customerGst}
                                </Typography.Text>
                            )}
                        </Flex>
                    </Flex>
                </Flex>

                {/* Receipt body */}
                <Flex vertical gap={10} className="px-4 py-5">
                    <Typography.Text className="text-center text-gray-600 text-xs font-medium uppercase tracking-wide">
                        Payment Receipt
                    </Typography.Text>
                    <Flex justify="center">
                        <Tag
                            className={`rounded-full px-3 py-0.5 border-0 text-sm font-normal m-0 ${statusStyle}`}
                        >
                            {statusLabel}
                        </Tag>
                    </Flex>
                    <Divider className="m-0" />
                    <Flex vertical gap={8}>
                        {receiptDetails.map(r => (
                            <ReceiptRow key={r.label} label={r.label} value={r.value} />
                        ))}
                    </Flex>
                    <Divider className="m-0" />
                    <ReceiptRow
                        label="Amount Paid"
                        value={data?.amount != null ? formatAmount(data.amount) : '-'}
                        bold
                        valueColor="text-[#43B75D]"
                    />
                </Flex>
            </Flex>
        </Card>
    );
}

export default PaymentReceiptPreview;
