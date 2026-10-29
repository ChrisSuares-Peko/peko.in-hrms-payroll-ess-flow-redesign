import { useCallback, useEffect, useRef, useState } from 'react';

import {
    CameraOutlined,
    CheckOutlined,
    CloseOutlined,
    DownloadOutlined,
    ExclamationCircleOutlined,
    FileTextOutlined,
    IdcardOutlined,
    LockOutlined,
    MessageOutlined,
    ReloadOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Input, message, Result, Row, Select, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useLocation, useParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';

import { uploadApplicantDocument } from '../api/visa';
import { useTrackVisaApplication } from '../hooks/useVisaApi';
import type { VisaOrderDocument } from '../types/visa';

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
    borderRadius: 24,
    boxShadow: '0px 1.5px 16.5px rgba(0, 0, 0, 0.06)',
    border: 'none',
};

const cardBodyStyle = { padding: '24px 28px' };

// ─── Types ────────────────────────────────────────────────────────────────────

type TrackingStatus =
    | 'application_submitted'
    | 'documents_verified'
    | 'under_review'
    | 'documents_pickup_scheduled'
    | 'appointment_booked'
    | 'visa_stamped'
    | 'visa_delivered'
    | 'application_created'
    | 'documents_under_review'
    | 'processing'
    | 'visa_issued'
    | 'embassy_submission'
    | 'documents_returned'
    | 'embassy_visit';

type TrackType = 'evisa' | 'representative' | 'embassy';

const formatVisaFormat = (format: string) => {
    if (format.toLowerCase() === 'evisa') return 'E-Visa';
    return format.charAt(0).toUpperCase() + format.slice(1);
};

type StepStatus = 'completed' | 'current' | 'failed' | 'pending';

interface StepDef {
    key: TrackingStatus;
    label: string;
    date?: string;
}

interface ComputedStep extends StepDef {
    status: StepStatus;
}

// ─── Step Definitions ─────────────────────────────────────────────────────────

const fullServiceSteps: StepDef[] = [
    { key: 'application_created', label: 'Application Created' },
    { key: 'application_submitted', label: 'Application Submitted' },
    { key: 'documents_under_review', label: 'Documents Under Review' },
    { key: 'processing', label: 'Processing' },
    { key: 'visa_issued', label: 'Visa Issued / Closed' },
];

const embassyVisitSteps: StepDef[] = [
    { key: 'application_created', label: 'Application Created' },
    { key: 'application_submitted', label: 'Application Submitted' },
    { key: 'documents_under_review', label: 'Documents Under Review' },
    { key: 'appointment_booked', label: 'Appointment Booked' },
    { key: 'embassy_visit', label: 'Embassy Visit' },
];

const representativeSteps: StepDef[] = [
    { key: 'application_created', label: 'Application Created' },
    { key: 'application_submitted', label: 'Application Submitted' },
    { key: 'documents_under_review', label: 'Documents Under Review' },
    { key: 'documents_pickup_scheduled', label: 'Documents Pickup Scheduled' },
    { key: 'embassy_submission', label: 'Embassy Submission' },
    { key: 'visa_issued', label: 'Visa Issued / Closed' },
    { key: 'documents_returned', label: 'Documents Returned' },
];


