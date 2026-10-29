import { Col, Flex, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import copyrightIcon from '../../../assets/icons/copyright.svg';
import moneysIcon from '../../../assets/icons/moneys.svg';
import { setSelectedService } from '../../../slices';

const { Text } = Typography;

interface ServiceCardItem {
    nameKeyword: string;
    icon: string;
    title: string;
    description: string;
}

const serviceCards: ServiceCardItem[] = [
    {
        nameKeyword: 'msme',
        icon: moneysIcon,
        title: 'You may be eligible for MSME benefits',
        description: 'Get access to collateral-free loans, subsidies, and protection against delayed payments',
    },
    {
        nameKeyword: 'trademark',
        icon: copyrightIcon,
        title: 'Protect your brand with Trademark',
        description: 'Secure exclusive rights to your brand name and logo with legal protection',
    },
];

const ServiceCards = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const servicesList = useAppSelector((state) => state.reducer.governmentServices.servicesList);

    const handleLearnMore = (nameKeyword: string) => {
        const service = servicesList.find((s) => s.name.toLowerCase().includes(nameKeyword));
        if (!service) return;
        dispatch(setSelectedService(service));
        navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${service.id}`);
    };

    const visibleCards = serviceCards.filter((card) =>
        servicesList.some((s) => s.name.toLowerCase().includes(card.nameKeyword))
    );

    if (!visibleCards.length) return null;

    return (
        <Row gutter={[16,16]}>
            {visibleCards.map((card) => (
                <Col xs={24} md={12} key={card.nameKeyword}>
                    <Flex gap={12} align="flex-start" className="rounded-lg p-4 h-full" style={{ border: '1px solid #F0F0F0', backgroundColor: '#F8FAFC' }}>
                        <img src={card.icon} alt={card.title} width={44} height={44} className="flex-shrink-0" />
                        <Flex vertical gap={4}>
                            <Text strong className="text-sm">
                                {card.title}
                            </Text>
                            <Text className="text-xs" style={{ color: '#8C8C8C' }}>
                                {card.description}
                            </Text>
                            <Text
                                className="text-xs font-medium cursor-pointer mt-1"
                                style={{ color: '#FF3A3A' }}
                                onClick={() => handleLearnMore(card.nameKeyword)}
                            >
                                Learn more &gt;
                            </Text>
                        </Flex>
                    </Flex>
                </Col>
            ))}
        </Row>
    );
};

export default ServiceCards;
