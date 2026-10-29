import React from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';

import { DocumentRow } from '../../types/documents';
import { formatAmount, formatDate, toTitleCase } from '../../utils/helperFunctions';
import ListDrawer from '../shared/ListDrawer';

const STATUS_STYLE: Record<string, string> = {
    Pending: 'bg-[#FFF7ED] text-[#F97316]',
    Overdue: 'bg-[#FEF2F2] text-[#EF4444]',
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSelectInvoice: (inv: DocumentRow) => void;
    invoices: DocumentRow[];
    isLoading: boolean;
    totalRecords: number;
    page: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
};

const RecordPaymentDrawer: React.FC<Props> = ({
    open,
    onClose,
    onSelectInvoice,
    invoices,
    isLoading,
    totalRecords,
    page,
    itemsPerPage,
    onPageChange,
}) => (
    <ListDrawer
        open={open}
        onClose={onClose}
        title="Select Invoice"
        description="Choose an invoice to collect payment"
        isLoading={isLoading}
        isEmpty={invoices.length === 0}
        totalRecords={totalRecords}
        page={page}
        pageSize={itemsPerPage}
        onPageChange={onPageChange}
        emptyText="No invoices found"
    >
        <Flex vertical gap={15} className="px-6 py-4 overflow-y-auto">
            {invoices.map(inv => (
                <Flex
                    key={inv.id}
                    justify="space-between"
                    align="flex-start"
                    className="border border-[#cbd5e1] rounded-xl p-4 cursor-pointer hover:border-[#ff4f4f] transition-colors"
                    onClick={() => onSelectInvoice(inv)}
                >
                    <Flex vertical gap={8}>
                        <Flex vertical gap={4}>
                            <Flex gap={6} align="center">
                                <Typography.Text className="text-[#1e293b] text-sm font-semibold">
                                    {inv.prefix}
                                    {inv.documentNumber}
                                </Typography.Text>
                                <Tag
                                    bordered={false}
                                    className={`rounded-full px-2 h-5 flex items-center text-xs font-normal ${STATUS_STYLE[toTitleCase(inv.status)] ?? ''}`}
                                >
                                    {toTitleCase(inv.status)}
                                </Tag>
                            </Flex>
                            <Typography.Text className="text-[#475569] text-xs font-semibold">
                                {inv.name}
                            </Typography.Text>
                        </Flex>
                        <Flex gap={12}>
                            <Typography.Text className="text-[#475569] text-xs">
                                Invoice: {formatDate(inv.documentDate)}
                            </Typography.Text>
                            <Typography.Text className="text-[#475569] text-xs">
                                Due: {formatDate(inv.dueDate)}
                            </Typography.Text>
                        </Flex>
                    </Flex>
                    <Flex gap={4} align="center">
                        <Typography.Text className="text-[#038e36] text-sm font-semibold">
                           {formatAmount(Number(inv.amountDue))}
                        </Typography.Text>
                        <RightOutlined className="text-gray-400 text-xs" />
                    </Flex>
                </Flex>
            ))}
        </Flex>
    </ListDrawer>
);

export default RecordPaymentDrawer;
