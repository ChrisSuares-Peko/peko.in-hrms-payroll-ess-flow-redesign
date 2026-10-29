import React from 'react';

import { Content } from 'antd/es/layout/layout';

import DashHeader from '@domains/systemUser/ecom_manager/home/components/DashHeader';
import RecentOrders from '@domains/systemUser/ecom_manager/home/components/RecentOrders';
import TotalData from '@domains/systemUser/ecom_manager/home/components/TotalData';

import useEcomGetData from '../hooks/useEcomGetData';

const EcomDashboard = () => {
    const { isLoading, dashboardData } = useEcomGetData();
    return (
        <Content className="px-0 mt-10 mb-20 sm:px-6">
            <DashHeader isLoading={isLoading} dashboardData={dashboardData!} />
            <TotalData
                isLoading={isLoading}
                products={dashboardData?.PRODUCTSCOUNT}
                orders={dashboardData?.TOTAL}
            />
            <RecentOrders />
        </Content>
    );
};

export default EcomDashboard;
