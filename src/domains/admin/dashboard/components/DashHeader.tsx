import React from 'react';

import { Col, Row, Skeleton } from 'antd';

import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import ActiveUser from '@domains/admin/dashboard/assets/icon/Active Users .svg';
import GMV from '@domains/admin/dashboard/assets/icon/GMV.svg';
import RegisteredUser from '@domains/admin/dashboard/assets/icon/Registered Users.svg';
import ServiceProvider from '@domains/admin/dashboard/assets/icon/Service Providers.svg';
import Transaction from '@domains/admin/dashboard/assets/icon/Transactions.svg';
import DetailsCard from '@domains/admin/dashboard/components/DetailsCard';

import { totalDatas } from '../types/types';

interface DashHeaderProps {
    totalData: totalDatas | undefined;
    isLoading: boolean;
}
const DashHeader = ({ totalData, isLoading }: DashHeaderProps) =>
    isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} className="pb-5" />
    ) : (
        <>
            <Row gutter={[30, 30]} className="mb-[30px]">
                <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={Transaction}
                        amount={totalData?.totalTransactions}
                        title="Transactions"
                    />
                </Col>
                <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard icon={GMV} amount={totalData?.totalRevenue} title="GMV" isAmount />
                </Col>
                <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        isAmount
                        icon={MoneyBackIcon}
                        amount={totalData?.totalCashback}
                        title="Commission (excl. GST)"
                    />
                </Col>
                <Col xs={24} sm={12} md={6} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={ServiceProvider}
                        amount={totalData?.totalVendors}
                        title="Service Providers"
                    />
                </Col>
            </Row>
            <Row gutter={[30, 30]} className="mb-[30px]">
                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={RegisteredUser}
                        amount={totalData?.totalCorporates}
                        title="Registered Users"
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={ActiveUser}
                        amount={totalData?.activeUsers}
                        title="Active Users (Last 1 Month)"
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={ActiveUser}
                        amount={totalData?.activeUsersTillDate}
                        title="Active Users (Till Date)"
                    />
                </Col>
            </Row>
            <Row gutter={[30, 30]}>
                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={RegisteredUser}
                        amount={totalData?.totalCustomers}
                        title="Total Customers"
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={ActiveUser}
                        amount={totalData?.activeCustomers}
                        title="Active Customers (Last 1 Month)"
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={6} className="min-h-10">
                    <DetailsCard
                        icon={ActiveUser}
                        amount={totalData?.activeCustomersTillDate}
                        title="Active Customers (Till Date)"
                    />
                </Col>
            </Row>
        </>
    );

export default DashHeader;
