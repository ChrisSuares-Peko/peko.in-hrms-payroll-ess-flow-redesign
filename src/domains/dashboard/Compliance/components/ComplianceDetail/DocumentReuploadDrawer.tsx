import { useState } from 'react';

import {
    CheckOutlined,
    CloseCircleOutlined,
    CloseOutlined,
    EyeOutlined,
    ReloadOutlined,
    UploadOutlined,
    WarningFilled,
} from '@ant-design/icons';
import { Alert, Button, Divider, Drawer, Flex, Tag, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import type { ComplianceDocSubmission, DocHistoryEntry, DocSubmissionStatus } from '../../types/docReupload';
import { ALLOWED_DOC_TYPES, type AllowedDocType } from '../../utils/complianceDetail';

const { Text, Title } = Typography;

// ─── Status config ────────────────────────────────────────────────────────────

const SUBMISSION_STATUS_CONFIG: Record<DocSubmissionStatus, { label: string; color: string; bg: string }> = {
    pending:       { label: 'Pending',       color: '#ef4444', bg: '#fef2f2' },
    due_soon:      { label: 'Due Soon',      color: '#d97706', bg: '#fffbeb' },
    under_review:  { label: 'Under Review',  color: '#2563eb', bg: '#eff6ff' },
    approved:      { label: 'Approved',      color: '#027a48', bg: '#ecfdf3' },
    rejected:      { label: 'Rejected',      color: '#ef4444', bg: '#fef2f2' },
    reopened:      { label: 'Re-upload',     color: '#7c3aed', bg: '#f5f3ff' },
};

const TIMELINE_DOT_COLOR: Record<DocSubmissionStatus, string> = {
    pending:       '#ef4444',
    due_soon:      '#d97706',
    under_review:  '#2563eb',
    approved:      '#027a48',
    rejected:      '#ef4444',
    reopened:      '#7c3aed',
};

// ─── Tracker steps definition ─────────────────────────────────────────────────

type TrackerStepKey = 'submitted' | 'under_review' | 'rejected' | 'reuploaded' | 'approved';

interface TrackerStep {
    key: TrackerStepKey;
    label: string;
    icon: React.ReactNode;
    errorStep?: boolean; // rejection step shows red instead of brand red
}

const DIRECT_PATH_STEPS: TrackerStep[] = [
    { key: 'submitted',    label: 'Submitted',    icon: <UploadOutlined />  },
    { key: 'under_review', label: 'Under Review', icon: <EyeOutlined />     },
    { key: 'approved',     label: 'Approved',     icon: <CheckOutlined />   },
];

const REJECTION_PATH_STEPS: TrackerStep[] = [
    { key: 'submitted',    label: 'Submitted',    icon: <UploadOutlined />                           },
    { key: 'under_review', label: 'Under Review', icon: <EyeOutlined />                              },
    { key: 'rejected',     label: 'Rejected',     icon: <CloseOutlined />,  errorStep: true          },
    { key: 'reuploaded',   label: 'Re-uploaded',  icon: <ReloadOutlined />                           },
    { key: 'approved',     label: 'Approved',     icon: <CheckOutlined />                            },
];

const STATUS_TO_DIRECT_STEP: Partial<Record<DocSubmissionStatus, number>> = {
    pending:      0,
    under_review: 1,
    approved:     2,
};

const STATUS_TO_REJECTION_STEP: Partial<Record<DocSubmissionStatus, number>> = {
    pending:      0,
    under_review: 1,
    rejected:     2,
    reopened:     3,
    approved:     4,
};

// ─── Process tracker ──────────────────────────────────────────────────────────

function ProcessTracker({
    submissionStatus,
    hasRejectionPath,
}: {
    submissionStatus: DocSubmissionStatus | null;
    hasRejectionPath: boolean;
}) {
    const steps = hasRejectionPath ? REJECTION_PATH_STEPS : DIRECT_PATH_STEPS;
    const stepMap = hasRejectionPath ? STATUS_TO_REJECTION_STEP : STATUS_TO_DIRECT_STEP;
    const currentStep = (submissionStatus ? stepMap[submissionStatus] : undefined) ?? -1;

    return (
        <Flex align="flex-start" justify="space-between" className="w-full px-2">
            {steps.map((step, i) => {
                const isCompleted = i < currentStep;
                const isActive    = i === currentStep;
                const isPending   = i > currentStep;

                const isError     = isActive && step.errorStep;
                const activeColor = isError ? '#ef4444' : '#ff4f4f';
                const doneColor   = step.errorStep ? '#ef4444' : '#ff4f4f';

                /* circle fill */
                let circleBg = '#eeeeee';
                if (isCompleted) circleBg = doneColor;
                else if (isActive) circleBg = activeColor;
                const iconColor   = isPending ? '#a9acb4' : '#fff';
                let labelColor = '#a9acb4';
                if (isCompleted || isActive) labelColor = isError ? '#ef4444' : '#ff4f4f';

                /* connector line after each step (except last) */
                const lineColor = i < currentStep ? '#ff4f4f' : '#e5e7eb';

                return (
                    <Flex key={step.key} align="flex-start" className="flex-1 min-w-0">
                        {/* step column */}
                        <Flex vertical align="center" gap={6} className="flex-1 min-w-0">
                            {/* circle */}
                            {isActive ? (
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="rounded-full shrink-0"
                                    style={{
                                        width: 34,
                                        height: 34,
                                        background: 'white',
                                        border: `2px solid ${activeColor}`,
                                    }}
                                >
                                    <Flex
                                        align="center"
                                        justify="center"
                                        className="rounded-full text-white text-sm"
                                        style={{ width: 26, height: 26, background: activeColor }}
                                    >
                                        {step.icon}
                                    </Flex>
                                </Flex>
                            ) : (
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="rounded-full shrink-0 text-sm"
                                    style={{ width: 34, height: 34, background: circleBg, color: iconColor }}
                                >
                                    {step.icon}
                                </Flex>
                            )}

                            {/* label */}
                            <Text
                                className="!text-[11px] !font-medium !text-center !leading-tight !whitespace-nowrap"
                                style={{ color: labelColor }}
                            >
                                {step.label}
                            </Text>
                        </Flex>

                        {/* connector line */}
                        {i < steps.length - 1 && (
                            <div
                                style={{
                                    flex: 1,
                                    height: 2,
                                    marginTop: 16,
                                    background: lineColor,
                                    minWidth: 8,
                                }}
                            />
                        )}
                    </Flex>
                );
            })}
        </Flex>
    );
}

// ─── Status timeline (audit log) ─────────────────────────────────────────────

function StatusTimeline({ history }: { history: DocHistoryEntry[] }) {
    return (
        <Flex vertical gap={0}>
            {history.map((entry, i) => {
                const isLast   = i === history.length - 1;
                const dotColor = TIMELINE_DOT_COLOR[entry.status];

                return (
                    <Flex key={i} gap={14} align="flex-start">
                        {/* dot + line */}
                        <Flex vertical align="center" className="shrink-0 w-4 mt-[3px]">
                            <div
                                className="w-4 h-4 rounded-full shrink-0 border-2 border-white"
                                style={{ background: dotColor, boxShadow: `0 0 0 2px ${dotColor}33` }}
                            />
                            {!isLast && (
                                <div
                                    className="w-0.5 mt-1"
                                    style={{ minHeight: 32, background: `${dotColor}55` }}
                                />
                            )}
                        </Flex>

                        {/* content */}
                        <Flex vertical gap={2} className="pb-5 flex-1 min-w-0">
                            <Flex align="center" gap={8} wrap="wrap">
                                <Text className="!text-sm !font-semibold !text-[#101828]">
                                    {SUBMISSION_STATUS_CONFIG[entry.status]?.label ?? entry.status}
                                </Text>
                                <Text className="!text-xs !text-[#94a3b8]">{entry.timestamp}</Text>
                            </Flex>
                            {entry.fileName && (
                                <Text className="!text-xs !text-[#475569]">File: {entry.fileName}</Text>
                            )}
                            {entry.remarks && (
                                <Text className="!text-xs !text-[#ef4444]">Reason: {entry.remarks}</Text>
                            )}
                        </Flex>
                    </Flex>
                );
            })}
        </Flex>
    );
}

// ─── Re-upload field ──────────────────────────────────────────────────────────

function ReuploadField({ onFileSelect }: { onFileSelect: (file: RcFile) => void }) {
    const [fileName, setFileName] = useState('');
    const dispatch = useAppDispatch();

    const beforeUpload = (file: RcFile) => {
        const isAllowed = ALLOWED_DOC_TYPES.includes(file.type as AllowedDocType);
        const isSize    = file.size / 1024 <= 5120;
        if (!isAllowed)
            dispatch(showToast({ description: 'Please upload a PDF, JPG, or PNG file.', variant: 'error' }));
        if (!isSize)
            dispatch(showToast({ description: 'File size must be smaller than 5 MB.', variant: 'error' }));
        return isAllowed && isSize;
    };

    const handleUpload = ({ file, onSuccess }: any) => {
        setFileName((file as RcFile).name);
        onFileSelect(file as RcFile);
        onSuccess('ok');
    };

    return (
        <Flex vertical gap={8}>
            <Text className="!text-sm !text-[#314259] !font-medium">Upload corrected document</Text>

            {fileName ? (
                <Flex
                    align="center"
                    justify="space-between"
                    className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px]"
                >
                    <Flex align="center" gap={10} className="flex-1 min-w-0">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                            <rect width="28" height="28" rx="4" fill="#fff1f1" />
                            <text x="4" y="20" fontSize="9" fontWeight="700" fill="#ff4f4f">PDF</text>
                        </svg>
                        <Text className="!text-[14px] !font-medium !text-[#292d32] truncate">{fileName}</Text>
                    </Flex>
                    <button
                        type="button"
                        onClick={() => setFileName('')}
                        className="shrink-0 text-[#8c8c8c] hover:text-[#ff4f4f] transition-colors ml-3"
                    >
                        <CloseCircleOutlined style={{ fontSize: 16 }} />
                    </button>
                </Flex>
            ) : (
                <Upload
                    accept=".pdf,.jpg,.jpeg,.png"
                    showUploadList={false}
                    maxCount={1}
                    beforeUpload={beforeUpload}
                    customRequest={handleUpload}
                    className="!block w-full [&_.ant-upload]:!block [&_.ant-upload]:!w-full"
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        className="border-[0.927px] border-dashed border-[#cbd0dc] rounded-[11px] px-4 h-[51px] cursor-pointer hover:border-[#ff4f4f] transition-colors w-full"
                    >
                        <Text className="!text-[14px] !font-medium !text-[#8c8c8c]">
                            Upload PDF, JPG, PNG (Max 5 MB)
                        </Text>
                        <span className="shrink-0 border-[0.867px] border-solid border-[#cbd0dc] rounded-[8px] px-3 py-[5px] text-[14px] font-medium text-[#54575c] bg-white">
                            Browse File
                        </span>
                    </Flex>
                </Upload>
            )}
        </Flex>
    );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

export interface DocumentReuploadDrawerProps {
    open: boolean;
    onClose: () => void;
    complianceTitle: string;
    submission: ComplianceDocSubmission | null;
    onReupload: (file: RcFile) => void;
}

export default function DocumentReuploadDrawer({
    open,
    onClose,
    complianceTitle,
    submission,
    onReupload,
}: DocumentReuploadDrawerProps) {
    const [pendingFile, setPendingFile] = useState<RcFile | null>(null);
    const [submitting, setSubmitting]   = useState(false);
    const dispatch = useAppDispatch();

    if (!submission) return null;

    const { submissionStatus, rejectionReason, history, lastUploadedFileName } = submission;

    const isRejected       = submissionStatus === null || submissionStatus === 'rejected' || submissionStatus === 'reopened';
    const hasRejectionPath = history.some((h) => h.status === 'rejected') || isRejected;
    const statusCfg        = (submissionStatus ? SUBMISSION_STATUS_CONFIG[submissionStatus] : null) ?? SUBMISSION_STATUS_CONFIG.pending;

    const handleSubmit = async () => {
        if (!pendingFile) {
            dispatch(showToast({ description: 'Please select a file to re-upload.', variant: 'error' }));
            return;
        }
        setSubmitting(true);
        try {
            onReupload(pendingFile);
            dispatch(showToast({ description: 'Document re-uploaded successfully.', variant: 'success' }));
            setPendingFile(null);
            onClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Drawer
            title={
                <Flex vertical gap={2}>
                    <Text className="!font-semibold !text-[16px] !text-[#101828]">Document Status</Text>
                    <Text className="!text-[13px] !text-[#64748b] !font-normal">{complianceTitle}</Text>
                </Flex>
            }
            open={open}
            onClose={onClose}
            width={520}
            footer={
                isRejected ? (
                    <Flex justify="end" gap={12}>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button
                            type="primary"
                            icon={<UploadOutlined />}
                            loading={submitting}
                            onClick={handleSubmit}
                            className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e]"
                        >
                            Re-upload Document
                        </Button>
                    </Flex>
                ) : null
            }
        >
            <Flex vertical gap={20}>

                {/* ── Process tracker ── */}
                <Flex vertical gap={16} className="bg-[#f8fafc] rounded-xl px-4 pt-5 pb-4">
                    <Text className="!text-[13px] !font-semibold !text-[#475569] !uppercase !tracking-wide">
                        Document Review Progress
                    </Text>
                    <ProcessTracker
                        submissionStatus={submissionStatus}
                        hasRejectionPath={hasRejectionPath}
                    />
                </Flex>

                <Divider className="!my-0" />

                {/* ── Current status tag ── */}
                <Flex align="center" gap={10}>
                    <Text className="!text-sm !text-[#475569]">Current Status:</Text>
                    <Tag
                        style={{
                            color: statusCfg.color,
                            background: statusCfg.bg,
                            border: 'none',
                            borderRadius: 50,
                            paddingInline: 12,
                            fontSize: 13,
                        }}
                    >
                        ● {statusCfg.label}
                    </Tag>
                </Flex>

                {/* ── Last uploaded file ── */}
                {lastUploadedFileName && (
                    <Flex align="center" gap={10} className="bg-[#f8fafc] rounded-lg px-4 py-3">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
                            <rect width="28" height="28" rx="4" fill="#fff1f1" />
                            <text x="4" y="20" fontSize="9" fontWeight="700" fill="#ff4f4f">DOC</text>
                        </svg>
                        <Flex vertical gap={0}>
                            <Text className="!text-[13px] !font-medium !text-[#292d32]">{lastUploadedFileName}</Text>
                            <Text className="!text-xs !text-[#94a3b8]">Last uploaded document</Text>
                        </Flex>
                    </Flex>
                )}

                {/* ── Rejection reason alert ── */}
                {isRejected && rejectionReason && (
                    <Alert
                        type="error"
                        icon={<WarningFilled />}
                        showIcon
                        message="Document Rejected"
                        description={rejectionReason}
                        className="!rounded-xl"
                    />
                )}

                {/* ── Re-upload field ── */}
                {isRejected && (
                    <>
                        <Divider className="!my-1" />
                        <ReuploadField onFileSelect={setPendingFile} />
                    </>
                )}

                {/* ── Audit / history timeline ── */}
                {history.length > 0 && (
                    <>
                        <Divider className="!my-1" />
                        <Flex vertical gap={12}>
                            <Title level={5} className="!m-0 !text-[14px] !text-[#101828]">
                                Status History
                            </Title>
                            <StatusTimeline history={history} />
                        </Flex>
                    </>
                )}

            </Flex>
        </Drawer>
    );
}
