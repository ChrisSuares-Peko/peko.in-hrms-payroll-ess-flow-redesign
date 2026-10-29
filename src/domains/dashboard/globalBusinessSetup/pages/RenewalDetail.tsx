/* eslint-disable no-nested-ternary */
import { ArrowLeftOutlined, CheckCircleFilled, LinkOutlined } from '@ant-design/icons';
import {
    Button,
    Col,
    Empty,
    Flex,
    // Modal, // TODO: re-enable when Request Revision is supported by vendor
    Row,
    Spin,
    Steps,
    Tag,
    Typography,
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { formattedDateTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import RupeeSymbol from '../components/RupeeSymbol';
import { useDownloadVendorFile } from '../hooks/useDownloadVendorFile';
import useRenewalDetail from '../hooks/useRenewalDetail';
import useRenewalPayment from '../hooks/useRenewalPayment';
// TODO: re-enable when Request Revision is supported by vendor
// import useRequestRenewalRevision from '../hooks/useRequestRenewalRevision';

const { Title, Text } = Typography;

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: Array<{ key: RenewalStatus; label: string }> = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'in_review', label: 'In Review' },
    { key: 'quoted', label: 'Quoted' },
    { key: 'awaiting_approval', label: 'Awaiting Approval' },
    { key: 'payment_pending', label: 'Payment' },
    { key: 'processing', label: 'Processing' },
    { key: 'completed', label: 'Completed' },
];

type RenewalStatus =
    | 'submitted'
    | 'in_review'
    | 'quoted'
    | 'awaiting_approval'
    | 'payment_pending'
    | 'processing'
    | 'completed'
    | 'revision_requested'
    | 'cancelled';

type RenewalDocument = { _id?: string; name?: string; url?: string; size?: number };

type ProcessingStep = {
    label: string;
    status: 'completed' | 'in_progress' | 'pending' | string;
    completed_at?: string;
};

type RenewalDetailData = {
    _id: string;
    agent?: string;
    company?: { _id?: string; proposed_name?: string } | string | null;
    external_company?: {
        name?: string;
        country?: string | { name?: string };
        company_type?: string;
        freezone?: string;
    } | null;
    renewal_type?: string;
    due_date?: string;
    priority?: 'normal' | 'high' | 'urgent';
    note?: string | null;
    status: RenewalStatus;
    document?: RenewalDocument | null;
    quote?: {
        service?: string;
        timeline?: string;
        jurisdiction?: string;
        licence_no?: string;
        remarks?: string;
        documents?: RenewalDocument[];
        breakdown?: {
            government_fees?: number;
            service_fee?: number;
            vat?: number;
            total?: number;
        };
    } | null;
    processing_steps?: ProcessingStep[];
    completed?: {
        completed_at?: string;
        notes?: string;
        documents?: RenewalDocument[];
    } | null;
    created_at?: string;
    updated_at?: string;
};

const STATUS_COLORS: Record<RenewalStatus, string> = {
    submitted: 'blue',
    in_review: 'orange',
    quoted: 'purple',
    awaiting_approval: 'gold',
    payment_pending: 'warning',
    processing: 'processing',
    completed: 'success',
    revision_requested: 'error',
    cancelled: 'default',
};

const humanize = (value?: string) => {
    if (!value) return 'N/A';
    return value
        .split(/[_\s-]+/)
        .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ''))
        .join(' ');
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getCompanyName = (renewal: RenewalDetailData) => {
    if (renewal.company && typeof renewal.company === 'object') {
        return renewal.company.proposed_name || 'N/A';
    }
    return renewal.external_company?.name || 'N/A';
};

const getCountryName = (renewal: RenewalDetailData) => {
    const ec = renewal.external_company;
    if (ec?.country) {
        if (typeof ec.country === 'string') return ec.country;
        return ec.country.name || 'N/A';
    }
    return 'N/A';
};

// ─── Sub-sections ─────────────────────────────────────────────────────────────

type SectionProps = { renewal: RenewalDetailData };

function InfoItem({
    label,
    value,
    children,
}: {
    label: string;
    value?: React.ReactNode;
    children?: React.ReactNode;
}) {
    const content = children ?? value;
    return (
        <div>
            <Text className="block !text-xs !text-neutral-400 mb-1">{label}</Text>
            <Text className="block !text-sm !text-neutral-900">
                {content === undefined || content === null || content === '' ? 'N/A' : content}
            </Text>
        </div>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Text className="block !text-xs !font-semibold !text-neutral-500 !uppercase tracking-wide mb-3">
            {children}
        </Text>
    );
}

