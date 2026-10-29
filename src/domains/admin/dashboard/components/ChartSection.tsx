/* eslint-disable no-nested-ternary */
import React from 'react';

import { Col, Flex, Image, Row, Spin, Typography } from 'antd';

import ChartEmpty from '@assets/svg/chartEmpty.svg';

import MonthlyCorporateChart from './MonthlyCorporateChart';
import MonthlyStaticsChart from './MonthlyStaticsChart';
import MonthlyStaticsGMVChart from './MonthlyStaticsGMVChart';
import { CorporateData, MonthlyStatistic } from '../types/types';

type Props = {
    monthlyCorporates: CorporateData[];
    monthlyStatistic: MonthlyStatistic[];
    isLoading: boolean;
};

const ChartSection = ({ monthlyCorporates, monthlyStatistic, isLoading }: Props) => (
    <Row gutter={[30, 20]} className="pt-10 w-100">
        <Col xs={24} md={24}>
            <Flex className="mb-10">
                <Typography.Text className="text-xl ">Monthly Corporates</Typography.Text>
            </Flex>
            {isLoading ? (
                <Flex justify="center" align="center" className="py-20 my-16">
                    <Spin size="large" />
                </Flex>
            ) : monthlyCorporates && monthlyCorporates.length > 0 ? (
                <MonthlyCorporateChart chartData={monthlyCorporates} />
            ) : (
                <Flex vertical align="center" className="pb-8">
                    <Image src={ChartEmpty} preview={false} width="20%" className="p-1 my-5" />
                    <Typography.Text className="pb-8 text-base font-normal text-gray-400">
                        No data to display on the graph
                    </Typography.Text>
                </Flex>
            )}
        </Col>
        <Col xs={24} md={24}>
            <Flex className="mb-10">
                <Typography.Text className="text-xl ">Monthly Transactions</Typography.Text>
            </Flex>
            {isLoading ? (
                <Flex justify="center" align="center" className="py-20 my-16">
                    <Spin size="large" />
                </Flex>
            ) : monthlyStatistic && monthlyStatistic.length > 0 ? (
                <MonthlyStaticsChart chartData={monthlyStatistic} />
            ) : (
                <Flex vertical align="center" className="pb-8">
                    <Image src={ChartEmpty} preview={false} width="20%" className="p-1 my-5" />
                    <Typography.Text className="pb-8 text-base font-normal text-gray-400">
                        No data to display on the graph
                    </Typography.Text>
                </Flex>
            )}
        </Col>
        <Col xs={24} md={24}>
            <Flex className="mb-10">
                <Typography.Text className="text-xl ">Monthly GMV</Typography.Text>
            </Flex>
            {isLoading ? (
                <Flex justify="center" align="center" className="py-20 my-16">
                    <Spin size="large" />
                </Flex>
            ) : monthlyStatistic && monthlyStatistic.length > 0 ? (
                <MonthlyStaticsGMVChart chartData={monthlyStatistic} />
            ) : (
                <Flex vertical align="center" className="pb-8">
                    <Image src={ChartEmpty} preview={false} width="20%" className="p-1 my-5" />
                    <Typography.Text className="pb-8 text-base font-normal text-gray-400">
                        No data to display on the graph
                    </Typography.Text>
                </Flex>
            )}
        </Col>
    </Row>
);

export default ChartSection;
