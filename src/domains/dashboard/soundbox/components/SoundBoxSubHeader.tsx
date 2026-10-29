import React from 'react';

import { Button, Col, Row, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

const SoundBoxSubHeader = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const navigate = useNavigate();
    const handleNavigate = () => {
        navigate('/sound-box/details');
    };
    return (
        <Row gutter={[20, 20]}>
            <Col span={24}>
                <Button
                    style={{ backgroundColor: colorPrimary, color: 'white' }}
                    size="middle"
                    className="mt-5"
                    onClick={handleNavigate}
                >
                    Get Your Soundbox
                </Button>
            </Col>

            <Col span={24}>
                <Typography.Paragraph className=" text-lg font-medium ">
                    Know Your Soundbox Better
                </Typography.Paragraph>
            </Col>
        </Row>
    );
};

export default SoundBoxSubHeader;
