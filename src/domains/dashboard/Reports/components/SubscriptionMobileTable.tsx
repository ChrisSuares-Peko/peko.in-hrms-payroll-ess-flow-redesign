import React from 'react';

import { Col, Empty, Flex, Pagination, Row, Skeleton, Typography } from 'antd';

import MoreTransactions from '@assets/svg/moretransactions.svg';

import SubscriptionTableMobile from './SubscriptionTableMobile';
import { subscriptionTransactionRow } from '../types/index';

const { Text } = Typography;

type Props = {
    data: subscriptionTransactionRow[];
    page: number;
    handlePageChange: (page: number, pageSize: number) => void;
    count: number | undefined;
    isCashbackTable: boolean;
    isLoading: boolean;
};

const SubscriptionMobileTable = ({
    isLoading,
    data,
    isCashbackTable,
    count,
    page,
    handlePageChange,
}: Props) => (
    <>
        <Row align="middle" className="p-3 rounded-md sm:p-5 bg-bgLightGray text-nowrap">
            <Col xs={7}>
                <Flex justify="start" className=''>
                    <Text className='text-sm'>Subscription</Text>
                </Flex>
            </Col>
            <Col xs={7}>
                <Flex justify="center">
                    <Text className='text-sm'>Amount</Text>
                </Flex>
            </Col>
            <Col xs={7}>
                <Flex justify="center">
                    {isCashbackTable ? <Text className='text-sm'>Cashback</Text> : <Text className='text-sm'>Status</Text>}
                </Flex>
            </Col>
            <Col xs={3}>
                <Flex justify="center">
                    <Text className='text-sm'>Action</Text>
                </Flex>
            </Col>
        </Row>
        {isLoading ? (
            <Skeleton paragraph={{ rows: 6 }} className="mt-5" />
        ) : (
            <Flex vertical className="h-full">
                {data.length > 0 ? (
                    data.map(transaction => (
                        <SubscriptionTableMobile
                            key={transaction.transactionID}
                            transaction={transaction}
                            isCashbackTable={isCashbackTable}
                        />
                    ))
                ) : (
                    <Flex vertical justify="center" align="center" className="h-full">
                        <Empty image={MoreTransactions} description="No data found" />
                    </Flex>
                )}
            </Flex>
        )}
        {count && count > 0 ? (
            <Pagination
                current={page}
                onChange={handlePageChange}
                className="mt-10 text-center"
                size="small"
                total={count}
                showSizeChanger={false}
            />
        ):""}
    </>
);

export default React.memo(SubscriptionMobileTable);
