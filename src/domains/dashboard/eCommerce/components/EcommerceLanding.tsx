import { MessageOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import FeatureCard from './landing/FeatureCard';
import StepCard from './landing/StepCard';
import productsIcon from '../assets/icons/products.svg';
import sellIcon from '../assets/icons/sell.svg';
import storeIcon from '../assets/icons/store.svg';
import subscribeIcon from '../assets/icons/subscribe.svg';
import card1 from '../assets/images/card-1.png';
import card2 from '../assets/images/card-2.png';
import card3 from '../assets/images/card-3.png';
import card4 from '../assets/images/card-4.png';

const features = [
    {
        title: 'Your Own Online Store',
        description:
            'Launch a branded storefront in minutes and select ready-made themes tailored to your business.',
        image: card1,
    },
    {
        title: 'Accept Online Payments',
        description: 'Connect your preferred payment gateway and start collecting instantly.',
        image: card2,
    },
    {
        title: 'Manage Orders with Ease',
        description: 'Track orders, update status, and manage deliveries in one place.',
        image: card3,
    },
    {
        title: 'Sales Overview',
        description: 'See revenue, top products, and order trends at a glance — so you always know how your store is performing.',
        image: card4,
    },
];

const steps = [
    { title: 'Subscribe', description: 'Choose your plan and activate.', iconSrc: subscribeIcon },
    {
        title: 'Configure Store',
        description: 'Add store name and select theme.',
        iconSrc: storeIcon,
    },
    {
        title: 'Add Products',
        description: 'Upload products, pricing, and inventory.',
        iconSrc: productsIcon,
    },
    {
        title: 'Start Selling',
        description: 'Publish and begin accepting orders.',
        iconSrc: sellIcon,
    },
];

type EcommerceLandingProps = {
    onSubscribe?: () => void;
};

const EcommerceLanding = ({ onSubscribe }: EcommerceLandingProps) => (
    <Content className="mx-auto max-w-[1280px] px-4">
        <Flex vertical gap={36} className="py-8">
            <Flex vertical align="center" gap={12} className="text-center">
                <Typography.Title className="!text-3xl md:!text-4xl xl:!text-5xl !font-bold !mb-0 !text-[#313131]">
                    Your online store, ready in minutes.
                </Typography.Title>
                <Typography.Text className="text-base md:text-lg xl:text-xl text-[#313131] max-w-6xl">
                    Set up a fully branded store with ready-made themes and powerful tools - no
                    technical skills needed.
                </Typography.Text>
            </Flex>

            <Row gutter={[20, 20]}>
                {features.map((f, i) => (
                    <Col key={i} xs={24} sm={12} xl={6}>
                        <FeatureCard {...f} />
                    </Col>
                ))}
            </Row>

            <Flex vertical gap={12} className="text-center max-w-6xl mx-auto">
                <Typography.Paragraph className="!mb-0 text-base md:text-lg leading-relaxed text-[#383838]">
                    Launch your brand online—without building anything. With Peko, you can set up a
                    fully branded online store in minutes, not weeks. No coding, no complex
                    integrations—just choose from ready-made themes and customize them to reflect
                    your brand identity.
                </Typography.Paragraph>
                <Typography.Paragraph className="!mb-0 text-base md:text-lg leading-relaxed text-[#383838]">
                    Peko goes beyond just storefronts. It brings together payments, business tools,
                    and operational support into one unified platform. From accepting transactions
                    and managing products to tracking performance and scaling globally, everything
                    is designed to work seamlessly.
                </Typography.Paragraph>
                <Typography.Paragraph className="!mb-0 text-base md:text-lg leading-relaxed text-[#383838]">
                    Build fast, launch faster—and grow without limits, all with Peko.
                </Typography.Paragraph>
            </Flex>

            <Flex vertical align="center" gap={10}>
                <Button
                    type="primary"
                    danger
                    size="large"
                    className="!h-12 !px-12 !rounded-md !text-base !font-medium"
                    onClick={onSubscribe}
                >
                    Set Up My Store
                </Button>
                <Button
                    type="link"
                    danger
                    icon={<MessageOutlined />}
                    onClick={() => {
                        window.location.href = 'tel:+02248930373';
                    }}
                    className="!font-medium"
                >
                    Request for demo
                </Button>
            </Flex>

            <Flex vertical gap={20} align="center" className="w-full">
                <Typography.Title level={3} className="!font-bold !mb-0 !text-black">
                    Go live in 4 simple steps
                </Typography.Title>
                <div className="w-full">
                    <div className="relative h-3 mb-4 hidden xl:block">
                        <div className="absolute top-1/2 -translate-y-1/2 left-[12.5%] right-[12.5%] border-t border-borderPrimaryLight" />
                        <div className="absolute inset-0 grid grid-cols-4">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="flex justify-center items-center">
                                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <Row gutter={[20, 20]}>
                        {steps.map((s, i) => (
                            <Col key={i} xs={24} sm={12} xl={6}>
                                <StepCard {...s} />
                            </Col>
                        ))}
                    </Row>
                </div>
            </Flex>
        </Flex>
    </Content>
);

export default EcommerceLanding;
