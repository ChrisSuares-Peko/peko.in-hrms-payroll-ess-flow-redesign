import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ReactSVG } from 'react-svg';

import useHideBreadcrumb from '@src/hooks/useHideBreadcrumb';

import FeatureCard from './landing/FeatureCard';
import SupportCard from './landing/SupportCard';
import bankIcon from '../assets/icons/bank.svg';
import keyboardOpenIcon from '../assets/icons/keyboard-open.svg';
import moneyIcon from '../assets/icons/money.svg';
import walletIcon from '../assets/icons/wallet.svg';
import card1 from '../assets/images/card-1.png';
import card2 from '../assets/images/card-2.png';
import card3 from '../assets/images/card-3.png';
import card4 from '../assets/images/card-4.png';
import hero from '../assets/images/hero.png';

const features = [
    {
        title: 'Fast & Easy Ordering',
        description: 'Take orders in seconds with an intuitive interface.',
        image: card1,
    },
    {
        title: 'All Payment Methods',
        description: 'Accept cards, Apple Pay. Google Pay, wallets and more.',
        image: card2,
    },
    {
        title: 'Table Management',
        description: 'Manage dine-in, takeaway and delivery effortlessly.',
        image: card3,
    },
    {
        title: 'Real-time Insights',
        description: 'Track sales, popular items and performance in one place.',
        image: card4,
    },
];

const supports = [
    { title: 'Setup in 48 hours', iconSrc: bankIcon },
    { title: 'Dedicated support', iconSrc: walletIcon },
    { title: 'Ongoing support', iconSrc: moneyIcon },
];

type PekoPosLandingProps = {
    onGetStarted?: () => void;
};

const PekoPosLanding = ({ onGetStarted }: PekoPosLandingProps) => {
    useHideBreadcrumb();

    return (
        <Content className="mx-auto max-w-[1280px] px-4">
            <Flex vertical gap={32} className="py-8">
                <img
                    src={hero}
                    alt="Peko POS"
                    className="h-[220px] md:h-[285px] w-full max-w-[600px] object-fill mx-auto"
                />

                <Flex vertical align="center" gap={12} className="text-center">
                    <Typography.Title className="!text-3xl md:!text-4xl !font-bold !mb-0 !text-[#383838]">
                        Run your restaurant smarter with Peko POS
                    </Typography.Title>
                    <Typography.Text className="text-base leading-relaxed text-[#383838] max-w-[960px]">
                        Manage your restaurant from one simple POS system. Take orders faster,
                        manage tables, handle dine-in, takeaway and delivery, accept payments, and
                        track sales in real time—all from one easy-to-use platform.
                    </Typography.Text>
                </Flex>

                <Flex gap={10} justify="center" wrap="wrap">
                    <Button
                        type="primary"
                        danger
                        size="large"
                        className="!h-10 !px-8 !rounded-md !text-base !font-medium"
                        onClick={onGetStarted}
                    >
                        Get Started
                    </Button>
                    <Button
                        danger
                        size="large"
                        icon={<ReactSVG src={keyboardOpenIcon} className="flex items-center" />}
                        className="!h-10 !px-4 !rounded-md !font-normal"
                        onClick={() => {
                            window.location.href = 'tel:+02248930373';
                        }}
                    >
                        Request for demo
                    </Button>
                </Flex>

                <div className="w-full max-w-[1100px] mx-auto">
                    <Row gutter={[20, 20]}>
                        {features.map(f => (
                            <Col key={f.title} xs={24} sm={12} xl={6}>
                                <FeatureCard {...f} />
                            </Col>
                        ))}
                    </Row>
                </div>

                <Flex vertical gap={16} align="center" className="w-full">
                    <Flex vertical gap={6} align="center" className="text-center">
                        <Typography.Title
                            level={4}
                            className="!font-semibold !mb-0 !text-[#1E293B]"
                        >
                            Quick setup | All payment methods | Built for restaurants
                        </Typography.Title>
                        <Typography.Text className="text-base text-black">
                            Our team is here to help you at every step.
                        </Typography.Text>
                    </Flex>
                    <Row gutter={[18, 18]} className="w-full max-w-[880px]">
                        {supports.map(s => (
                            <Col key={s.title} xs={24} sm={8}>
                                <SupportCard {...s} />
                            </Col>
                        ))}
                    </Row>
                </Flex>
            </Flex>
        </Content>
    );
};

export default PekoPosLanding;
