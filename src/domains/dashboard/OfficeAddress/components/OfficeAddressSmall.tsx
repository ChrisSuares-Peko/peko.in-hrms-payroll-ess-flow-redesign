import React from 'react';

import { Col, Row, Button, Typography, Flex, Empty, Skeleton } from 'antd';
import { Link, useNavigate } from 'react-router-dom';

import MoreTransactions from '@assets/svg/moretransactions.svg';
import { paths } from '@src/routes/paths';

import PlanCardMobile from './PlanCardMobile';
import usePlansApi from '../hooks/usePlansApi';

const OfficeAddressSmall = () => {
    const { plans, isLoading } = usePlansApi({ initialLoading: true });
    const navigate = useNavigate();

    return (
        <Skeleton loading={isLoading} active>
            <Flex justify="space-between" className="mt-5" align="center">
                <Flex align="center">
                    <Typography.Text className="text-lg font-medium sm:text-xl">
                        Office Address
                    </Typography.Text>
                </Flex>
                <Flex>
                    <Link to={paths.officeAddress.orderhistory}>
                        <Button danger className="px-3">
                            Order History
                        </Button>
                    </Link>
                </Flex>
            </Flex>

            <Row gutter={[20, 40]} className="my-7">
                {plans && plans.data?.length > 0 ? (
                    plans.data.map(plan => (
                        <Col key={plan.id} xs={24} sm={12} md={8}>
                            <PlanCardMobile plan={plan} />
                        </Col>
                    ))
                ) : (
                    <Flex vertical className="w-full my-14" justify="center" align="center">
                        <Empty
                            image={MoreTransactions}
                            imageStyle={{ display: 'flex', justifyContent: 'center' }}
                            description="No plans available at the moment"
                        />
                        <Button
                            danger
                            type="primary"
                            className="w-2/4 my-10"
                            onClick={() => navigate(paths.dashboard.home)}
                        >
                            Go to Dashboard
                        </Button>
                    </Flex>
                )}
            </Row>
        </Skeleton>
    );
};

export default OfficeAddressSmall;
