import { Col, Flex, Image, Layout, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import NewSetupIcon from '../assets/img/actions/new-setup.png';
import OngoingSetupIcon from '../assets/img/actions/ongoing-setup.png';
import QuickQuoteIcon from '../assets/img/actions/quick-quote.png';
import RenewalsIcon from '../assets/img/actions/renewals.png';
import globalBusinessSetupLogo from '../assets/img/globalBusinessSetup.png';
import globalBusinessSetupBanner from '../assets/img/pekostart-banner.png';
import GlobalExpansionImg from '../assets/img/promo-cards/global-expansion.png';
import UaeBusinessSetupImg from '../assets/img/promo-cards/uae-business-setup.png';
import UsBusinessSetupImg from '../assets/img/promo-cards/us-business-setup.png';

const { Content } = Layout;
const { Title, Text } = Typography;

const actionCards = [
    {
        title: 'Generate a Quick Quote',
        description:
            'Get your Quick Quote now – fast, simple, and accurate. No delays, no hassles.',
        illustration: QuickQuoteIcon,
        path: paths.globalBusinessSetup.getQuote,
    },
    {
        title: 'New Setup',
        description:
            'Establish your business with the right structure, licensing, and regulatory approvals.',
        illustration: NewSetupIcon,
        path: paths.globalBusinessSetup.getStarted,
    },
    {
        title: 'Ongoing Setup',
        description:
            'Keep your business running smoothly with continuous operational and compliance support.',
        illustration: OngoingSetupIcon,
        path: paths.globalBusinessSetup.ongoingSetups,
    },
    {
        title: 'Renewals',
        description:
            ' Ensure your licenses, permits, and registrations remain valid without interruptions.',
        illustration: RenewalsIcon,
        path: paths.globalBusinessSetup.renewals,
    },
];

const promoCards = [
    {
        title: 'UAE Business Setup',
        description:
            'Start your business in the UAE with ease. Fast, reliable, and 100% hassle-free.',
        image: UaeBusinessSetupImg,
    },
    {
        title: 'Go Global with Confidence',
        description:
            'Expand your business across 45+ countries. One platform, endless opportunities.',
        image: GlobalExpansionImg,
    },
    {
        title: 'US Business Setup',
        description:
            'Register your US business quickly and easily. Trusted. Compliant. Hassle-free.',
        image: UsBusinessSetupImg,
    },
];

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { xs } = useScreenSize();

    return (
        xs !== undefined && (
            <Content
                style={{ maxWidth: 1200, margin: '0 auto', padding: xs ? '0 16px' : '0 20px' }}
            >
                {/* Global Business Setup Logo */}
                <Flex justify="center" className="mt-4 mb-8">
                    <Image src={globalBusinessSetupLogo} alt="Global Business Setup" preview={false} width={150} />
                </Flex>

                {/* Action Cards */}
                <Row gutter={[20, 20]} className="mb-8">
                    {actionCards.map((card, index) => (
                        <Col xs={12} md={6} key={index}>
                            <Flex
                                vertical
                                align="center"
                                onClick={() => navigate(card.path)}
                                className="bg-white rounded-[20px] px-5 pt-7 pb-6 cursor-pointer h-full"
                                style={{ boxShadow: '0px 1.4px 14px rgba(0, 0, 0, 0.1)' }}
                            >
                                <Text className="text-base sm:text-xl font-medium text-center block break-normal">
                                    {card.title}
                                </Text>

                                <div className="flex items-center justify-center h-24 w-full my-4">
                                    <Image
                                        src={card.illustration}
                                        alt={card.title}
                                        preview={false}
                                        style={{ maxHeight: 96, objectFit: 'contain' }}
                                    />
                                </div>

                                <Text className="text-xs text-center text-black leading-5 block">
                                    {card.description}
                                </Text>
                            </Flex>
                        </Col>
                    ))}
                </Row>

                {/* Banner Section */}
                <div
                    className="rounded-3xl overflow-hidden relative mb-8"
                    style={{
                        background: 'linear-gradient(to left, #F0F7FF, #FFF2F2)',
                    }}
                >
                    <Row align="middle" className="h-full">
                        <Col xs={24} md={14}>
                            <div className={xs ? 'p-6' : 'p-14'}>
                                <Title
                                    level={xs ? 3 : 2}
                                    className="!mb-1"
                                    style={{ fontWeight: 600, lineHeight: 1.38 }}
                                >
                                    Set up in any of the 45+ free zones of the UAE.
                                </Title>
                                <Text
                                    className="text-lg md:text-xl"
                                    style={{ color: '#212121', lineHeight: 1.78 }}
                                >
                                    Start setting up your companies now.
                                </Text>
                            </div>
                        </Col>
                        <Col xs={0} md={10}>
                            <div className="flex items-center justify-end h-full">
                                <Image
                                    src={globalBusinessSetupBanner}
                                    alt="Banner"
                                    preview={false}
                                    style={{ maxHeight: 220, objectFit: 'contain' }}
                                />
                            </div>
                        </Col>
                    </Row>
                </div>

                {/* Promotional Cards */}
                <Row gutter={[20, 20]} className="mb-8">
                    {promoCards.map((card, index) => (
                        <Col xs={24} sm={12} md={8} key={index}>
                            <div
                                className="bg-white rounded-3xl overflow-hidden border border-neutral-200 h-full"
                                style={{
                                    boxShadow: '0px 1.2px 12.4px 1.1px rgba(0, 0, 0, 0.06)',
                                }}
                            >
                                <div className="w-full h-40 overflow-hidden">
                                    <Image
                                        src={card.image}
                                        alt={card.title}
                                        preview={false}
                                        width="100%"
                                        height="100%"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            display: 'block',
                                        }}
                                    />
                                </div>

                                <div className="px-7 pt-4 pb-6">
                                    <Text className="text-lg font-medium block mb-1">
                                        {card.title}
                                    </Text>
                                    <Text className="text-base block">{card.description}</Text>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Content>
        )
    );
};

export default SubscriptionPage;
