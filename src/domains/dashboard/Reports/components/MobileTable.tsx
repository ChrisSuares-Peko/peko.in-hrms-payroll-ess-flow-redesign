import React from 'react';

import { Col, Empty, Flex, Pagination, Row, Skeleton, Typography } from 'antd';

import MoreTransactions from '@assets/svg/moretransactions.svg';

import TableMobile from './TableMobile';
import { transactionType } from '../types/index';

type Props = {
    data: transactionType[];
    page: number;
    handlePageChange: (page: number, pageSize: number) => void;
    count: number | undefined;
    isCashbackTable: boolean;
    isLoading: boolean;
};

const MobileTable = ({
    isLoading,
    data,
    isCashbackTable,
    count,
    page,
    handlePageChange,
}: Props) => (
    <>
        <Row align="middle" className="p-5 rounded-md bg-bgLightGray text-nowrap">
            <Col xs={6}>
                <Flex justify="start">
                    <Typography.Text>Operator</Typography.Text>
                </Flex>
            </Col>
            <Col xs={7}>
                <Flex justify="center">
                    <Typography.Text>Amount</Typography.Text>
                </Flex>
            </Col>
            <Col xs={7}>
                <Flex justify="center">
                    {isCashbackTable ? (
                        <Typography.Text>Cashback</Typography.Text>
                    ) : (
                        <Typography.Text>Status</Typography.Text>
                    )}
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
                    data.map(transaction => (
                        <TableMobile
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
        <Pagination
            current={page}
            onChange={handlePageChange}
            className="mt-10 text-center"
            size="small"
            total={count}
            showSizeChanger={false}
        />
    </>
);

export default MobileTable;
