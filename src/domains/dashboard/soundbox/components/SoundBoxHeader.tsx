import React from 'react';

import { Col, Row, Typography } from 'antd';

const SoundBoxHeader = () => (
    <Row align="middle" gutter={[20, 6]}>
        <Col span={24}>
            <Typography.Paragraph
                className=" text-lg font-medium  "
                style={{ paddingLeft: '.625rem' }}
            >
                Soundbox
            </Typography.Paragraph>
        </Col>

        <Col span={24}>
            <Typography.Paragraph
                className="text-gray-500  text-base font-light "
                style={{ paddingLeft: '.625rem' }}
            >
                The Sound of Indias Payment Revolution
            </Typography.Paragraph>
        </Col>
    </Row>
);

export default SoundBoxHeader;
