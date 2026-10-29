import React from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';

import useRecentTransactions from '../../hooks/useRecentTransactions';
import { RecentTransactionItem } from '../../types/dashboard';
import { formatAmount, formatDateAndTime } from '../../utils/helperFunctions';
import ListDrawer from '../shared/ListDrawer';

const DOC_TYPE_STYLE: Record<string, { label: string; className: string }> = {
    INVOICE: { label: 'Invoice', className: 'bg-[#DCFCE7] text-[#15803D]' },
    QUOTATION: { label: 'Quotation', className: 'bg-[#DBEAFE] text-[#1D4ED8]' },
    SALES_ORDER: { label: 'Sales Order', className: 'bg-[#EDE9FE] text-[#7C3AED]' },
};

interface Props {
    open: boolean;
    onClose: () => void;
}

const RecentTransactionsDrawer: React.FC<Props> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const { transactions, recordsTotal, page, pageLimit, isLoading, fetchPage } =
        useRecentTransactions(open);

    const handleClick = (txn: RecentTransactionItem) => {
        const id = String(txn.id);
        const pathMap: Record<string, string> = {
            INVOICE: `${paths.sales.invoices}/${paths.sales.invoicedetails.replace(':id', id)}`,
            QUOTATION: `${paths.sales.quotations}/${paths.sales.quotationDetails.replace(':id', id)}`,
            SALES_ORDER: `${paths.sales.salesOrders}/${paths.sales.salesOrderDetails.replace(':id', id)}`,
        };
        const path = pathMap[txn.documentType];
        if (path) {
            navigate(path);
            onClose();
        }
    };

    const typeStyle = (type: string) => DOC_TYPE_STYLE[type] ?? DOC_TYPE_STYLE.INVOICE;

    return (
        <ListDrawer
            open={open}
            onClose={onClose}
            title="Recent Transactions"
            description="Recent transactions across all documents"
            isLoading={isLoading}
            isEmpty={transactions.length === 0}
            totalRecords={recordsTotal}
            page={page}
            pageSize={pageLimit}
            onPageChange={fetchPage}
            emptyText="No transactions found"
        >
            <Flex vertical gap={15} className="px-6 py-4 overflow-y-auto">
                {transactions.map(txn => (
                    <Flex
                        key={txn.id}
                        justify="space-between"
                        align="flex-start"
                        className="border border-[#CBD5E1] rounded-xl p-4 cursor-pointer hover:border-[#FF4F4F] transition-colors"
                        onClick={() => handleClick(txn)}
                    >
                        <Flex vertical gap={8}>
                            <Flex gap={6} align="center">
                                <Typography.Text className="text-[#1E293B] text-sm font-semibold">
                                    {txn.invoiceNumber}
                                </Typography.Text>
                                <Tag
                                    bordered={false}
                                    className={`rounded-full px-2 h-5 flex items-center text-xs font-normal ${typeStyle(txn.documentType).className}`}
                                >
                                    {typeStyle(txn.documentType).label}
                                </Tag>
                            </Flex>
                            <Typography.Text className="text-[#475569] text-xs font-semibold">
                                {txn.customerName}
                            </Typography.Text>
                            <Typography.Text className="text-[#475569] text-xs">
                                {formatDateAndTime(txn.createdAt)}
                            </Typography.Text>
                        </Flex>
                        <Flex gap={4} align="center">
                            <Typography.Text className="text-[#038E36] text-sm font-semibold">
                                {formatAmount(txn.totalAmount)}
                            </Typography.Text>
                            <RightOutlined className="text-gray-400 text-xs" />
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </ListDrawer>
    );
};

export default RecentTransactionsDrawer;
