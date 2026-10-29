import React from 'react';

import { Flex, Skeleton } from 'antd';

import EarningsIcon from '@assets/icons/Earnings.svg';
import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import SpentIcon from '@assets/icons/Spent.svg';
import useScreenSize from '@src/hooks/useScreenSize';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import PriceInfoCard from './PriceInfoCard';
import useCountApi from '../hooks/useCountApi';

type PriceInfoListProps = {
    monthlySpends: React.MutableRefObject<null>;
    totalTransactions: React.MutableRefObject<null>;
    totalSpends: React.MutableRefObject<null>;
};

const PriceInfoList = ({ monthlySpends, totalTransactions, totalSpends }: PriceInfoListProps) => {
    const { data, isLoading } = useCountApi();
    const { xl } = useScreenSize();
    return (
        <Flex className="flex flex-wrap gap-4">
            {isLoading ? (
                <Skeleton active avatar />
            ) : (
                <>
                    <PriceInfoCard
                        title="Current Month's Spend"
                        value={`${formatNumberWithLocalString(data?.totalSpendCurrentMonth || 0) ?? '0'}`}
                        bgColor="dashboard-card-monthly-spend-bg"
                        icon={EarningsIcon}
                        currency="₹"
                        reference={monthlySpends}
                    />
                    <PriceInfoCard
                        title="Total Transactions"
                        value={`${data?.totalTransactions ?? '0'}`}
                        bgColor="dashboard-card-transactions-bg"
                        icon={MoneyBackIcon}
                        currency=""
                        reference={totalTransactions}
                    />
                    {xl && (
                        <PriceInfoCard
                            title="Total Spend"
                            value={`${formatNumberWithLocalString(data?.totalSpend || 0) ?? '0'}`}
                            bgColor="dashboard-card-total-spend-bg"
                            icon={SpentIcon}
                            currency="₹"
                            reference={totalSpends}
                        />
                    )}
                </>
            )}
        </Flex>
    );
};
export default React.memo(PriceInfoList);
