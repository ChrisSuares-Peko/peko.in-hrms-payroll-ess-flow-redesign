import React, { useCallback, useMemo, useState } from 'react';

import type { TableColumnsType, TableProps } from 'antd';
import { Pagination, Flex, Typography, Button, Radio, Spin, theme } from 'antd';
import { FilterValue } from 'antd/es/table/interface';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useSubscriptionDownloadInvoice } from '../hooks/useSubscriptionDownloadInvoice';
import { subscriptionTransactionRow } from '../types/index';

const { Text } = Typography;

type Props = {
    data: subscriptionTransactionRow[];
    isloading: boolean;
    page: number;
    handlePageChange: (page: number, pageSize: number) => void;
    count: number | undefined;
    isCashbackTable: boolean;
    handleSort: (sort: string) => void;
    handleFilter: (sort: FilterValue | null) => void;
    handleTableChange: TableProps<subscriptionTransactionRow>['onChange'];
    handleFilterChange: (value: any) => void;
    filter: string;
};

const SubscriptionWebTable = ({
    data,
    isloading,
    page,
    count,
    handlePageChange,
    isCashbackTable,
    handleSort,
    handleFilter,
    handleTableChange,
    handleFilterChange,
    filter,
}: Props) => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const { getInvoiceData, loadingTxnId, loadingType } = useSubscriptionDownloadInvoice();
    // const handleTableChange: TableProps<transactionType>['onChange'] = (
    //     pagination,
    //     filters,
    //     sorter,
    //     extra
    // ) => {
    //     if (sorter) {
    //         Object.values(sorter).forEach(sortItem => {
    //             if (sortItem && sortItem === 'ascend') {
    //                 handleSort('ASC');
    //             } else if (sortItem && sortItem === 'descend') {
    //                 handleSort('DESC');
    //             }
    //         });
    //     }
    //     if (filters.status) handleFilter(filters.status);
    //     else handleFilter(filters.status);
    // };

    const [filteredValue, setFilteredValue] = useState<string | null>('');

    const statusArray = useMemo(
        () => [
            { text: 'Success', value: 'SUCCESS' },
            { text: 'Failure', value: 'FAILED' },
            { text: 'In Progress', value: 'PENDING' },
            { text: 'Refunded', value: 'REFUNDED' },
        ],
        []
    );
    const handleDownloadInvoiceOrReceipt = useCallback(
        (txnId: number, type: 'invoice' | 'receipt') => {
            getInvoiceData(txnId, type);
        },
        [getInvoiceData]
    );
    const columns: TableColumnsType<subscriptionTransactionRow> = useMemo(
        () => [
            {
                title: 'Date',
                sorter: true,
                dataIndex: 'date',
                render: (date: string) => <Text>{formattedDateTime(new Date(date))}</Text>,
            },
            {
                title: 'Order ID',
                sorter: true,
                dataIndex: 'transactionID',
            },
            {
                title: 'Subscription',
                dataIndex: 'serviceName',
                render: (serviceName: string) => <Text>{serviceName || 'Not available'}</Text>,
            },
            {
                title: 'Billing Type',
                dataIndex: 'billingType',
                render: (billingType: string) => <Text>{billingType || 'Not available'}</Text>,
            },
            {
                title: 'Amount',
                dataIndex: 'amount',
                sorter: true,
                render: (amount: string) => `₹ ${formatNumberWithLocalString(Number(amount))}`,
            },
            {
                title: 'Payment Mode',
                sorter: true,
                dataIndex: 'paymentMode',
            },
            {
                title: 'Status',
                dataIndex: 'status',
                render: (text: string) => (
                    <span className={`${text === 'Success' ? 'text-textGreen' : 'text-bgOrange2'}`}>
                        {text === 'Pending' ? 'In Progress' : text}
                    </span>
                ),
                filters: statusArray,
                filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
                    <div>
                        <Flex style={{ padding: 8 }} vertical>
                            {statusArray.map(status => (
                                <Flex>
                                    <Button
                                        className="w-full border-none flex justify-start"
                                        onClick={() => {
                                            setSelectedKeys([status.value]);
                                            setFilteredValue(status.value);
                                        }}
                                    >
                                        <Radio checked={status.value === filteredValue}>
                                            {status.text}
                                        </Radio>
                                    </Button>
                                </Flex>
                            ))}
                        </Flex>
                        <Flex className="justify-around items-center pb-1">
                            <Button
                                type="text"
                                onClick={() => {
                                    setFilteredValue('');
                                    setSelectedKeys([]);
                                }}
                                disabled={!filteredValue}
                                className="text-sky-500"
                            >
                                Reset
                            </Button>
                            <Button
                                className="h-7"
                                style={{
                                    backgroundColor: colorPrimary,
                                    color: 'white',
                                    padding: '0px 10px',
                                }}
                                onClick={() => {
                                    confirm();
                                }}
                            >
                                OK
                            </Button>
                        </Flex>
                    </div>
                ),
                onFilter: (value, record) => {
                    const normalized = record.status.toUpperCase() === 'FAILURE' ? 'FAILED' : record.status.toUpperCase();
                    const isMatch = normalized === String(value);

                    if (isMatch && filter !== value) {
                        handleFilterChange(value);
                    }

                    return isMatch;
                },
                filterMultiple: false,
                filterResetToDefaultFilteredValue: true,
                width: 120,
            },
            {
                title: 'Details',
                dataIndex: 'download',
                render: (_text: string, record: subscriptionTransactionRow) =>
                    record.status === 'Success' && (
                        <Flex gap={8} vertical align="start">
                            {record.isInvoice &&
                                (loadingTxnId === record.transactionID &&
                                loadingType === 'invoice' ? (
                                    <Spin size="small" />
                                ) : (
                                    <span
                                        tabIndex={0}
                                        role="button"
                                        onClick={() =>
                                            handleDownloadInvoiceOrReceipt(
                                                record.transactionID,
                                                'invoice'
                                            )
                                        }
                                        onKeyDown={(
                                            event: React.KeyboardEvent<HTMLSpanElement>
                                        ) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                handleDownloadInvoiceOrReceipt(
                                                    record.transactionID,
                                                    'invoice'
                                                );
                                            }
                                        }}
                                        className="text-bgOrange2 cursor-pointer"
                                        aria-label={`Download invoice for transaction ID ${record.transactionID}`}
                                    >
                                        Download Invoice
                                    </span>
                                ))}
                            {loadingTxnId === record.transactionID &&
                            loadingType === 'receipt' ? (
                                <Spin size="small" />
                            ) : (
                                <span
                                    tabIndex={0}
                                    role="button"
                                    onClick={() =>
                                        handleDownloadInvoiceOrReceipt(
                                            record.transactionID,
                                            'receipt'
                                        )
                                    }
                                    onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            handleDownloadInvoiceOrReceipt(
                                                record.transactionID,
                                                'receipt'
                                            );
                                        }
                                    }}
                                    className="text-bgOrange2 cursor-pointer"
                                    aria-label={`Download receipt for transaction ID ${record.transactionID}`}
                                >
                                    Download Receipt
                                </span>
                            )}
                        </Flex>
                    ),
            },
        ],
        [
            statusArray,
            colorPrimary,
            filter,
            filteredValue,
            handleDownloadInvoiceOrReceipt,
            handleFilterChange,
            loadingTxnId,
            loadingType,
        ]
    );
    return (
        <>
            <GenericTable
                rowKey={record => record.transactionID}
                className="w-full"
                bordered={false}
                columns={columns}
                dataSource={data}
                loading={isloading}
                pagination={false}
                onChange={handleTableChange}
            />
            <Pagination
                current={page}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7"
                style={{ display: 'block' }}
                total={count}
                showSizeChanger={false}
            />
        </>
    );
};
export default React.memo(SubscriptionWebTable);
