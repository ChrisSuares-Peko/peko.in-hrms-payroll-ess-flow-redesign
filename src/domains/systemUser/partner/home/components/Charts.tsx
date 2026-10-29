/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import { Col, Flex, Image, Row, Spin, Typography, Select } from 'antd';

import ChartEmpty from '@assets/svg/chartEmpty.svg';

import MonthlyCorporateChart from './MonthlyCoporateChart';
import MonthlyStaticsChart from './MonthlyStaticsChart';
import MonthlyStaticsGMVChart from './MonthlyStaticsGMVChart';
import MonthlyStaticsSharesChart from './MonthlyStaticsSharesChart';
import useGetStatistics from '../hooks/useGetStatistics';

type DropDownData = {
    label: number | string;
    value: number;
};

const monthOptions: DropDownData[] = [
    {
        label: 'January',
        value: 1,
    },
    {
        label: 'February',
        value: 2,
    },
    {
        label: 'March',
        value: 3,
    },
    {
        label: 'April',
        value: 4,
    },
    {
        label: 'May',
        value: 5,
    },
    {
        label: 'June',
        value: 6,
    },
    {
        label: 'July',
        value: 7,
    },
    {
        label: 'August',
        value: 8,
    },
    {
        label: 'September',
        value: 9,
    },
    {
        label: 'October',
        value: 10,
    },
    {
        label: 'November',
        value: 11,
    },
    {
        label: 'December',
        value: 12,
    },
];

const yearOptions: DropDownData[] = [];
const currYear = new Date().getFullYear();
for (let i = 0; i < 5; i += 1) {
    yearOptions.push({
        label: currYear - i,
        value: currYear - i,
    });
}

const Charts = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const { isLoading, chartData } = useGetStatistics(month, year);

    return (
        <Row gutter={[30, 20]} className="pt-10 w-100">
            <Col xs={24} md={24}>
                <Flex className="mb-10 w-full" align="center" justify="space-between">
                    <Typography.Text className="text-lg ">Monthly Corporates</Typography.Text>
                    <Flex>
                        <Flex gap="10px">
                            <Select
                                size="middle"
                                value={monthOptions.filter(x => Number(x.value) === month)[0].value}
                                onChange={(e: number) => {
                                    setMonth(e);
                                }}
                            >
                                {monthOptions.map((option, index) => (
                                    <Select.Option key={index} value={option.value}>
                                        {option.label}
                                    </Select.Option>
                                ))}
                            </Select>
                            <Select
                                size="middle"
                                value={yearOptions.filter(x => Number(x.value) === year)[0].value}
                                onChange={(e: number) => {
                                    setYear(e);
                                }}
                            >
                                {yearOptions.map((option, index) => (
                                    <Select.Option key={index} value={option.value}>
                                        {option.label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Flex>
                    </Flex>
                </Flex>
                {isLoading ? (
                    <Flex justify="center" align="center" className="py-20 my-16">
                        <Spin size="large" />
                    </Flex>
                ) : chartData?.allCorporates && chartData.allCorporates.length > 0 ? (
                    <MonthlyCorporateChart chartData={chartData.allCorporates} />
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
                    <Typography.Text className="text-lg ">Monthly Transactions</Typography.Text>
                </Flex>
                {isLoading ? (
                    <Flex justify="center" align="center" className="py-20 my-16">
                        <Spin size="large" />
                    </Flex>
                ) : chartData?.monthlyStatistics && chartData.monthlyStatistics.length > 0 ? (
                    <MonthlyStaticsChart chartData={chartData.monthlyStatistics} />
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
                    <Typography.Text className="text-lg ">Monthly GMV</Typography.Text>
                </Flex>
                {isLoading ? (
                    <Flex justify="center" align="center" className="py-20 my-16">
                        <Spin size="large" />
                    </Flex>
                ) : chartData?.monthlyStatistics && chartData.monthlyStatistics.length > 0 ? (
                    <MonthlyStaticsGMVChart chartData={chartData.monthlyStatistics} />
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
                    <Typography.Text className="text-lg ">System Share (excl. GST)</Typography.Text>
                </Flex>
                {isLoading ? (
                    <Flex justify="center" align="center" className="py-20 my-16">
                        <Spin size="large" />
                    </Flex>
                ) : chartData?.monthlyStatistics && chartData.monthlyStatistics.length > 0 ? (
                    <MonthlyStaticsSharesChart chartData={chartData.monthlyStatistics} />
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
};

export default Charts;