const trackTypeOptions: { value: TrackType; label: string }[] = [
    { value: 'evisa', label: 'E-Visa' },
    { value: 'representative', label: 'Representative Submission' },
    { value: 'embassy', label: 'Embassy Visit' },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CODE_STYLES: Record<string, { bg: string; color: string }> = {
    UNDER_REVIEW:           { bg: '#EDECFD', color: '#4343B7' },
    DOCUMENTS_PENDING:      { bg: '#FFFBEA', color: '#D88602' },
    NEW:                    { bg: '#EFF6FF', color: '#3B82F6' },
    APPLICATION_CREATED:    { bg: '#EFF6FF', color: '#3B82F6' },
    DOCUMENTS_VERIFIED:     { bg: '#ECFDF5', color: '#059669' },
    DOCS_UNDER_REVIEW:      { bg: '#EFF6FF', color: '#3B82F6' },
    PROCESSING:             { bg: '#F5F3FF', color: '#7C3AED' },
    VISA_ISSUED:            { bg: '#ECFDF5', color: '#059669' },
    VISA_STAMPED:           { bg: '#ECFDF5', color: '#059669' },
    VISA_DELIVERED:         { bg: '#ECFDF5', color: '#059669' },
    DELIVERED:              { bg: '#ECFDF5', color: '#059669' },
    REJECTED:               { bg: '#FEF2F2', color: '#EF4444' },
    VISA_REJECTED:          { bg: '#FEF2F2', color: '#EF4444' },
    DOCS_REJECTED:          { bg: '#FEF2F2', color: '#EF4444' },
};

const getStatusBadgeStyle = (code?: string) =>
    STATUS_CODE_STYLES[code ?? ''] ?? { bg: '#F3F4F6', color: '#6B7280' };

// ─── Step Circle ──────────────────────────────────────────────────────────────

const StepCircle = ({ step, status }: { step: number; status: StepStatus }) => {
    if (status === 'completed') {
        return (
            <Flex align="center" justify="center" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FF4F4F', border: '2px solid #FF4F4F', flexShrink: 0 }}>
                <CheckOutlined style={{ color: '#FFFFFF', fontSize: 14 }} />
            </Flex>
        );
    }
    if (status === 'current') {
        return (
            <Flex align="center" justify="center" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #FF4F4F', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
                <CheckOutlined style={{ color: '#FF4F4F', fontSize: 14 }} />
            </Flex>
        );
    }
    if (status === 'failed') {
        return (
            <Flex align="center" justify="center" style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#EF4444', border: '2px solid #EF4444', flexShrink: 0 }}>
                <CloseOutlined style={{ color: '#FFFFFF', fontSize: 14 }} />
            </Flex>
        );
    }
    return (
        <Flex align="center" justify="center" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #A1AEBE', backgroundColor: '#FFFFFF', flexShrink: 0 }}>
            <Text style={{ color: '#242E39', fontSize: 13, fontWeight: 500 }}>
                {String(step).padStart(2, '0')}
            </Text>
        </Flex>
    );
};

// ─── Shared form field label ──────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: 400, color: 'rgba(0, 0, 0, 0.85)', lineHeight: '22px' }}>
            {children}
        </Text>
    </div>
);

const fieldInputStyle: React.CSSProperties = {
    borderRadius: 8,
    height: 40,
    border: '1px solid #D9D9D9',
    fontSize: 14,
};

// ─── Info Card for "Documents Pickup Scheduled" ───────────────────────────────

const DocumentsPickupInfoCard = () => (
    <div style={{ background: '#FFFDF9', border: '1px solid #EAC78C', borderRadius: 24, padding: '18px 24px', marginTop: 16, marginBottom: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: 500, color: '#272116', display: 'block', marginBottom: 16 }}>
            Please keep the following documents ready for pickup on 02 Feb 2025
        </Text>
        <div style={{ marginBottom: 20 }}>
            <FieldLabel>Enter Addresss</FieldLabel>
            <Input placeholder="Eg. Arya" style={fieldInputStyle} />
        </div>
        <Row gutter={[32, 0]}>
            <Col xs={24} sm={12}>
                <Flex vertical gap={2}>
                    {[['Date', '02 Feb 2025'], ['Time', '10:00 AM – 1:00 PM'], ['Contact', 'Peko Operations Team']].map(([label, value]) => (
                        <Text key={label} style={{ fontSize: 14, fontWeight: 600, color: '#272116', lineHeight: '29px' }}>
                            {label}: <span style={{ fontWeight: 600 }}>{value}</span>
                        </Text>
                    ))}
                </Flex>
            </Col>
            <Col xs={24} sm={12}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#272116', display: 'block', lineHeight: '25px' }}>Required Documents for Pickup:</Text>
                {['Original Passport', 'Bank Statement', 'Photograph (recent)', 'Visa Application Form'].map(doc => (
                    <Text key={doc} style={{ fontSize: 14, fontWeight: 600, color: '#272116', display: 'block', lineHeight: '25px' }}>✓ {doc}</Text>
                ))}
            </Col>
        </Row>
    </div>
);

// ─── Info Card for "Documents Returned" ──────────────────────────────────────

