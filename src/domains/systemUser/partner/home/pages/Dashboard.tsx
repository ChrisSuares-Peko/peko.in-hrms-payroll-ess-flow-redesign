import React from 'react';

import { Content } from 'antd/es/layout/layout';

import DashHeader from '@domains/systemUser/partner/home/components/DashHeader';

import Charts from '../components/Charts';
import TodaysHeader from '../components/TodaysHeader';
import useDashboardDetails from '../hooks/useDashboardDetails';

const PartnerDashboard = () => {
    const { isLoading, dashboardData } = useDashboardDetails();
    return (
        <Content className="px-0 mt-10 mb-20 sm:px-6">
            <DashHeader isLoading={isLoading} dashboardData={dashboardData!} />
            <TodaysHeader isLoading={isLoading} dashboardData={dashboardData} />
            <Charts />
        </Content>
    );
};

export default PartnerDashboard;
