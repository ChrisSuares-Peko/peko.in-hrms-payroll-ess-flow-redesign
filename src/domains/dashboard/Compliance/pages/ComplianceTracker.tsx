import { useState, useEffect } from 'react';

import { Button, Flex, Image, Tag, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getComplianceListApi } from '../api';
import iconAppId from '../assets/icons/icon-tracker-app-id.svg';
import iconProcessing from '../assets/icons/icon-tracker-processing.svg';
import iconRejected from '../assets/icons/icon-tracker-rejected.svg';
import iconReupload from '../assets/icons/icon-tracker-reupload.svg';
import iconSms from '../assets/icons/icon-tracker-sms.svg';
import iconStepCompleted from '../assets/icons/icon-tracker-step-completed.svg';
// import DocumentReuploadDrawer from '../components/ComplianceDetail/DocumentReuploadDrawer';
import type { ComplianceItem } from '../types';
import type { DocSubmissionStatus } from '../types/docReupload';
import { complianceHealthItems, formatComplianceDate } from '../utils/data';

const { Text, Title } = Typography;

// ─── Step definitions ─────────────────────────────────────────────────────────

interface TrackerStep {
    key: string;
    label: string;
    description: string;
}

const STEPS: TrackerStep[] = [
    { key: 'submitted', label: 'Application Submitted',     description: 'Your compliance document has been submitted for review.' },
    { key: 'review',    label: 'Review by Peko',            description: 'Our team is reviewing your submitted document.' },
    { key: 'esign',     label: 'E-sign / OTP Verification', description: 'Review documents and complete e-sign to continue.' },
    { key: 'filing',    label: 'Filing Submitted',          description: 'Your compliance filing has been successfully submitted and is currently under processing.' },
    { key: 'completed', label: 'Completed',                 description: 'Your compliance process has been completed successfully.' },
];

type StepState = 'completed' | 'active' | 'rejected' | 'pending';

function deriveStepStates(status: DocSubmissionStatus | null): StepState[] {
    switch (status) {
        case null:
        case 'pending':      return ['completed', 'active',    'pending', 'pending', 'pending'];
        case 'under_review': return ['completed', 'active',    'pending', 'pending', 'pending'];
        case 'rejected':     return ['completed', 'rejected',  'pending', 'pending', 'pending'];
        case 'reopened':     return ['completed', 'rejected',  'pending', 'pending', 'pending'];
        case 'approved':     return ['completed', 'completed', 'completed', 'completed', 'completed'];
        default:             return ['pending',   'pending',   'pending', 'pending', 'pending'];
    }
}

// ─── Step circle ──────────────────────────────────────────────────────────────

