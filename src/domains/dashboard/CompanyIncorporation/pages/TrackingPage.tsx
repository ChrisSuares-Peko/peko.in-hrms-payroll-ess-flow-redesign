import React, { useEffect, useMemo } from 'react';

import { Button, Divider, Empty, Flex, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import useUserInfo from '@hooks/useUserInfo';
import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import CompanyDetailsCard from '../components/CompanyDetailsCard';
import { useApplicationTracking } from '../hooks/useApplicationTracking';
import { clearFormData } from '../slices/incorporationSlice';
import { Application, ApplicationStatus, VendorStage } from '../types';
import { getEffectiveStatus } from '../utils/applicationStatus';
import { normalizeStagesForDisplay } from '../utils/normalizeStages';
// import { POST_INCORPORATION_SERVICES } from '../utils/data';

const { Title, Paragraph, Text } = Typography;

function docStatusClass(status: string | undefined): string {
    if (status === 'VERIFIED') return 'bg-[#ecffe8] text-textGreen border border-[#c0f0b8]';
    if (status === 'REJECTED') return 'bg-[#fff0f0] text-[#e53e3e] border border-red-300';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
}

// ─── Stage helpers ────────────────────────────────────────────────────────────

const FALLBACK_STAGE: VendorStage = {
    _id: 'fallback',
    title: 'Order Confirmed',
    description: 'Your application has been received and payment confirmed.',
    location: '',
    date: '',
    state: 'completed',
    created_at: '',
    updated_at: '',
};

function stageIcon(state: VendorStage['state']) {
    if (state === 'completed') {
        return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#e7ffec] border border-brandGreen">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7L5.5 10.5L12 4" stroke="#43b75d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        );
    }
    if (state === 'in_progress') {
        return (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f4efff] border border-violet-500">
                <Spin size="small" style={{ color: '#8b5cf6' }} />
            </div>
        );
    }
    return (
        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#ececec] bg-white">
            <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
    );
}

