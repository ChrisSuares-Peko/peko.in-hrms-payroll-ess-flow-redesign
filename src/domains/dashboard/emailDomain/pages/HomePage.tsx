/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react';

import { Col, Empty, Flex, Row, Skeleton, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import MoreTransactions from '@assets/svg/moretransactions.svg';
import useDebounce from '@src/hooks/useDebounce';

import DomainCard from '../components/DomainCard';
import useEmailDomainApi from '../hooks/useEmailDomainApi';

const { Text, Title } = Typography;

const HomePage = () => {
    const [searchText, setSearchText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(10);
    const debouncedSearchText = useDebounce(searchText, 500);
    useEffect(() => {
        if (searchText && searchText !== '') {
            setCurrentPage(1);
        }
    }, [searchText]);
    const { data, isLoading, count } = useEmailDomainApi(debouncedSearchText, currentPage, limit);

    let cardsToDisplay;
    if (isLoading) {
        cardsToDisplay = Array.from({ length: limit }).map((_, index) => (
            <Col xs={24} sm={12} md={8} xl={6} key={index}>
                <Skeleton active avatar className="h-60 w-60" />
            </Col>
        ));
    } else if (data.length === 0) {
        cardsToDisplay = (
            <Empty
                image={
                    <img
                        src={MoreTransactions}
                        alt="No result"
                        style={{ width: '200px', height: '200px' }}
                    />
                } // Adjust width and height as needed
                description={
                    <div className="font-normal" style={{ marginTop: '80px' }}>
                        No result to show
                    </div>
                } // Add margin-top to position the text below the image
            />
        );
    } else {
        cardsToDisplay = data.map((item, i) => (
            <Col xs={24} sm={12} md={12} lg={12} xl={9} xxl={7} key={i} className="mt-4">
                <DomainCard
                    productId={item.id}
                    image={item.image || ''}
                    name={item.name || ''}
                    offersText={item.offersText || ''}
                />
            </Col>
        ));
    }
    return (
        <Content>
            <Flex justify="start" style={{ marginBottom: '20px' }}>
                <Title level={4}>Business Emails</Title>
            </Flex>
            <Flex justify="center" style={{ marginBottom: '20px' }}>
                <Text className="font-normal text-2xl">
                    Get a custom email address for your business and enhance your professional image
                </Text>
            </Flex>

            <Row gutter={[40, 40]} className="mt-8" justify="center">
                {cardsToDisplay}
            </Row>
        </Content>
    );
};

export default HomePage;
