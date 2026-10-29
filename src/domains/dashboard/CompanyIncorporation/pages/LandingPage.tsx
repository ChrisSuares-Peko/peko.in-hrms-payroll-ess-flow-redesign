import { FC, useState } from 'react';

import { ArrowRightOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Flex, Skeleton, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getApplicationDetail } from '../api';
import clockImage from '../assets/clock.png';
import digitalImage from '../assets/digital.png';
import star1S from '../assets/heroDecorations/star1S.svg';
import stars2S from '../assets/heroDecorations/stars2S.svg';
import stars3L from '../assets/heroDecorations/stars3L.svg';
import stars3S from '../assets/heroDecorations/stars3S.svg';
import thunderIcon from '../assets/heroDecorations/thunder.svg';
import todoListImage from '../assets/todolist.png';
import { useExistingApplication } from '../hooks/useExistingApplication';
import { setSubmittedApplication } from '../slices/incorporationSlice';
import { Application, ApplicationStatus } from '../types';
import { getEffectiveStatus } from '../utils/applicationStatus';
import { PROCESS_STEPS, REQUIRED_INFO } from '../utils/data';

const { Title, Text } = Typography;

interface StatDecoration {
    src: string;
    className: string;
}

interface StatCard {
    title: string;
    subtitle: string;
    img: string;
    decorations: StatDecoration[];
}

// Per-card decoration positions translated from Figma node 11062:49044 insets.
// SVGs keep their natural sizes (9-24px) so they render at their design scale
// regardless of card width.
const STATS: StatCard[] = [
    {
        title: '15-25 min',
        subtitle: 'Time to complete',
        img: clockImage,
        decorations: [
            { src: stars2S, className: 'absolute top-[55%] right-[18%]' },
            { src: star1S, className: 'absolute top-[50%] left-[22%]' },
            { src: thunderIcon, className: 'absolute top-[74%] left-[20%]' },
        ],
    },
    {
        title: '7 steps',
        subtitle: 'Simple process',
        img: todoListImage,
        decorations: [
            { src: stars2S, className: 'absolute top-[58%] right-[10%]' },
            { src: stars3S, className: 'absolute top-[50%] left-[12%]' },
            { src: stars3S, className: 'absolute  top-[74%] left-[20%]' },
        ],
    },
    {
        title: '100% Digital',
        subtitle: 'No paperwork',
        img: digitalImage,
        decorations: [
            { src: stars3S, className: 'absolute top-[58%] right-[10%]' },
            { src: stars3L, className: 'absolute top-[50%] left-[12%]' },
            { src: stars3S, className: 'absolute  top-[74%] left-[20%]' },
        ],
    },
];

const STATUS_CONFIG: Record<
    ApplicationStatus,
    { label: string; bg: string; border: string; color: string }
> = {
    [ApplicationStatus.PENDING]: {
        label: 'Pending',
        bg: '#f5f5f5',
        border: '#d9d9d9',
        color: '#595959',
    },
    [ApplicationStatus.SUBMITTED]: {
        label: 'Submitted',
        bg: '#e6f4ff',
        border: '#1677ff',
        color: '#1677ff',
    },
    [ApplicationStatus.UNDER_REVIEW]: {
        label: 'Under Review',
        bg: '#fffbeb',
        border: '#f59e0b',
        color: '#f59e0b',
    },
    [ApplicationStatus.APPROVED]: {
        label: 'Approved',
        bg: '#f0fdf4',
        border: '#43b75d',
        color: '#43b75d',
    },
    [ApplicationStatus.REJECTED]: {
        label: 'Rejected',
        bg: '#fff2f0',
        border: '#ff4f4f',
        color: '#ff4f4f',
    },
};

const DEFAULT_MESSAGE = {
    title: 'Application Submitted Successfully',
    colorClass: '!text-brandGreen',
    subtitle: 'Your application is under review...',
};

const MESSAGE_CONFIG: Partial<
    Record<ApplicationStatus, { title: string; colorClass: string; subtitle: string }>
