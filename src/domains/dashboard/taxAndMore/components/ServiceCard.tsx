import { Button, Card, Flex, Typography } from 'antd';

import gstIcon from '../assets/icons/gst-filing.svg';
import tdsIcon from '../assets/icons/tds-filing.svg';
import { TaxService } from '../types';

interface ServiceCardProps {
    service: TaxService;
    locked: boolean;
    onCtaClick?: () => void;
}

const SERVICE_ICONS: Record<string, string> = {
    gst: gstIcon,
    tds: tdsIcon,
};

const ServiceCard = ({ service, locked, onCtaClick }: ServiceCardProps) => {
    const icon = SERVICE_ICONS[service.id] ?? SERVICE_ICONS.gst;

    return (
        <Card
            variant="borderless"
            className="h-full rounded-[26px]"
            style={{ boxShadow: '0px 1.4px 14px rgba(0, 0, 0, 0.1)' }}
            styles={{ body: { padding: '40px 45px' } }}
        >
            <Flex vertical gap={16}>
                <Flex
                    align="center"
                    justify="center"
                    className="rounded-[14px] flex-shrink-0 bg-[#F9F6F5]"
                    style={{ width: 80, height: 80 }}
                >
                    <img src={icon} alt={service.title} style={{ height: 60 }} />
                </Flex>

                <Flex vertical gap={6}>
                    <Typography.Title level={4} className="!mb-0 text-valueText">
                        {service.title}
                    </Typography.Title>
                    <Typography.Text className="text-titleText text-sm leading-relaxed">
                        {service.description}
                    </Typography.Text>
                </Flex>

                <Flex vertical gap={12}>
                    {service.features.map(feat => (
                        <Flex key={feat} align="center" gap={8}>
                            <span
                                className="rounded-full flex-shrink-0 bg-[#334155]"
                                style={{ width: 6, height: 6 }}
                            />
                            <Typography.Text className="text-sm leading-5 text-[#374151]">
                                {feat}
                            </Typography.Text>
                        </Flex>
                    ))}
                </Flex>

                <Button
                    type="primary"
                    className="w-fit"
                    disabled={locked}
                    onClick={!locked ? onCtaClick : undefined}
                >
                    {service.ctaLabel}
                </Button>
            </Flex>
        </Card>
    );
};

export default ServiceCard;
