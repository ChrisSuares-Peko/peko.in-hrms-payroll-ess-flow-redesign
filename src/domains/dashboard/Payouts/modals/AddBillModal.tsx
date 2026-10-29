import React from 'react';

import { CloseOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Drawer, Row, Space, Tag, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import rentIcon from '../assets/billIcons/linkIcon.svg';
import billPayoutIcon from '../assets/billIcons/mobileIcon.svg';
import vendorIcon from '../assets/billIcons/vendorpayIcon.svg';


const { Text, Title } = Typography;

interface AddBillModalProps {
    visible: boolean;
    onCancel: () => void;
    onSelect: (route: string) => void;
}

const billOptions = [
    {
        key: 'bill-payout',
        title: 'Bill Payout',
        subtitle: 'Pay to vendor invoices',
        icon: billPayoutIcon,
        bgColor: '#FFF1F2',
        route: '/payouts/bill-payout',
        comingSoon: false,
    },
    {
        key: 'rent',
        title: 'Rent',
        subtitle: 'Property & Office Rent',
        icon: rentIcon,
        bgColor: '#FFF1F2',
        route: '/payouts/rent',
        comingSoon: false,
    },
    {
        key: 'vendor-payments',
        title: 'Vendor Payments',
        subtitle: 'Suppliers & Vendors',
        icon: vendorIcon,
        bgColor: '#FFF1F2',
        route: '/payouts/vendor-payments',
        comingSoon: false,
    },
    {
        key: 'other-payments',
        title: 'Other Payments',
        subtitle: 'Miscellaneous Expenses',
        icon: vendorIcon,
        bgColor: '#FFF1F2',
        route: '/payouts/other-bills',
        comingSoon: false,
    },
];

const AddBillModal: React.FC<AddBillModalProps> = ({ visible, onCancel, onSelect }) => {
    const onOptionClick = (route: string) => {
        onCancel();
        onSelect(route);
    };

    return (
        <Drawer
            title={
                <Space direction="vertical" size={2}>
                    <Title level={4} className="m-0">
                        Add New Bill
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                        Select a category to continue
                    </Text>
                </Space>
            }
            open={visible}
            onClose={onCancel}
            footer={null}
            placement="right"
            width={480}
            closable={false}
            extra={
                <Button type="text" icon={<CloseOutlined />} onClick={onCancel} />
            }
        >
            <Text strong  className="mb-3 block text-lg">
                Select Bill Category
            </Text>

            <Space direction="vertical" size={12} className="w-full mt-4">
                {billOptions.map(option => (
                    <Card
                        key={option.key}
                        hoverable={!option.comingSoon}
                        onClick={() => !option.comingSoon && onOptionClick(option.route)}
                        styles={{ body: { padding: '12px 16px' } }}
                        style={{
                            borderRadius: 12,
                            borderColor: '#e5e7eb',
                            opacity: option.comingSoon ? 0.6 : 1,
                            cursor: option.comingSoon ? 'not-allowed' : 'pointer',
                        }}
                    >
                        <Row align="middle" justify="space-between" wrap={false}>
                            <Col>
                                <Row align="middle" gutter={14} wrap={false}>
                                    <Col>
                                        <div style={{ background: option.bgColor, borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <ReactSVG
                                                src={option.icon}
                                                beforeInjection={(svg) => {
                                                    svg.setAttribute('width', '16');
                                                    svg.setAttribute('height', '16');
                                                    svg.querySelectorAll('path, circle, rect, polygon').forEach(el => el.setAttribute('fill', '#FF4F4F'));
                                                }}
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }}
                                            />
                                        </div>
                                    </Col>
                                    <Col>
                                        <Space direction="vertical" size={2}>
                                            <Space size={8}>
                                                <Text strong style={{ fontSize: 14 }}>
                                                    {option.title}
                                                </Text>
                                                {option.comingSoon && (
                                                    <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>Coming Soon</Tag>
                                                )}
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {option.subtitle}
                                            </Text>
                                        </Space>
                                    </Col>
                                </Row>
                            </Col>
                            <Col>
                                {!option.comingSoon && <RightOutlined style={{ color: '#9ca3af', fontSize: 12 }} />}
                            </Col>
                        </Row>
                    </Card>
                ))}
            </Space>
        </Drawer>
    );
};

export default AddBillModal;