function DocumentItem({ doc }: { doc: RenewalDocument }) {
    const downloadVendorFile = useDownloadVendorFile();
    if (!doc?._id && !doc?.url && !doc?.name) return null;
    return (
        <div className="flex items-center justify-between border border-neutral-200 rounded-xl px-3 py-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
                <LinkOutlined className="text-neutral-400 shrink-0" />
                <span className="truncate">{doc.name || 'Document'}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {doc.size ? (
                    <span className="text-xs text-neutral-400">
                        {Math.round(doc.size / 1024)} KB
                    </span>
                ) : null}
                {doc._id ? (
                    <button
                        type="button"
                        className="text-primary hover:underline bg-transparent border-0 p-0 cursor-pointer"
                        onClick={() => downloadVendorFile(doc._id)}
                    >
                        Download
                    </button>
                ) : doc.url ? (
                    <a
                        className="text-primary hover:underline"
                        href={doc.url}
                        rel="noreferrer"
                        target="_blank"
                    >
                        Download
                    </a>
                ) : null}
            </div>
        </div>
    );
}

function PendingSection({ renewal }: SectionProps) {
    const companyName = getCompanyName(renewal);
    return (
        <Flex vertical gap={16}>
            <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-500">
                Your renewal request has been received and is being reviewed by our team.
                You&apos;ll be notified once a quote is ready.
            </div>

            <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Renewal Type" value={humanize(renewal.renewal_type)} />
                <InfoItem
                    label="Due Date"
                    value={
                        renewal.due_date ? formattedDateTime(new Date(renewal.due_date)) : undefined
                    }
                />
                <InfoItem
                    label="Priority"
                    value={<span className="capitalize">{renewal.priority || 'Normal'}</span>}
                />
                <InfoItem label="Company" value={companyName} />
            </div>

            {renewal.note && (
                <div>
                    <Text className="block !text-xs !text-neutral-400 mb-1">
                        Additional Instructions
                    </Text>
                    <Text className="block !text-sm">{renewal.note}</Text>
                </div>
            )}
        </Flex>
    );
}