> = {
    [ApplicationStatus.UNDER_REVIEW]: {
        title: 'Application Under Review',
        colorClass: '!text-brandGreen',
        subtitle: 'Your application is currently being reviewed.',
    },
    [ApplicationStatus.APPROVED]: {
        title: 'Company Registered Successfully',
        colorClass: '!text-brandGreen',
        subtitle: 'Your company has been registered successfully.',
    },
    [ApplicationStatus.REJECTED]: {
        title: 'Application Rejected',
        colorClass: '!text-lightRed',
        subtitle: 'Unfortunately, your application was rejected.',
    },
};

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

// ── Sub-components ──────────────────────────────────────────────────────────

interface StepCardProps {
    number: number;
    label: string;
}

const StepCard: FC<StepCardProps> = ({ number, label }) => (
    <Flex
        vertical
        justify="center"
        gap={8}
        className="bg-white border border-[#f7c7c7] rounded-[14px] shadow-[0px_1.3px_12.9px_rgba(0,0,0,0.06)] px-4 py-3 h-[96px]"
    >
        <Flex
            align="center"
            justify="center"
            className="rounded-full border border-lightRed bg-[#fff2f2] flex-shrink-0 mx-auto"
            style={{ width: 22, height: 22 }}
        >
            <Text className="!text-[10px] !font-medium !text-lightRed !leading-none">
                {number}
            </Text>
        </Flex>
        <Text className="!text-[13px] !font-medium !text-[#3d3d3d] tracking-[-0.3px] !leading-[18px] !text-center">
            {label}
        </Text>
    </Flex>
);

interface InfoTileProps {
    label: string;
    value?: string;
    children?: React.ReactNode;
}

const InfoTile: FC<InfoTileProps> = ({ label, value, children }) => (
    <div className="bg-zinc-50 flex-1 flex items-center px-6 py-4 rounded-[16px] min-h-[82px]">
        <div className="flex flex-col gap-1">
            <Text className="!text-[14px] !text-[#969696] !leading-[22px]">{label}</Text>
            {value && <Text className="!text-[16px] !text-black !leading-[24px]">{value}</Text>}
            {children}
        </div>
    </div>
);

interface StatusBadgeProps {
    status: ApplicationStatus;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG[ApplicationStatus.UNDER_REVIEW];
    return (
        <Flex
            align="center"
            gap={4}
            className="px-2 py-1.5 rounded-[40px] border w-fit h-[28px]"
            style={{ background: cfg.bg, borderColor: cfg.border }}
        >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
            <Text
                className="!text-[14px] !leading-[22px] whitespace-nowrap"
                style={{ color: cfg.color }}
            >
                {cfg.label}
            </Text>
        </Flex>
    );
};

// ── Hero stat cards (shared between both views) ──────────────────────────────

const HeroStats = () => (
    <div className="flex gap-3 sm:gap-[18px] justify-center w-full">
        {STATS.map((stat, idx) => (
            <Flex
                key={idx}
                vertical
                align="center"
                justify="space-between"
                className="rounded-[21px] overflow-hidden pt-4 sm:pt-[22px] flex-1 relative"
                style={{
                    minWidth: 0,
                    maxWidth: 200,
                    // Subtle radial gradient: slightly deeper pink in the bottom centre
                    // fades up to #fff9f9. Matches the soft swirl feel in Figma node
                    // 11062:49044 without any visible "blob" shapes.
                    background:
                        'radial-gradient(ellipse 90% 70% at 50% 100%, #ffeaea 0%, #fff5f5 45%, #fff9f9 80%)',
                }}
            >
                {stat.decorations.map((d, i) => (
                    <img
                        key={i}
                        src={d.src}
                        alt=""
                        aria-hidden
                        className={`${d.className} pointer-events-none select-none`}
                    />
                ))}
                <div className="text-center px-2 sm:px-4 relative z-10">
                    <Text className="!block !text-[14px] sm:!text-[18px] !font-semibold !text-slate-800 tracking-[-0.18px]">
                        {stat.title}
                    </Text>
                    <div className="mt-[5px]">
                        <Text className="!text-[11px] sm:!text-[13px] !text-slate-500 !font-normal">
                            {stat.subtitle}
                        </Text>
                    </div>
                </div>
                <img
                    src={stat.img}
                    alt={stat.title}
                    className="w-full object-contain px-3 sm:px-5 pb-3 relative z-10"
                    style={{ maxHeight: 80 }}
                />
            </Flex>
        ))}
    </div>
);

