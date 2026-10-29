import React, { useMemo, useState } from 'react';

import { PlusOutlined, SearchOutlined, SyncOutlined } from '@ant-design/icons';
import { Button, DatePicker, Flex, Grid, Input, Pagination } from 'antd';
import { Content } from 'antd/es/layout/layout';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';
import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { paths } from '@src/routes/paths';

import moneySendImg from '../assets/icons/money-send2.svg';
import moneySend1Img from '../assets/icons/status-up.svg';
import statusUpImg from '../assets/icons/status-up2.svg';
import MakeRecurringModal from '../components/general/MakeRecurringModal';
import StatCard from '../components/shared/StatCard';
import StatCardsSkeleton from '../components/shared/StatCardsSkeleton';
import useInvoice from '../hooks/useInvoice';
import { StatCardItem } from '../types';
import { InvoiceRow } from '../types/invoice';
import { formatAmount, getLastMonthDateRange } from '../utils/helperFunctions';
import getInvoiceColumns, { TABLE_HEADER_STYLE } from '../utils/table_column/invoiceColumns';

const defaultDateRange = getLastMonthDateRange();

const Invoice: React.FC = () => {
    const navigate = useNavigate();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = !!screens.md && !screens.xl;
    const [filters, setFilters] = useState({
        searchText: '',
        page: 1,
        itemsPerPage: 5,
        sort: 'DESC' as 'ASC' | 'DESC',
        sortField: '',
        startDate: defaultDateRange.startDate,
        endDate: defaultDateRange.endDate,
        status: '',
    });
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { invoiceList, stats, isLoading, isStatsLoading, isDeleting, deleteInvoice, markAsPaid } =
        useInvoice(filters);
    const [deletingInvoice, setDeletingInvoice] = useState<InvoiceRow | null>(null);
    const [recurringInvoice, setRecurringInvoice] = useState<InvoiceRow | null>(null);

    const invoiceStats = useMemo<StatCardItem[]>(
        () => [
            {
                id: 'total',
                value: String(stats?.totalInvoices || 0),
                label: 'Total Invoices',
                bgColor: '#FDF6F0',
                icon: statusUpImg,
            },
            {
                id: 'received',
                value: formatAmount(stats?.totalReceived || 0),
                label: 'Amount Received',
                bgColor: '#ECF0FC',
                icon: moneySendImg,
            },
            {
                id: 'outstanding',
                value: formatAmount(stats?.outstandingAmount || 0),
                label: 'Outstanding Amount',
                bgColor: '#EBF6F1',
                icon: moneySend1Img,
            },
        ],
        [stats]
    );

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
        sorter: SorterResult<InvoiceRow> | SorterResult<InvoiceRow>[]
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

    const handleDeleteInvoice = (row: InvoiceRow) => {
        setDeletingInvoice(row);
    };

    const handleViewInvoice = (id: string) => {
        navigate(`/${paths.invoice.index}/${paths.invoice.invoicedetails.replace(':id', id)}`);
    };

    const filteredInvoiceData = useMemo(() => {
        const data = invoiceList?.invoiceData ?? [];
        if (!filters.searchText) return data;
        const lower = filters.searchText.toLowerCase();
        return data.filter(
            row =>
                `${row.prefix ?? ''}${row.invoiceNumber ?? ''}`.toLowerCase().includes(lower) ||
                row.name?.toLowerCase().includes(lower) ||
                row.totalAmount?.toLowerCase().includes(lower) ||
                row.invoiceType?.toLowerCase().includes(lower) ||
                row.status?.toLowerCase().includes(lower)
        );
    }, [invoiceList?.invoiceData, filters.searchText]);

    const statusFilter = filters.status ? filters.status.split(',') : [];
    const rangePickerValue =
        filters.startDate && filters.endDate
            ? ([dayjs(filters.startDate), dayjs(filters.endDate)] as [Dayjs, Dayjs])
            : null;
    const columns = getInvoiceColumns(
        (row: InvoiceRow) =>
            navigate(`/${paths.invoice.index}/${paths.invoice.edit.replace(':id', row.id)}`),
        handleDeleteInvoice,
        handleViewInvoice,
        statusFilter.length ? statusFilter : undefined,
        (row: InvoiceRow) => setRecurringInvoice(row),
        (row: InvoiceRow) => markAsPaid(row.id)
    );

    return (
        <Content className="px-0">
            <Flex justify="space-between" align="center" gap={12} wrap="wrap" className="mt-4 mb-6">
                <TypographyText className="text-[#101828] text-xl font-semibold leading-7">
                    All Invoices
                </TypographyText>
                <Flex gap={8} wrap="wrap">
<Button
                        icon={<SyncOutlined />}
                        className="h-9 w-full sm:w-auto px-4 font-medium text-sm rounded-lg"
                        onClick={() => navigate(`/${paths.invoice.index}/${paths.invoice.recurring}`)}
                    >
                        Recurring Invoices
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        className="h-9 w-full sm:w-auto px-4 bg-[#FF4F4F] border-[#FF4F4F] text-white font-medium text-sm rounded-lg hover:bg-[#e64444]"
                        onClick={() => navigate(`/${paths.invoice.index}/${paths.invoice.create}`)}
                    >
                        Create Invoice
                    </Button>
                </Flex>
            </Flex>

            <Flex gap={16} wrap="wrap" className="mb-6">
                {isStatsLoading ? (
                    <StatCardsSkeleton count={3} verticalOnMobile={isMobile} />
                ) : (
                    <Flex vertical={isMobile} gap={16} wrap="wrap" className="w-full">
                        {invoiceStats.map(s => (
                            <StatCard key={s.id} {...s} />
                        ))}
                    </Flex>
                )}
            </Flex>

            <Flex vertical gap={20} className="pt-7">
                <Flex
                    vertical={isTablet || isMobile}
                    justify="space-between"
                    align={isTablet || isMobile ? 'stretch' : 'center'}
                    gap={12}
                >
                    <TypographyText className="text-[#101828] text-lg font-semibold leading-6">
                        Invoice List
                    </TypographyText>
                    <Flex
                        vertical={isMobile}
                        align="center"
                        gap={12}
                        wrap="wrap"
                        className="w-full md:w-auto"
                    >
                        <DatePicker.RangePicker
                            className="h-10 w-full md:w-auto rounded-lg border-[#E4E4E7]"
                            onChange={handleDateRange}
                            format="YYYY-MM-DD"
                            value={rangePickerValue}
                        />
                        <Input
                            prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                            placeholder="Search Invoice..."
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
                        dataSource={filteredInvoiceData}
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
                        total={invoiceList?.recordsTotal ?? 0}
                        showSizeChanger={false}
                    />
                </Flex>
            </Flex>

            <MakeRecurringModal
                open={!!recurringInvoice}
                onClose={() => setRecurringInvoice(null)}
                sourceInvoice={recurringInvoice}
            />

            <ConfirmationModal
                isOpen={!!deletingInvoice}
                handleCancel={() => setDeletingInvoice(null)}
                handleSubmit={() => {
                    if (deletingInvoice) deleteInvoice(deletingInvoice.id);
                    setDeletingInvoice(null);
                }}
                title={`Delete ${deletingInvoice?.invoiceNumber ?? 'this invoice'}?`}
                description="This action cannot be undone."
                isLoading={isDeleting}
            />
        </Content>
    );
};

export default Invoice;
