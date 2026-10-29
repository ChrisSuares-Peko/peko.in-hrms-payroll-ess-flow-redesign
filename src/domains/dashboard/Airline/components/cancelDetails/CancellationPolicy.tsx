import React from 'react';

import { DownOutlined, RightOutlined } from '@ant-design/icons';
import { Card, Typography, Row, Col, Collapse, Alert } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

import '../../assets/style.css';
import { CancelationCharge } from '../../types/manageBookings';

const CancellationAndRefundPolicy: React.FC<{ cancellationCharges?: CancelationCharge }> = ({
    cancellationCharges,
}) => {
    const customExpandIcon = (panelProps: { isActive?: boolean }) =>
        panelProps.isActive ? <DownOutlined /> : <RightOutlined />;
    const { sm } = useScreenSize();

    const items = [
        {
            key: '1',
            label: (
                <Typography.Title level={5} style={{ margin: 0 }}>
                    Cancellation and Refund Policy
                </Typography.Title>
            ),
            children: (
                <Card
                    style={{ borderRadius: '8px', backgroundColor: '#F8FAFC' }}
                    variant="borderless"
                    styles={{ body: { padding: 0 } }}
                >
                    <Card
                        style={{
                            backgroundColor: '#F8FAFC',
                            borderRadius: '8px',
                        }}
                        variant="borderless"
                        styles={sm ? {} : { body: { padding: 16 } }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col span={12}>
                                <Typography.Text className="text-xs sm:text-sm">
                                    Refund Method
                                </Typography.Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Typography.Text className="text-xs sm:text-sm">
                                    To Original Payment Method
                                </Typography.Text>
                            </Col>

                            <Col span={12}>
                                <Typography.Text className="text-xs sm:text-sm">
                                    Refund Processing Time
                                </Typography.Text>
                            </Col>
                            <Col span={12} style={{ textAlign: 'right' }}>
                                <Typography.Text className="text-xs sm:text-sm">
                                    7-10 Business Days
                                </Typography.Text>
                            </Col>

                        </Row>
                    </Card>
                    <Alert
                        className="text-xs"
                        message="Cancellation/Flight change charges are indicative. Airline policy applicable during cancellation/flight change will be final. We won't be able to accept cancellation/change requests 3 hours before flight departure."
                        type="warning"
                        showIcon={!!sm}
                        style={{ marginTop: '20px' }}
                    />
                </Card>
            ),
            style: {
                backgroundColor: '#F8FAFC',
                borderRadius: '8px',
                border: 'none',
            },
        },
    ];

    return (
        <div className="cancellation-collapse">
            <Collapse
                defaultActiveKey={['1']}
                expandIcon={customExpandIcon}
                expandIconPosition="end"
                style={{ backgroundColor: 'transparent', border: 'none' }}
                items={items}
            />
        </div>
    );
};

export default CancellationAndRefundPolicy;
