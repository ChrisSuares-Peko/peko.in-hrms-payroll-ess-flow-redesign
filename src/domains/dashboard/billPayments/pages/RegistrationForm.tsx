import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import BharathConnect from '@src/domains/dashboard/billPayments/assets/svg/BharatConnect.svg';

import ComplaintForm from '../components/complaintRegistration/ComplaintForm';

const { Text } = Typography;
const RegistrationForm = () => (
        <Row>
            <Col xs={24}>
                <Flex justify="space-between">
                    <Text className="font-medium text-lg sm:text-xl">Raise a Complaint</Text>
                    <Flex vertical gap={15}>
                        <ReactSVG
                            className="ml-16"
                            src={BharathConnect}
                            beforeInjection={svg => {
                                svg.setAttribute('style', 'width: 85px; height: 40px;');
                            }}
                        />
                    </Flex>
                </Flex>
            </Col>
            <Col xs={24} xl={12}>
                <ComplaintForm />
            </Col>
        </Row>
    );

export default RegistrationForm;
