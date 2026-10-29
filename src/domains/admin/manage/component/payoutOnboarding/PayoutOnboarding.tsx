import React, { useCallback, useRef, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Flex, Pagination, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import DetailDrawer from './DetailDrawer';
import Header from './Header';
import useFilter from '../../hooks/useFilters';
import usePayoutOnboarding from '../../hooks/usePayoutOnboarding';
import { AdminPayoutOnboardingRecord } from '../../types/payoutOnboarding';

const today = dayjs().format('YYYY-MM-DD');
const oneMonthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
    active: { color: '#3AB75E', bg: '#ECFDF3' },
    pending: { color: '#D97706', bg: '#FFFBEB' },
    rejected: { color: '#EF4444', bg: '#FEF2F2' },
    suspended: { color: '#6B7280', bg: '#F3F4F6' },
};

const PayoutOnboardingPage = () => {
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        from: oneMonthAgo,
        to: today,
    };

    const [filters, setFilters] = useState(initialValues);
    const [searchText, setSearchText] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerData, setDrawerData] = useState<AdminPayoutOnboardingRecord>();

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.trimStart();
        setSearchText(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setFilters(prev => ({ ...prev, searchText: value, page: 1 }));
        }, 300);
    }, []);

    const { handlePageChange, handleTableChange, handleDateChange } = useFilter({
        setFilters,
        initalStartDate: oneMonthAgo,
        initalEndDate: today,
    });

    const { isLoading, tableData, count, updateStatus } = usePayoutOnboarding(filters);

    const handleView = (record: AdminPayoutOnboardingRecord) => {
        setDrawerData(record);
        setDrawerOpen(true);
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            sorter: true,
            key: 'createdAt',
            render: (createdAt: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                    <Typography.Text className="text-xs text-[#98A2B3]">
                        {formattedTime(new Date(createdAt))}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Corporate Name',
            dataIndex: 'corporateName',
            sorter: true,
            key: 'corporateName',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Business Name',
            dataIndex: 'businessName',
            key: 'businessName',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'PAN',
            dataIndex: 'pan',
            key: 'pan',
            render: (val: string) => <Typography.Text>{val || '-'}</Typography.Text>,
        },
        {
            title: 'Bank',
            key: 'bank',
            render: (_: any, record: AdminPayoutOnboardingRecord) => (
                <Flex vertical>
                    <Typography.Text>{record.bankName || '-'}</Typography.Text>
                    <Typography.Text className="text-xs text-[#98A2B3]">
                        {record.accountNumber || ''}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Consent',
            dataIndex: 'consentAcceptedAt',
            key: 'consentAcceptedAt',
            render: (val: string | null) => (
                <Typography.Text>{val ? formattedDateOnly(new Date(val)) : '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            sorter: true,
            key: 'status',
            render: (status: string) => {
                const style = STATUS_COLOR[status] ?? { color: '#6B7280', bg: '#F3F4F6' };
                return (
                    <Tag
                        className="rounded-full border-0 px-3 py-0.5 text-xs font-medium capitalize"
                        style={{ color: style.color, backgroundColor: style.bg }}
                    >
                        {status}
                    </Tag>
                );
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: AdminPayoutOnboardingRecord) => (
                <EyeOutlined
                    className="cursor-pointer text-base text-[#667085] hover:text-[#FF4D4F]"
                    onClick={() => handleView(record)}
                />
            ),
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                searchText={searchText}
                handleSearch={handleSearch}
                from={filters.from}
                to={filters.to}
                handleDateChange={handleDateChange}
            />
            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="justify-end text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            {drawerOpen && (
                <DetailDrawer
                    open={drawerOpen}
                    data={drawerData}
                    onClose={() => setDrawerOpen(false)}
                    onUpdateStatus={updateStatus}
                    isLoading={isLoading}
                />
            )}
        </Flex>
    );
};

export default PayoutOnboardingPage;
