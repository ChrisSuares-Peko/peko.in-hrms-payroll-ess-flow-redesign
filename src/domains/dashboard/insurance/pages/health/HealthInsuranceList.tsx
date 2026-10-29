import React from 'react';

import { Col, Flex } from 'antd';
import { Content } from 'antd/es/layout/layout';

import HeadSearchResult from '../../components/HeaderSearchResult';
import InsuranceListing from '../../components/InsuranceListing';

const HealthList = () => (
    <Content className="sm:px-8">
        <Col span={24}>
            <Flex vertical gap={30}>
                <HeadSearchResult
                    title="Showing 4 Plans for you"
                    description="Members Insured: For self, Father, Mother, Son, Daughter, Mother-in-law, Father-in-law  |  Location: Kochi "
                />
                <InsuranceListing isHealthDrawer drawerFilterName="Cover Amount" />
            </Flex>
        </Col>
    </Content>
);

export default HealthList;
