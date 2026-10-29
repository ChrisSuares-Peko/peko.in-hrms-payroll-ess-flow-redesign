import React, { useMemo, useState } from 'react';

import { PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Flex, Grid, Input, Pagination, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import profile2userImg from '../assets/icons/customers/profile-2user.svg';
import profileTickImg from '../assets/icons/customers/profile-tick.svg';
import moneySend1Img from '../assets/icons/money-send.svg';
import statusUpImg from '../assets/icons/status-up.svg';
import AddCustomerDrawer from '../components/customers/AddCustomerDrawer';
import BulkUploadCustomerModal from '../components/customers/BulkUploadCustomerModal';
import RankingPanel from '../components/shared/RankingPanel';
import StatCard from '../components/shared/StatCard';
import StatCardsSkeleton from '../components/shared/StatCardsSkeleton';
import useCustomerActions from '../hooks/customer/useCustomerActions';
import useCustomerData from '../hooks/customer/useCustomerData';
import { StatCardItem } from '../types';
import { CustomerRow } from '../types/customer';
import { formatAmount, getLastMonthDateRange } from '../utils/helperFunctions';
import getCustomerColumns, { TABLE_HEADER_STYLE } from '../utils/table_column/CustomerColumns';

const defaultDateRange = getLastMonthDateRange();

const Customers: React.FC = () => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = !!screens.md && !screens.xl;
    const initialValues = {
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        status: '',
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const {
        customerList,
        stats,
        topByRevenue,
        topByTxn,
        isLoading,
        isDashboardLoading,
        setRefresh,
    } = useCustomerData(filters);
    const onSuccess = () => setRefresh(true);
    const { deleteCustomer } = useCustomerActions(onSuccess);

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
    const [deletingCustomer, setDeletingCustomer] = useState<CustomerRow | null>(null);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);

    const handleDateRange = (_: any, [start, end]: [string, string]) => {
        setFilters(prev => ({
            ...prev,
            startDate: start || '',
            endDate: end || '',
            page: 1,
        }));
    };

    const handleTableChange = (
        _: any,
        tableFilters: Record<string, FilterValue | null>,
        sorter: SorterResult<CustomerRow> | SorterResult<CustomerRow>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        const statusValues = tableFilters?.status as string[] | null;
        setFilters(prev => ({
            ...prev,
            sortField: (s?.field as string) || '',
            sort: s?.order === 'ascend' ? 'ASC' : 'DESC',
            status: statusValues?.join(',') || '',
            page: 1,
        }));
    };

    const customerStats = useMemo<StatCardItem[]>(
        () => [
            {
                id: 'total',
                value: String(stats.totalCustomers),
                label: 'Total Customers',
                bgColor: '#FDF6F0',
                icon: profile2userImg,
            },
            {
                id: 'active',
                value: String(stats.activeCustomers),
                label: 'Active Customers',
                bgColor: '#ECF0FC',
                icon: profileTickImg,
            },
            {
                id: 'revenue',
                value: formatAmount(stats?.totalRevenue || 0),
                label: 'Total Revenue',
                bgColor: '#EBF6F1',
                icon: statusUpImg,
            },
            {
                id: 'avg',
                value: formatAmount(stats?.avgTransaction || 0),
                label: 'Avg Transaction',
                bgColor: '#FCF9FF',
                icon: moneySend1Img,
            },
        ],
        [stats]
    );

    const handleEditCustomer = (row: CustomerRow) => {
        setEditingCustomer(row);
        setIsDrawerOpen(true);
    };

    const handleDeleteCustomer = (row: CustomerRow) => {
        setDeletingCustomer(row);
    };

    const statusFilter = filters.status ? filters.status.split(',') : [];
    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;
    const columns = getCustomerColumns(
        handleEditCustomer,
        handleDeleteCustomer,
        statusFilter.length ? statusFilter : undefined
    );

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex
                vertical={isMobile}
                justify="space-between"
                align={isMobile ? 'stretch' : 'center'}
                gap={isMobile ? 16 : 0}
                className="mt-4 mb-6"
            >
                <TypographyText className="text-[#101828] text-xl font-semibold leading-7">
                    Customer
                </TypographyText>
                <Flex vertical={isMobile} gap={10}>
                    <Button
                        icon={<UploadOutlined />}
                        block={isMobile}
                        className="h-9 px-4 font-medium text-sm rounded-lg md:w-auto"
                        onClick={() => setIsBulkUploadModalOpen(true)}
                    >
                        Bulk Upload Customer
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        block={isMobile}
                        className="h-9 px-4 bg-[#FF4F4F] border-[#FF4F4F] text-white font-medium text-sm rounded-lg hover:bg-[#e64444] md:w-auto"
                        onClick={() => {
                            setEditingCustomer(null);
                            setIsDrawerOpen(true);
                        }}
                    >
                        Add Customer
                    </Button>
                </Flex>
            </Flex>

            {/* Stat cards — 1×4 → 2×2 → 4×1 */}
            <Row gutter={[16, 16]} className="mb-6">
                {customerStats.map(s => (
                    <Col key={s.id} xs={24} sm={12} xl={6}>
                        {isDashboardLoading ? <StatCardsSkeleton count={1} /> : <StatCard {...s} />}
                    </Col>
                ))}
            </Row>

            {/* Leaderboard panels */}
            <Flex vertical={isTablet || isMobile} gap={24} className="mb-6">
                <RankingPanel
                    title="Top Customers by Revenue"
                    data={topByRevenue}
                    variant="revenue"
                    isLoading={isDashboardLoading}
                />
                <RankingPanel
                    title="Top Customers by Transactions"
                    data={topByTxn}
                    variant="txn"
                    isLoading={isDashboardLoading}
                />
            </Flex>

            {/* Customer List */}
            <Flex vertical gap={20}>
                <Flex
                    vertical={isTablet || isMobile}
                    justify="space-between"
                    align={isTablet || isMobile ? 'stretch' : 'center'}
                    gap={isTablet || isMobile ? 12 : 0}
                >
                    <TypographyText className="text-[#101828] text-base font-semibold leading-6">
                        Customer List
                    </TypographyText>
                    <Flex vertical={isMobile} align="center" gap={12}>
                        <DatePicker.RangePicker
                            className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                            onChange={handleDateRange}
                            format="YYYY-MM-DD"
                            value={rangePickerValue}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder="Search customers..."
                            value={searchText}
                            onChange={updateSearchText}
                            className="w-full md:w-[260px] h-10 rounded-lg border-[#E4E4E7]"
                        />
                    </Flex>
                </Flex>

                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={customerList?.customers || []}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        className="w-full"
                        loading={isLoading}
                        onChange={handleTableChange}
                        components={{
                            header: {
                                cell: ({
                                    style,
                                    ...rest
                                }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                    <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                                ),
                            },
                        }}
                    />
                    <Pagination
                        current={filters.page}
                        pageSize={filters.itemsPerPage}
                        onChange={(page, pageSize) =>
                            setFilters(prev => ({ ...prev, page, itemsPerPage: pageSize }))
                        }
                        size="default"
                        className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                        total={customerList?.recordsTotal || 0}
                        showSizeChanger={false}
                    />
                </Flex>
            </Flex>

            <AddCustomerDrawer
                open={isDrawerOpen}
                editingCustomer={editingCustomer ?? undefined}
                onSuccess={onSuccess}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setEditingCustomer(null);
                }}
            />
            {isBulkUploadModalOpen && (
                <BulkUploadCustomerModal
                    open={isBulkUploadModalOpen}
                    handleCancel={() => setIsBulkUploadModalOpen(false)}
                />
            )}
            <ConfirmationModal
                isOpen={!!deletingCustomer}
                handleCancel={() => setDeletingCustomer(null)}
                handleSubmit={() => {
                    if (deletingCustomer) deleteCustomer(deletingCustomer.id);
                    setDeletingCustomer(null);
                }}
                title={`Delete ${deletingCustomer?.name ?? 'this customer'}?`}
                description="This action cannot be undone."
                isLoading={false}
            />
        </Content>
    );
};

export default Customers;
