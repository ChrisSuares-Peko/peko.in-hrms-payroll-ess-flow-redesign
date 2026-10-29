import React, { useState } from 'react';

import type { TableColumnsType, TableProps } from 'antd';
import { Pagination, Flex, Typography, Button, Radio, Spin, theme } from 'antd';
import { FilterValue } from 'antd/es/table/interface';

import GenericTable from '@components/atomic/GenericTable';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { useDownloadInvoice } from '../hooks/useDownloadInvoice';
import { transactionType } from '../types/index';

type Props = {
    data: transactionType[];
    isloading: boolean;
    page: number;
    handlePageChange: (page: number, pageSize: number) => void;
    count: number | undefined;
    isCashbackTable: boolean;
    handleSort: (sort: string) => void;
    handleFilter: (sort: FilterValue | null) => void;
    handleTableChange: TableProps<transactionType>['onChange'];
    handleFilterChange: (value: any) => void;
    filter: string;
};

const WebTable = ({
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
    const { getInvoiceData, loadingTxnId, loadingType } = useDownloadInvoice();
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

    const statusArray = [
        { text: 'Success', value: 'SUCCESS' },
        { text: 'Failure', value: 'FAILED' },
        { text: 'In Progress', value: 'PENDING' },
        { text: 'Refunded', value: 'REFUNDED' },
    ];
    const handleDownloadInvoiceOrReceipt = (txnId: number, type: 'invoice' | 'receipt') => {
        getInvoiceData(txnId, type);
    };
    const columns: TableColumnsType<transactionType> = [
        {
            title: 'Date',
            sorter: true,
            dataIndex: 'date',
            render: (date: string) => (
                <Typography.Text>{formattedDateTime(new Date(date))}</Typography.Text>
            ),
            width: 150,
        },
        {
            title: 'Order ID',
            sorter: true,
            dataIndex: 'transactionID',
            width: 180,
        },
        {
            title: 'User',
            dataIndex: 'subCorporateName',
            render: (subCorporateName: string) => (
                <Typography.Text>{subCorporateName || 'Not available'}</Typography.Text>
            ),
            align: 'center',
            width: 180,
        },
        {
            title: 'Category',
            sorter: true,
            dataIndex: 'category',
            width: 200,
        },
        {
            title: 'Operator',
            sorter: true,
            dataIndex: 'operator',
            render: (operator: string, record) => (
                <Flex vertical justify="center">
                    <Typography.Text>
                        {record.category === 'Gift Cards/Vouchers' ? 'Gift Cards' : operator}
                    </Typography.Text>
                    {record.accountNumber && (
                        <Typography.Text className="text-sm font-normal">
                            {record.accountNumber}
                        </Typography.Text>
                    )}
                </Flex>
            ),
            width: 200,
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            sorter: true,
            render: (amount: string) => `₹ ${formatNumberWithLocalString(Number(amount))}`,
            width: 150,
        },
        {
            title: `${isCashbackTable ? 'Cashback Received' : 'Payment Mode'}`,
            dataIndex: `${isCashbackTable ? 'cashback' : 'paymentMode'}`,
            sorter: true,
            render: (wrd: string) => {
                if (isCashbackTable) {
                    const cashbackAmount = Number(wrd);
                    // Hide the row if cashback is 0
                    return cashbackAmount >= 1
                        ? `₹ ${formatNumberWithLocalString(cashbackAmount)}`
                        : `₹ ${cashbackAmount}`;
                }
                return wrd;
            },
            width: 180,
        },

        !isCashbackTable
            ? {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (text: string) => {
                      const statusMap: Record<string, string> = {
                          Pending: 'In Progress',
                          Processing: 'In Progress',
                          Failure: 'Failed',
                          Success: 'Success',
                      };

                      let colorClass = 'text-bgOrange2'; // red — used for Failure and unknown states
                      if (text === 'Success') {
                          colorClass = 'text-textGreen';
                      } else if (text === 'Pending' || text === 'Processing') {
                          colorClass = 'text-textYellow';
                      }
                      const displayText = statusMap[text] || text;

                      return <span className={colorClass}>{displayText}</span>;
                  },
                  filters: statusArray,
                  filterDropdown: ({ setSelectedKeys, confirm }) => (
                      <div>
                          <Flex style={{ padding: 8 }} vertical>
                              {statusArray.map(status => (
                                  <Flex key={status.value}>
                                      <Button
                                          className="flex justify-start w-full border-none"
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
                          <Flex className="items-center justify-around pb-1">
                              <Button
                                  type="text"
                                  onClick={() => {
                                      setFilteredValue('');
                                      setSelectedKeys([]);
                                      // Server-side filter is the source of truth — push the cleared
                                      // value upstream so the parent refetches without a filter.
                                      handleFilterChange('');
                                      confirm();
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
                                      // Push the selected filter value to the parent directly so the
                                      // API is re-fetched with `filter=<value>` regardless of whether
                                      // AntD's internal onChange fires (it may not when filteredValue
                                      // is controlled to null below).
                                      if (filteredValue) handleFilterChange(filteredValue);
                                      confirm();
                                  }}
                              >
                                  OK
                              </Button>
                          </Flex>
                      </div>
                  ),
                  // Disable AntD's built-in client-side filtering entirely. The parent owns the
                  // filter (sent as the `filter` query-param to the orders API) and the server
                  // returns only matching rows — including logical equivalents like PROCESSING
                  // under "In Progress" and FAILURE under "Failed". A `filteredValue` of null tells
                  // AntD "do not filter rows here", so all server-returned rows render as-is.
                  filteredValue: null,
                  onFilter: () => true,
                  filterMultiple: false,
                  filterResetToDefaultFilteredValue: true,
                  width: 120,
              }
            : {
                  title: 'Payment Mode',
                  sorter: true,
                  dataIndex: 'paymentMode',
                  width: 150,
              },
        {
            title: 'Details',
            dataIndex: 'download',
            render: (_text: string, record: transactionType) =>
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
                                    onKeyDown={(event: React.KeyboardEvent<HTMLSpanElement>) => {
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
                        {loadingTxnId === record.transactionID && loadingType === 'receipt' ? (
                            <Spin size="small" />
                        ) : (
                            <span
                                tabIndex={0}
                                role="button"
                                onClick={() =>
                                    handleDownloadInvoiceOrReceipt(record.transactionID, 'receipt')
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
            width: 150,
        },
    ];
    return (
        <>
            <GenericTable
                rowKey={record => record.transactionID}
                className="w-full "
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
export default WebTable;