const HeroHeader = () => (
    <div className="text-center w-full">
        <Title
            level={2}
            className="!text-[22px] sm:!text-[27px] !font-bold !text-[#313131] !mb-0 !leading-[1.82]"
        >
            Incorporate Your Company
        </Title>
        <div className="mt-1">
            <Text className="text-[13px] sm:text-[14px] text-[#313131] font-normal leading-[1.82]">
                Complete digital company registration with the Ministry of Corporate Affairs (MCA)
            </Text>
        </div>
    </div>
);

// ── Submitted view ────────────────────────────────────────────────────────────

interface SubmittedViewProps {
    application: Application;
    userId: number;
    userType: string;
}

const SubmittedView: FC<SubmittedViewProps> = ({ application, userId, userType }) => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isCompletePaymentLoading, setIsCompletePaymentLoading] = useState(false);
    const effectiveStatus = getEffectiveStatus(application);
    const message = MESSAGE_CONFIG[effectiveStatus] ?? DEFAULT_MESSAGE;

    const handleCompletePayment = async () => {
        let totalAmount = application.totalAmount ?? 0;

        if (!totalAmount) {
            setIsCompletePaymentLoading(true);
            const detail = await getApplicationDetail({
                userId,
                userType,
                applicationId: application.applicationId,
            });
            setIsCompletePaymentLoading(false);
            if (!detail) return;
            totalAmount = detail.totalAmount ?? 0;
        }

        dispatch(
            setSubmittedApplication({
                applicationId: application.applicationId,
                totalAmount,
                status: application.status,
                createdAt: application.createdAt,
            })
        );
        navigate(`${paths.companyIncorporation.index}/${paths.companyIncorporation.payment}`);
    };

    return (
        <div className="bg-white px-4 sm:px-6 pt-1 sm:pt-2 pb-4 sm:pb-6 min-h-screen">
            <div className="max-w-[900px] mx-auto">
                <Flex vertical align="center" gap={32}>
                    <HeroHeader />
                    <HeroStats />

                    {/* Application status card */}
                    <div className="border border-zinc-200 rounded-[24px] p-4 sm:p-8 flex flex-col gap-8 items-center w-full">
                        {/* Success header + info tiles */}
                        <Flex vertical align="center" gap={32} className="w-full">
                            <div className="text-center">
                                {effectiveStatus === ApplicationStatus.PENDING ? (
                                    <>
                                        <Text className="!text-[18px] !font-semibold !text-amber-500 !leading-[26px]">
                                            {application.vendorStatus === 'FAILED'
                                                ? 'Payment Attempt Unsuccessful'
                                                : 'Complete Your Payment'}
                                        </Text>
                                        <div className="mt-1">
                                            <Text className="!text-[14px] !text-[rgba(56,56,56,0.75)] !leading-[20px] tracking-[0.14px]">
                                                {application.vendorStatus === 'FAILED'
                                                    ? 'Your previous payment attempt was unsuccessful and the amount has been refunded. Please try again.'
                                                    : 'Your application has been saved. Complete the payment to submit it for processing.'}
                                            </Text>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Text className={`!text-[18px] !font-semibold ${message.colorClass} !leading-[26px]`}>
                                            {message.title}
                                        </Text>
                                        <div className="mt-1">
                                            <Text className="!text-[14px] !text-[rgba(56,56,56,0.75)] !leading-[20px] tracking-[0.14px]">
                                                {message.subtitle}
                                            </Text>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* 2×2 info tiles */}
                            <div className="flex flex-col gap-3 w-full">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <InfoTile
                                        label="Application ID"
                                        value={application.applicationId}
                                    />
                                    <InfoTile
                                        label="Submitted on"
                                        value={formatDate(application.createdAt)}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <InfoTile
                                        label="Estimated completion"
                                        value="7–10 business days"
                                    />
                                    <InfoTile label="Status">
                                        <StatusBadge status={effectiveStatus} />
                                    </InfoTile>
                                </div>
                            </div>
                        </Flex>

                        {/* Action buttons */}
                        {effectiveStatus === ApplicationStatus.PENDING ? (
                            <Flex gap={12} className="w-full flex-col sm:flex-row">
                                <Button
                                    icon={<EyeOutlined />}
                                    onClick={() =>
                                        navigate(paths.companyIncorporation.form, {
                                            state: {
                                                step: 6,
                                                applicationId: application.applicationId,
                                            },
                                        })
                                    }
                                    className="!h-[48px] !border-slate-300 !text-slate-600 hover:!bg-gray-50 !text-[16px] !font-medium !rounded-[10px] !px-4 transition-colors sm:!w-auto"
                                >
                                    View Application
                                </Button>
                                <Button
                                    block
                                    type="primary"
                                    loading={isCompletePaymentLoading}
                                    onClick={handleCompletePayment}
                                    className="!h-[48px] !bg-lightRed hover:!bg-lightRedHover !text-[16px] !font-medium !rounded-[10px] transition-colors sm:!flex-1"
                                >
                                    Complete Payment
                                </Button>
                            </Flex>
                        ) : (
                            <Flex vertical gap={12} className="w-full">
                                <Button
                                    block
                                    onClick={() => navigate(paths.companyIncorporation.tracking)}
                                    className="!h-[52px] !border-lightRed !text-lightRed hover:!bg-bgRedLight !text-[16px] !font-medium !rounded-[10px] transition-colors"
                                >
                                    <Flex gap={8} align="center" justify="center">
                                        Track Application
                                        <ArrowRightOutlined />
                                    </Flex>
                                </Button>
                            </Flex>
                        )}
                    </div>
                </Flex>
            </div>
        </div>
    );
};

