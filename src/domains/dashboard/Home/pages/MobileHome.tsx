import { lazy } from 'react';

import { Flex } from 'antd';

import CashbackEverywhere from '@assets/icons/CashbackEverywhere.svg';
import EarningsIcon from '@assets/icons/Earnings.svg';
import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import SpentIcon from '@assets/icons/Spent.svg';
import MobileNav from '@components/molecular/nav-section/mobile-nav/MobileNav';
import ServiceSearch from '@components/molecular/searchTree/ServiceSearch';
import { useAppSelector } from '@src/hooks/store';
import useShowWalletBalance from '@src/hooks/useShowWalletBalance';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import AlertsList from '../components/AlertsList';
import DashboardBussinessCardList from '../components/DashboardBussinessCardLIst';
import Headers from '../components/headers/Headers';
import PekoCreditsAdaptive from '../components/PekoCreditsAdaptive';
import PekoUpgradePlanAdaptive from '../components/PekoUpgradePlanAdaptive';
import PriceInfoCard from '../components/PriceInfoCard';
import useChartApi from '../hooks/useChartApi';
import useCountApi from '../hooks/useCountApi';

const RecentTransactionsList = lazy(() => import('../components/RecentTransactionsList'));
const TotalSpentMobile = lazy(() => import('../components/TotalSpentMobile'));

const MobileHome = () => {
    const { data } = useCountApi();
    const { data: chartData, filters, isLoading: chartLoading } = useChartApi();
    const { user } = useAppSelector(state => state.reducer.user);
    const showWalletBalance = useShowWalletBalance();
    return (
        <>
            <ServiceSearch variant="filled" />
            <Flex justify="space-between" className="w-full my-4" gap={10}>
                <PriceInfoCard
                    title="Current Month's Spend"
                    value={formatNumberWithLocalString(data?.totalSpendCurrentMonth! || 0)}
                    bgColor="sm-orange-bg"
                    icon={EarningsIcon}
                    currency="₹"
                    isMobile
                />
                <PriceInfoCard
                    title="Total Transactions"
                    value={data?.totalTransactions! || 0}
                    bgColor="sm-violet-bg"
                    icon={MoneyBackIcon}
                    currency=""
                    isMobile
                />
            </Flex>
            <Flex justify="space-between" className="w-full mb-4" gap={10}>
                <PriceInfoCard
                    title="Total Spend"
                    value={formatNumberWithLocalString(data?.totalSpend || 0) ?? '0'}
                    bgColor="sm-green-bg"
                    icon={SpentIcon}
                    currency="₹"
                    isMobile
                />
                {showWalletBalance && (
                    <PriceInfoCard
                        title="Wallet"
                        value={formatNumberWithLocalString(user?.balance ?? 0)}
                        bgColor="sm-yellow-bg"
                        icon={CashbackEverywhere}
                        currency="₹"
                        isMobile
                    />
                )}
            </Flex>
            <Flex justify="center" className="w-full">
                <MobileNav />
            </Flex>
            <Headers />
            <Flex vertical className="w-full mt-5">
                <PekoUpgradePlanAdaptive />
                <PekoCreditsAdaptive />
            </Flex>
            <Flex vertical className="w-full mt-6">
                <TotalSpentMobile filters={filters} chartData={chartData?.filteredResult} />
                <AlertsList />
                <RecentTransactionsList
                    recentData={chartData?.recentTransaction}
                    isLoading={chartLoading}
                />
                <DashboardBussinessCardList />
            </Flex>
        </>
    );
};

export default MobileHome;
