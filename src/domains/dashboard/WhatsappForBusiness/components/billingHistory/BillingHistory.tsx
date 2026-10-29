import React, { useEffect, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Table, Typography, Row, Col, Input, Pagination, Flex } from 'antd';

import useDebounce from '@src/hooks/useDebounce';

import { useFetchOrders } from '../../hooks/useFetchOrders';
import { OrderHistoryColumns } from '../../utils/index';

const { Text } = Typography; // Assuming you have predefined columns

const BillingHistory: React.FC = () => {
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300); // Use the custom hook
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { isLoading, orders, pagination, loadOrders } = useFetchOrders();

   

    useEffect(() => {
        loadOrders(debouncedSearch, currentPage, pageSize);
    }, [debouncedSearch, currentPage, pageSize, loadOrders]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handlePageChange = (page: number, newPageSize?: number) => {
        setCurrentPage(page);
        if (newPageSize) {
            setPageSize(newPageSize);
        }
    };

    return (
        <Flex style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6}>
                    <Text className="xl:text-xl lg:text-lg sm:text-lg text-lg font-medium">
                        Top-Up History
                    </Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search for orders"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        value={search}
                        onChange={handleSearch}
                    />
                </Col>
            </Row>
            <Table
                columns={OrderHistoryColumns}
                dataSource={orders}
                pagination={false}
                scroll={{ x: 568 }}
                loading={isLoading}
                rowKey="id" // Assuming each order has a unique id
            />
            <Pagination
                className="sm:text-end text-center mt-10"
                current={pagination.currentPage}
                pageSize={pagination.pageSize}
                total={pagination.totalOrders}
                onChange={handlePageChange}
                showSizeChanger={false} // Hides the page size changer
                pageSizeOptions={['10']}
                style={{ display: 'block' }}
            />
        </Flex>
    );
};

export default BillingHistory;
