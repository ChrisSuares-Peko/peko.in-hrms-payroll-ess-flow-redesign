import React from 'react';

import { Col, Row, Skeleton, Typography } from 'antd';

import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import ActiveUser from '@domains/admin/dashboard/assets/icon/Active Users .svg';
import GMV from '@domains/admin/dashboard/assets/icon/GMV.svg';
import RegisteredUser from '@domains/admin/dashboard/assets/icon/Registered Users.svg';
import ServiceProvider from '@domains/admin/dashboard/assets/icon/Service Providers.svg';
import Transaction from '@domains/admin/dashboard/assets/icon/Transactions.svg';
import DetailsCard from '@domains/admin/dashboard/components/DetailsCard';

import { DashboardDetails } from '../types/types';

interface DashHeaderProps {
    dashboardData: DashboardDetails | undefined;
    isLoading: boolean;
}
const TodaysHeader = ({ dashboardData, isLoading }: DashHeaderProps) =>
    isLoading ? (
        <>
            <Typography.Text className="text-xl ">Todays Statistics</Typography.Text>
            <Skeleton active paragraph={{ rows: 5 }} className="pb-5" />
        </>
    ) : (
        <Row gutter={[30, 30]}>
            <Col span={24}>
                <Typography.Text className="text-xl ">Todays Statistics</Typography.Text>
            </Col>
            <Col xs={24} sm={12} md={6} lg={8} className="min-h-10">
                <DetailsCard
                    icon={Transaction}
                    amount={dashboardData?.todaysTransactions}
                    title="Transactions"
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={8} className="min-h-10">
                <DetailsCard
                    icon={GMV}
                    amount={dashboardData?.todaysRevenue}
                    title="GMV"
                    isAmount
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={8} className="min-h-10">
                <DetailsCard
                    isAmount
                    icon={MoneyBackIcon}
                    amount={dashboardData?.todaysCashback}
                    title="Total Commission (excl. GST)"
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={8} className="min-h-10">
                <DetailsCard
                    isAmount
                    icon={ServiceProvider}
                    amount={dashboardData?.todaysNetworkShare}
                    title="System Share (excl. GST)"
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={8} className="min-h-10">
                <DetailsCard
                    icon={RegisteredUser}
                    amount={dashboardData?.todaysCorporateUsers}
                    title="Registered Users"
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={8} className="min-h-10">
                <DetailsCard
                    icon={ActiveUser}
                    amount={dashboardData?.todaysActiveUsers}
                    title="Active Users"
                />
            </Col>
        </Row>
    );

export default TodaysHeader;
