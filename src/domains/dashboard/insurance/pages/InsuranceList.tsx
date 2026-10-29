import React from 'react';

import { Row, Col } from 'antd';
import { Content } from 'antd/es/layout/layout';

import SectionHeader from '../components/SectionHeader';
import ServiceListCard from '../components/ServiceListCard';
import { InsuranceServices } from '../utils/data';

const InsuranceList = () => (
    <Content className="px-8">
        <SectionHeader
            title="Insurance"
            subTitle="A Smart, Simple & Secure Platform to Buy Insurance"
        />
        <Row gutter={[40, 20]}>
            {InsuranceServices.map((item, i) => (
                <Col xs={12} sm={6} xl={4} key={i}>
                    <ServiceListCard icon={item.icon} title={item.title} key={i} path={item.path} />
                </Col>
            ))}
        </Row>
    </Content>
);

export default InsuranceList;