const DocumentsReturnedInfoCard = () => (
    <div style={{ background: '#F0FBF6', border: '1px solid #43B75D', borderRadius: 24, padding: '18px 24px', marginTop: 16, marginBottom: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: 500, color: '#276749', display: 'block', marginBottom: 16 }}>
            Your documents are scheduled to be returned on 08 Feb 2025
        </Text>
        <div style={{ marginBottom: 20 }}>
            <FieldLabel>Enter Addresss</FieldLabel>
            <Input placeholder="Eg. Arya" style={fieldInputStyle} />
        </div>
        <Row gutter={[32, 0]}>
            <Col xs={24} sm={12}>
                <Flex vertical gap={2}>
                    {[['Date', '08 Feb 2025'], ['Time', '2:00 PM – 4:00 PM'], ['Contact', 'Peko Operations Team']].map(([label, value]) => (
                        <Text key={label} style={{ fontSize: 14, fontWeight: 600, color: '#276749', lineHeight: '29px' }}>
                            {label}: <span style={{ fontWeight: 600 }}>{value}</span>
                        </Text>
                    ))}
                </Flex>
            </Col>
            <Col xs={24} sm={12}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: '#276749', display: 'block', lineHeight: '25px' }}>Documents Being Returned:</Text>
                {['Original Passport', 'Bank Statement', 'Visa Application Form', 'Supporting Documents'].map(doc => (
                    <Text key={doc} style={{ fontSize: 14, fontWeight: 600, color: '#276749', display: 'block', lineHeight: '25px' }}>✓ {doc}</Text>
                ))}
            </Col>
        </Row>
    </div>
);

// ─── Info Card for "Appointment Booked" ──────────────────────────────────────

const AppointmentBookedInfoCard = () => (
    <div style={{ background: '#E8F4FF', border: '1px solid #014EDC', borderRadius: 24, padding: '18px 24px', marginTop: 16, marginBottom: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: 500, color: '#014EDC', display: 'block', marginBottom: 16 }}>Appointment Details</Text>
        <Flex vertical gap={2}>
            {[['Date', '02 Feb 2025'], ['Time', '10:00 AM – 1:00 PM'], ['Embassy', 'US Consulate General, Mumbai'], ['Address', 'C-49, G-Block, Bandra Kurla Complex, Mumbai']].map(([label, value]) => (
                <Text key={label} style={{ fontSize: 14, fontWeight: 400, color: '#465668', lineHeight: '29px' }}>
                    {label}: <span style={{ fontWeight: 400 }}>{value}</span>
                </Text>
            ))}
        </Flex>
    </div>
);

// ─── Info Card for "Visa Issued / Closed" ────────────────────────────────────

const VisaIssuedInfoCard = ({ statusCode }: { statusCode?: string }) => {
    const isRejected = statusCode === 'VISA_REJECTED';
    if (isRejected) {
        return (
            <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', borderRadius: 24, padding: '18px 24px', marginTop: 16, marginBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: 500, color: '#EF4444', display: 'block', marginBottom: 8 }}>
                    Visa Application Rejected
                </Text>
                <Text style={{ fontSize: 14, color: '#7F1D1D', display: 'block' }}>
                    Your visa application has been rejected by the embassy. Please check the Documents section below for the rejection reason and contact support for further assistance.
                </Text>
            </div>
        );
    }
    return (
        <div style={{ background: '#F0FBF6', border: '1px solid #43B75D', borderRadius: 24, padding: '18px 24px', marginTop: 16, marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: 500, color: '#276749', display: 'block', marginBottom: 8 }}>
                Visa Approved
            </Text>
            <Text style={{ fontSize: 14, color: '#14532D', display: 'block' }}>
                Your visa has been approved. Please check the Documents section below to download your visa copy.
            </Text>
        </div>
    );
};

// ─── Info Cards for "Embassy Visit" ──────────────────────────────────────────

