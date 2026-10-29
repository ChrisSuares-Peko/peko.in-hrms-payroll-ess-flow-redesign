import type { FC } from 'react';

import { ArrowDownOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import imgCheckmarkFrame from '../assets/icons/checkmarkFrame.svg';
import imgCurvedLine from '../assets/icons/curvedLine.png';
import imgGreenLine from '../assets/icons/greenLine.svg';
import imgMessageIcon from '../assets/icons/messageIcon.svg';

const { Title, Text } = Typography;

const IllustrationWrapper: FC<{ children: React.ReactNode }> = ({ children }) => (
    <Flex align="center" justify="center" className="w-full h-full overflow-hidden">
        <div className="relative flex-shrink-0" style={{ width: 310, height: 131 }}>
            {children}
        </div>
    </Flex>
);

const Card1Illustration: FC = () => (
    <IllustrationWrapper>
        {/* Compliance service label */}
        <Flex
            align="center"
            justify="center"
            className="absolute bg-white border-[#f2f2f2] border-[0.5px] border-solid shadow-[0px_1.558px_7.79px_rgba(0,0,0,0.1)] rounded-[6px]"
            style={{ left: 84, top: 13, width: 90, height: 24 }}
        >
            <Text style={{ fontSize: 5.1, fontWeight: 700, color: '#232323' }}>Compliance service</Text>
        </Flex>
        {/* Arrow */}
        <ArrowDownOutlined
            className="absolute"
            style={{ left: 127, top: 40, fontSize: 8, color: '#c0c0c0' }}
        />
        {/* MOA & AOA + Document Upload card */}
        <Flex
            vertical
            gap={1.9}
            className="absolute bg-white border-[#f2f2f2] border-[0.3px] border-solid shadow-[0px_0.531px_2.656px_rgba(0,0,0,0.06)] rounded-[5.6px]"
            style={{ left: 91, top: 55, width: 126, height: 47, padding: 2.9 }}
        >
            <Flex style={{ position: 'relative', flex: 1 }}>
                <Flex
                    align="center"
                    className="absolute inset-0 bg-white border-[#f2f2f2] border-[0.35px] border-solid rounded-[4.2px]"
                    style={{ paddingInline: 3 }}
                >
                    <Text style={{ fontSize: 4.9, fontWeight: 600, color: '#242424', flex: 1 }} ellipsis>MOA &amp; AOA</Text>
                </Flex>
                <Flex
                    align="center"
                    justify="center"
                    className="absolute bg-[#f2f9f4] rounded-full"
                    style={{ right: 2, top: '50%', transform: 'translateY(-50%)', height: 9.3, width: 28.9 }}
                >
                    <Text style={{ fontSize: 3.8, fontWeight: 500, color: '#387e62' }}>Completed</Text>
                </Flex>
            </Flex>
            <Flex style={{ position: 'relative', flex: 1 }}>
                <Flex
                    align="center"
                    className="absolute inset-0 bg-white border-[#f2f2f2] border-[0.35px] border-solid rounded-[4.2px]"
                    style={{ paddingInline: 3 }}
                >
                    <Text style={{ fontSize: 4.9, fontWeight: 600, color: '#242424', flex: 1 }} ellipsis>Document Upload</Text>
                </Flex>
                <Flex
                    align="center"
                    justify="center"
                    className="absolute bg-[#f8f2e7] rounded-full"
                    style={{ right: 2, top: '50%', transform: 'translateY(-50%)', height: 9.3, width: 28.9 }}
                >
                    <Text style={{ fontSize: 3.8, fontWeight: 500, color: '#c89733' }}>Pending</Text>
                </Flex>
            </Flex>
        </Flex>
    </IllustrationWrapper>
);

const Card2Illustration: FC = () => (
    <IllustrationWrapper>
        <Flex align="center" justify="center" className="absolute inset-0">
            <div
                className="relative bg-white rounded-[8.8px] shadow-[0px_0.883px_4.139px_0.662px_rgba(0,0,0,0.09)]"
                style={{ width: 144, height: 87 }}
            >
                <Text
                    className="absolute"
                    style={{
                        left: 15,
                        top: 9,
                        fontSize: 8.5,
                        fontWeight: 500,
                        lineHeight: 1.31,
                        letterSpacing: -0.21,
                        background: 'linear-gradient(to right, #2a2a2a, #ff4f4f)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Company details
                </Text>
                {([
                    { top: 29, barWidth: 99, barHeight: 4 },
                    { top: 43, barWidth: 69, barHeight: 4 },
                    { top: 57, barWidth: 99, barHeight: 4 },
                    { top: 71, barWidth: 91, barHeight: 3.5 },
                ] as const).map(({ top, barWidth, barHeight }, i) => (
                    <Flex
                        key={i}
                        align="center"
                        gap={4}
                        className="absolute"
                        style={{ left: 15, top }}
                    >
                        <svg width="7" height="7" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
                            <circle cx="7" cy="7" r="6" fill="#e7ffec" stroke="#43B75D" strokeWidth="1.4" />
                            <path d="M4.5 7L6.2 8.8L9.5 5.2" stroke="#43B75D" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="bg-[#ffd0d0] rounded-full flex-shrink-0" style={{ width: barWidth, height: barHeight }} />
                    </Flex>
                ))}
            </div>
        </Flex>
    </IllustrationWrapper>
);

const Card3Illustration: FC = () => (
    <IllustrationWrapper>
        {/* Curved dashed line (flipped vertically) */}
        <img
            src={imgCurvedLine}
            className="absolute object-contain"
            style={{ left: 56, top: 29, width: 185, height: 36, transform: 'scaleY(-1)' }}
            alt=""
        />
        {/* Chat icon circle */}
        <Flex
            align="center"
            justify="center"
            className="absolute bg-white border-[#fbebeb] border-[0.5px] border-solid shadow-[0px_0px_5px_rgba(0,0,0,0.08)] rounded-full"
            style={{ left: 139, top: 11, padding: 6.9 }}
        >
            <img src={imgMessageIcon} style={{ width: 20.7, height: 20.7 }} alt="" />
        </Flex>
        {/* Order Confirmed pill */}
        <Flex
            align="center"
            justify="center"
            className="absolute bg-[#fff4f4] border-[#ffd9d9] border-[0.8px] border-solid rounded-full shadow-[0px_2px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden"
            style={{ left: 21, top: 65, width: 90, height: 25 }}
        >
            <Text style={{ fontSize: 8.7, fontWeight: 600, color: '#ff4f4f', whiteSpace: 'nowrap' }}>Order Confirmed</Text>
        </Flex>
        {/* Certificate Issued pill */}
        <Flex
            align="center"
            justify="center"
            className="absolute bg-[#fff4f4] border-[#ffd9d9] border-[0.8px] border-solid rounded-full shadow-[0px_2px_16px_0px_rgba(0,0,0,0.05)] overflow-hidden"
            style={{ left: 200, top: 65, width: 90, height: 25 }}
        >
            <Text style={{ fontSize: 8.7, fontWeight: 600, color: '#ff4f4f', whiteSpace: 'nowrap' }}>Certificate issued</Text>
        </Flex>
        {/* Left green checkmark */}
        <img src={imgCheckmarkFrame} className="absolute" style={{ left: 56, top: 98, width: 20, height: 20 }} alt="" />
        {/* Right green checkmark */}
        <img src={imgCheckmarkFrame} className="absolute" style={{ left: 235, top: 98, width: 20, height: 20 }} alt="" />
        {/* Green connecting line */}
        <img src={imgGreenLine} className="absolute" style={{ left: 82, top: 106, width: 145, height: 4 }} alt="" />
    </IllustrationWrapper>
);

interface FeatureCardProps {
    illustration: React.ReactNode;
    title: string;
}

const FeatureCard: FC<FeatureCardProps> = ({ illustration, title }) => (
    <Flex
        vertical
        className="rounded-[26px] border-[4px] border-white shadow-[0px_1.7px_16.9px_0px_rgba(0,0,0,0.09)] overflow-hidden w-full lg:w-[323px] lg:h-[241px] lg:flex-shrink-0"
        style={{ background: 'linear-gradient(157.96deg, #fff2ee 17.6%, #fafeff 105.89%)' }}
    >
        <div
            className="rounded-[19px] bg-white shadow-[0px_1.356px_6.354px_1.017px_rgba(160,160,160,0.05)] overflow-hidden flex-shrink-0 h-[131px]"
            style={{ margin: '6px 7px 0' }}
        >
            {illustration}
        </div>
        <Flex align="center" justify="center" className="px-4 pb-4 pt-3 text-center flex-1">
            <Text className="!text-[#383838] !font-medium !text-base lg:!text-[22px]" style={{ lineHeight: '30px' }}>
                {title}
            </Text>
        </Flex>
    </Flex>
);

const IncorporationRedirect: FC = () => {
    const navigate = useNavigate();
    const handleContinue = () => {
        navigate(paths.businessRegistration.index);
    };

    return (
        <Content>
            <Flex
                vertical
                align="center"
                justify="center"
                className="min-h-[calc(100vh-120px)] py-12 px-4"
            >
                <Flex vertical align="center" gap={48} className="w-full max-w-5xl">
                    <Flex vertical align="center" gap={16} className="text-center max-w-3xl">
                        <Title
                            level={2}
                            className="!mb-0 !text-[#383838] !font-bold !text-2xl md:!text-4xl lg:!text-[50px]"
                            style={{ lineHeight: 1.44 }}
                        >
                            Business Registration Service
                        </Title>
                        <Text
                            className="!text-[rgba(56,56,56,0.75)] block !text-sm md:!text-lg lg:!text-[25px]"
                            style={{ lineHeight: 1.4 }}
                        >
                            You&apos;ll be redirected to our business registration service. Once your
                            company is registered with Peko, you can seamlessly return here for
                            post-registration compliance management.
                        </Text>
                    </Flex>

                    <Flex vertical align="center" gap={24}>
                        <Text className="!font-medium !text-[#383838] !text-base lg:!text-[22px]">
                            Why register with <span className="text-[#ff4f4f]">Peko</span>?
                        </Text>

                        <Flex gap={24} justify="center" wrap className="w-full lg:flex-nowrap lg:gap-[40px]">
                            <FeatureCard
                                illustration={<Card1Illustration />}
                                title="Seamless integration with compliance services"
                            />
                            <FeatureCard
                                illustration={<Card2Illustration />}
                                title="Pre-filled company details for faster setup"
                            />
                            <FeatureCard
                                illustration={<Card3Illustration />}
                                title="Expert guidance throughout the process"
                            />
                        </Flex>
                    </Flex>

                    <Button
                        type="primary"
                        size="large"
                        onClick={handleContinue}
                        className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e] !rounded-xl !h-[44px] lg:!h-[52px] !px-6 lg:!px-[21.5px] !text-base lg:!text-[20px] !font-medium w-full sm:w-auto"
                    >
                        Continue to Business Registration
                    </Button>
                </Flex>
            </Flex>
        </Content>
    );
};

export default IncorporationRedirect;
