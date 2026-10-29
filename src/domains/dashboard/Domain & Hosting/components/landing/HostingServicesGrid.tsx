import React from 'react';

import { Row, Typography } from 'antd';

import HostingServiceCard from './HostingServiceCard';

const { Title } = Typography;

interface ServiceItem {
    planType: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    path: string;
    infoPath: string;
}

interface Props {
    visibleServices: ServiceItem[];
    startingPriceMap: Record<string, number>;
    colSpan: number;
    onNavigate: (path: string) => void;
}

const HostingServicesGrid: React.FC<Props> = ({
    visibleServices,
    startingPriceMap,
    colSpan,
    onNavigate,
}) => (
    <>
        <div className="mb-8 text-center">
            <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
                Extend Your Online Capabilities
            </Title>
        </div>
        <Row gutter={[16, 16]} justify="center">
            {visibleServices.map((service, index) => (
                <HostingServiceCard
                    key={index}
                    service={service}
                    startingPrice={startingPriceMap[service.planType]}
                    colSpan={colSpan}
                    onNavigate={onNavigate}
                />
            ))}
        </Row>
    </>
);

export default HostingServicesGrid;
