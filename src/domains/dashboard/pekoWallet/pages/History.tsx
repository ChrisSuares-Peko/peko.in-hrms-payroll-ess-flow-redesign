import React, { useState } from 'react';

import { Badge, Flex, Pagination, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import creditIcon from '../assets/arrow.svg';
import debitIcon from '../assets/downarrow.svg';
import TransactionHeader from '../components/TransactionHeader';
import useFilter from '../hooks/useFilter';
import useOrderHistoryApi from '../hooks/useOrderHistoryApi';

const History = () => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    // Handling cases where last month has fewer days
    if (lastMonth.getDate() !== today.getDate()) {
        lastMonth.setDate(0);
    }
    const initialValues = {
        page: 1,
        itemsPerPage: 10,
        filter: '',
        // module: 'all',
        searchText: '',
        from: lastMonth.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
    };
    const [filters, setFilters] = useState(initialValues);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { isLoading, count, history, downloadReport } = useOrderHistoryApi(filters);

    const { handlePageChange, handleDateChange, handleFromChange, handleToChange } =
        useFilter({
            setFilters,
            initalStartDate: filters.from,
            initalEndDate: filters.to,
        });
    const statusStyles = {
        SUCCESS: {
            text: '#16a34a',
            background: '#d1fae5',
        },
        FAILURE: {
            text: '#d97b7b',
            background: '#ffc2c2',
        },
        REFUND: {
            text: '#92400e',
            background: '#fef9c3',
        },
    };
    function findColorByStatus(status: string) {
        let value = statusStyles.SUCCESS;
        if (status === 'SUCCESS') {
            value = statusStyles[status];
        } else if (status === 'REFUND') {
            value = statusStyles[status];
        } else {
            value = statusStyles.FAILURE;
        }
        return value;
    }

    const columns = [
        {
            title: 'Transaction Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (transactionDate: any) => (
                <Flex vertical>
                    <Typography.Text>
                        {formattedDateOnly(new Date(transactionDate))}
                    </Typography.Text>
                    <Typography.Text>at {formattedTime(new Date(transactionDate))}</Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'Transaction ID',
            dataIndex: 'corporateTxnId',
            key: 'corporateTxnId',
        },
        {
            title: 'Amount(₹)',
            dataIndex: 'creditAmount',
            key: 'creditAmount',
            render: (_: any, record: any) => {
                const debit = parseFloat(record.debitAmount || 0);
                const credit = parseFloat(record.creditAmount || 0);

                let isCredit = false;
                let amount = 0;

                if (debit !== 0) {
                    isCredit = debit < 0; // Negative debit means it's a credit
                    amount = Math.abs(debit);
                } else if (credit !== 0) {
                    isCredit = credit > 0; // Positive credit means it's a credit
                    amount = credit;
                }

                const colorClass = isCredit ? 'text-green-600' : 'text-red-600';
                const icon = isCredit ? creditIcon : debitIcon;

                return (
                    <Flex gap={3}>
                        <Typography.Text className={colorClass}>
                            ₹ {formatNumberWithLocalString(amount)}
                        </Typography.Text>
                        <ReactSVG
                            src={icon}
                            beforeInjection={svg => {
                                svg.setAttribute('style', 'width: 16px; height: 16px;');
                            }}
                            className="mt-1"
                        />
                    </Flex>
                );
            },
        },
        {
            title: 'Payment Mode',
            dataIndex: 'mode',
            key: 'mode',
            render: (_: string, record: any) => {
                const isCredit = record.creditAmount && parseFloat(record.creditAmount) > 0;
                const text = isCredit ? 'Payment gateway' : 'Wallet';
                return (
                    <Flex>
                        <Typography.Text>{text}</Typography.Text>
                    </Flex>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: any, record: any) => {
                if (record.remarks === 'REFUND') {
                    status = 'REFUND';
                }
                return (
                    <Flex>
                        <Badge
                            status={status === 'SUCCESS' ? 'success' : 'error'}
                            text={
                                status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Failed'
                            }
                            className="px-2 rounded-2xl"
                            style={{
                                color: findColorByStatus(status).text,
                                backgroundColor: findColorByStatus(status).background,
                                padding: '2px 7px',
                                border: '1px ',
                                borderRadius: '15px',
                            }}
                        />
                    </Flex>
                );
            },
        },
    ];
    return (
        <Flex vertical gap={4}>
            <TransactionHeader
                downloadReport={downloadReport}
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            <GenericTable
                rowKey={record => record.id}
                className="w-full mt-2 md:mt-0"
                bordered={false}
                columns={columns}
                dataSource={history}
                pagination={false}
                scroll={{ x: 992 }}
                loading={isLoading}
            />
            <Pagination
                current={filters.page}
                onChange={handlePageChange}
                size="default"
                className="text-end pt-7"
                style={{ display: 'block' }}
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default History;
