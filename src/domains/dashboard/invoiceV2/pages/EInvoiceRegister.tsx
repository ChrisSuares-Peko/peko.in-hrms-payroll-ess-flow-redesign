import React from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Input, Pagination, Tabs } from 'antd';
import { Content } from 'antd/es/layout/layout';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@routes/paths';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import { TABLE_HEADER_STYLE } from '../constants/style';
import useEInvoiceRegister from '../hooks/useEInvoiceRegister';
import { EInvoiceRegisterTab } from '../types/eInvoiceRegister';
import { getLastMonthDateRange } from '../utils/helperFunctions';
import eInvoiceRegisterColumns from '../utils/table_column/eInvoiceRegisterColumns';

const defaultDateRange = getLastMonthDateRange();

const TAB_STATUS: Record<EInvoiceRegisterTab, string> = {
    all: '',
    active: 'ACTIVE',
    cancelled: 'CANCELLED',
};

const EInvoiceRegister: React.FC = () => {
    const navigate = useNavigate();

    const [filters, setFilters] = React.useState({
        searchText: '',
        page: 1,
        itemsPerPage: 10,
        sort: 'DESC',
        sortField: '',
        from: defaultDateRange.startDate,
        to: defaultDateRange.endDate,
        status: '',
        supplyType: '',
    });

    const [activeTab, setActiveTab] = React.useState<EInvoiceRegisterTab>('all');

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);

    const { rows, stats, recordsTotal, isLoading } = useEInvoiceRegister(filters);

    const handleTabChange = (key: string) => {
        const tab = key as EInvoiceRegisterTab;
        setActiveTab(tab);
        setFilters(prev => ({ ...prev, status: TAB_STATUS[tab], page: 1 }));
    };

    const handleTableChange = (
        _: unknown,
        tableFilters: Record<string, FilterValue | null>,
        sorter: SorterResult<unknown> | SorterResult<unknown>[]
    ) => {
        const s = Array.isArray(sorter) ? sorter[0] : sorter;
        const supplyValues = tableFilters?.supply as string[] | null;
        setFilters(prev => ({
            ...prev,
            sortField: (s?.columnKey as string) || 'id',
            sort: s?.order === 'ascend' ? 'ASC' : 'DESC',
            supplyType: supplyValues?.join(',') || '',
            page: 1,
        }));
    };

    const handleDateRange = (_: unknown, [start, end]: [string, string]) => {
        setFilters(prev => ({
            ...prev,
            from: start || defaultDateRange.startDate,
            to: end || defaultDateRange.endDate,
            page: 1,
        }));
    };

    const rangePickerValue =
        filters.from && filters.to
            ? ([dayjs(filters.from), dayjs(filters.to)] as [Dayjs, Dayjs])
            : null;

    const tabItems = [
        { key: 'all', label: `All (${stats.total})` },
        { key: 'active', label: `Active (${stats.active})` },
        { key: 'cancelled', label: `Cancelled (${stats.cancelled})` },
    ];

    return (
        <Content className="px-0">
            {/* Header */}
            <Flex
                justify="space-between"
                align="flex-start"
                gap={16}
                className="mt-4 mb-7 flex-col sm:flex-row md:items-center"
            >
                <Flex vertical gap={4}>
                    <TypographyText className="text-xl md:text-2xl font-semibold">
                        E-Invoice Register
                    </TypographyText>
                    <TypographyText className="text-[#6B7280] text-sm md:text-base font-normal leading-6">
                        {Math.min(filters.page * filters.itemsPerPage, stats.total)} of{' '}
                        {stats.total} invoices · Active ({stats.active}) · Cancelled (
                        {stats.cancelled})
                    </TypographyText>
                </Flex>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    danger
                    onClick={() =>
                        navigate(`/${paths.invoice.index}/${paths.invoice.convertToEInvoice}`)
                    }
                >
                    Generate IRN
                </Button>
            </Flex>

            {/* Search + Date Range */}
            <Flex gap={12} wrap="wrap" className="mb-3 flex-col md:flex-row">
                <Input
                    prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                    placeholder="Search Invoice..."
                    value={searchText}
                    onChange={updateSearchText}
                    allowClear
                    className="flex-1 h-10"
                />
                <DatePicker.RangePicker
                    className="h-10 min-w-[300px]"
                    onChange={handleDateRange}
                    value={rangePickerValue}
                    format="YYYY-MM-DD"
                />
            </Flex>

            {/* Tabs + Table */}
            <Tabs
                activeKey={activeTab}
                onChange={handleTabChange}
                className="[&_.ant-tabs-tab]:px-6"
                items={tabItems.map(tab => ({
                    key: tab.key,
                    label: tab.label,
                    children: (
                        <Flex
                            vertical
                            className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                        >
                            <GenericTable
                                dataSource={rows}
                                columns={eInvoiceRegisterColumns}
                                rowKey="id"
                                loading={isLoading}
                                pagination={false}
                                onChange={handleTableChange}
                                onRow={row => ({
                                    onClick: () =>
                                        navigate(
                                            `/${paths.invoice.index}/${paths.invoice.eInvoiceDetails.replace(':id', row.id)}`
                                        ),
                                    className: 'cursor-pointer',
                                })}
                                components={{
                                    header: {
                                        cell: ({
                                            style,
                                            ...rest
                                        }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                            <th
                                                {...rest}
                                                style={{ ...style, ...TABLE_HEADER_STYLE }}
                                            />
                                        ),
                                    },
                                }}
                            />
                            <Pagination
                                current={filters.page}
                                pageSize={filters.itemsPerPage}
                                total={recordsTotal}
                                onChange={(page, pageSize) =>
                                    setFilters(prev => ({ ...prev, page, itemsPerPage: pageSize }))
                                }
                                size="default"
                                showSizeChanger={false}
                                className="justify-end text-end py-4 px-5 [&_.ant-pagination-item-active]:!border-[#42526D] [&_.ant-pagination-item-active_a]:!text-[#42526D]"
                            />
                        </Flex>
                    ),
                }))}
            />
        </Content>
    );
};

export default EInvoiceRegister;
