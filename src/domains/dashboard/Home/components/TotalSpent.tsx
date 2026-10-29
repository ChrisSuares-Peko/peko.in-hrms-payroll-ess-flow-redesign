/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';

import { Flex, Typography, Switch, Select, Skeleton, Spin, Image } from 'antd';

import ChartEmpty from '@assets/svg/chartEmpty.svg';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import Chart from './Chart';
import useSelectApi from '../hooks/useSelectApi';
import { CharDataType, Filters } from '../types/index';

interface TotalSpentProps {
    chartData?: CharDataType[];
    filters: Filters;
    isLoading: boolean;
    chartRef: React.MutableRefObject<null>;
}
const { Text } = Typography;

const TotalSpent: React.FC<TotalSpentProps> = ({
    chartData,
    filters,
    isLoading: chartLoading,
    chartRef,
}) => {
    const [isMonthChart, setIsMonthChart] = useState(false);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = currentDate.getMonth() + 1;

    const { isLoading, paymentModeData, monthsData, yearsData } = useSelectApi();
    const { handleMonthChange, handlePaymentModeFilter, handleYearChange, handleMonthlyView } =
        filters;
    const handleMonthlyViewChart = (value: boolean) => {
        setIsMonthChart(value);
        handleMonthlyView();
    };
    return (
        <Flex vertical gap={32} className="mt-8 border border-solid rounded-2xl" ref={chartRef}>
            <Flex
                align="center"
                justify="space-between"
                className="flex-wrap w-full p-6 border-b border-solid gap-y-5"
            >
                <Flex vertical>
                    <Text className="text-lg font-medium">Total Spending</Text>
                    {chartLoading ? (
                        <Skeleton.Input size="small" active style={{ width: 120 }} />
                    ) : (
                        <Text className="text-xs text-gray-500">
                            {`₹ ${formatNumberWithLocalString(chartData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0)}`}
                        </Text>
                    )}
                </Flex>

                <Flex align="center" gap={10} wrap="wrap">
                    <Text>Monthly</Text>
                    <Switch onChange={handleMonthlyViewChart} size="default" />
                    {isLoading ? (
                        <Skeleton.Input size="small" active style={{ width: 96 }} />
                    ) : (
                        <Select
                            className="w-24 rounded-select"
                            size="small"
                            defaultValue="all"
                            options={paymentModeData}
                            onSelect={handlePaymentModeFilter}
                        />
                    )}
                    {isLoading ? (
                        <Skeleton.Input size="small" active style={{ width: 96 }} />
                    ) : (
                        <Select
                            size="small"
                            className="w-24 rounded-select"
                            defaultValue={currentYear}
                            onSelect={handleYearChange}
                            options={yearsData}
                        />
                    )}
                    {isLoading ? (
                        <Skeleton.Input size="small" active style={{ width: 96 }} />
                    ) : (
                        <Select
                            size="small"
                            className="w-24 rounded-select"
                            defaultValue={currentMonth.toString()}
                            onSelect={handleMonthChange}
                            options={monthsData}
                            disabled={isMonthChart}
                        />
                    )}
                </Flex>
            </Flex>

            {chartLoading ? (
                <Flex justify="center" align="center" className="py-20 my-16">
                    <Spin size="large" />
                </Flex>
            ) : chartData && chartData.length > 0 ? (
                <Chart chartData={chartData} />
            ) : (
                <Flex vertical align="center" className="pb-8">
                    <Image
                        src={ChartEmpty}
                        loading="lazy"
                        preview={false}
                        width="20%"
                        className="p-1 my-5"
                    />
                    <Text className="pb-8 text-base font-normal text-gray-400">
                        No transactions to display here
                    </Text>
                </Flex>
            )}
        </Flex>
    );
};
export default TotalSpent;
