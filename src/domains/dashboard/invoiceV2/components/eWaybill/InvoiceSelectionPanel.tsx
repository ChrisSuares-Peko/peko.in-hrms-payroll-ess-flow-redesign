import React from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import InvoiceListItem from './InvoiceListItem';
import { ActiveWaybillEntry, EligibleInvoice } from '../../types/eWaybill';
import CardRowsSkeleton from '../shared/CardRowsSkeleton';

interface Props {
    eligibleInvoices: EligibleInvoice[];
    recordsTotal: number;
    activeWaybills: ActiveWaybillEntry[];
    selectedInvoiceId?: string;
    searchText: string;
    isLoading: boolean;
    hasMore: boolean;
    onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSelect: (invoice: EligibleInvoice) => void;
    onLoadMore: () => void;
}

const InvoiceSelectionPanel: React.FC<Props> = ({
    eligibleInvoices,
    recordsTotal,
    activeWaybills,
    selectedInvoiceId,
    searchText,
    isLoading,
    hasMore,
    onSearchChange,
    onSelect,
    onLoadMore,
}) => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 60 && hasMore && !isLoading) {
            onLoadMore();
        }
    };

    return (
        <Flex vertical gap={16} className="w-full h-full p-5 md:p-6 rounded-2xl border">
            {/* Header */}
            <Flex justify="space-between" align="center">
                <TypographyText className="text-lg font-semibold">Select Invoice</TypographyText>
                <TypographyText className="text-[#475467] text-sm">
                    ({recordsTotal} eligible)
                </TypographyText>
            </Flex>

            {/* Search — hidden when a specific invoice is pre-selected */}
            {onSearchChange && (
                <Input
                    prefix={<SearchOutlined className="text-[#A1A1AA]" />}
                    placeholder="Search Invoices"
                    value={searchText}
                    onChange={onSearchChange}
                />
            )}

            {/* Eligible invoices with infinite scroll */}
            <Flex
                vertical
                gap={10}
                className="overflow-y-auto flex-1 min-h-0 pr-1"
                onScroll={handleScroll}
            >
                {eligibleInvoices.map(invoice => (
                    <InvoiceListItem
                        key={invoice.id}
                        invoice={invoice}
                        isSelected={invoice.id === selectedInvoiceId}
                        onClick={() => onSelect(invoice)}
                    />
                ))}
                {isLoading && (
                    <CardRowsSkeleton
                        count={5}
                        rowClassName="bg-[#F8FAFC] rounded-xl px-4 py-3 overflow-hidden"
                    />
                )}
                {!isLoading && eligibleInvoices.length === 0 && (
                    <Flex flex={1} align="center" justify="center">
                        <TypographyText className="text-[#A1A1AA] text-sm">
                            No active e-invoices found
                        </TypographyText>
                    </Flex>
                )}
            </Flex>

            {/* Divider */}
            {/* <Divider className="h-px w-full bg-[#E4E4E7]" /> */}

            {/* Active waybills */}
            {/* <Flex vertical gap={10}>
                <TypographyText className="text-base font-semibold">
                    Invoices with Active E-Waybill
                </TypographyText>
                {activeWaybills.length > 0 && (
                    <Flex vertical gap={8}>
                        {activeWaybills.map(entry => (
                            <LabelValueRow
                                key={entry.id}
                                label={entry.invoiceRef}
                                value={`EWB: ${entry.waybillNumber}`}
                            />
                        ))}
                    </Flex>
                )}
            </Flex> */}
        </Flex>
    );
};

export default InvoiceSelectionPanel;
