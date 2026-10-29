import type { FC, ReactNode } from 'react';

import { Button, Flex, Image, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import iconCalendarGray from '../assets/icons/icon-calendar-gray.svg';
import iconCursorPointer from '../assets/icons/icon-cursor-pointer.svg';
import iconInfoCircleAmber from '../assets/icons/icon-info-circle-amber.svg';

const { Title, Text } = Typography;


const MiniDeadlineCard: FC<{ style?: import('react').CSSProperties }> = ({ style }) => (
    <div
        className="bg-white flex flex-col justify-between shadow-[2.048px_4.095px_14.737px_rgba(0,0,0,0.06)]"
        style={{ width: 137.5, height: 152.8, borderRadius: 13.96, padding: '9.9px 11.6px', ...style }}
    >
        <div className="flex flex-col gap-[9.3px]">
            <div
                className="bg-[#fff8f8] flex items-center justify-center shrink-0"
                style={{ width: 41.1, height: 41.1, borderRadius: 12, border: '0.76px solid #fff3de' }}
            >
                <Image src={iconInfoCircleAmber} alt="" preview={false} style={{ width: 18.3, height: 18.3 }} />
            </div>
            <div className="flex flex-col gap-[6.2px]">
                <div className="bg-[#ffd0d0] rounded-[10.3px]" style={{ width: 105.1, height: 11.3 }} />
                <div className="flex items-center gap-[2.3px]">
                    <Image src={iconCalendarGray} alt="" preview={false} style={{ width: 9.3, height: 9.3 }} />
                    <span className="text-[6.98px] text-[#838383] leading-none">Due: 28 Feb 2026</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-[4.6px]">
            <div
                className="flex-1 flex items-center justify-center"
                style={{ background: '#fef2f2', border: '0.58px solid rgba(239,68,68,0.2)', borderRadius: 58.2, padding: '3.5px 7px' }}
            >
                <span className="text-[6.98px] text-[#ef4444] whitespace-nowrap">High Priority</span>
            </div>
            <div
                className="flex-1 flex items-center justify-center"
                style={{ background: '#fffbeb', border: '0.58px solid rgba(245,158,11,0.2)', borderRadius: 46.5, padding: '3.5px 7px' }}
            >
                <span className="text-[8.14px] text-[#f59e0b] whitespace-nowrap">44 days left</span>
            </div>
        </div>
    </div>
);

const DeadlineIllustration: FC = () => (
    <>
        <div className="absolute flex items-center justify-center" style={{ left: 64.66, top: 95, width: 171.6, height: 182.6 }}>
            <MiniDeadlineCard style={{ transform: 'rotate(-14.63deg)' }} />
        </div>
        <div className="absolute flex items-center justify-center" style={{ left: 108.05, top: 119, width: 138.3, height: 153.5 }}>
            <MiniDeadlineCard style={{ transform: 'rotate(-0.31deg)' }} />
        </div>
    </>
);

const RecurringIllustration: FC = () => (
    <div className="absolute" style={{ left: 50.48, top: 108 }}>
        <div className="relative bg-white rounded-[7.825px] shadow-[1.337px_2.674px_20.052px_0.905px_rgba(0,0,0,0.05)]" style={{ width: 231.451, height: 162 }}>
        {/* Tabs */}
        <div className="absolute flex items-center justify-center bg-[#f4eded] rounded-full px-[10px] py-[6.7px]" style={{ left: 57, top: 14.6, width: 59, height: 24.6 }}>
            <span className="text-[8.948px] font-medium" style={{ background: 'linear-gradient(to right, #2a2a2a, #ff4f4f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>One-time</span>
        </div>
        <div className="absolute flex items-center justify-center rounded-full px-[10px] py-[6.7px]" style={{ left: 116, top: 15.2, width: 59, height: 24.6 }}>
            <span className="text-[8.948px] font-medium" style={{ background: 'linear-gradient(to right, rgba(42,42,42,0.4), rgba(255,79,79,0.4))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Recurring</span>
        </div>
        {/* Bars + status */}
        {[
            { top: 57.8, width: 79.8, status: 'Due soon', statusColor: '#f59e0b' },
            { top: 76.5, width: 97.8, status: 'Completed', statusColor: '#43b75d' },
            { top: 95.3, width: 79.7, status: 'Over due', statusColor: '#f59e0b' },
            { top: 114, width: 98.2, status: 'Completed', statusColor: '#43b75d' },
            { top: 132.7, width: 80.4, status: 'Due soon', statusColor: '#f59e0b' },
        ].map((row, i) => (
            <div key={i} className="absolute flex items-center justify-between" style={{ left: 22.4, top: row.top, width: 200 }}>
                <div className="bg-[#ffd0d0] rounded-[7.825px]" style={{ width: row.width, height: 8.544 }} />
                <span className="text-[9.222px] font-medium" style={{ color: row.statusColor }}>{row.status}</span>
            </div>
        ))}
        </div>
    </div>
);

const PenaltyIllustration: FC = () => (
    <div className="absolute" style={{ left: 60.5, top: 118 }}>
        {/* Slightly rotated white card */}
        <div
            className="absolute bg-white rounded-[7.731px] shadow-[1.321px_2.642px_19.812px_0.894px_rgba(0,0,0,0.05)]"
            style={{ width: 106.97, height: 111.452, transform: 'rotate(-0.58deg)' }}
        >
            <div className="p-3">
                <p className="text-[11.887px] font-medium mb-1" style={{ background: 'linear-gradient(to right, #2a2a2a, #ff4f4f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ESI Registration</p>
                <p className="text-[9.112px] font-medium mb-3" style={{ background: 'linear-gradient(to right, #2a2a2a, #ff4f4f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Due soon</p>
                <div className="bg-[#ffd0d0] rounded-[7.731px] mb-1" style={{ width: 44.945, height: 5.878 }} />
                <div className="bg-[#ffd0d0] rounded-[7.731px]" style={{ width: 78.879, height: 5.878 }} />
            </div>
        </div>
        {/* Submit button */}
        <Flex
            align="center"
            justify="center"
            className="absolute bg-[#ff7575] rounded-[28.275px] shadow-[0px_0.866px_4.059px_0.65px_rgba(0,0,0,0.09)]"
            style={{ left: 77.36, top: 38.68, width: 133.824, height: 43.368 }}
        >
            <Text className="!text-white !text-[13px] !font-semibold">Submit</Text>
        </Flex>
    </div>
);

interface FeatureCardProps {
    title: string;
    description: string;
    illustration: FC;
    overlay?: ReactNode;
}

const FeatureCard: FC<FeatureCardProps> = ({ title, description, illustration: Illustration, overlay }) => (
    <div className="bg-[#fff9f9] rounded-[28px] overflow-hidden relative shrink-0 w-full max-w-[333px] mx-auto lg:mx-0 h-[291px]">
        <div className="absolute flex flex-col gap-[6px] left-5 top-[22px] w-[calc(100%-40px)] max-w-[275px]">
            <Text className="!text-black !font-semibold !text-[17px] !leading-[1.2] line-clamp-1">{title}</Text>
            <Text className="!text-[#383838] !text-[12px] font-normal !leading-[1.55] line-clamp-2">{description}</Text>
        </div>
        <Illustration />
        {overlay}
    </div>
);

const LandingPage: FC = () => {
    const navigate = useNavigate();

    return (
        <Content>
            <Flex vertical align="center" justify="center" className="min-h-[calc(100vh-120px)] py-12 px-4">
                <Flex vertical align="center" gap={64} className="w-full max-w-5xl">
                    <Flex vertical align="center" gap={18} className="text-center max-w-[959px]">
                        <Title
                            level={2}
                            className="!mb-0 !text-[#383838] !font-bold !text-2xl md:!text-4xl lg:!text-[50px]"
                            style={{ lineHeight: 1.4 }}
                        >
                            Compliance Management
                        </Title>
                        <Text
                            className="!text-black block !text-sm md:!text-lg lg:!text-[28px] font-roboto"
                            style={{ lineHeight: 1.46 }}
                        >
                            Stay on top of all your statutory obligations. Track deadlines, manage
                            filings, and keep your company fully compliant — all in one place.
                        </Text>
                    </Flex>

                    <Flex vertical align="center" gap={24} className="w-full">
                        <Flex gap={18} justify="center" wrap className="w-full lg:flex-nowrap lg:gap-[18px]">
                            <FeatureCard
                                title="Never miss a deadline"
                                description="Get timely reminders for all your compliance filings so you're always ahead of due dates."
                                illustration={DeadlineIllustration}
                            />
                            <FeatureCard
                                title="One-time & recurring tasks"
                                description="Track both one-time registrations and recurring annual filings from a single dashboard."
                                illustration={RecurringIllustration}
                            />
                            <FeatureCard
                                title="Avoid penalties"
                                description="Stay informed of overdue and high-priority items before they lead to fines or legal risks."
                                illustration={PenaltyIllustration}
                                overlay={
                                    <Image
                                        src={iconCursorPointer}
                                        alt=""
                                        preview={false}
                                        width={23.328}
                                        height={27.106}
                                        wrapperStyle={{ position: 'absolute', left: 238.22, top: 185, width: 23.328, height: 27.106, pointerEvents: 'none', zIndex: 10 }}
                                    />
                                }
                            />
                        </Flex>
                    </Flex>

                    <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                            // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
                            navigate(`${paths.dashboard.compliance}/${paths.compliance.companyIdentify}`);
                        }}
                        className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e] !rounded-xl !min-h-[52px] !h-auto !py-2 !px-[21.5px] !text-base sm:!text-[20px] !font-medium !whitespace-normal w-full sm:w-auto"
                    >
                        Continue to Compliance
                    </Button>
                </Flex>
            </Flex>
        </Content>
    );
};

export default LandingPage;
