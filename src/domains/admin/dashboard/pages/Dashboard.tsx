import React from 'react';

import { Content } from 'antd/es/layout/layout';

import MobileNav from '@components/molecular/nav-section/mobile-nav/MobileNav';
import DashHeader from '@domains/admin/dashboard/components/DashHeader';
import TodaysData from '@domains/admin/dashboard/components/TodaysData';
import useScreenSize from '@src/hooks/useScreenSize';

import ChartSection from '../components/ChartSection';
import useGetData from '../hooks/useGetData';

const Dashboard = () => {
    const { isLoading, monthlyCorporates, monthlyStatistic, todayData, totalData } = useGetData();
    const { lg } = useScreenSize();
    return (
        <Content>
            <DashHeader totalData={totalData} isLoading={isLoading} />
            <TodaysData todayData={todayData!} isLoading={isLoading} />
            {!lg && <MobileNav />}
            <ChartSection
                monthlyCorporates={monthlyCorporates!}
                monthlyStatistic={monthlyStatistic!}
                isLoading={isLoading}
            />
        </Content>
    );
};

export default Dashboard;
