import React, { useEffect, useState } from 'react';

import { Button, Flex, Pagination, Typography, Tooltip } from 'antd';
import dayjs from 'dayjs';

import GenericTable from '@components/atomic/GenericTable';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateTime } from '@utils/dateFormat';
import { useFindRolesService } from '@utils/findRolesService';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AdminHandleRefundModal from './AdminHandleRefundModal';
import RefundTransactionModal from './RefundTransactionModal';
import RefundTransactionsHeader from './RefundTransactionsHeader';
import useFilter from '../hooks/useFilter';
import useGetCorporate from '../hooks/useGetCorporate';
import useRefundTransaction from '../hooks/useRefundTransaction';
import { Transaction, RolePermissionAccessData } from '../types/refundTransactions';

const RefundTransactions = () => {
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const initialFilters = {
        searchText: '',
        category: '',
        corporateId: '',
        from: todayFormatted,
        to: todayFormatted,
        page: 1,
        itemsPerPage: 10,
    };
    const [filters, setFilters] = useState(initialFilters);
    const [search, setSearch] = useState<string>('');
    const [loadingRow] = useState<Record<string, boolean>>({});
    const { tableData, isLoading, count, refundTransaction } = useRefundTransaction(filters);
    const { corporateList } = useGetCorporate(search);
    const [accessPermission, setAccessPermission] = useState<RolePermissionAccessData>();
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const service = useFindRolesService(services?.data, 'Refund Transactions'); // Get the service
    const [open, setOpen] = useState<boolean>(false);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [modalData, setModalData] = useState<any>(null);

    useEffect(() => {
        if (service) {
            setAccessPermission(service); // Update state if service is found
        }
    }, [service]);
    const {
        handleDateChange,
        handleSearch,
        handlePageChange,
        handleTableChange,
        handleChangeCorporate,
    } = useFilter({
        initalEndDate: initialFilters.to,
        initalStartDate: initialFilters.from,
        setFilters,
    });
    const handleRefund = async (record: any): Promise<boolean> => {
        const res = await refundTransaction(record);
        return !!res;
    };

    const columns = [
        {
            title: 'Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            width: 160,
            render: (data: any) => (
                <Typography.Text>{formattedDateTime(new Date(data))}</Typography.Text>
            ),
        },
        {
            title: 'Corporate Name',
            dataIndex: 'credential',
            key: 'credential',
            width: 130,
            render: (credential: any) => (
                <Typography.Text>{credential?.name || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Corporate ID',
            dataIndex: 'credential',
            key: 'credential',
            width: 120,
            render: (credential: any) => (
                <Typography.Text>{credential?.username || '-'}</Typography.Text>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
            width: 160,
            render: (corporateTxnId: string, record: Transaction) => (
                <Flex vertical gap={5}>
                    <Typography.Text>{corporateTxnId}</Typography.Text>
                    <Typography.Text>
                        {record.serviceOperator.serviceProvider || ''}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Refunded Amount',
            dataIndex: 'refundedAmount',
            key: 'refundedAmount',
            width: 140,
            render: (refundedAmount: string) => (
                <Typography.Text>
                    {refundedAmount ? `₹ ${formatNumberWithLocalString(Number(refundedAmount))}` : '₹ 0.00'}
                </Typography.Text>
            ),
        },
        {
            title: 'Amount',
            dataIndex: 'order',
            key: 'order',
            width: 140,
            render: (amount: any, record: Transaction) => (
                <Flex vertical gap={5}>
                    <Typography.Text>
                        ₹ {formatNumberWithLocalString(Number(amount.amountInINR || 0))}
                    </Typography.Text>
                    <Typography.Text>{record.order.paymentMode || ''}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Payment Status',
            dataIndex: 'remarks',
            key: 'remarks',
            width: 140,
            render: (data: any, record: Transaction) =>
                data === 'PENDING' || data === 'Payment Failed' ? (
                    <Flex vertical gap={5}>
                        <Typography.Text className="text-textRed">{data}</Typography.Text>

                    </Flex>
                ) : (
                    <Typography.Text className="text-textGreen">{data}</Typography.Text>
                ),
        },
        {
            title: 'Refund Status',
            dataIndex: 'order',
            key: 'status',
            width: 120,
            render: (_: any, record: Transaction) => {
                let refundStatus = '';
                try {
                    const paymentResponse = record.order?.paymentModeResponse
                        ? JSON.parse(record.order.paymentModeResponse)
                        : {};
                    refundStatus = paymentResponse?.refundStatus || '';
                } catch {
                    refundStatus = '';
                }
                if (!refundStatus && record.order?.status === 'REFUNDED') {
                    refundStatus = 'REFUNDED';
                }
                if (!refundStatus) {
                    return <Typography.Text>-</Typography.Text>;
                }
                const normalized = String(refundStatus).toUpperCase();
                let statusClass = '';
                if (normalized === 'SUCCESS' || normalized === 'REFUNDED') {
                    statusClass = 'text-textGreen';
                } else if (normalized.includes('FAIL')) {
                    statusClass = 'text-textRed';
                }
                return <Typography.Text className={statusClass}>{refundStatus}</Typography.Text>;
            },
        },
        {
            title: 'Action',
            dataIndex: 'id',
            key: 'id',
            width: 90,
            render: (_: any, data: any) => {
                const paymentResponse = data?.order?.paymentModeResponse
                    ? JSON.parse(data?.order?.paymentModeResponse)
                    : {};

                const isDisabled =
                    data?.remarks === 'REFUNDED' ||
                    data?.remarks === 'PENDING' ||
                    paymentResponse.refundStatus === 'PENDING';
                // const { transactionDate, status } = data;
                // const { status: s2, message } = calculateTimeRemainingForPGRefund({
                //     transactionDate: data.transactionDate,
                //     status: data.status,
                //     paymentMode: data.order.paymentMode,
                // });
                return (
                    <>
                        {/* {s2 ? ( */}
                            <Tooltip
                                placement="rightTop"
                                title={
                                    !accessPermission?.update
                                        ? 'Sorry, you do not have permission to perform this action'
                                        : ''
                                }
                            >
                                <Button
                                    type="default"
                                    size="small"
                                    // disabled={isDisabled}
                                    disabled={isDisabled || !accessPermission?.update}
                                    onClick={() => {
                                        if (data?.order?.paymentMode === 'CRYPTO WALLET') {
                                            setOpen(true);
                                            setModalData(data);
                                        } else {
                                            setOpenModal(true);
                                            setModalData(data);
                                        }
                                    }}
                                    danger
                                    loading={loadingRow[data.id] || false}
                                >
                                    Refund
                                </Button>
                            </Tooltip>
                        {/* ) : (
                            <Typography.Text>{message}</Typography.Text>
                        )} */}
                    </>
                );
            },
        },
    ];
    return (
        <>
            <RefundTransactionsHeader
                searchCorporate={search}
                setSearchCorporate={setSearch}
                categoryDatas={corporateList}
                from={filters.from}
                to={filters.to}
                searchText={filters.searchText}
                handleCategoryFilters={handleChangeCorporate}
                handleDateChange={handleDateChange}
                handleSearch={handleSearch}
            />

            <GenericTable
                rowKey={record => record.id}
                columns={columns}
                dataSource={tableData}
                pagination={false}
                loading={isLoading}
                onChange={handleTableChange}
            />
            {open && (
                <AdminHandleRefundModal
                    open={open}
                    isHandleRefund={refundTransaction}
                    handleCancel={() => setOpen(false)}
                    data={modalData}
                />
            )}
            <Pagination
                current={filters.page}
                size="default"
                className="text-end pt-7"
                onChange={handlePageChange}
                total={count}
                showSizeChanger={false}
            />
            <RefundTransactionModal
                open={openModal}
                data={modalData}
                handleCancel={() => setOpenModal(false)}
                handleRefund={handleRefund}
            />
        </>
    );
};

export default RefundTransactions;
