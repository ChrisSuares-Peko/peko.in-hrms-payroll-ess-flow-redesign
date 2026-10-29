import React from 'react';

import { Button, Card, Col, Flex, Typography } from 'antd';

const { Title, Text } = Typography;

interface ServiceItem {
    planType: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    infoPath: string;
}

interface Props {
    service: ServiceItem;
    startingPrice: number | null | undefined;
    colSpan: number;
    onNavigate: (path: string) => void;
}

const HostingServiceCard: React.FC<Props> = ({ service, startingPrice, colSpan, onNavigate }) => (
    <Col xs={24} sm={24} md={12} xl={colSpan} className="flex">
        <Card
            className="rounded-2xl border border-gray-200 h-full w-full"
            styles={{
                body: {
                    padding: '24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                },
            }}
        >
            <div className="bg-[#FCF7FF] rounded-xl p-6 mb-4 flex justify-center">
                {service.icon}
            </div>
            <Title level={4} className="!mb-2 font-bold">
                {service.title}
            </Title>
            <Text className="text-gray-500 text-sm font-medium block mb-3 line-clamp-3">
                {service.description}
            </Text>
            <Flex justify="center" className="mb-4" style={{ marginTop: 'auto' }}>
                <Button
                    type="link"
                    className="!text-brandPrimary hover:!text-brandPrimary !underline !text-sm !p-0"
                    onClick={() => onNavigate(service.infoPath)}
                >
                    Learn More
                </Button>
            </Flex>
            <div className="border border-gray-200 rounded-2xl p-5">
                <Text className="text-gray-400 text-sm font-medium block">Starting at</Text>
                <Title level={3} className="!mb-3 font-bold">
                    {startingPrice != null ? `₹ ${Number(startingPrice).toFixed(2)}` : '—'}
                </Title>
                <Button
                    className="border-brandPrimary text-brandPrimary rounded-lg font-medium px-8"
                    onClick={() => onNavigate(service.path)}
                >
                    Get Started
                </Button>
            </div>
        </Card>
    </Col>
);

export default HostingServiceCard;
