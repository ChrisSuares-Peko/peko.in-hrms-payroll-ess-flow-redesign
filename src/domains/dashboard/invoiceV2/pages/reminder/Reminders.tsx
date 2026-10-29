import React, { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, DatePicker, Flex, Grid, Input, Pagination, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import pendingImg from '../../assets/icons/empty-wallet.svg';
import completedImg from '../../assets/icons/status-up.svg';
import StatCard from '../../components/shared/StatCard';
import StatCardsSkeleton from '../../components/shared/StatCardsSkeleton';
import { useReminderActions } from '../../hooks/reminders/useReminderActions';
import { useReminderData } from '../../hooks/reminders/useReminderData';
import type { ReminderRow } from '../../types/page-props/reminders';
import getReminderColumns, { TABLE_HEADER_STYLE } from '../../utils/table_column/reminders';

const defaultDateRange = {
    startDate: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
};

const Reminders: React.FC = () => {
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = !!screens.md && !screens.xl;

    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        status: '',
    });

    const {
        reminders,
        recordsTotal,
        stats,
        isLoading: isStatsLoading,
        refetch,
    } = useReminderData(filters);
    const { onSend, onCancel, acting } = useReminderActions(refetch);

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const handleDateRange = (_: any, [start, end]: [string, string]) => {
        setFilters(prev => ({ ...prev, startDate: start || '', endDate: end || '', page: 1 }));
    };

    const handleTableChange = (
        _: any,
        tableFilters: Record<string, FilterValue | null>,
        sorter: SorterResult<ReminderRow> | SorterResult<ReminderRow>[]
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

    const reminderStats = useMemo(
        () => [
            {
                id: 'pending',
                value: String(stats.pending),
                label: 'Pending',
                bgColor: '#FCF9FF',
                icon: pendingImg,
            },
            {
                id: 'completed',
                value: String(stats.completed),
                label: 'Completed',
                bgColor: '#F2F7FB',
                icon: completedImg,
            },
            {
                id: 'cancelled',
                value: String(stats.cancelled),
                label: 'Cancelled',
                bgColor: '#F1FFF6',
                icon: completedImg,
            },
        ],
        [stats]
    );

    const statusFilter = filters.status ? filters.status.split(',') : [];
    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;

    const columns = getReminderColumns(
        onSend,
        onCancel,
        statusFilter.length ? statusFilter : undefined,
        acting
    );

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex justify="space-between" align="flex-start">
                <Flex vertical gap={4}>
                    <Typography.Text className="text-xl font-semibold block">
                        Reminders
                    </Typography.Text>
                    <Typography.Text className="text-gray-500 text-sm font-normal block">
                        View scheduled reminders and configure automation rules.
                    </Typography.Text>
                </Flex>
            </Flex>

            {/* Stat cards */}
            <Row gutter={[16, 16]} className="my-8">
                {isStatsLoading ? (
                    <Col xs={24}>
                        <StatCardsSkeleton count={3} />
                    </Col>
                ) : (
                    reminderStats.map(s => (
                        <Col key={s.id} xs={24} sm={12} xl={8}>
                            <StatCard
                                value={s.value}
                                label={s.label}
                                bgColor={s.bgColor}
                                icon={s.icon}
                            />
                        </Col>
                    ))
                )}
            </Row>

            {/* Reminder List */}
            <Flex vertical gap={20}>
                <Flex
                    vertical={isTablet || isMobile}
                    justify="space-between"
                    align={isTablet || isMobile ? 'stretch' : 'center'}
                    gap={isTablet || isMobile ? 12 : 0}
                >
                    <Typography.Text className="text-base font-semibold leading-6">
                        Reminder List
                    </Typography.Text>
                    <Flex vertical={isMobile} align="center" gap={12}>
                        <DatePicker.RangePicker
                            className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                            onChange={handleDateRange}
                            format="YYYY-MM-DD"
                            value={rangePickerValue}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder="Search reminders..."
                            value={searchText}
                            onChange={updateSearchText}
                            className="w-full md:w-[260px] h-10 rounded-lg border-[#E4E4E7]"
                            allowClear
                        />
                    </Flex>
                </Flex>

                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={reminders}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        className="w-full"
                        loading={isStatsLoading}
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
                        total={recordsTotal}
                        showSizeChanger={false}
                    />
                </Flex>
            </Flex>
        </Content>
    );
};

export default Reminders;
