import { useEffect, useState } from 'react';

import { EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Pagination, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { useFindRolesService } from '@utils/findRolesService';

import Header from './Header';
import OrderDetailsModal from './OrderDetailsModal';
import RefundModal from './RefundModal';
import useDomainHostingRefunds from '../../hooks/useDomainHostingRefunds';
import useFilter from '../../hooks/useFilter';
import { DomainHostingRefund } from '../../types/domainHostingRefunds';
import { RolePermissionAccessData } from '../../types/reportsScheduling';

const STATUS_COLORS: Record<string, string> = {
    CANCELLATION_REQUESTED: 'orange',
    REFUNDED: 'green',
    CANCELLED: 'red',
};

const DomainHostingRefunds = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const oneMonthAgoFormatted = today.subtract(1, 'month').format('YYYY-MM-DD');

    const [openViewModal, setOpenViewModal] = useState(false);
    const [openRefundModal, setOpenRefundModal] = useState(false);
    const [selectedTxnId, setSelectedTxnId] = useState<string | undefined>();
    const [selectedRecord, setSelectedRecord] = useState<DomainHostingRefund | undefined>();
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();

    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Domain & Hosting Refunds');
    useEffect(() => {
        if (service) setAccessPermission(service);
    }, [service]);

    const initialValues = {
        searchText: '',
        sort: 'DESC',
        sortField: 'transactionDate',
        page: 1,
        itemsPerPage: 10,
        from: oneMonthAgoFormatted,
        to: todayFormatted,
    };

    const [filters, setFilters] = useState(initialValues);

    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
        handleTableChange,
    } = useFilter({
        setFilters,
        initalStartDate: initialValues.from,
        initalEndDate: initialValues.to,
    });

    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, modalLoading, tableData, count, downloadReport, getAllTableData, refundOrder } =
        useDomainHostingRefunds(filters);

    const columns: ColumnsType<DomainHostingRefund> = [
        {
            title: 'Transaction ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
        },
        {
            title: 'Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (val: string) => (val ? dayjs(val).format('DD MMM YYYY, hh:mm A') : '-'),
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_: any, record: DomainHostingRefund) =>
                record.credential?.name || record.credential?.username || '-',
        },
        {
            title: 'Username',
            key: 'username',
            render: (_: any, record: DomainHostingRefund) => record.credential?.username || '-',
        },
        {
            title: 'Amount (₹)',
            dataIndex: 'amountInINR',
            key: 'amountInINR',
            render: (val: string) => (val ? `₹ ${parseFloat(val).toFixed(2)}` : '-'),
        },
        {
            title: 'Payment Mode',
            dataIndex: 'paymentMode',
            key: 'paymentMode',
        },
        {
            title: 'Remarks',
            dataIndex: 'message',
            key: 'message',
            render: (val: string) => val || '-',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (val: string) => (
                <Tag color={STATUS_COLORS[val] || 'default'}>{val}</Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: DomainHostingRefund) => {
                const isProcessed = ['REFUNDED', 'CANCELLED'].includes(record.status);
                return (
                    <Flex gap={8}>
                        <Tooltip title="View Details">
                            <Button
                                type="default"
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    setSelectedTxnId(record.corporateTxnId);
                                    setOpenViewModal(true);
                                }}
                            />
                        </Tooltip>
                        <Tooltip
                            title={
                                // eslint-disable-next-line no-nested-ternary
                                !accessPermission?.update
                                    ? 'You do not have permission to perform this action'
                                    : isProcessed
                                      ? 'Order already processed'
                                      : ''
                            }
                        >
                            <span>
                                <Button
                                    type="default"
                                    size="small"
                                    danger
                                    disabled={isProcessed || !accessPermission?.update}
                                    onClick={() => {
                                        setSelectedRecord(record);
                                        setOpenRefundModal(true);
                                    }}
                                >
                                    Refund
                                </Button>
                            </span>
                        </Tooltip>
                    </Flex>
                );
            },
        },
    ];

    return (
        <Flex vertical gap={20}>
            <Header
                handleDownloadReport={downloadReport}
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
                from={filters.from!}
                to={filters.to!}
            />
            <GenericTable
                handleSort={handleTableChange}
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
                className="text-end pt-7 justify-end"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />

            {openViewModal && selectedTxnId && (
                <OrderDetailsModal
                    open={openViewModal}
                    corporateTxnId={selectedTxnId}
                    handleCancel={() => {
                        setOpenViewModal(false);
                        setSelectedTxnId(undefined);
                    }}
                />
            )}

            {openRefundModal && selectedRecord && (
                <RefundModal
                    open={openRefundModal}
                    data={selectedRecord}
                    loading={modalLoading}
                    handleCancel={() => {
                        setOpenRefundModal(false);
                        setSelectedRecord(undefined);
                    }}
                    handleRefresh={getAllTableData}
                    refundOrder={refundOrder}
                />
            )}
        </Flex>
    );
};

export default DomainHostingRefunds;
