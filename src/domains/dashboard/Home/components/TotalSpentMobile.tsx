import React from 'react';

import { Flex, Typography, Switch, Select, Skeleton, Image } from 'antd';

import ChartEmpty from '@assets/svg/chartEmpty.svg';

import Chart from './Chart';
import useSelectApi from '../hooks/useSelectApi';
import { CharDataType, Filters } from '../types/index';

interface TotalSpentMobileProps {
    chartData?: CharDataType[];
    filters: Filters;
}

const { Text } = Typography;

const TotalSpentMobile: React.FC<TotalSpentMobileProps> = ({ chartData, filters }) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = currentDate.getMonth() + 1;

    const { isLoading, paymentModeData, monthsData, yearsData } = useSelectApi();
    const { handleMonthChange, handlePaymentModeFilter, handleYearChange, handleMonthlyView } =
        filters;
    return (
        <Flex vertical className="mb-4 sm:mb-8">
            <Text className="pb-3 text-xs font-bold md:font-semibold md:text-lg">
                Total Spending
            </Text>
            <Flex
                align="center"
                justify="space-between"
                className="px-4 py-2 my-4 border border-solid rounded-md"
            >
                <Text className="text-[11px] sm:text-xs whitespace-nowrap mr-2 sm:mr-0">
                    Monthly
                </Text>
                <Switch onChange={handleMonthlyView} size="small" />
                {isLoading ? (
                    <Skeleton.Input size="small" active style={{ width: 60 }} />
                ) : (
                    <Select
                        size="small"
                        defaultValue="all"
                        options={paymentModeData}
                        onSelect={handlePaymentModeFilter}
                        variant="borderless"
                        styles={{ popup: { root: { width: 100 } } }}
                    />
                )}
                {isLoading ? (
                    <Skeleton.Input size="small" active style={{ width: 60 }} />
                ) : (
                    <Select
                        size="small"
                        defaultValue={currentYear}
                        onSelect={handleYearChange}
                        options={yearsData}
                        variant="borderless"
                        styles={{ popup: { root: { width: 100 } } }}
                    />
                )}
                {isLoading ? (
                    <Skeleton.Input size="small" active style={{ width: 60 }} />
                ) : (
                    <Select
                        size="small"
                        defaultValue={currentMonth.toString()}
                        onSelect={handleMonthChange}
                        options={monthsData}
                        variant="borderless"
                        styles={{ popup: { root: { width: 100 } } }}
                    />
                )}
            </Flex>
            {chartData && chartData?.length > 0 ? (
                <Chart chartData={chartData} />
            ) : (
                <Flex vertical align="center" className="pb-8">
                    <Image src={ChartEmpty} loading="lazy" preview={false} width="25%" />
                    <Text className="text-base font-normal ">No transaction to show the graph</Text>
                </Flex>
            )}
        </Flex>
    );
};
export default React.memo(TotalSpentMobile);
