import React from 'react';

import { FileTextOutlined, RightOutlined } from '@ant-design/icons';
import { Drawer, Flex, Pagination, Tag, Typography } from 'antd';

import { InvoiceRow } from '../../types/invoice';
import { formatAmount, formatDate, toTitleCase } from '../../utils/helperFunctions';
import CardRowsSkeleton from '../shared/CardRowsSkeleton';
import LeftHeader from '../shared/LeftHeader';

const STATUS_STYLE: Record<string, string> = {
    Pending: 'bg-[#FFF7ED] text-[#F97316]',
    Overdue: 'bg-[#FEF2F2] text-[#EF4444]',
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSelectInvoice: (inv: InvoiceRow) => void;
    invoices: InvoiceRow[];
    isLoading: boolean;
    totalRecords: number;
    page: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
};

const SelectInvoiceDrawer: React.FC<Props> = ({
    open,
    onClose,
    onSelectInvoice,
    invoices,
    isLoading,
    totalRecords,
    page,
    itemsPerPage,
    onPageChange,
}) => {
    let content: React.ReactNode;

    if (isLoading) {
        content = (
            <CardRowsSkeleton
                count={5}
                containerClassName="px-6 py-4"
                rowClassName="border border-[#cbd5e1] rounded-xl p-4 overflow-hidden bg-white"
            />
        );
    } else if (invoices.length === 0) {
        content = (
            <Flex vertical align="center" justify="center" gap={8} className="min-h-[400px]">
                <FileTextOutlined className="text-3xl text-[#D0D5DD]" />
                <Typography.Text className="text-sm text-[#6A7282]">
                    No invoices found
                </Typography.Text>
            </Flex>
        );
    } else {
        content = (
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
                                        {inv.prefix
                                            ? `${inv.prefix}${inv.invoiceNumber}`
                                            : inv.invoiceNumber}
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
                                    Invoice: {formatDate(inv.invoiceDate)}
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
        );
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            width={520}
            closable={false}
            destroyOnHidden
            styles={{
                body: { padding: 0 },
                header: { padding: '16px 24px' },
                footer: {
                    padding: '14px 24px',
                    background: '#f8fafc',
                    borderTop: '1px solid #e2e8f0',
                },
            }}
            title={
                <LeftHeader
                    title="Select Invoice"
                    description="Choose an invoice to collect payment"
                    onClose={onClose}
                />
            }
            footer={
                totalRecords > itemsPerPage ? (
                    <Flex justify="center">
                        <Pagination
                            current={page}
                            total={totalRecords}
                            pageSize={itemsPerPage}
                            onChange={onPageChange}
                            showSizeChanger={false}
                        />
                    </Flex>
                ) : (
                    <Typography.Text className="text-[#475569] text-sm font-medium block text-center">
                        Showing {totalRecords} pending invoices
                    </Typography.Text>
                )
            }
        >
            {content}
        </Drawer>
    );
};

export default SelectInvoiceDrawer;
