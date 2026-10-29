import React from 'react';

import { Col, Row, Skeleton, Typography } from 'antd';

import MoneyBackIcon from '@assets/icons/MoneyBack.svg';
import GMV from '@domains/admin/dashboard/assets/icon/GMV.svg';
import RegisteredUser from '@domains/admin/dashboard/assets/icon/Registered Users.svg';
import Transaction from '@domains/admin/dashboard/assets/icon/Transactions.svg';
import DetailsCard from '@domains/admin/dashboard/components/DetailsCard';

import { todaysDatas } from '../types/types';

interface TodaysDataProps {
    todayData: todaysDatas;
    isLoading: boolean;
}
const TodaysData = ({ todayData, isLoading }: TodaysDataProps) =>
    isLoading ? (
        <>
            <Typography.Text className="text-xl pt-10">Todays Statistics</Typography.Text>
            <Skeleton active paragraph={{ rows: 5 }} className="mt-5" />
        </>
    ) : (
        <Row gutter={[20, 25]} className="pt-10 xs:mb-10 lg:mb-0">
            <Col span={24}>
                <Typography.Text className="text-xl ">Todays Statistics</Typography.Text>
            </Col>
            <Col xs={24} sm={12} md={6} lg={12} xl={6}>
                <DetailsCard
                    icon={Transaction}
                    title="Transactions"
                    amount={todayData?.todaysTransactions}
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={12} xl={6}>
                <DetailsCard
                    icon={GMV}
                    title="GMV"
                    isAmount
                    amount={todayData?.todaysRevenue ?? 0}
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={12} xl={6}>
                <DetailsCard
                    isAmount
                    icon={MoneyBackIcon}
                    title="Commission (excl. GST)"
                    amount={todayData?.todaysCashback ?? 0}
                />
            </Col>
            <Col xs={24} sm={12} md={6} lg={12} xl={6}>
                <DetailsCard
                    icon={RegisteredUser}
                    title="Registered Users"
                    amount={todayData?.todaysCorporateUsers}
                />
            </Col>
        </Row>
    );

export default TodaysData;
