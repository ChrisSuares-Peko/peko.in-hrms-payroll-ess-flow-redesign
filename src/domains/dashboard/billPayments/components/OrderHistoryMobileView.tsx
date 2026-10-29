import React, { useState } from 'react';

import { Card, Col, Empty, Flex, Pagination, Row, Skeleton, Typography } from 'antd';

import useDebounceSearch from '@src/hooks/useDebounceSearch';

import HistoryHeader from './History/HistoryHeader';
import OrderHistorycardMobile from './History/OrderHistorycardMobile';
import useFilter from '../hooks/useFilter';
import useOrderHistoryApi from '../hooks/useGetHistory';

const { Text } = Typography;

const OrderHistory = () => {
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
    const { isLoading, count, history } = useOrderHistoryApi(filters);
    const {
        handlePageChange,
        handleDateChange,
        handleFromChange,
        handleToChange,
    } = useFilter({
        setFilters,
        initalStartDate: filters.from,
        initalEndDate: filters.to,
    });

    const renderSkeleton = () => <Skeleton active paragraph={{ rows: 3 }} />;

    let tableContent;
    if (isLoading) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="mt-4 h-40 bg-slate-50 border-none p-2" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    {renderSkeleton()}
                </Flex>
            </Card>
        ));
    } else if (history.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = history.map(
            (
                item: {
                    Operator: string;
                    status: string;
                    corporateTxnId: string;
                    createdAt: string;
                    bbpsSupportHistory: { requestBody: { txnRefId: string } };
                    category: string;
                    amount: string;
                },
                index: React.Key | null | undefined
            ) => <OrderHistorycardMobile key={index} item={item} />
        );
    }

    return (
        <Flex vertical className="mt-2">
            <HistoryHeader
                handleSearch={updateSearchText}
                searchText={searchText}
                handleDateChange={handleDateChange}
                from={filters.from}
                to={filters.to}
                handleFromChange={handleFromChange}
                handleToChange={handleToChange}
            />
            <Row align="middle" className="p-5 rounded-md mt-3 bg-bgLightGray">
                <Col xs={7}>
                    <Flex justify="start">
                        <Text>Operator</Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    <Flex justify="center">
                        <Text>Amount</Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    <Flex justify="center">
                        <Text>Status</Text>
                    </Flex>
                </Col>
            </Row>
            {tableContent}
            <Pagination
                current={filters.page}
                onChange={handlePageChange}
                size="default"
                className="pt-7 text-center md:text-end"
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default OrderHistory;