// ── Normal (pre-submission) view ──────────────────────────────────────────────

interface NormalViewProps {
    onStart: () => void;
}

const NormalView: FC<NormalViewProps> = ({ onStart }) => (
    <div className="bg-white px-4 sm:px-6 pt-1 sm:pt-2 pb-4 sm:pb-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                {/* Left Column */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    {/* Hero */}
                    <Flex vertical align="center" gap={28}>
                        <HeroHeader />
                        <HeroStats />
                        <Button
                            type="primary"
                            onClick={onStart}
                            className="!h-[48px] !px-[20px] !text-[15px] !font-medium !rounded-[8px] !bg-lightRed hover:!bg-lightRedHover w-full sm:w-auto transition-colors"
                        >
                            Start Company Incorporation
                        </Button>
                    </Flex>

                    {/* Process Steps */}
                    <Flex vertical align="center" gap={20}>
                        <Title level={3} className="!text-[20px] !font-medium !text-[#111] !mb-0">
                            Process Steps
                        </Title>
                        <div className="w-full flex flex-col gap-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {PROCESS_STEPS.slice(0, 4).map((step, idx) => (
                                    <StepCard key={idx} number={idx + 1} label={step} />
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 w-full md:w-3/4 mx-auto gap-3">
                                {PROCESS_STEPS.slice(4).map((step, idx) => (
                                    <StepCard key={idx + 4} number={idx + 5} label={step} />
                                ))}
                            </div>
                        </div>
                    </Flex>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5">
                    <div className="bg-bgGrayF9 rounded-[32px] px-4 sm:px-8 py-[34px] flex flex-col gap-5">
                        <Text className="!text-[16px] !font-semibold !text-slate-600 uppercase !leading-[28px]">
                            What you will need ?
                        </Text>
                        <div className="flex flex-col gap-[10px]">
                            {REQUIRED_INFO.map((info, idx) => (
                                <div
                                    key={idx}
                                    className="bg-white rounded-[14px] flex items-center gap-3 px-4 py-[10px]"
                                >
                                    <div className="flex-shrink-0 bg-[#ffeaea] rounded-[9px] w-[28px] h-[28px] flex items-center justify-center">
                                        <ArrowRightOutlined
                                            className="text-lightRed"
                                            style={{ fontSize: 11 }}
                                        />
                                    </div>
                                    <Text className="!text-[13px] !text-black !font-normal !leading-[20px]">
                                        {info}
                                    </Text>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────

const LandingPage = () => {
    const navigate = useNavigate();
    // const dispatch = useAppDispatch();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { existingApplication, isLoading } = useExistingApplication();

    const handleStartApplication = () => {
        // dispatch(setSelectedServices([]));
        navigate(paths.companyIncorporation.form);
    };

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 2 }} />;
    }

    if (existingApplication) {
        return (
            <SubmittedView
                application={existingApplication}
                userId={Number(userId)}
                userType={userType ?? ''}
            />
        );
    }

    return <NormalView onStart={handleStartApplication} />;
};

export default LandingPage;
