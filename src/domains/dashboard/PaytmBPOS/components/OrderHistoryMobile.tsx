import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Flex, Input, Pagination, Row, Skeleton, Typography } from 'antd';

import OrderHistorycardMobile from './OrderHistorycardMobile';
import useFilter from '../hooks/useFilter';
import useOrderHistory from '../hooks/useOrderHistory';
import { FilterState } from '../types/index';

const OrderHistoryMobile = () => {
    const [filter, setFilter] = useState<FilterState>({
        search: '',
        start: 0,
        length: 10,
    });
    const { handleSearch, handlePageChange } = useFilter({ setFilter });
    const { data, isLoading, count } = useOrderHistory(filter);

    let tableContent;
    if (isLoading) {
        tableContent = Array.from({ length: 10 }).map((_, index) => (
            <Card size="small" className="mt-4 h-40 bg-slate-50 border-none p-2" key={index}>
                <Flex className="w-full" gap={5} vertical>
                    <Skeleton active paragraph={{ rows: 3 }} />
                </Flex>
            </Card>
        ));
    } else if (data.length === 0) {
        tableContent = <Empty description="No data available" />;
    } else {
        tableContent = data.map((item, index) => (
            <OrderHistorycardMobile key={index} item={item} /> // Use SubscriptionCard component
        ));
    }

    return (
        <Flex vertical gap={20} className="">
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6}>
                    <Typography.Text className="xl:text-xl lg:text-lg sm:text-lg text-lg font-medium">
                        Order History
                    </Typography.Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for orders"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        value={filter.search}
                        onChange={handleSearch}
                    />
                </Col>
            </Row>
            <Row align="middle" className="p-5 rounded-md bg-bgLightGray">
                <Col xs={7}>
                    {' '}
                    <Flex justify="start">
                        <Typography.Text>Store name</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    {' '}
                    <Flex justify="center">
                        <Typography.Text>Person name</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    {' '}
                    <Flex justify="center">
                        {' '}
                        <Typography.Text>Mobile</Typography.Text>
                    </Flex>
                </Col>
            </Row>
            {tableContent}
            <Pagination
                current={filter.start}
                onChange={handlePageChange}
                size="small"
                className="text-center mt-10"
                total={count}
            />
        </Flex>
    );
};

export default OrderHistoryMobile;
