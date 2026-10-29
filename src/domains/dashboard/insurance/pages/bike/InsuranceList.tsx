import React from 'react';

import { Col, Flex, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import HeadSearchResult from '../../components/HeaderSearchResult';
import InsuranceListing from '../../components/InsuranceListing';

const InsuranceList = () => (
    <Content className="sm:px-8">
        <Row>
            <Col span={24}>
                <Flex vertical gap={30}>
                    <HeadSearchResult
                        description="Existing Policy Expiry: 29 Mar 2024 | New No Claim Bonus (NCB): 50% | Current
                    Insurer: New India - Comprehensive"
                    />
                    <InsuranceListing drawerFilterName="Addons" />
                </Flex>
            </Col>
        </Row>
    </Content>
);

export default InsuranceList;
