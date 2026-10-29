import { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, Tag, Typography } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';
import useDebounce from '@src/hooks/useDebounce';

import QuotationSelectionCard from './QuotationSelectionCard';
import SelectionCardSkeleton from './SelectionCardSkeleton';
import useCustomerQuotations from '../../hooks/agreement/useCustomerQuotations';
import { QuotationOption } from '../../types/agreement';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

interface Props {
    confirmedCustomerId: string;
    selectedQuotationId: string;
    onSelectQuotation: (id: string, rawId: number | undefined) => void;
    onSkip: () => void;
}

const QuotationRow = ({
    quotation,
    selected,
    onClick,
}: {
    quotation: QuotationOption;
    selected: boolean;
    onClick: () => void;
}) => (
    <Flex
        justify="space-between"
        align="center"
        className="p-3 rounded-xl cursor-pointer"
        style={{
            backgroundColor: selected ? '#FFF5F5' : '#FFFFFF',
            border: selected ? '1px solid #FF4F4F' : '1px solid #E5E7EB',
        }}
        onClick={onClick}
    >
        <Flex align="center" gap={10}>
            <Flex
                justify="center"
                align="center"
                className="w-8 h-8 rounded-full bg-[#F4F4F5] shrink-0"
            >
                <Typography.Text className="text-xs font-medium text-black">
                    {quotation.displayId.slice(0, 2).toUpperCase()}
                </Typography.Text>
            </Flex>
            <Flex vertical gap={1}>
                <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                    {quotation.displayId}
                </Typography.Text>
                <Typography.Text className="text-xs font-normal text-[#1E293B]">
                    {quotation.customer}
                </Typography.Text>
                <Typography.Text className="text-xs font-normal text-[#6B7280]">
                    {quotation.date}
                </Typography.Text>
            </Flex>
        </Flex>
        <Flex vertical align="flex-end" gap={4}>
            <Typography.Text className="text-xs font-medium text-[#42526D]">
                {fmt(quotation.amount)}
            </Typography.Text>
            <Tag className="rounded-full border-0 bg-[#ECFDF5] text-[#43B75D] text-xs font-normal px-3 py-0.5 m-0">
                {quotation.status}
            </Tag>
        </Flex>
    </Flex>
);

const Step2AttachQuotations = ({
    confirmedCustomerId,
    selectedQuotationId,
    onSelectQuotation,
    onSkip,
}: Props) => {
    const [quotationSearch, setQuotationSearch] = useState('');
    const debouncedSearch = useDebounce(quotationSearch, 300);
    const { quotations, isLoading } = useCustomerQuotations(
        confirmedCustomerId || undefined,
        debouncedSearch
    );

    const selectedQuotation = quotations.find(q => q.id === selectedQuotationId);

    const quotationListContent =
        quotations.length > 0 ? (
            <Flex vertical gap={6} className="overflow-y-auto" style={{ maxHeight: 320 }}>
                {quotations.map(q => (
                    <QuotationRow
                        key={q.id}
                        quotation={q}
                        selected={q.id === selectedQuotationId}
                        onClick={() => {
                            if (q.id === selectedQuotationId) {
                                onSelectQuotation('', undefined);
                            } else {
                                onSelectQuotation(q.id, q.rawId);
                            }
                        }}
                    />
                ))}
            </Flex>
        ) : (
            <Flex
                vertical
                align="center"
                justify="center"
                gap={4}
                className="py-8 rounded-xl border border-dashed border-[#E4E4E7]"
            >
                <Typography.Text className="text-sm font-medium text-[#6B7280]">
                    No quotations found
                </Typography.Text>
                <Typography.Text className="text-xs text-[#A1A1AA]">
                    No quotations available for this customer
                </Typography.Text>
            </Flex>
        );

    return (
        <Flex gap={16} className="p-4 md:p-6 flex-col lg:flex-row">
            <Flex vertical gap={10} className="w-full lg:flex-none lg:w-[360px]">
                <Flex justify="space-between" align="flex-start">
                    <Flex vertical gap={2} className="flex-1">
                        <TypographyText className="text-lg font-semibold">
                            Attach Quotations
                        </TypographyText>
                        <TypographyText className="text-sm text-gray-500">
                            Link an approved quotation to this agreement
                        </TypographyText>
                    </Flex>
                    <Typography.Text
                        className="text-xs font-normal text-[#FF4F4F] cursor-pointer shrink-0 ml-4 mt-0.5"
                        onClick={onSkip}
                    >
                        Skip this step
                    </Typography.Text>
                </Flex>
                <Input
                    prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                    placeholder="Search quotations"
                    value={quotationSearch}
                    onChange={e => setQuotationSearch(e.target.value)}
                    className="h-9 rounded-lg border-[#E4E4E7]"
                />
                {isLoading ? <SelectionCardSkeleton /> : quotationListContent}
            </Flex>

            {selectedQuotation ? (
                <QuotationSelectionCard quotation={selectedQuotation} />
            ) : (
                <Flex
                    flex={1}
                    vertical
                    align="center"
                    justify="center"
                    gap={6}
                    className="rounded-xl border border-dashed border-[#E4E4E7]"
                    style={{ minHeight: 240 }}
                >
                    <Typography.Text className="text-sm font-medium text-[#6B7280]">
                        No quotation selected
                    </Typography.Text>
                    <Typography.Text className="text-xs text-[#A1A1AA]">
                        Select a quotation from the list to preview
                    </Typography.Text>
                </Flex>
            )}
        </Flex>
    );
};

export default Step2AttachQuotations;
