import React, { useEffect, useState } from 'react';

import { Col, Row, Pagination, Skeleton, PaginationProps, Empty, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
// import clevertap from 'clevertap-web-sdk';

import MoreTransactions from '@assets/images/No-Product.png';
import SubHeader from '@src/domains/dashboard/Subscriptions/components/SubscriptionListing/SubHeader';
import SubscriptionCard from '@src/domains/dashboard/Subscriptions/components/SubscriptionListing/SubscriptionCard';
import SubscriptionHeader from '@src/domains/dashboard/Subscriptions/components/SubscriptionListing/SubscriptionHeader';
import useDebounce from '@src/hooks/useDebounce';
import useScreenSize from '@src/hooks/useScreenSize';

import Categories from '../components/SubscriptionListing/Categories';
import { useGetCategories } from '../hooks/useCategory';
import useSubscriptionApi from '../hooks/useSubscriptionApi';

const SubscriptionsListing = () => {
    const [searchText, setSearchText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(20);
    const [category, setCategory] = useState<string>('All');

    const { CategoryData, Loading } = useGetCategories();
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const debouncedSearchText = useDebounce(searchText, 500);

    useEffect(() => {
        if (searchText && searchText !== '') {
            setCurrentPage(1);
        }
    }, [searchText]);

    // useEffect(() => {
    //     clevertap.event.push('Softwares', {
    //         Page: 'Softwares',
    //         Action: 'Subscription page loaded',
    //         // Action:'softwares clicked',
    //         // Email: user?.email,
    //         // SubscriptionName: name
    //     });
    // }, []);

    const { data, isLoading, count } = useSubscriptionApi(
        debouncedSearchText,
        currentPage,
        category,
        limit,
        selectedCategory
    );

    const handlePageChange: PaginationProps['onChange'] = (page, length) => {
        if (length !== limit) {
            setCurrentPage(1);
        } else {
            setCurrentPage(page);
        }
        setLimit(length);
    };
    const { sm } = useScreenSize();

    const size = sm ? 'default' : 'small';

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
                image={MoreTransactions}
                imageStyle={{ height: 200 }}
                description={<Typography.Text>No software products found</Typography.Text>}
            />
        );
    } else {
        cardsToDisplay = data.map((item, i) => (
            <Col xs={12} sm={12} md={12} lg={12} xl={6} xxl={6} key={i} className="mt-4">
                <SubscriptionCard
                    image={item.image}
                    id={item.id}
                    title={item.name}
                    description={item.description}
                    discount={item.badge}
                />
            </Col>
        ));
    }

    return (
        <Content className="mb-20 ">
            <SubscriptionHeader />
            <Categories
                isLoading={Loading}
                category={CategoryData}
                setSelectedCategory={setSelectedCategory}
                selectedCategory={selectedCategory}
            />
            <SubHeader
                count={count}
                category={category}
                setCategory={setCategory}
                searchText={searchText}
                setSearchtext={setSearchText}
            />
            <Row
                gutter={[20, 20]}
                className="h-full mt-8 min-h-96"
                justify={data && data.length > 0 ? 'start' : 'center'}
                align="middle"
            >
                {cardsToDisplay}
            </Row>
            {data.length > 0 && (
                <Pagination
                    className="mt-10 text-center sm:text-end"
                    size={size}
                    total={count}
                    onChange={handlePageChange}
                    current={currentPage}
                    defaultPageSize={limit}
                    showSizeChanger
                />
            )}
        </Content>
    );
};

export default SubscriptionsListing;
