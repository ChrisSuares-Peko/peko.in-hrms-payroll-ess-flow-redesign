/* eslint-disable no-nested-ternary */
import { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Col, Empty, Flex, Input, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { debounce } from 'lodash';

import useScreenSize from '@src/hooks/useScreenSize';

import ConnectListCard from '../components/ConnectListCard';
import { useConnectApi } from '../hooks/useConnectApi';

const { Text } = Typography;

const Connect = () => {
    const { data, isLoading } = useConnectApi();
    const { xs } = useScreenSize();
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = debounce(value => {
        setSearchTerm(value);
    }, 300);

    const filteredData = useMemo(
        () => data?.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
        [data, searchTerm]
    );

    const skeletonCards = useMemo(
        () =>
            Array.from({ length: 8 }).map((_, index) => (
                <Col xs={24} sm={12} md={8} xl={6} key={index}>
                    <Skeleton active avatar className="min-h-48" />
                </Col>
            )),
        []
    );

    return (
        <Content className="mt-2 sm:mt-0">
            <Input
                placeholder="Search"
                suffix={<SearchOutlined />}
                allowClear
                type="text"
                maxLength={40}
                className="rounded-md hidden mt-7"
                onChange={e => handleSearch(e.target.value)}
            />
            <Text className="font-medium text-lg sm:text-xl">
                Marketplace -
                <br className="xs:block sm:hidden" />
                <Text className="md:text-lg font-thin sm:font-thin sm:ms-1">
                    Connect instantly with the best service providers
                </Text>
            </Text>
            <Row gutter={xs ? [15, 15] : [25, 35]} className="mt-16">
                {isLoading ? (
                    skeletonCards
                ) : filteredData && filteredData.length > 0 ? (
                    filteredData?.map((item, i) => (
                        <Col xs={12} md={8} xl={6} key={item.id}>
                            <ConnectListCard
                                id={item.id}
                                title={item.name}
                                description={item.tagline}
                                image={item.image}
                                offer={item.offer}
                            />
                        </Col>
                    ))
                ) : (
                    <Flex justify="center" className="w-full">
                        <Empty description="No result found" />
                    </Flex>
                )}
            </Row>
        </Content>
    );
};

export default Connect;
