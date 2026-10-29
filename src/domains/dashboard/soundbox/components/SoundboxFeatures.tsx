import React from 'react';

import { Button, Col, Flex, Row, Typography, theme } from 'antd';
import { useNavigate } from 'react-router-dom';

function SoundboxFeatures() {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const navigate = useNavigate();
    const handleNavigate = () => {
        navigate('/sound-box/order-details');
    };
    return (
        <Col span={24}>
            <Row gutter={[30, 30]}>
                <Col xs={24} sm={24} md={12}>
                    <Flex justify="space-between" className="p-4 bg-bgSoundbox">
                        <Typography.Text>Battery Backup</Typography.Text>
                        <Typography.Text>5 Days</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={24} md={12}>
                    <Flex justify="space-between" className="p-4 bg-bgSoundbox">
                        <Typography.Text>Speakers</Typography.Text>
                        <Typography.Text>4W</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={24} md={12}>
                    <Flex justify="space-between" className="p-4 bg-bgSoundbox">
                        <Typography.Text>Connectivity</Typography.Text>
                        <Typography.Text>4G</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={24} md={12}>
                    <Flex justify="space-between" className="p-4 bg-bgSoundbox">
                        <Typography.Text>Charging</Typography.Text>
                        <Typography.Text>Type C</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={24} md={12}>
                    <Flex justify="space-between" className="p-4 bg-bgSoundbox">
                        <Typography.Text>LCD Display</Typography.Text>
                        <Typography.Text>Yes</Typography.Text>
                    </Flex>
                </Col>
                <Col xs={24} sm={24} md={12}>
                    <Flex justify="space-between" className="p-4 bg-bgSoundbox">
                        <Typography.Text>Bluetooth</Typography.Text>
                        <Typography.Text>Na</Typography.Text>
                    </Flex>
                </Col>
            </Row>
            <Button
                style={{ backgroundColor: colorPrimary }}
                size="middle"
                className="mt-5 text-white"
                onClick={handleNavigate}
            >
                Get Your Soundbox
            </Button>
        </Col>
    );
}

export default SoundboxFeatures;
