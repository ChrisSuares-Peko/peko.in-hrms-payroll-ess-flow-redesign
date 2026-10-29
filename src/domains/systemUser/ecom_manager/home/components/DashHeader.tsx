import React from 'react';

import { Col, Grid, Row } from 'antd';

import ConfirmedIcon from '@domains/systemUser/ecom_manager/home/assets/icons/confirmed.svg';
import DeliveredIcon from '@domains/systemUser/ecom_manager/home/assets/icons/delivered.svg';
import InProgressIcon from '@domains/systemUser/ecom_manager/home/assets/icons/inProgress.svg';
import PendingIcon from '@domains/systemUser/ecom_manager/home/assets/icons/pending.svg';
import ShippedIcon from '@domains/systemUser/ecom_manager/home/assets/icons/shipped.svg';
import DetailsCard from '@domains/systemUser/ecom_manager/home/components/DetailsCard';

import { dashboardStatusData } from '../types/types';

const { useBreakpoint } = Grid;

type Props = {
    isLoading: boolean;
    dashboardData: dashboardStatusData;
};
const DashHeader = ({ dashboardData, isLoading }: Props) => {
    const screens = useBreakpoint();
    const justify = screens.xl ? 0 : 20;
    const dashData = [
        {
            bgColor: 'bg-bgLightPink',
            icon: PendingIcon,
            title: 'Pending Orders',
            amount: dashboardData.PENDING,
        },
        {
            bgColor: 'bg-bgOrangeYellow',
            icon: ConfirmedIcon,
            title: 'Confirmed Orders ',
            amount: dashboardData.CONFIRMED,
        },
        {
            bgColor: 'bg-bgBlue',
            icon: InProgressIcon,
            title: 'Orders in Progress',
            amount: dashboardData.ONPROGRESS,
        },
        {
            bgColor: 'bg-bgOceanBlue',
            icon: ShippedIcon,
            title: 'Orders Shipped',
            amount: dashboardData.SHIPPED,
        },
        {
            bgColor: 'bg-bgLightGreen',
            icon: DeliveredIcon,
            title: 'Orders Delivered',
            amount: dashboardData.DELIVERED,
        },
    ];
    return (
        <Row justify="space-between" gutter={[justify, 20]}>
            {dashData.map((item, i) => (
                <Col xs={24} sm={12} md={6} lg={12} xl={4} key={i}>
                    <DetailsCard
                        icon={item.icon}
                        bgColor={item.bgColor}
                        amount={item.amount}
                        title={item.title}
                    />
                </Col>
            ))}
        </Row>
    );
};

export default DashHeader;