const EmbassyVisitInfoCard = () => (
    <Flex vertical gap={12} style={{ marginTop: 16, marginBottom: 4 }}>
        <div style={{ background: '#F1F5F9', borderRadius: 18, padding: '18px' }}>
            <Text style={{ fontSize: 14, fontWeight: 400, color: '#475569', lineHeight: '20px' }}>
                From this stage onward, the remaining visa process is managed directly by the embassy or consulate. Live status tracking will not be available beyond this point.
            </Text>
        </div>
        <div style={{ background: '#EDECFD', border: '1px solid #4343B7', borderRadius: 24, padding: '18px 24px' }}>
            <Text style={{ fontSize: 16, fontWeight: 500, color: '#4343B7', display: 'block', marginBottom: 12 }}>Documents to Carry to Embassy:</Text>
            {['Original Passport', 'Bank Statement', 'Visa Application Form', 'Supporting Documents'].map(doc => (
                <Text key={doc} style={{ fontSize: 14, fontWeight: 400, color: '#475569', display: 'block', lineHeight: '25px' }}>✓ {doc}</Text>
            ))}
        </div>
    </Flex>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const VisaTrackApplication = () => {
    const { orderNumber: orderNumberParam } = useParams<{ orderNumber: string }>();
    const location = useLocation();
    const state = location.state as { orderNumber?: string } | null;
    const orderNumber = orderNumberParam ?? state?.orderNumber ?? '';

    const { orderData, isLoading, error, refetch } = useTrackVisaApplication(orderNumber);
    const { role, id: userId } = useAppSelector(s => s.reducer.auth);

    const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>('application_submitted');
    const [testTrackType, setTestTrackType] = useState<TrackType | ''>('');
    const [uploadingCode, setUploadingCode] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingDoc = useRef<VisaOrderDocument | null>(null);

    const handleReUploadClick = (doc: VisaOrderDocument) => {
        pendingDoc.current = doc;
        fileInputRef.current?.click();
    };

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !pendingDoc.current) return;

        const { document_code, application_id } = pendingDoc.current;
        setUploadingCode(document_code);

        try {
            const result = await uploadApplicantDocument({
                userType: role,
                userId,
                file,
                document_code,
                application_id: Number(application_id ?? 0),
                order_number: orderNumber,
            });
            if (result) {
                message.success('Document uploaded successfully');
                refetch();
            } else {
                message.error('Upload failed. Please try again.');
            }
        } catch {
            message.error('Upload failed. Please try again.');
        } finally {
            setUploadingCode(null);
            pendingDoc.current = null;
            e.target.value = '';
        }
    }, [role, userId, orderNumber, refetch]);

    useEffect(() => {
        const statusCode = orderData?.status_code;
        if (!statusCode) return;
        const statusMap: Partial<Record<string, TrackingStatus>> = {
            NEW:                    'application_submitted',
            DOCUMENTS_PENDING:      'application_submitted',
            DOCUMENTS_VERIFIED:     'documents_verified',
            UNDER_REVIEW:           'under_review',
            PICKUP_SCHEDULED:       'documents_pickup_scheduled',
            APPOINTMENT_BOOKED:     'appointment_booked',
            VISA_STAMPED:           'visa_stamped',
            DELIVERED:              'visa_delivered',
            APPLICATION_CREATED:    'application_created',
            DOCS_UNDER_REVIEW:      'documents_under_review',
            PROCESSING:             'processing',
            VISA_ISSUED:            'visa_issued',
            VISA_REJECTED:          'visa_issued',   // terminal step shared with approval; badge colour distinguishes outcome
            DOCS_REJECTED:          'documents_under_review',   // QC failure; step renders as failed, not just current
            EMBASSY_SUBMISSION:     'embassy_submission',
            DOCUMENTS_RETURNED:     'documents_returned',
            EMBASSY_VISIT:          'embassy_visit',
        };
        const mapped = statusMap[statusCode];
        if (mapped) setTrackingStatus(mapped);
    }, [orderData?.status_code]);

    const hasRepresentativeSubmission = orderData?.add_ons?.some(
        (a: string) => a.toLowerCase().replace(/[\s_-]/g, '') === 'representativesubmission'
    ) ?? false;
    const orderVisaType = (orderData?.visa_type ?? '').toLowerCase();

    const computedTrackType: TrackType = (() => {
        if (orderVisaType === 'evisa' && !hasRepresentativeSubmission) return 'evisa';
        if (hasRepresentativeSubmission) return 'representative';
        return 'embassy';
    })();

    const trackType: TrackType = testTrackType || computedTrackType;

    const getStepDefs = () => {
        if (trackType === 'representative') return representativeSteps;
        if (trackType === 'embassy') return embassyVisitSteps;
        return fullServiceSteps;
    };
    const stepDefs = getStepDefs();

    const statusDropdownOptions = stepDefs.map(s => ({ value: s.key as TrackingStatus, label: s.label }));

    const currentIdx = stepDefs.findIndex(s => s.key === trackingStatus);
    const currentStepFailed = orderData?.status_code === 'DOCS_REJECTED';

    const computeStepStatus = (idx: number): StepStatus => {
        if (idx < currentIdx) return 'completed';
        if (idx === currentIdx) return currentStepFailed ? 'failed' : 'current';
        return 'pending';
    };

    const computedSteps: ComputedStep[] = stepDefs.map((s, idx) => ({
        ...s,
        date: orderData?.step_dates?.[s.key],
        status: computeStepStatus(idx),
    }));

    const statusBadgeStyle = getStatusBadgeStyle(orderData?.status_code);

    // ─── Error states ─────────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <Flex align="center" justify="center" style={{ minHeight: 400 }}>
                <Spin size="large" />
            </Flex>
        );
    }

    if (error === 'NOT_FOUND') {
        return (
            <Result
                icon={<ExclamationCircleOutlined style={{ color: '#FF4F4F' }} />}
                title="Order Not Found"
                subTitle={`We couldn't find an order with number "${orderNumber}". It may have been removed or the link is incorrect.`}
                extra={
                    <Button onClick={() => window.history.back()} style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8 }}>
                        Go Back
                    </Button>
                }
            />
        );
    }

    if (error === 'FORBIDDEN') {
        return (
            <Result
                icon={<LockOutlined style={{ color: '#FF4F4F' }} />}
                title="Access Denied"
                subTitle="You don't have permission to view this order."
                extra={
                    <Button onClick={() => window.history.back()} style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8 }}>
                        Go Back
                    </Button>
                }
            />
        );
    }

    if (error === 'ERROR') {
        return (
            <Result
                status="error"
                title="Failed to Load"
                subTitle="Something went wrong while fetching the order details. Please try again."
                extra={
                    <Button onClick={refetch} icon={<ReloadOutlined />} style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8 }}>
                        Retry
                    </Button>
                }
            />
        );
    }

    return (
        <Flex vertical gap={20} style={{ padding: 'clamp(12px, 3vw, 24px)', maxWidth: 1100, margin: '0 auto' }}>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,.pdf"
                onChange={handleFileChange}
            />
            {/* Header card */}
            {/* <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
                    <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#1E293B' }}>
                        Tracking Flow
                    </Title>
                    <Flex gap={8} wrap="wrap">
                        {['E-Visa', 'Visa 1 - Full Service', 'Visa 2 - Embassy Visit'].map(tab => (
                            <Tag
                                key={tab}
                                style={{
                                    backgroundColor: '#FFF0F0',
                                    color: '#FF4F4F',
                                    border: '1px solid #FFCDD2',
                                    borderRadius: 20,
                                    padding: '4px 14px',
                                    fontSize: 13,
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                }}
                            >
                                {tab}
                            </Tag>
                        ))}
                    </Flex>
                </Flex>
            </Card> */}

            {/* Order info bar */}
            <Card style={cardStyle} styles={{ body: cardBodyStyle }}>
                <Flex align="center" justify="space-between" wrap="wrap" gap={16}>
                    {/* Left: order number + badges (top row) + subtitle (bottom row) */}
                    <Flex vertical gap={10} style={{ flex: 1, minWidth: 0 }}>
                        <Flex align="center" gap={12} wrap="wrap">
                            <Title level={3} style={{ margin: 0, fontWeight: 700, color: '#1E293B', fontSize: 26 }}>
                                {orderNumber || '—'}
                            </Title>

                            {orderData?.frontend_status && (
                                <Tag
                                    style={{
                                        backgroundColor: statusBadgeStyle.bg,
                                        color: statusBadgeStyle.color,
                                        border: 'none',
                                        borderRadius: 20,
                                        padding: '4px 14px',
                                        fontSize: 13,
                                        fontWeight: 500,
                                    }}
                                >
                                    {orderData.frontend_status}
                                </Tag>
                            )}

                            {orderData?.visa_format && (
                                <Tag
                                    style={{
                                        backgroundColor: '#E8F4FF',
                                        color: '#014EDC',
                                        border: 'none',
                                        borderRadius: 20,
                                        padding: '4px 14px',
                                        fontSize: 13,
                                        fontWeight: 500,
                                    }}
                                >
                                    {formatVisaFormat(orderData.visa_format)}
                                </Tag>
                            )}
                        </Flex>

                        {orderData?.destination && (
                            <Text style={{ color: '#6A7282', fontSize: 14 }}>
                                {orderData.destination}
                                {orderData.visa_duration ? ` · ${orderData.visa_duration}` : ''}
                                {orderData.entries_allowed ? ` · ${orderData.entries_allowed}` : ''}
                            </Text>
                        )}
                    </Flex>

                    {/* Right: action buttons */}
                    <Flex gap={8} wrap="wrap" style={{ flexShrink: 0 }}>
                        {/* Refresh button intentionally hidden — keep for future use
                        <Button
                            icon={<ReloadOutlined />}
                            loading={isLoading}
                            onClick={refetch}
                            style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8, height: 40, fontWeight: 500 }}
                        >
                            Refresh
                        </Button>
                        */}
                        <div style={{ display: 'none' }}>
                        <Button
                            icon={<DownloadOutlined />}
                            style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8, height: 40, fontWeight: 500 }}
                        >
                            Download Receipt
                        </Button>
                        <Button
                            icon={<MessageOutlined />}
                            style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 8, height: 40, fontWeight: 500 }}
                        >
                            Contact Support
                        </Button>
                        </div>
                    </Flex>
                </Flex>
            </Card>

            {/* Main content */}
            <Row gutter={[20, 20]} align="top">
                {/* Left column */}
                <Col xs={24} lg={14}>
                    <Flex vertical gap={20}>
                        {/* Application Timeline */}
                        <Card
                            style={cardStyle}
                            styles={{ body: cardBodyStyle }}
                            title={
                                <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                                    <Text style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Application Timeline</Text>
                                    <Flex align="center" gap={8} style={{ flexShrink: 0, display: 'none' }}>
                                        <Text style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Test Type:</Text>
                                        <Select
                                            value={testTrackType || undefined}
                                            onChange={v => {
                                                setTestTrackType(v ?? '');
                                                setTrackingStatus('application_submitted');
                                            }}
                                            placeholder="Auto"
                                            options={trackTypeOptions}
                                            allowClear
                                            style={{ width: 180 }}
                                            size="small"
                                        />
                                        <Text style={{ fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>Test Status:</Text>
                                        <Select
                                            value={trackingStatus}
                                            onChange={v => setTrackingStatus(v)}
                                            options={statusDropdownOptions}
                                            style={{ width: 200 }}
                                            size="small"
                                        />
                                    </Flex>
                                </Flex>
                            }
                        >
                            <div>
                                {computedSteps.map((step, idx) => {
                                    const isLast = idx === computedSteps.length - 1;
                                    const connectorColor = step.status === 'completed' ? '#FF4F4F' : '#A1AEBE';
                                    const stepLabelColor = (() => {
                                        if (step.status === 'pending') return '#465668';
                                        if (step.status === 'failed') return '#EF4444';
                                        if (step.status === 'current') return '#FF4F4F';
                                        return '#000000';
                                    })();

                                    return (
                                        <div
                                            key={step.key}
                                            style={{ display: 'grid', gridTemplateColumns: '32px 1fr', columnGap: 14 }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <StepCircle step={idx + 1} status={step.status} />
                                                {!isLast && (
                                                    <div style={{ flex: 1, width: 2, backgroundColor: connectorColor, minHeight: 24 }} />
                                                )}
                                            </div>

                                            <div style={{ paddingTop: 5, paddingBottom: isLast ? 0 : 20 }}>
                                                <Flex align="center" gap={8} wrap="wrap">
                                                    <Text
                                                        style={{
                                                            fontSize: step.status === 'pending' ? 13 : 16,
                                                            fontWeight: step.status === 'pending' || step.status === 'completed' ? 500 : 700,
                                                            color: stepLabelColor,
                                                            lineHeight: step.status === 'pending' ? '16px' : '22px',
                                                        }}
                                                    >
                                                        {step.label}
                                                    </Text>
                                                    {step.status === 'current' && step.key !== 'visa_issued' && (
                                                        <Tag
                                                            style={{
                                                                backgroundColor: '#FFFBEA',
                                                                color: '#D88602',
                                                                border: '1px solid #FDE68A',
                                                                borderRadius: 42,
                                                                fontSize: 14,
                                                                fontWeight: 500,
                                                                padding: '2px 10px',
                                                                margin: 0,
                                                            }}
                                                        >
                                                            In Progress
                                                        </Tag>
                                                    )}
                                                    {step.status === 'failed' && (
                                                        <Tag
                                                            style={{
                                                                backgroundColor: '#FEF2F2',
                                                                color: '#EF4444',
                                                                border: '1px solid #FECACA',
                                                                borderRadius: 42,
                                                                fontSize: 14,
                                                                fontWeight: 500,
                                                                padding: '2px 10px',
                                                                margin: 0,
                                                            }}
                                                        >
                                                            Failed
                                                        </Tag>
                                                    )}
                                                </Flex>
                                                {step.status !== 'pending' && step.date && (
                                                    <Text style={{ fontSize: 12, color: '#6A7282', display: 'block', marginTop: 2 }}>
                                                        {step.date}
                                                    </Text>
                                                )}

                                                {step.status === 'current' && step.key === 'documents_pickup_scheduled' && (
                                                    <DocumentsPickupInfoCard />
                                                )}
                                                {step.status === 'current' && step.key === 'documents_returned' && (
                                                    <DocumentsReturnedInfoCard />
                                                )}
                                                {step.status === 'current' && step.key === 'appointment_booked' && (
                                                    <AppointmentBookedInfoCard />
                                                )}
                                                {step.status === 'current' && step.key === 'embassy_visit' && (
                                                    <EmbassyVisitInfoCard />
                                                )}
                                                {step.key === 'visa_issued' && step.status !== 'pending' && (
                                                    <VisaIssuedInfoCard statusCode={orderData?.status_code} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>

                        {/* Documents Uploaded */}
                        <Card
                            style={cardStyle}
                            styles={{ body: cardBodyStyle }}
                            title={<Text style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Documents Uploaded</Text>}
                        >
                            {!orderData?.documents?.length ? (
                                <Text style={{ color: '#9CA3AF', fontSize: 14 }}>No documents on record.</Text>
                            ) : (
                                <Flex vertical gap={12}>
                                    {(() => {
                                        const isVisaApproved = orderData?.status_code === 'VISA_ISSUED';
                                        return orderData.documents.map(doc => {
                                        const effectiveStatus = isVisaApproved ? 'APPROVED' : doc.status;
                                        const docIcon = (() => {
                                            if (doc.document_code === 'PHOTOGRAPH') return <CameraOutlined style={{ color: '#3B82F6', fontSize: 24 }} />;
                                            if (doc.document_code === 'AADHAR_CARD') return <IdcardOutlined style={{ color: '#7C3AED', fontSize: 24 }} />;
                                            if (doc.document_code === 'PASSPORT_FRONT' || doc.document_code === 'PASSPORT_BACK') return (
                                                <svg width="38" height="47" viewBox="0 0 38 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <rect width="38" height="47" rx="6" fill="#1A2F5A" />
                                                    {/* globe circle */}
                                                    <circle cx="19" cy="23" r="10" stroke="white" strokeWidth="1.2" fill="none" />
                                                    {/* vertical meridian */}
                                                    <ellipse cx="19" cy="23" rx="4.5" ry="10" stroke="white" strokeWidth="1.2" fill="none" />
                                                    {/* horizontal parallels */}
                                                    <line x1="9" y1="20" x2="29" y2="20" stroke="white" strokeWidth="1" />
                                                    <line x1="9" y1="23" x2="29" y2="23" stroke="white" strokeWidth="1" />
                                                    <line x1="9" y1="26" x2="29" y2="26" stroke="white" strokeWidth="1" />
                                                </svg>
                                            );
                                            return <FileTextOutlined style={{ color: '#64748B', fontSize: 24 }} />;
                                        })();
                                        return (
                                        <Flex
                                            key={doc.document_code}
                                            align="center"
                                            justify="space-between"
                                            wrap="wrap"
                                            style={{
                                                border: '1.02913px solid #E1E1E1',
                                                borderRadius: 14,
                                                padding: '12px 16px',
                                                minHeight: 87,
                                                gap: 12,
                                            }}
                                        >
                                            <Flex align="center" gap={16}>
                                                <Flex align="center" justify="center" style={{ width: 38, height: 47, flexShrink: 0 }}>
                                                    {docIcon}
                                                </Flex>
                                                <Flex vertical gap={2}>
                                                    <Text style={{ fontSize: 16, fontWeight: 600, color: '#000000', lineHeight: '21px' }}>
                                                        {doc.display_value}
                                                    </Text>
                                                    {doc.file_name && (
                                                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{doc.file_name}</Text>
                                                    )}
                                                    {effectiveStatus === 'REJECTED' && doc.rejection_reason && (
                                                        <Text style={{ fontSize: 12, color: '#EF4444' }}>
                                                            {doc.rejection_reason}
                                                        </Text>
                                                    )}
                                                </Flex>
                                            </Flex>

                                            <Flex align="center" gap={8} style={{ flexShrink: 0 }}>
                                                {effectiveStatus === 'APPROVED' && (
                                                    <Tag
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            backgroundColor: '#ECFDF5', color: '#43B75D', border: 'none',
                                                            borderRadius: 44, fontWeight: 400, fontSize: 14, lineHeight: '18px',
                                                            padding: '5px 8px', margin: 0,
                                                        }}
                                                    >
                                                        ✓ Approved
                                                    </Tag>
                                                )}
                                                {effectiveStatus === 'UPLOADED' && (
                                                    <>
                                                        <Tag
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                backgroundColor: '#EFF6FF', color: '#3B82F6', border: 'none',
                                                                borderRadius: 44, fontWeight: 400, fontSize: 14, lineHeight: '18px',
                                                                padding: '5px 8px', margin: 0,
                                                            }}
                                                        >
                                                            Available
                                                        </Tag>
                                                        {doc.s3Url && (
                                                            <Button
                                                                size="small"
                                                                icon={<DownloadOutlined />}
                                                                href={doc.s3Url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ borderColor: '#3B82F6', color: '#3B82F6', borderRadius: 6, fontSize: 12 }}
                                                            >
                                                                Download
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                {effectiveStatus === 'REJECTED' && (
                                                    <>
                                                        <Tag
                                                            style={{
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                backgroundColor: '#FEF2F2', color: '#EF4444', border: 'none',
                                                                borderRadius: 44, fontWeight: 400, fontSize: 14, lineHeight: '18px',
                                                                padding: '5px 8px', margin: 0,
                                                            }}
                                                        >
                                                            ✗ Rejected
                                                        </Tag>
                                                        <Button
                                                            size="small"
                                                            icon={<UploadOutlined />}
                                                            loading={uploadingCode === doc.document_code}
                                                            style={{ borderColor: '#FF4F4F', color: '#FF4F4F', borderRadius: 6, fontSize: 12 }}
                                                            onClick={() => handleReUploadClick(doc)}
                                                        >
                                                            Re-upload
                                                        </Button>
                                                    </>
                                                )}
                                                {effectiveStatus === 'PENDING' && (
                                                    <Tag
                                                        style={{
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            backgroundColor: '#FFFBEA', color: '#D88602', border: '1px solid #FDE68A',
                                                            borderRadius: 44, fontWeight: 400, fontSize: 14, lineHeight: '18px',
                                                            padding: '5px 8px', margin: 0,
                                                        }}
                                                    >
                                                        Processing
                                                    </Tag>
                                                )}
                                            </Flex>
                                        </Flex>
                                        );
                                    });
                                    })()}
                                </Flex>
                            )}
                        </Card>
                    </Flex>
                </Col>

                {/* Right column – Application Details */}
                <Col xs={24} lg={10}>
                    <Card
                        style={{ ...cardStyle, position: 'sticky', top: 24 }}
                        styles={{ body: cardBodyStyle }}
                        title={<Text style={{ fontSize: 16, fontWeight: 600, color: '#1E293B' }}>Application Details</Text>}
                    >
                        <Flex vertical gap={0}>
                            {[
                                { key: 'Order No.',     value: orderNumber || '—' },
                                { key: 'Status',        value: orderData?.frontend_status ?? '—' },
                                { key: 'Destination',   value: orderData?.destination ?? '—' },
                                { key: 'Visa Name',     value: orderData?.visa_name ?? '—' },
                                { key: 'Format',        value: orderData?.visa_format ? formatVisaFormat(orderData.visa_format) : '—' },
                                { key: 'Travel Date',   value: orderData?.travel_date ? dayjs(orderData.travel_date).format('DD MMM YYYY') : '—' },
                                { key: 'Applicants',    value: (() => {
                                    const count = orderData?.applicants_count ?? 0;
                                    return count ? `${count} Traveller${count > 1 ? 's' : ''}` : '—';
                                })() },
                            ].map((item, idx, arr) => (
                                <div key={item.key}>
                                    <Flex justify="space-between" align="center" style={{ padding: '12px 0' }}>
                                        <Text style={{ fontSize: 14, color: '#6A7282' }}>{item.key}</Text>
                                        <Text style={{ fontSize: 14, fontWeight: 500, color: '#1E293B', textAlign: 'right', maxWidth: '55%' }}>
                                            {item.value}
                                        </Text>
                                    </Flex>
                                    {idx < arr.length - 1 && <Divider style={{ margin: 0 }} />}
                                </div>
                            ))}
                        </Flex>
                    </Card>
                </Col>
            </Row>
        </Flex>
    );
};

export default VisaTrackApplication;