function stageBadge(state: VendorStage['state']) {
    if (state === 'completed') {
        return (
            <span className="inline-flex items-center px-4 py-1 rounded-lg text-textGreen bg-[#ecffe8] border border-[#c0f0b8] text-[15px] font-normal">
                Completed
            </span>
        );
    }
    if (state === 'in_progress') {
        return (
            <span className="inline-flex items-center px-4 py-1 rounded-lg text-violet-500 bg-[#f7f3ff] border border-violet-500 text-[15px] font-normal">
                Processing
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-4 py-1 rounded-lg text-slate-600 bg-[#f0f0f0] border border-[#e7e7e7] text-[15px] font-normal">
            Pending
        </span>
    );
}

function connectorLine(state: VendorStage['state']) {
    const color = state === 'completed' ? '#43b75d' : '#e5e7eb';
    return (
        <div className="flex justify-center w-8 flex-1 min-h-[16px]">
            <div className="w-px h-full" style={{ backgroundColor: color }} />
        </div>
    );
}

// ─── Stage item ───────────────────────────────────────────────────────────────

interface StageItemProps {
    stage: VendorStage;
    isLast: boolean;
    previousState?: VendorStage['state'];
}

// A future date is the vendor's ETA: hide it on completed steps, show it as
// "Expected by" on pending steps.
function getDateLabel(stage: VendorStage): string | null {
    const stageDate = stage.date ? new Date(stage.date) : null;
    if (!stageDate || Number.isNaN(stageDate.getTime())) return null;

    const formattedDate = stageDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const isFutureDate = stageDate.getTime() > Date.now();

    if (!isFutureDate) return formattedDate;
    return stage.state === 'completed' ? null : `Expected by ${formattedDate}`;
}

const StageItem: React.FC<StageItemProps> = ({ stage, isLast, previousState }) => {
    const dateLabel = getDateLabel(stage);

    return (
        <div className="flex gap-6 items-start w-full">
            <div className="flex flex-col items-center flex-shrink-0 self-stretch">
                {previousState !== undefined ? (
                    <div className="flex justify-center w-8" style={{ height: 14 }}>
                        <div className="w-px h-full" style={{ backgroundColor: previousState === 'completed' ? '#43b75d' : '#e5e7eb' }} />
                    </div>
                ) : (
                    <div style={{ height: 14 }} />
                )}
                {stageIcon(stage.state)}
                {!isLast && connectorLine(stage.state)}
            </div>
            <div
                className={`flex-1 mb-4 rounded-3xl border p-4 flex flex-col gap-3 bg-[#fbfbfb] border-[#efefef] ${
                    stage.state === 'in_progress' ? 'mb-0' : ''
                }`}
            >
                <Flex align="flex-start" justify="space-between" gap={12} wrap="wrap">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <Text className="!text-[16px] sm:!text-[20px] !font-semibold !text-slate-800 !leading-7">
                            {stage.title}
                        </Text>
                        <Text className="!text-[14px] sm:!text-[16px] !text-[#667085] !leading-6">
                            {stage.description}
                        </Text>
                        {dateLabel && (
                            <Text className="!text-[12px] !font-medium !text-[#667085]">
                                {dateLabel}
                            </Text>
                        )}
                    </div>
                    <div className="flex-shrink-0">{stageBadge(stage.state)}</div>
                </Flex>

                {stage.state === 'in_progress' && stage.description && (
                    <>
                        <Divider className="!my-2" />
                        <div className="flex flex-col gap-1">
                            <Text className="!text-[16px] !font-semibold !text-slate-800">
                                {`What's happening now?`}
                            </Text>
                            <Text className="!text-[14px] !text-[#667085] !leading-[22px]">
                                {stage.description}
                            </Text>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ─── Application tracker card ─────────────────────────────────────────────────

interface ApplicationTrackerCardProps {
    application: Application;
}

const ApplicationTrackerCard: React.FC<ApplicationTrackerCardProps> = ({ application }) => {
    const stages: VendorStage[] = useMemo(() => {
        const raw =
            Array.isArray(application.vendorStages) && application.vendorStages.length > 0
                ? application.vendorStages
                : [FALLBACK_STAGE];
        return normalizeStagesForDisplay(raw);
    }, [application.vendorStages]);

    const submittedDate = new Date(application.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="bg-white border border-[#f1f1f1] rounded-[24px] sm:rounded-[36px] shadow-[0px_1.2px_12px_0px_rgba(0,0,0,0.06)] p-4 sm:p-14 flex flex-col gap-6 sm:gap-8">

            {/* Application ID banner */}
            <div className="flex items-center gap-3 bg-[rgba(37,99,235,0.04)] border border-[rgba(0,0,0,0.04)] rounded-2xl px-4 py-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1L10.5 6L16 6.75L12 10.5L13 16L8 13.5L3 16L4 10.5L0 6.75L5.5 6L8 1Z" fill="white" />
                    </svg>
                </div>
                <div className="flex flex-col gap-1">
                    <Text className="!text-[15px] sm:!text-[20px] !font-semibold !text-blue-600 !leading-7 break-all">
                        Application ID: {application.applicationId}
                    </Text>
                    <Text className="!text-[13px] sm:!text-[16px] !text-[rgba(37,99,235,0.8)] !leading-6">
                        Submitted on {submittedDate} • Estimated completion: 7–10 business days
                    </Text>
                </div>
            </div>

            {/* Stage timeline */}
            <div className="flex flex-col items-start w-full">
                {stages.map((stage, index) => (
                    <StageItem
                            key={stage._id}
                            stage={stage}
                            isLast={index === stages.length - 1}
                            previousState={index > 0 ? stages[index - 1].state : undefined}
                        />
                ))}
            </div>

            {/* Email notifications row */}
            <div className="flex items-center justify-between gap-3 flex-wrap border border-[rgba(0,0,0,0.04)] rounded-2xl px-4 py-4">
                <Flex gap={12} align="center" className="flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#fff9f9] flex-shrink-0">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            <path d="M4 4h16v16H4V4zm0 4l8 5 8-5" stroke="#FF3A3A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="flex flex-col gap-1">
                        <Text className="!text-[16px] sm:!text-[20px] !font-semibold !text-slate-800">Email Notifications</Text>
                        <Text className="!text-[13px] sm:!text-[16px] !text-slate-600">{`We'll keep you updated at every step`}</Text>
                    </div>
                </Flex>
                <Flex gap={8} align="center" className="bg-[#ecfdf3] rounded-full px-4 py-1 flex-shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#12b76a]" />
                    <Text className="!text-[#027a48] !text-[14px] sm:!text-[16px] !leading-7">Active</Text>
                </Flex>
            </div>

            {/* Submitted documents */}
            {application.applicationDocuments && application.applicationDocuments.length > 0 && (
                <div className="flex flex-col gap-4 border border-[rgba(0,0,0,0.04)] rounded-2xl px-4 py-4">
                    <Text className="!text-[18px] !font-semibold !text-slate-800">
                        Submitted Documents ({application.applicationDocuments.length})
                    </Text>
                    <div className="flex flex-col gap-3">
                        {application.applicationDocuments.map(doc => (
                            <Flex
                                key={doc.id}
                                align="center"
                                justify="space-between"
                                wrap="wrap"
                                gap={8}
                                className="bg-zinc-50 border border-[#f0f0f0] rounded-xl px-4 py-3"
                            >
                                <Flex gap={12} align="center" className="flex-1 min-w-0">
                                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#f0f4ff] flex-shrink-0">
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                            <path d="M10 2H4a1 1 0 00-1 1v12a1 1 0 001 1h10a1 1 0 001-1V7l-5-5z" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M10 2v5h5" stroke="#2563eb" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <Text className="!text-[14px] !font-medium !text-slate-800 truncate">
                                            {doc.docType
                                                .replace(/([a-z])([A-Z])/g, '$1 $2')
                                                .replace(/_/g, ' ')
                                                .replace(/\b\w/g, c => c.toUpperCase())}
                                        </Text>
                                        <Text className="!text-[12px] !text-slate-400 truncate">{doc.fileName}</Text>
                                    </div>
                                </Flex>
                                <Flex gap={10} align="center" className="flex-shrink-0">
                                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[12px] font-medium ${docStatusClass(doc.status)}`}>
                                        {doc.status ?? 'PENDING'}
                                    </span>
                                    {doc.fileUrl && (
                                        <a
                                            href={doc.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 text-[13px] font-medium hover:underline"
                                        >
                                            View
                                        </a>
                                    )}
                                </Flex>
                            </Flex>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Post-incorporation services card — commented out for future use ──────────

/* interface PostIncorporationServicesCardProps {
    isApproved: boolean;
}

const PostIncorporationServicesCard: React.FC<PostIncorporationServicesCardProps> = ({
    isApproved,
}) => (
    <div className="bg-white border border-[#ffd2d2] rounded-3xl p-8 flex flex-col gap-8">
        <Flex gap={16} align="flex-start">
            <div className="flex items-center justify-center w-16 h-16 bg-[#faf4ff] rounded-[12.8px] flex-shrink-0">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path
                        d="M16 4L20 12L28 13.5L22 19.5L23.5 28L16 24L8.5 28L10 19.5L4 13.5L12 12L16 4Z"
                        fill="#c084fc"
                    />
                </svg>
            </div>
            <div className="flex flex-col gap-2">
                <Text className="!text-[24px] !font-semibold !text-slate-800 !leading-8">
                    Post-Incorporation Services (Pending Activation)
                </Text>
                <Text className="!text-[16px] !text-slate-600 !leading-6">
                    The following services will be activated once your company incorporation is
                    successfully completed:
                </Text>
            </div>
        </Flex>
        <div className="flex flex-col gap-4">
            {POST_INCORPORATION_SERVICES.map((svc, idx) => (
                <React.Fragment key={svc.id}>
                    <Flex align="center" justify="space-between">
                        <Flex gap={16} align="center">
                            <div className="w-2 h-2 rounded-full bg-brandColor flex-shrink-0" />
                            <Text className="!text-[16px] !font-semibold !text-slate-800">
                                {svc.name}
                            </Text>
                        </Flex>
                        {isApproved ? (
                            <Flex
                                gap={6}
                                align="center"
                                className="bg-[#ecffe8] border border-[#c0f0b8] rounded-lg px-4 py-1"
                            >
                                <div className="w-2 h-2 rounded-full bg-textGreen" />
                                <Text className="!text-[14px] !text-textGreen">Active</Text>
                            </Flex>
                        ) : (
                            <Flex
                                gap={8}
                                align="center"
                                className="bg-[#f4f5f7] border border-[#ededed] rounded-lg px-4 py-1"
                            >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <rect
                                        x="3"
                                        y="6"
                                        width="8"
                                        height="6"
                                        rx="1"
                                        stroke="#475569"
                                        strokeWidth="1.2"
                                    />
                                    <path
                                        d="M5 6V4.5a2 2 0 014 0V6"
                                        stroke="#475569"
                                        strokeWidth="1.2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <Text className="!text-[14px] !text-slate-600">Locked</Text>
                            </Flex>
                        )}
                    </Flex>
                    {idx < POST_INCORPORATION_SERVICES.length - 1 && (
                        <Divider className="!my-0" />
                    )}
                </React.Fragment>
            ))}
        </div>
    </div>
); */

// ─── Page ─────────────────────────────────────────────────────────────────────

const TrackingPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { applications, currentApplicationDetail, isLoading } = useAppSelector(
        state => state.reducer.incorporation
    );
    const { fetchApplications } = useApplicationTracking();
    const { getUserData } = useUserInfo();

    useEffect(() => {
        dispatch(clearFormData());
        fetchApplications();
    }, [dispatch, fetchApplications]);

    useEffect(() => {
        if (currentApplicationDetail?.status === ApplicationStatus.APPROVED) {
            getUserData();
        }
    }, [currentApplicationDetail?.status, getUserData]);

    if (isLoading) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: '70vh' }}>
                <Spin size="large" />
            </Flex>
        );
    }

    // Use full detail (with vendorStages) if available, fall back to list entry
    const activeApplication = currentApplicationDetail ?? applications[0] ?? null;

    if (activeApplication && activeApplication.status === ApplicationStatus.PENDING) {
        navigate(paths.companyIncorporation.index, { replace: true });
        return null;
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="text-center">
                <Title level={2} className="!text-[20px] sm:!text-[28px] !font-medium !text-neutral-950 !mb-2">
                    Incorporate Your Company
                </Title>
                <Paragraph className="!mb-0 text-[13px] sm:text-[16px] text-slate-500">
                    Complete digital company registration with the Ministry of Corporate Affairs (MCA)
                </Paragraph>
            </div>

            {activeApplication ? (
                <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
                    <ApplicationTrackerCard application={activeApplication} />
                    {getEffectiveStatus(activeApplication) === ApplicationStatus.APPROVED && (
                        <CompanyDetailsCard application={activeApplication} />
                    )}
                    {/* <PostIncorporationServicesCard
                        isApproved={activeApplication.status === ApplicationStatus.APPROVED}
                    /> */}
                    <Flex justify="flex-end">
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => navigate(paths.dashboard.home)}
                            className="w-full sm:!w-auto !bg-lightRed hover:!bg-lightRedHover"
                            style={{ height: 48, paddingInline: 28 }}
                        >
                            Back to dashboard
                        </Button>
                    </Flex>
                </div>
            ) : (
                <Empty description="No applications found" style={{ marginTop: '50px' }} />
            )}
        </div>
    );
};

export default TrackingPage;
