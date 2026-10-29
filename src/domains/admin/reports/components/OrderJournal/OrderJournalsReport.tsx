import { useEffect, useMemo, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Pagination, Tag, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';

import GenericTable from '@components/atomic/GenericTable';
import ExportButtons from '@src/domains/admin/accounting/components/common/ExportButtons';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Header from './Header';
import { renderJournalStatusSummary } from './journalStatus';
import { countOrderDocuments } from './orderDocuments';
import OrderDocumentsModal from './OrderDocumentsModal';
import OrderJournalDrawer from './OrderJournalDrawer';
import useFilter from '../../hooks/useFilter';
import useOrderJournalData from '../../hooks/useOrderJournalData';
import useOrderJournalsExport from '../../hooks/useOrderJournalsExport';

const OrderJournalsReport = () => {
    const [searchParams] = useSearchParams();
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');
    // A dashboard KPI card can deep-link here with the exact range, journal type and status
    // it was computed from (e.g. Refund Entries -> journalKey=refund); otherwise fall back to
    // the page's own default window and the transaction key.
    const initialValues = {
        searchText: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        journalKey: searchParams.get('journalKey') || '',
        sort: 'DESC',
        sortField: 'transactionDate',
        page: 1,
        itemsPerPage: 10,
        from: searchParams.get('from') || oneMonthAgoFormatted,
        to: searchParams.get('to') || todayFormatted,
        partnerId: '',
    };

    const [filters, setFilters] = useState(initialValues);
    const [drawerRecord, setDrawerRecord] = useState<any | null>(null);
    const [documentsRecord, setDocumentsRecord] = useState<any | null>(null);
    const requestedTxnId = searchParams.get('open');
    const [openedTxnId, setOpenedTxnId] = useState<string | null>(null);

    const { user } = useAppSelector(state => state.reducer.user);
    const lockedPartnerId = user?.partnerId ? String(user.partnerId) : undefined;
    const { partnerData } = usePartnersForCorporate('');
    const partnerOptions = useMemo(
        () =>
            (partnerData || []).map(option => ({
                value: String(option.value),
                label: option.label,
            })),
        [partnerData]
    );

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleCategoryFilters,
        handlePartnerChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { searchText, setSearchText, updateSearchText } = useDebounceSearch(
        setFilters,
        initialValues.searchText
    );
    const { isLoading, tableData, count, resolveAccounts, refresh } = useOrderJournalData(filters);

    useEffect(() => {
        if (!requestedTxnId || openedTxnId === requestedTxnId || !tableData?.length) return;
        const match = tableData.find(row => row.corporateTxnId === requestedTxnId);
        if (!match) return;
        setDrawerRecord(match.order);
        setOpenedTxnId(requestedTxnId);
    }, [requestedTxnId, openedTxnId, tableData]);

    const exportFilters = useMemo(
        () => ({
            searchText: filters.searchText,
            from: filters.from,
            to: filters.to,
            sort: filters.sort,
            sortField: filters.sortField,
            status: filters.status,
            journalKey: filters.journalKey,
            partnerId: filters.partnerId,
        }),
        [
            filters.searchText,
            filters.from,
            filters.to,
            filters.sort,
            filters.sortField,
            filters.status,
            filters.journalKey,
            filters.partnerId,
        ]
    );
    const { exportingFormat, exportAs } = useOrderJournalsExport(exportFilters);

    const handleRetried = async () => {
        const freshRows = await refresh();
        if (drawerRecord) {
            const updated = freshRows.find(
                row => row.corporateTxnId === drawerRecord.corporateTxnId
            );
            setDrawerRecord(updated ? updated.order : null);
        }
    };

    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            sorter: true,
            render: (date: string) => (
                <Flex vertical>
                    <Typography.Text>{formattedDateOnly(new Date(date))}</Typography.Text>
                    <Typography.Text>{formattedTime(new Date(date))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            render: (_: any, data: any) => (
                <Typography.Text copyable>{data.corporateTxnId}</Typography.Text>
            ),
        },
        {
            title: 'Customer',
            dataIndex: 'credential',
            key: 'credential',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.credential?.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Service',
            dataIndex: 'serviceOperator',
            key: 'serviceOperator',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.serviceOperator?.serviceProvider || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'order',
            key: 'amount',
            render: (_: any, data: any) => (
                <Typography.Text>
                    ₹ {formatNumberWithLocalString(data?.order?.amountInINR || 0)}
                </Typography.Text>
            ),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'order',
            key: 'paymentMode',
            render: (_: any, data: any) => (
                <Typography.Text>{data?.order?.paymentMode || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'order',
            key: 'status',
            render: (_: any, data: any) => {
                const statusColors: Record<string, string> = {
                    SUCCESS: 'green',
                    FAILURE: 'red',
                    REFUNDED: 'default',
                    PENDING: 'gold',
                };
                const status = data?.order?.status;
                return <Tag color={statusColors[status] || 'default'}>{status || '-'}</Tag>;
            },
        },
        {
            title: 'Journal Status',
            dataIndex: 'order',
            key: 'journalStatus',
            render: (_: any, data: any) =>
                renderJournalStatusSummary(
                    data?.order?.journalRecordStatus,
                    data?.order?.journalData
                ),
        },
        {
            title: 'Documents',
            dataIndex: 'documents',
            key: 'documents',
            render: (_: any, data: any) => {
                const documentCount = countOrderDocuments(data?.documents);
                return (
                    <Flex align="center" gap={10}>
                        <Typography.Text>{documentCount}</Typography.Text>
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            disabled={documentCount === 0}
                            onClick={() => setDocumentsRecord(data)}
                            aria-label={`View documents for ${data?.corporateTxnId}`}
                        />
                    </Flex>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, data: any) => (
                <Button size="small" onClick={() => setDrawerRecord(data?.order)}>
                    View
                </Button>
            ),
        },
    ];

    const handleTableChange: TableProps<any>['onChange'] = (pagination, filter, sorter) => {
        let sort: string = 'DESC';
        let field;

        if (Array.isArray(sorter)) {
            if (sorter.length > 0) {
                ({ field } = sorter[0]);
                sort = sorter[0].order === 'ascend' ? 'ASC' : 'DESC';
            }
        } else {
            ({ field } = sorter);
            sort = sorter.order === 'ascend' ? 'ASC' : 'DESC';
        }

        if (field) {
            setFilters(prev => ({ ...prev, sortField: field.toString(), sort, page: 1 }));
        }
    };

    return (
        <Flex vertical gap={20}>
            <Header
                actions={
                    <ExportButtons
                        onExport={exportAs}
                        loadingFormat={exportingFormat}
                        disabled={isLoading || count === 0}
                    />
                }
                handleSearch={updateSearchText}
                setSearchText={setSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                handleCategoryFilters={handleCategoryFilters}
                handlePartnerChange={handlePartnerChange}
                partnerOptions={partnerOptions}
                partnerId={lockedPartnerId ?? filters.partnerId}
                partnerLocked={Boolean(lockedPartnerId)}
                from={filters.from}
                to={filters.to}
                status={filters.status}
            />
            <GenericTable
                rowKey={(record: any) => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            <OrderJournalDrawer
                open={!!drawerRecord}
                onClose={() => setDrawerRecord(null)}
                record={drawerRecord}
                resolveAccounts={resolveAccounts}
                onRetried={handleRetried}
            />
            {documentsRecord && (
                <OrderDocumentsModal
                    open
                    onClose={() => setDocumentsRecord(null)}
                    orderId={documentsRecord?.order?.id}
                    corporateTxnId={documentsRecord?.corporateTxnId}
                    documents={documentsRecord?.documents}
                />
            )}
        </Flex>
    );
};

export default OrderJournalsReport;
