import { memo, useCallback, useMemo, useState } from 'react';

import { Col, Flex, Pagination, Skeleton, Typography } from 'antd';

import GenericTable from '@components/atomic/GenericTable';

import getPurchaseHistoryColumns from './SubscriptionHistoryColumns';
import { useDownloadInvoice } from '../../hooks/subscriptions/useDownloadInvoice';
import useFilter from '../../hooks/subscriptions/useFilter';
import usePurchaseHistory from '../../hooks/subscriptions/usePurchaseHIstory';

type Props = {};

const { Text } = Typography;

const OrdersTable = (props: Props) => {
    const initialValues = {
        page: 1,
        itemsPerPage: 3,
    };
    const [filters, setFilters] = useState(initialValues);
    const { handlePageChange } = useFilter({ setFilters });
    const { data, isLoading, count } = usePurchaseHistory(filters);
    const { getInvoiceData, getDocumentData, isLoading: downloadLoading } = useDownloadInvoice();
    const [loadingRows, setLoadingRows] = useState<{ [key: string]: boolean }>({});
    const handleDownloadInvoice = useCallback(
        async (recordId: number) => {
            const record = data.find(item => item.id === recordId);
            setLoadingRows(prev => ({ ...prev, [recordId]: true }));
            if (record) {
                setLoadingRows(prev => ({
                    ...prev,
                    [recordId]: true,
                    [record.tableName]: true,
                }));
                try {
                    await getInvoiceData(recordId, record);
                } finally {
                    setLoadingRows(prev => ({
                        ...prev,
                        [recordId]: false,
                        [record.tableName]: false,
                    }));
                }
            }
        },
        [data, getInvoiceData]
    );
    // Common download API (invoice/receipt by the order's corporateTxnId).
    const handleDownloadDocument = useCallback(
        async (record: { corporateTxnId?: string | number }, type: 'invoice' | 'receipt') => {
            if (!record?.corporateTxnId) return;
            const loadingKey = `${type}-${record.corporateTxnId}`;
            setLoadingRows(prev => ({ ...prev, [loadingKey]: true }));
            try {
                await getDocumentData(record.corporateTxnId, type);
            } finally {
                setLoadingRows(prev => ({ ...prev, [loadingKey]: false }));
            }
        },
        [getDocumentData]
    );
    const columns = getPurchaseHistoryColumns(
        handleDownloadInvoice,
        loadingRows,
        handleDownloadDocument
    )
    const sortedData = useMemo(() => {
        if (!data) return [];

        return [...data].sort((a, b) => {
            if (a.subscriptionPaymentRefId === b.subscriptionPaymentRefId) {
                if (
                    a.package.packageName === 'WhatsApp Add on' &&
                    (b.package.packageName === 'WhatsApp Basic' ||
                        b.package.packageName === 'WhatsApp Pro')
                ) {
                    return -1;
                }
                if (
                    b.package.packageName === 'WhatsApp Add on' &&
                    (a.package.packageName === 'WhatsApp Basic' ||
                        a.package.packageName === 'WhatsApp Pro')
                ) {
                    return 1;
                }
            }
            return 0;
        });
    }, [data]);

    return (
        <Col className="w-full">
            {isLoading ? (
                <Skeleton className="py-10" />
            ) : (
                <Flex className="w-full" vertical>
                    <Text className="py-5 text-lg">Subscription History & Invoices</Text>
                    <GenericTable
                        rowKey={record => record.id}
                        loading={isLoading || downloadLoading}
                        className="w-full"
                        columns={columns}
                        style={{ overflow: 'auto' }}
                        dataSource={sortedData}
                        pagination={false}
                    />
                    {data.length > 0 && (
                        <Pagination
                            current={filters.page}
                            pageSize={filters.itemsPerPage}
                            size="default"
                            className="text-end pt-7"
                            onChange={handlePageChange}
                            total={count}
                            showSizeChanger={false}
                        />
                    )}
                </Flex>
            )}
        </Col>
    );
};

export default memo(OrdersTable);
