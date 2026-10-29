import React from 'react';

import { Col, Row, Tabs } from 'antd';
import { Content } from 'antd/es/layout/layout';

import companyLogo from '@src/domains/dashboard/insurance/assets/images/companyLogo.png';

import DetailViewContent from '../../components/DetailViewContent';
import DetailViewHeader from '../../components/DetailViewHeader';
import DocumentDownload from '../../components/DocumentDownload';
import { detailPageTabs } from '../../utils/TabData';

const HealthInsuranceDetails = () => (
    <Content className="sm:px-8">
        <Row gutter={[0, 40]}>
            <DetailViewHeader
                logo={companyLogo}
                title="HDFC Ergo Optima Secure"
                description="20 Cashless Hospitals in Kottayam"
            />
            <DetailViewContent isHealthView />
            <Col span={24}>
                <Tabs defaultActiveKey="1" items={detailPageTabs} />
            </Col>
            <DocumentDownload />
        </Row>
    </Content>
);

export default HealthInsuranceDetails;
