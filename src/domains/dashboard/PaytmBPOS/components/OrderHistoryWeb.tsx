import React, { useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Flex, Input, Pagination, Row, Table, Typography } from 'antd';

import useFilter from '../hooks/useFilter';
import useOrderHistory from '../hooks/useOrderHistory';
import { FilterState } from '../types/index';
import { OrderHistoryColumns } from '../utils/index';

const OrderHistoryWeb = () => {
    const initialValues = {
        search: '',
        start: 0,
        length: 10,
    };
    const [filter, setFilter] = useState<FilterState>(initialValues);

    const { handleSearch, handlePageChange } = useFilter({ setFilter });
    const { data, isLoading, count } = useOrderHistory(filter);

    return (
        <Flex vertical gap={20}>
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6}>
                    <Typography.Text className="xl:text-xl lg:text-lg  sm:text-lg text-lg font-medium ">
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
            <Table
                columns={OrderHistoryColumns}
                dataSource={data}
                loading={isLoading}
                pagination={false}
            />
            <Pagination
                size="default"
                className="text-end pt-7"
                total={count}
                current={filter.start}
                onChange={handlePageChange}
            />
        </Flex>
    );
};

export default OrderHistoryWeb;
