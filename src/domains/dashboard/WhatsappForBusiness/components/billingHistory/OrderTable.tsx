import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Pagination, Typography, Input, Row } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import getPurchaseHistoryColumns from './SubscriptionHistoryColumns';
// import { useDownloadInvoice } from '../../hooks/subscriptions/useDownloadInvoice';
import { useDownloadInvoice } from '../../hooks/useDownloadInvoice';
import useFilter from '../../hooks/useFilter';
import usePurchaseHistory from '../../hooks/usePurchaseHistory';

const { Text } = Typography;

type OrdersTableProps = {
    refresh: boolean;
    setRefresh: (value: boolean) => void;
};

const OrdersTable: React.FC<OrdersTableProps> = ({ refresh, setRefresh }) => {
    const initialValues = {
        page: 1,
        itemsPerPage: 3,
    };
    const [filters, setFilters] = useState(initialValues);
    const { handlePageChange } = useFilter({ setFilters });
    const { data, isLoading, count, refetch } = usePurchaseHistory(filters);
    const { searchText, updateSearchText } = useDebounceSearch(setFilters);
    const { getInvoiceData, loadingKey } = useDownloadInvoice();
    useEffect(() => {
        refetch();
        setRefresh(false);
    }, [refresh, setRefresh, refetch]);

    const handleDownloadInvoice = useCallback(
        (transactionID: string, type: 'invoice' | 'receipt', rowId: string | number) => {
            getInvoiceData(transactionID, rowId, type);
        },
        [getInvoiceData]
    );

    const columns = getPurchaseHistoryColumns(handleDownloadInvoice, loadingKey);
    const sortedData = useMemo(() => {
        if (!data) return [];

        return [...data].sort((a, b) => {
            if (a.subscriptionPaymentRefId === b.subscriptionPaymentRefId) {
                const getPriority = (pkg: string) => {
                    if (pkg === 'WhatsApp Basic') return 0;
                    if (pkg === 'Add on') return 1;
                    return 2;
                };

                return getPriority(a.package.packageName) - getPriority(b.package.packageName);
            }
            return 0;
        });
    }, [data]);
    return (
        <Col className="w-full">
            <Flex className="w-full" vertical gap={3}>
                <Row justify="space-between" align="middle" gutter={[20, 20]}>
                    <Col xs={24} sm={12} md={6}>
                        <Text className="py-5 xl:text-xl lg:text-lg sm:text-lg text-lg font-medium">
                            Subscription History
                        </Text>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Search for orders"
                            suffix={<SearchOutlined />}
                            allowClear
                            type="text"
                            maxLength={100}
                            value={searchText}
                            onChange={updateSearchText}
                        />
                    </Col>
                </Row>

                <GenericTable
                    rowKey={record => record.id}
                    loading={isLoading}
                    className="w-full"
                    columns={columns}
                    dataSource={sortedData}
                    pagination={false}
                />
                <Pagination
                    current={filters.page}
                    pageSize={filters.itemsPerPage}
                    size="default"
                    className="text-end pt-7"
                    onChange={handlePageChange}
                    total={count}
                    showSizeChanger={false}
                    style={{ display: 'block' }}
                />
            </Flex>
        </Col>
    );
};

export default OrdersTable;