function StepCircle({ state }: { state: StepState }) {
    if (state === 'completed') {
        return (
            <Image src={iconStepCompleted} preview={false} width={32} height={32} wrapperClassName="shrink-0 leading-none" />
        );
    }

    const circleClass: Record<Exclude<StepState, 'completed'>, string> = {
        active:   'bg-purple-50 border border-purple-500',
        rejected: 'bg-red-50 border border-red-400',
        pending:  'bg-gray-100 border border-gray-300',
    };

    return (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${circleClass[state]}`}>
            {state === 'active' && (
                <Image src={iconProcessing} preview={false} width={20} height={20} wrapperClassName="leading-none" />
            )}
            {state === 'rejected' && (
                <Image src={iconRejected} preview={false} width={20} height={20} wrapperClassName="leading-none" />
            )}
        </div>
    );
}

// ─── Step badge ───────────────────────────────────────────────────────────────

function StepBadge({ state }: { state: StepState }) {
    const cfg: Record<StepState, { label: string; className: string }> = {
        completed: { label: 'Completed',  className: 'text-green-600 bg-green-50 border-green-200' },
        active:    { label: 'Processing', className: 'text-purple-500 bg-purple-50 border-purple-500' },
        rejected:  { label: 'Rejected',   className: 'text-red-500 bg-red-50 border-red-200' },
        pending:   { label: 'Pending',    className: 'text-slate-600 bg-gray-100 border-gray-200' },
    };
    const c = cfg[state];
    return (
        <Tag className={`rounded-lg text-[13px] px-3 py-0.5 leading-[22px] m-0 font-normal border ${c.className}`}>
            {c.label}
        </Tag>
    );
}

// ─── Reupload button ──────────────────────────────────────────────────────────

function ReuploadButton({ complianceId }: { complianceId: string }) {
    const nav = useNavigate();
    return (
        <Button
            onClick={() => nav(`${paths.dashboard.compliance}/${paths.compliance.detail.replace(':id', complianceId)}`)}
            className="!border !border-red-400 !rounded-lg !text-red-400 !text-[13px] !h-auto !px-3 !py-0.5 !shadow-none hover:!border-red-400 hover:!text-red-400"
        >
            <span className="flex items-center gap-1.5">
                <Image src={iconReupload} preview={false} width={16} height={16} wrapperClassName="leading-none flex items-center" />
                Reupload
            </span>
        </Button>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ComplianceTracker() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { id: userId, role: userType } = useAppSelector((state) => (state.reducer as any).auth);

    const [apiRecord, setApiRecord] = useState<ComplianceItem | null>(null);

    const item = complianceHealthItems.find((c) => c.id === id);

    useEffect(() => {
        if (!item) return;
        getComplianceListApi({ userId, userType, page: 1, pageSize: 10, searchText: item.title, from: '', to: '' })
            .then((res) => {
                if (res && res.rows.length) {
                    const match = res.rows.find((r) => r.title === item.title);
                    setApiRecord(match ?? null);
                }
            });
    }, [item, userId, userType]);

    const submissionStatus = (apiRecord?.adminStatus ?? null) as DocSubmissionStatus | null;
    const stepStates       = deriveStepStates(submissionStatus);
    const isActionable     = apiRecord !== null && (
        apiRecord.adminStatus === 'rejected' ||
        apiRecord.adminStatus === 'reopened'
    );

    if (!item) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
                <Text>Compliance item not found.</Text>
                <Button
                    type="link"
                    onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.myCompliances}`)}
                >
                    Back to My Compliances
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-[1137px] mx-auto w-full">

            {/* ── Page heading ── */}
            <div className="flex flex-col items-center gap-1.5 text-center">
                <Title level={2} className="!text-[28px] !font-semibold !text-[#383838] !m-0 !leading-9 tracking-[-0.14px]">
                    Compliance Tracker
                </Title>
                <Text className="!text-sm !text-[rgba(56,56,56,0.75)] !leading-5 tracking-[0.14px]">
                    A centralized view of your compliance deadlines, submissions, and status updates.
                </Text>
            </div>

            {/* ── Main card ── */}
            <div className="bg-white rounded-[36px] p-14 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.06)]">
                <Flex vertical gap={40}>

                    {/* Title + description */}
                    <Flex vertical gap={10}>
                        <Title level={3} className="!text-[28px] !font-medium !text-[#0a0a0a] !m-0 !leading-9 tracking-[-0.14px]">
                            {item.title}
                        </Title>
                        <Text className="text-base text-slate-500 leading-6">
                            {item.description}
                        </Text>
                    </Flex>

                    <Flex vertical gap={16}>

                        {/* Application ID banner */}
                        {apiRecord && (
                            <div className="flex items-center gap-3 bg-blue-600/[0.04] border border-black/[0.04] rounded-2xl p-4">
                                <Image src={iconAppId} preview={false} width={32} height={32} wrapperClassName="shrink-0 leading-none" />
                                <Flex vertical gap={2}>
                                    <Text className="!text-blue-600 !font-semibold !text-base !leading-6">
                                        Application ID: {apiRecord.complianceId}
                                    </Text>
                                    <Text className="!text-blue-600/80 !text-sm !leading-[22px]">
                                        Submitted on {formatComplianceDate(apiRecord.createdAt)}
                                    </Text>
                                </Flex>
                            </div>
                        )}

                        {/* Action Required banner */}
                        {isActionable && (
                            <div className="flex items-center justify-between gap-4 bg-amber-50 rounded-[15px] px-[30px] py-4">
                                <Flex vertical gap={6} style={{ flex: 1 }}>
                                    <Text className="!font-semibold !text-base !text-amber-400 !leading-[1.4]">
                                        Action Required
                                    </Text>
                                    <Text className="!text-sm !text-[#939ba7] !leading-[1.4]">
                                        {apiRecord?.adminRemarks ?? 'Please upload an updated document to continue.'}
                                    </Text>
                                </Flex>
                                <ReuploadButton complianceId={id ?? ''} />
                            </div>
                        )}

                        {/* ── Inner timeline card ── */}
                        <div className="border border-[#ccc]/50 rounded-[36px] p-14">
                            <Flex vertical gap={0}>
                                {STEPS.map((step, idx) => {
                                    const state          = stepStates[idx];
                                    const isLast         = idx === STEPS.length - 1;
                                    const isReview       = idx === 1;
                                    const showReupload   = isReview && isActionable;
                                    const connectorColor = state === 'completed' ? '#43b75d' : '#e5e7eb';

                                    const stepRemark = isReview && (state === 'rejected' || state === 'active')
                                        ? apiRecord?.submissionHistory?.find((h) => h.status === 'rejected' || h.status === 'under_review')?.remarks ?? step.description
                                        : step.description;

                                    return (
                                        <div key={step.key} className="flex gap-[25px]">

                                            {/* Circle + vertical connector */}
                                            <div className="flex flex-col items-center shrink-0 pt-4">
                                                <StepCircle state={state} />
                                                {!isLast && (
                                                    <div
                                                        className="w-0.5 flex-1 min-h-10 my-1"
                                                        style={{ background: connectorColor }}
                                                    />
                                                )}
                                            </div>

                                            {/* Step card */}
                                            <div
                                                className={`flex-1 bg-[#fbfbfb] border border-[#efefef] rounded-3xl pl-4 pr-6 py-4 ${isLast ? '' : 'mb-8'}`}
                                            >
                                                <div className="flex items-center justify-between flex-wrap gap-3">
                                                    <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
                                                        <Text className={`!font-semibold !text-base !leading-6 ${state === 'pending' ? '!text-[#979797]' : '!text-slate-800'}`}>
                                                            {step.label}
                                                        </Text>
                                                        {idx !== 0 && (
                                                            <Text className={`!text-base !leading-6 ${state === 'pending' ? '!text-[#a8a8a8]' : '!text-[#667085]'}`}>
                                                                {stepRemark}
                                                            </Text>
                                                        )}
                                                        {idx === 0 && apiRecord?.createdAt && (
                                                            <Text className="!text-xs !text-[#667085] !font-medium">
                                                                {formatComplianceDate(apiRecord.createdAt)}
                                                            </Text>
                                                        )}
                                                        {isReview && apiRecord?.submissionHistory?.find((h) => h.status === 'rejected') && (
                                                            <Text className="!text-xs !text-[#667085] !font-medium">
                                                                {formatComplianceDate(
                                                                    apiRecord.submissionHistory.find((h) => h.status === 'rejected')!.timestamp
                                                                )}
                                                            </Text>
                                                        )}
                                                    </Flex>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        {showReupload && <ReuploadButton complianceId={id ?? ''} />}
                                                        <StepBadge state={state} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Flex>

                            {/* Email notifications */}
                            <div className="flex items-center justify-between border border-black/[0.04] rounded-2xl p-4 mt-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[#fff9f9] flex items-center justify-center shrink-0">
                                        <Image src={iconSms} preview={false} width={28} height={28} wrapperClassName="leading-none" />
                                    </div>
                                    <Flex vertical gap={4}>
                                        <Text className="!font-semibold !text-base !text-slate-800 !leading-6">
                                            Email Notifications
                                        </Text>
                                        <Text className="!text-sm !text-slate-500 !leading-[22px]">
                                            We&apos;ll keep you updated at every step
                                        </Text>
                                    </Flex>
                                </div>
                                <div className="flex items-center gap-2 bg-[#ecfdf3] rounded-[20px] px-4 py-0.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#027a48] shrink-0" />
                                    <Text className="!text-[#027a48] !text-sm !leading-[22px]">Active</Text>
                                </div>
                            </div>
                        </div>
                    </Flex>
                </Flex>
            </div>

            {/* Back to dashboard */}
            <div className="flex justify-end">
                <Button
                    type="primary"
                    danger
                    onClick={() => navigate(`${paths.dashboard.compliance}/${paths.compliance.myCompliances}`)}
                    className="!h-12 !px-[22px] !text-base !font-medium !rounded-lg"
                >
                    Back to dashboard
                </Button>
            </div>
        </div>
    );
}
