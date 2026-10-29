// OfficeAddressLarge.tsx
import React from 'react';

import { Col, Row, Button, Typography, Flex, Image, Skeleton, Empty } from 'antd';
import { Link } from 'react-router-dom';

import MoreTransactions from '@assets/svg/moretransactions.svg';
import securityImage from '@src/domains/dashboard/OfficeAddress/assets/icons/iconly.png';
import { paths } from '@src/routes/paths';

import IconCard from './IconCard';
import PlanCardWeb from './PlanCardWeb';
import usePlansApi from '../hooks/usePlansApi';
import { iconCards } from '../utils/data';

const OfficeAddressLarge = () => {
    const { isLoading, plans } = usePlansApi({ initialLoading: true });

    return (
        <Skeleton loading={isLoading} active>
            <Flex justify="space-between" align="center">
                <Flex align="center">
                    <Typography.Text className="text-lg font-medium sm:text-2xl">
                        Office Address
                    </Typography.Text>
                </Flex>
                <Flex className="mb-1">
                    <Link to={paths.officeAddress.orderhistory}>
                        <Button size="middle" danger className="px-5">
                            Order History
                        </Button>
                    </Link>
                </Flex>
            </Flex>
            <Flex className="w-full my-6" justify="center">
                <Typography.Text className="text-2xl font-light text-center">
                    Give your business an address it deserves
                </Typography.Text>
            </Flex>

            <Row justify="center" gutter={[20, 30]} className="py-4">
                {plans && plans.data.length > 0 ? (
                    plans.data.map((plan, i) => (
                        <Col key={i} xs={24} sm={12} md={10} lg={11} xl={7}>
                            <PlanCardWeb plan={plan} />
                        </Col>
                    ))
                ) : (
                    <Empty
                        className="my-10"
                        image={MoreTransactions}
                        imageStyle={{ display: 'flex', justifyContent: 'center' }}
                        description="No plans available at the moment"
                    />
                )}
            </Row>

            <Typography.Paragraph className="mt-8 text-xl text-center">
                How Office Address Works?
            </Typography.Paragraph>

            <Row className="h-full my-8" justify="center" gutter={[20, 20]}>
                {iconCards.map((item, i) => (
                    <Col key={i} xs={24} sm={12} xl={6} xxl={5}>
                        <IconCard title={item.title} icon={item.icon} count={item.count} />
                    </Col>
                ))}
            </Row>
            <Flex gap={10} align="middle" justify="center">
                <Image preview={false} className="mr-5" width={20} src={securityImage} />
                <Typography.Text className="text-titleDescription">
                    Secure virtual or coworking space and client assistance
                </Typography.Text>
            </Flex>
        </Skeleton>
    );
};

export default OfficeAddressLarge;