function ApprovalSection({
    renewal,
    onApprove,
}: SectionProps & {
    onApprove: () => void;
    // TODO: re-add onRevision / isRevising when Request Revision is supported again
}) {
    const { quote } = renewal;
    const breakdown = quote?.breakdown;
    const rowCls = 'flex justify-between py-3';

    return (
        <Flex vertical gap={24}>
            {/* Quote Details */}
            <div>
                <SectionLabel>Quote Details</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Service" value={quote?.service} />
                    <InfoItem label="Timeline" value={quote?.timeline} />
                    {quote?.jurisdiction && (
                        <InfoItem label="Jurisdiction" value={quote.jurisdiction} />
                    )}
                    {quote?.licence_no && <InfoItem label="Licence No." value={quote.licence_no} />}
                    <InfoItem
                        label="Due Date"
                        value={
                            renewal.due_date
                                ? formattedDateTime(new Date(renewal.due_date))
                                : undefined
                        }
                    />
                    {quote?.remarks && (
                        <div className="col-span-2">
                            <InfoItem label="Remarks" value={quote.remarks} />
                        </div>
                    )}
                    {quote?.documents && quote.documents.length > 0 && (
                        <div className="col-span-2">
                            <Text className="block !text-xs !text-neutral-400 mb-2">Documents</Text>
                            <Flex vertical gap={8}>
                                {quote.documents.map((doc, i) => (
                                    <DocumentItem key={i} doc={doc} />
                                ))}
                            </Flex>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-neutral-200" />

            {/* Cost Breakdown */}
            <div>
                <SectionLabel>Cost Breakdown</SectionLabel>
                {breakdown ? (
                    <div
                        className="rounded-2xl border border-neutral-200 overflow-hidden"
                        style={{ background: '#FAFAFA' }}
                    >
                        <div className={`${rowCls} px-5 border-b border-neutral-200`}>
                            <Text className="text-neutral-700">Government Fees</Text>
                            <Text className="font-medium">
                                <RupeeSymbol size={14} />
                                {formatNumberWithLocalString(breakdown.government_fees ?? 0)}
                            </Text>
                        </div>
                        <div className={`${rowCls} px-5 border-b border-neutral-200`}>
                            <Text className="text-neutral-700">Service Fee</Text>
                            <Text className="font-medium">
                                <RupeeSymbol size={14} />
                                {formatNumberWithLocalString(breakdown.service_fee ?? 0)}
                            </Text>
                        </div>
                        <div className={`${rowCls} px-5 border-b border-neutral-200`}>
                            <Text className="text-neutral-700">VAT</Text>
                            <Text className="font-medium">
                                <RupeeSymbol size={14} />
                                {formatNumberWithLocalString(breakdown.vat ?? 0)}
                            </Text>
                        </div>
                        <div className={`${rowCls} px-5`} style={{ background: '#fff' }}>
                            <Text className="text-lg font-semibold">Total</Text>
                            <Text className="text-lg font-semibold text-neutral-900">
                                <RupeeSymbol size={18} />
                                {formatNumberWithLocalString(breakdown.total ?? 0)}
                            </Text>
                        </div>
                    </div>
                ) : (
                    <Empty description="No quote breakdown available" />
                )}
            </div>

            <Flex gap={12} justify="flex-end" className="mt-2">
                {/* TODO: re-enable when Request Revision is supported by vendor
                <Button
                    danger
                    type="default"
                    loading={isRevising}
                    onClick={onRevision}
                >
                    Request Revision
                </Button>
                */}
                <Button type="primary" danger onClick={onApprove}>
                    Approve &amp; Pay
                </Button>
            </Flex>
        </Flex>
    );
}

function stepDot(status: string) {
    if (status === 'completed') {
        return <CheckCircleFilled style={{ color: '#16A34A', fontSize: 16 }} />;
    }
    if (status === 'in_progress') {
        return <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />;
    }
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-neutral-300" />;
}

function stepChipColor(status: string): 'success' | 'processing' | 'default' {
    if (status === 'completed') return 'success';
    if (status === 'in_progress') return 'processing';
    return 'default';
}

function stepChipLabel(status: string) {
    if (status === 'completed') return 'Completed';
    if (status === 'in_progress') return 'Ongoing';
    return 'Pending';
}

function ProcessingSection({ renewal }: SectionProps) {
    const steps = renewal.processing_steps ?? [];

    return (
        <Flex vertical gap={24}>
            <div>
                <SectionLabel>Request Details</SectionLabel>
                <div className="grid grid-cols-2 gap-4">
                    <InfoItem
                        label="Due Date"
                        value={
                            renewal.due_date
                                ? formattedDateTime(new Date(renewal.due_date))
                                : undefined
                        }
                    />
                    <InfoItem label="Timeline" value={renewal.quote?.timeline} />
                </div>
            </div>

            <div>
                <SectionLabel>What&apos;s happening now?</SectionLabel>
                {steps.length === 0 ? (
                    <div className="bg-neutral-50 rounded-xl p-4 text-sm text-neutral-500">
                        Your application will be processed soon. You can track its status here.
                    </div>
                ) : (
                    <Flex vertical gap={12}>
                        {steps.map((step, i) => (
                            <Flex key={i} align="center" gap={12}>
                                <div className="w-5 flex justify-center">
                                    {stepDot(step.status)}
                                </div>
                                <div className="flex-1">
                                    <Text className="block !text-sm">{step.label}</Text>
                                    {step.completed_at && (
                                        <Text className="block !text-xs !text-neutral-400">
                                            {formattedDateTime(new Date(step.completed_at))}
                                        </Text>
                                    )}
                                </div>
                                <Tag color={stepChipColor(step.status)} className="!m-0">
                                    {stepChipLabel(step.status)}
                                </Tag>
                            </Flex>
                        ))}
                    </Flex>
                )}
            </div>
        </Flex>
    );
}

function CompletedSection({ renewal }: SectionProps) {
    const { completed } = renewal;

    return (
        <Flex vertical gap={24}>
            <Flex
                vertical
                align="center"
                className="rounded-2xl p-6"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}
            >
                <CheckCircleFilled style={{ color: '#16A34A', fontSize: 42 }} />
                <Text className="!mt-3 !text-green-700 !font-semibold !text-lg">
                    Renewal Completed Successfully!
                </Text>
                <Text className="!text-green-600 !text-sm mt-1">
                    Your trade licence has been renewed.
                </Text>
            </Flex>

            <div>
                <SectionLabel>Summary</SectionLabel>
                <Flex vertical gap={16}>
                    <InfoItem
                        label="Completed On"
                        value={
                            completed?.completed_at
                                ? formattedDateTime(new Date(completed.completed_at))
                                : undefined
                        }
                    />
                    {completed?.notes && <InfoItem label="Notes" value={completed.notes} />}
                    {completed?.documents && completed.documents.length > 0 && (
                        <div>
                            <Text className="block !text-xs !text-neutral-400 mb-2">Documents</Text>
                            <Flex vertical gap={8}>
                                {completed.documents.map((doc, i) => (
                                    <DocumentItem key={i} doc={doc} />
                                ))}
                            </Flex>
                        </div>
                    )}
                </Flex>
            </div>
        </Flex>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function RenewalDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { xs } = useScreenSize();
    const { isLoading, data, error } = useRenewalDetail(id);
    const { proceedToPayment } = useRenewalPayment();
    // TODO: re-enable when Request Revision is supported by vendor
    // const { request: requestRevision, isRequesting: isRevising } =
    //     useRequestRenewalRevision();

    if (isLoading) {
        return (
            <Flex justify="center" align="center" className="w-full py-24">
                <Spin size="large" />
            </Flex>
        );
    }

    if (error || !data) {
        return (
            <Flex vertical justify="center" align="center" className="w-full py-24" gap={16}>
                <Empty description="Renewal not found" />
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                    Back
                </Button>
            </Flex>
        );
    }

    const renewal = data as RenewalDetailData;
    const { status } = renewal;
    const activeIdx = STAGES.findIndex(s => s.key === status);
    const stepsCurrent = activeIdx >= 0 ? activeIdx : 0;
    const stepsStatus = status === 'completed' ? 'finish' : activeIdx >= 0 ? 'process' : 'wait';

    const stepItems = STAGES.map(stage => ({
        title: stage.label,
    }));

    // TODO: re-enable when Request Revision is supported by vendor
    // const handleRevision = () => {
    //     if (!renewal._id) return;
    //     Modal.confirm({
    //         title: 'Request revision',
    //         content:
    //             'The vendor will be asked to revise the quote. You can still approve the original quote afterwards.',
    //         okText: 'Request Revision',
    //         okButtonProps: { danger: true },
    //         onOk: async () => {
    //             const res = await requestRevision(renewal._id);
    //             if (res) refresh();
    //         },
    //     });
    // };

    const handleApprove = () => {
        proceedToPayment({
            renewalId: renewal._id,
            baseAmount: Number(renewal.quote?.breakdown?.total ?? 0),
            renewalType: humanize(renewal.renewal_type),
            companyName: getCompanyName(renewal),
        });
    };

    const renderContent = () => {
        switch (status) {
            case 'quoted':
            case 'awaiting_approval':
            case 'payment_pending':
                return (
                    <ApprovalSection
                        renewal={renewal}
                        onApprove={handleApprove}
                        // TODO: re-add onRevision / isRevising when vendor re-enables it
                        // onRevision={handleRevision}
                        // isRevising={isRevising}
                    />
                );
            case 'processing':
                return <ProcessingSection renewal={renewal} />;
            case 'completed':
                return <CompletedSection renewal={renewal} />;
            default:
                return <PendingSection renewal={renewal} />;
        }
    };

    return (
        <Flex
            vertical
            className="mt-10"
            style={{ maxWidth: 1500, padding: xs ? '0 16px' : '0 24px' }}
        >
            {/* Header card */}
            <div
                className="bg-white rounded-[20px] mb-6"
                style={{
                    boxShadow: '0px 1.66px 16.56px 1.52px rgba(0,0,0,0.06)',
                    padding: xs ? 20 : 24,
                }}
            >
                <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
                    <Flex vertical gap={4}>
                        <Text className="text-xs text-neutral-400">Renewal Request</Text>
                        <Title level={4} className="!m-0">
                            {humanize(renewal.renewal_type)} — {getCompanyName(renewal)}
                        </Title>
                        <Text className="text-sm text-neutral-500">
                            Submitted{' '}
                            {renewal.created_at
                                ? formattedDateTime(new Date(renewal.created_at))
                                : 'N/A'}
                            {getCountryName(renewal) !== 'N/A' && ` · ${getCountryName(renewal)}`}
                        </Text>
                    </Flex>
                    <Tag
                        color={STATUS_COLORS[status] ?? 'default'}
                        style={{
                            padding: '4px 12px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 500,
                        }}
                    >
                        {humanize(status)}
                    </Tag>
                </Flex>
            </div>

            {/* Grid: timeline + content */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <div
                        className="bg-white rounded-[20px] min-h-[480px]"
                        style={{
                            boxShadow: '0px 1.66px 16.56px 1.52px rgba(0,0,0,0.06)',
                            padding: xs ? 20 : 24,
                        }}
                    >
                        <Text className="block font-medium mb-4">Progress</Text>
                        <Steps
                            direction="vertical"
                            size="small"
                            current={stepsCurrent}
                            status={stepsStatus as 'wait' | 'process' | 'finish' | 'error'}
                            items={stepItems}
                            className="mt-4"
                        />
                    </div>
                </Col>

                <Col xs={24} lg={16}>
                    <div
                        className="bg-white rounded-[20px] min-h-[480px]"
                        style={{
                            boxShadow: '0px 1.66px 16.56px 1.52px rgba(0,0,0,0.06)',
                            padding: xs ? 20 : 24,
                        }}
                    >
                        {renderContent()}
                    </div>
                </Col>
            </Row>
        </Flex>
    );
}
