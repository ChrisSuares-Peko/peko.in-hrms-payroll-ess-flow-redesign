import React from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Tag, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';

import useDueThisWeek from '../../hooks/payments/useDueThisWeek';
import { DueThisWeekItem } from '../../types/payments';
import { formatAmount, formatDate, toInitials } from '../../utils/helperFunctions';
import ListDrawer from '../shared/ListDrawer';

const STATUS_STYLE: Record<string, string> = {
    PENDING: 'bg-[#FFF7ED] text-[#F97316]',
    OVERDUE: 'bg-[#FEF2F2] text-[#EF4444]',
};

interface Props {
    open: boolean;
    onClose: () => void;
}

const DueThisWeekDrawer: React.FC<Props> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const { items, isLoading, page, totalRecords, pageSize, handlePageChange } =
        useDueThisWeek(open);

    const handleClick = (item: DueThisWeekItem) => {
        navigate(
            `/${paths.sales.index}/${paths.sales.invoices}/${paths.sales.invoicedetails.replace(':id', String(item.id))}`
        );
        onClose();
    };

    return (
        <ListDrawer
            open={open}
            onClose={onClose}
            title="Payments Due This Week"
            description="Invoices with payments due in the week"
            isLoading={isLoading}
            isEmpty={items.length === 0}
            totalRecords={totalRecords}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            emptyText="No payments due this week"
        >
            <Flex vertical gap={15} className="px-6 py-4">
                {items.map(item => (
                    <Flex
                        key={item.id}
                        justify="space-between"
                        align="flex-start"
                        className="border border-[#CBD5E1] rounded-xl p-4 cursor-pointer hover:border-[#FF4F4F] transition-colors"
                        onClick={() => handleClick(item)}
                    >
                        <Flex gap={12} align="center" className="flex-1">
                            <Flex
                                align="center"
                                justify="center"
                                className="w-10 h-10 rounded-full bg-[#EBF5FF] flex-shrink-0"
                            >
                                <Typography.Text className="text-sm font-semibold text-[#2B5678]">
                                    {toInitials(item.name)}
                                </Typography.Text>
                            </Flex>
                            <Flex vertical gap={4}>
                                <Flex gap={6} align="center">
                                    <Typography.Text className="text-[#1E293B] text-sm font-semibold">
                                        {item.invoiceNumber}
                                    </Typography.Text>
                                    <Tag
                                        bordered={false}
                                        className={`rounded-full px-2 h-5 flex items-center text-xs font-normal ${STATUS_STYLE[item.status.toUpperCase()] ?? 'bg-[#F1F5F9] text-[#64748B]'}`}
                                    >
                                        {item.status}
                                    </Tag>
                                </Flex>
                                <Typography.Text className="text-[#475569] text-xs font-semibold">
                                    {item.name}
                                </Typography.Text>
                                <Typography.Text className="text-[#94A3B8] text-xs">
                                    Due: {formatDate(item.dueDate)}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                        <Flex gap={4} align="center">
                            <Typography.Text className="text-[#038E36] text-sm font-semibold">
                                {formatAmount(Number(item.amountDue))}
                            </Typography.Text>
                            <RightOutlined className="text-gray-400 text-xs" />
                        </Flex>
                    </Flex>
                ))}
            </Flex>
        </ListDrawer>
    );
};

export default DueThisWeekDrawer;
