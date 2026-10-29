import React from 'react';

import { Col, Row } from 'antd';
import { Content } from 'antd/es/layout/layout';

import SoundBoxHeader from '@domains/dashboard/soundbox/components/SoundBoxHeader';
import { soundboxData } from '@domains/dashboard/soundbox/utils/data';

import SoundboxCard from '../components/SoundboxCard';

const SoundboxListing = () => (
    <Content className="px-0 sm:px-6">
        <SoundBoxHeader />
        <Row gutter={[20, 40]} className=" mt-12">
            {soundboxData.map((item, i) => (
                <Col xs={12} sm={12} md={6} lg={12} xl={6} xxl={6} key={i}>
                    <SoundboxCard
                        image={item.image}
                        subImage={item.descImage}
                        id={i}
                        description={item.description}
                    />
                </Col>
            ))}
        </Row>
    </Content>
);

export default SoundboxListing;
