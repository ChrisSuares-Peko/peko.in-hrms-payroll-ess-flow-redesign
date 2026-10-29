import { Divider, Flex, Tag, Typography } from 'antd';

import { QuotationOption } from '../../types/agreement';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
    quotation: QuotationOption;
}

const QuotationSelectionCard = ({ quotation }: Props) => (
    <Flex
        vertical
        className="flex-1 rounded-xl border border-[#E5E7EB] overflow-hidden shadow-sm"
    >
        {/* Header */}
        <Flex justify="space-between" align="center" className="p-4 pb-3">
            <Typography.Text className="text-sm font-semibold">
                Quotation Summary
            </Typography.Text>
            <Tag className="rounded-full border-0 bg-[#FEE2E2] text-[#EF4444] text-xs font-normal px-3 py-0.5 m-0">
                {quotation.displayId}
            </Tag>
        </Flex>

        {/* Customer / Date */}
        <Flex vertical gap={0} className="px-4">
            {[
                { label: 'Customer', value: quotation.customer },
                { label: 'Date', value: quotation.date },
            ].map(({ label, value }) => (
                <Flex
                    key={label}
                    justify="space-between"
                    align="center"
                    className="py-2"
                >
                    <Typography.Text className="text-xs font-normal text-[#6B7280]">
                        {label}
                    </Typography.Text>
                    <Typography.Text className="text-xs font-semibold text-[#1E293B]">
                        {value}
                    </Typography.Text>
                </Flex>
            ))}
        </Flex>

        <Divider className="my-0" />

        {/* Items table header */}
        {quotation.items.length > 0 && (
            <>
                <Flex className="px-4 py-2 bg-[#F9FAFB]">
                    <Typography.Text className="text-xs font-semibold text-[#6B7280] flex-1 uppercase">
                        Description
                    </Typography.Text>
                    <Typography.Text className="text-xs font-semibold text-[#6B7280] w-10 text-center uppercase">
                        Qty
                    </Typography.Text>
                    <Typography.Text className="text-xs font-semibold text-[#6B7280] w-20 text-right uppercase">
                        Rate
                    </Typography.Text>
                    <Typography.Text className="text-xs font-semibold text-[#6B7280] w-20 text-right uppercase">
                        Amount
                    </Typography.Text>
                </Flex>
                <Flex vertical className="px-4">
                    {quotation.items.map((item, i) => (
                        <Flex
                            key={i}
                            align="center"
                            className="py-2 border-b border-[#F4F4F5] last:border-0"
                        >
                            <Typography.Text className="text-xs font-medium text-[#1E293B] flex-1">
                                {item.name}
                            </Typography.Text>
                            <Typography.Text className="text-xs text-[#6B7280] w-10 text-center">
                                {item.quantity}
                            </Typography.Text>
                            <Typography.Text className="text-xs text-[#6B7280] w-20 text-right">
                                {fmt(parseFloat(item.unitPrice) || 0)}
                            </Typography.Text>
                            <Typography.Text className="text-xs font-medium text-[#1E293B] w-20 text-right">
                                {fmt(parseFloat(item.netAmount) || 0)}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>

                <Divider className="my-0" />
            </>
        )}

        {/* Totals */}
        <Flex vertical gap={0} className="px-4 py-2">
            {[
                {
                    label: 'Subtotal',
                    value: fmt(quotation.subtotal),
                    color: '#1E293B',
                },
                {
                    label: 'GST %',
                    value: `+ ${fmt(quotation.tax)}`,
                    color: '#EF4444',
                },
                {
                    label: 'Discount',
                    value: `-${fmt(quotation.discount)}`,
                    color: '#43B75D',
                },
            ].map(({ label, value, color }) => (
                <Flex
                    key={label}
                    justify="space-between"
                    align="center"
                    className="py-1.5"
                >
                    <Typography.Text className="text-xs font-normal text-[#6B7280]">
                        {label}
                    </Typography.Text>
                    <Typography.Text className="text-xs font-medium" style={{ color }}>
                        {value}
                    </Typography.Text>
                </Flex>
            ))}
        </Flex>

        <Divider className="my-0" />

        <Flex justify="space-between" align="center" className="px-4 py-3">
            <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                Total
            </Typography.Text>
            <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                {fmt(quotation.amount)}
            </Typography.Text>
        </Flex>
    </Flex>
);

export default QuotationSelectionCard;
