import React from 'react';

import { Button, Col, Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import HealthDetailView from './HealthDetailView';
import VehicleDetailView from './VehicleDetailView';

const DetailViewContent: React.FC<{ isHealthView?: boolean }> = ({ isHealthView }) => (
    <>
        {isHealthView ? <HealthDetailView /> : <VehicleDetailView />}
        <Col xs={24} sm={12} lg={8} xl={4}>
            <Link to="/payment">
                <Button className=" bg-bgOrange2 h-12 " type="primary" danger block>
                    Buy Now
                </Button>
            </Link>
        </Col>
        {isHealthView && (
            <Col span={24}>
                <Flex vertical gap={10}>
                    <Typography.Text className="text-lg font-medium">
                        Members Covered
                    </Typography.Text>
                    <Typography.Text className="text-base font-medium">
                        For Self, Father, Mother, Son and Daughter
                    </Typography.Text>
                </Flex>
            </Col>
        )}
    </>
);

export default DetailViewContent;
