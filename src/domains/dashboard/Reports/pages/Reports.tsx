import React, { useState, useMemo, useCallback } from 'react';

import { Flex, Row, Typography, Tabs, Col, Skeleton } from 'antd';
import { TabsProps } from 'antd/lib';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
// import useScreenSize from '@src/hooks/useScreenSize';
import { checkSubServiceAccessCorporate } from '@utils/checkAccess';

import ReportScheduling from '../components/ReportScheduling';
import ReportTables from '../components/ReportTables';
import SubscriptionReportTables from '../components/SubscriptionReportTables';
import { useGetCashbackData } from '../hooks/useGetCashbackData';
import { useGetCategories } from '../hooks/useGetCategories';
import { useGetReportsApi } from '../hooks/useGetReportsApi';
import { useGetSubscription } from '../hooks/useGetSubscription';
import { useSubscriptionApi } from '../hooks/useSubscriptionApi';

const { Text } = Typography;
const Reports: React.FC = () => {
    // const { md } = useScreenSize();
    // const size = md ? 'large' : 'small';
    const today = dayjs();
    const todayFormatted = today.format('YYYY-MM-DD');
    const lastMonthSameDate = today.subtract(1, 'month').format('YYYY-MM-DD');
    // Memoize initialValues to avoid re-creation on every render
    const location = useLocation();
    const deepLinkAccessKey = (location.state as { accessKey?: string } | null)?.accessKey || '';
    const initialValues = useMemo(
        () => ({
            searchText: '',
            category: '',
            accessKey: '',
            sort: 'DESC',
            page: 1,
            itemsPerPage: 10,
            filter: '',
            from: lastMonthSameDate,
            to: todayFormatted,
            sortField: '',
        }),
        [todayFormatted, lastMonthSameDate]
    );

    const [transactionFilters, setTransactionFilters] = useState(() => ({
        ...initialValues,
        accessKey: deepLinkAccessKey,
    }));
    const [cashbackFilters, setCashbackFilters] = useState(initialValues);
    const [subscriptionFilters, setSubscriptionFilters] = useState(initialValues);
    const { category } = useGetCategories();
    const { orderCount, orderData, orderLoading, initailLoader } = useGetReportsApi(
        transactionFilters.searchText,
        transactionFilters.category,
        transactionFilters.sort,
        transactionFilters.page,
        transactionFilters.itemsPerPage,
        transactionFilters.filter,
        transactionFilters.from,
        transactionFilters.to,
        transactionFilters.sortField,
        transactionFilters.accessKey
    );
    const handleFilterChange = (newFilterValue: string) => {
        setTransactionFilters(prevFilters => {
            // Only update filters if the value has changed
            if (prevFilters.filter !== newFilterValue) {
                return {
                    ...prevFilters,
                    filter: newFilterValue,
                };
            }
            return prevFilters; // No change, avoid re-render
        });
    };
    useGetCashbackData(
        cashbackFilters.searchText,
        cashbackFilters.category,
        cashbackFilters.sort,
        cashbackFilters.page,
        cashbackFilters.itemsPerPage,
        cashbackFilters.filter,
        cashbackFilters.from,
        cashbackFilters.to,
        cashbackFilters.sortField
    );

    const { subscription } = useGetSubscription();

    const { subscriptionCount, subscriptionData, subscriptionLoading } = useSubscriptionApi(
        subscriptionFilters.searchText,
        subscriptionFilters.category,
        subscriptionFilters.sort,
        subscriptionFilters.page,
        subscriptionFilters.itemsPerPage,
        subscriptionFilters.filter,
        subscriptionFilters.from,
        subscriptionFilters.to,
        subscriptionFilters.sortField
    );

    const handleSubscriptionFilterChange = (newFilterValue: string) => {
        setSubscriptionFilters(prevFilters => {
            // Only update filters if the value has changed
            if (prevFilters.filter !== newFilterValue) {
                return {
                    ...prevFilters,
                    filter: newFilterValue,
                };
            }
            return prevFilters; // No change, avoid re-render
        });
    };
    let items: TabsProps['items'] = useMemo(
        () => [
            {
                key: '1',
                label: 'Transactions',
                children: (
                    <ReportTables
                        data={orderData}
                        count={orderCount}
                        isLoading={orderLoading}
                        title="Transactions"
                        category={category}
                        filter={transactionFilters}
                        setFilter={setTransactionFilters}
                        handleFilterChange={handleFilterChange}
                        initalStartDate={initialValues.from}
                        initalEndDate={initialValues.to}
                        initialValues={initialValues}
                    />
                ),
            },
            // {
            //     key: '2',
            //     label: 'Cashbacks',
            //     children: (
            //         <ReportTables
            //             handleFilterChange={handleFilterChange}
            //             data={cashbackdata}
            //             count={cashbackCount}
            //             isLoading={cashbackLoading}
            //             title="Cashbacks"
            //             category={category}
            //             filter={cashbackFilters}
            //             setFilter={setCashbackFilters}
            //             initalStartDate={initialValues.from}
            //             initalEndDate={initialValues.to}
            //             initialValues={initialValues}
            //             isCashbackTable
            //         />
            //     ),
            // },
            {
                key: '3',
                label: 'Scheduling Reports',
                children: <ReportScheduling />,
            },
            {
                key: '4',
                label: 'Subscription Transactions',
                children: (
                    <SubscriptionReportTables
                        data={subscriptionData}
                        count={subscriptionCount}
                        isLoading={subscriptionLoading}
                        title="Subscriptions"
                        subscription={subscription}
                        filter={subscriptionFilters}
                        setFilter={setSubscriptionFilters}
                        handleFilterChange={handleSubscriptionFilterChange}
                        initalStartDate={initialValues.from}
                        initalEndDate={initialValues.to}
                        initialValues={initialValues}
                    />
                ),
            },
        ],
        [
            orderData,
            orderCount,
            orderLoading,
            // cashbackCount,
            // cashbackFilters,
            // cashbackLoading,
            // cashbackdata,
            category,
            initialValues,
            subscription,
            subscriptionCount,
            subscriptionData,
            subscriptionFilters,
            subscriptionLoading,
            transactionFilters,
        ]
    );

    const handleTabChange = useCallback(
        (activeKey: string) => {
            if (activeKey === '1') {
                setTransactionFilters(prev => ({
                    ...prev,
                    ...initialValues,
                }));
            } else if (activeKey === '2') {
                setCashbackFilters(prev => ({
                    ...prev,
                    ...initialValues,
                }));
            } else if (activeKey === '4') {
                setSubscriptionFilters(prev => ({
                    ...prev,
                    ...initialValues,
                }));
            }
        },
        [initialValues]
    );

    const { user } = useAppSelector(state => state.reducer.user);
    if (user?.roleName === 'corporate sub user') {
        items = items.slice(0, 1); // Keep only the first element for the sub corporate
    }

    const filteredItems = useMemo(
        () =>
            items.filter(
                item =>
                    typeof item.label === 'string' &&
                    checkSubServiceAccessCorporate('Reports', item.label)
            ),
        [items]
    );

    return (
        <Row>
            <Col span={24}>
                {initailLoader ? (
                    <>
                        <Text className="text-lg font-medium sm:text-xl">Reports</Text>
                        <Skeleton paragraph={{ rows: 12 }} className="mt-16" />
                    </>
                ) : (
                    <Flex vertical gap={20}>
                        <Text className="text-lg font-medium sm:text-xl">Reports</Text>
                        <Tabs
                            // size={size}
                            defaultActiveKey="1"
                            items={filteredItems}
                            onChange={handleTabChange}
                        />
                    </Flex>
                )}
            </Col>
        </Row>
    );
};

export default Reports;
