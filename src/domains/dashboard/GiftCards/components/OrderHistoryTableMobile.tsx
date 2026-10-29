import { FC, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Empty, Flex, Input, Pagination, Row, Skeleton, Typography } from 'antd';

import OrderHistorycardMobile from './OrderHistorycardMobile';
import useFilter from '../hooks/useFilter';
import { useOrderHistoryTable } from '../hooks/useOrderHistoryTable';
import { filterState } from '../types/types';

interface HistoryTableMobileProps {
    searchText?: string | null;
}

const OrderHistoryTableMobile: FC<HistoryTableMobileProps> = ({ searchText }) => {
    const [filter, setFilter] = useState<filterState>({
        search: '',
        start: 1,
        length: 10,
        draw: 1,
        from: '',
        to: '',
    });
    const { handleSearch, handlePageChange } = useFilter({ setFilter });
    const { data, isLoading, count } = useOrderHistoryTable(
        filter.draw,
        filter.start,
        filter.length,
        filter.search
    );

    return (
        <Flex vertical gap={20}>
            <Row justify="space-between" align="middle" gutter={[20, 20]}>
                <Col xs={24} sm={12} md={6}>
                    <Typography.Text className="text-lg font-medium">Purchase History</Typography.Text>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Input
                        placeholder="Search"
                        suffix={<SearchOutlined />}
                        allowClear
                        type="text"
                        maxLength={100}
                        value={filter.search}
                        onChange={handleSearch}
                    />
                </Col>
            </Row>

            <Row align="middle" className="p-5 rounded-md bg-bgLightGray text-nowrap">
                <Col xs={6}>
                    <Flex justify="start">
                        <Typography.Text>Gift Card</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    <Flex justify="center">
                        <Typography.Text>Total Amount</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={7}>
                    <Flex justify="center">
                        <Typography.Text>Status</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={4}>
                    <Flex justify="center">
                        <Typography.Text>Action</Typography.Text>
                    </Flex>
                </Col>
            </Row>

            {isLoading ? (
                <Skeleton paragraph={{ rows: 6 }} className="mt-5" />
            ) : (
                <Flex vertical className="h-full">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <OrderHistorycardMobile key={index} item={item} />
                        ))
                    ) : (
                        <Flex vertical justify="center" align="center" className="h-full">
                            <Empty description="No data found" />
                        </Flex>
                    )}
                </Flex>
            )}

            <Pagination
                current={filter.start}
                onChange={handlePageChange}
                className="mt-10 text-center"
                size="small"
                total={count}
                showSizeChanger={false}
            />
        </Flex>
    );
};

export default OrderHistoryTableMobile;
