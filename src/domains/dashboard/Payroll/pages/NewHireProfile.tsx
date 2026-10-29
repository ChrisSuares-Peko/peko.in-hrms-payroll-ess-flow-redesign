import { useRef, useState } from 'react';

import {
    CheckOutlined,
    ClockCircleOutlined,
    DownloadOutlined,
    MailOutlined,
    UploadOutlined,
    UserAddOutlined,
} from '@ant-design/icons';
import {
    Alert,
    Avatar,
    Button,
    Col,
    Flex,
    Modal,
    Row,
    Skeleton,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import EssInviteModal from '../components/modals/EssInviteModal';
import NewHireCompensationEditModal from '../components/modals/NewHireCompensationEditModal';
import NewHireDetailsEditModal from '../components/modals/NewHireDetailsEditModal';
import OfferLetterSignerCard, { SignerValues } from '../components/NewHire/OfferLetterSignerCard';
import PDFViewer, { SignatureField } from '../components/NewHire/PDFViewer';
import { useGetEmployeeCtc } from '../hooks/ctcCalculator/useGetEmployeeCtc';
import { useGetNewHireProfile } from '../hooks/employeeHooks/useGetNewHireProfile';
import { useResendOfferLetterInvitation } from '../hooks/employeeHooks/useResendOfferLetterInvitation';
import { useSendOfferLetterForESign } from '../hooks/employeeHooks/useSendOfferLetterForESign';
import { offerLetterSignerSchema } from '../schema/offerLetterSignerSchema';
import { adaptEmployeeCtcResponse } from '../utils/ctcCalculator/adaptEmployeeCtcResponse';

const { Text, Title } = Typography;

const MAX_OFFER_LETTER_SIZE = 5 * 1024 * 1024;

const offerStatusColor: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: '#B78912', bg: '#FFFAE6', label: 'Pending' },
    SIGNED: { color: '#027A48', bg: '#ECFDF3', label: 'Signed' },
    REJECTED: { color: '#B42318', bg: '#FEF3F2', label: 'Rejected' },
    EMAIL_CHANGED: { color: '#B54708', bg: '#FFFAEB', label: 'Email Changed' },
};

const formatStepDate = (step: string, iso?: string | null) => {
    if (!iso) return '';
    const d = dayjs(iso);
    if (!d.isValid()) return '';
    if (step === 'Joining Date') return `Scheduled · ${d.format('MMM DD, YYYY')}`;
    return d.format('MMM DD, YYYY · hh:mm A');
};

const DetailField = ({ label, value }: { label: string; value?: string | null }) => (
    <div className="bg-[#f2f2f5] rounded-[10px] px-3 py-2">
        <Text className="text-[10px] text-[#969696] block">{label}</Text>
        <Text className="text-[13px] font-medium">{value || '—'}</Text>
    </div>
);

const CardShell = ({
    title,
    subtitle,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <div className="bg-white border border-solid border-[#eaecf0] rounded-[16px] p-5">
        <Flex justify="space-between" align="flex-start" className="mb-1">
            <div>
                <Text className="text-[16px] font-semibold text-[#141414] block">{title}</Text>
                {subtitle && <Text className="text-[12px] text-[#969696]">{subtitle}</Text>}
            </div>
            {action}
        </Flex>
        {children}
    </div>
);

const EditButton = ({ onClick }: { onClick: () => void }) => (
    <Button
        size="small"
        style={{ borderRadius: 8, borderColor: '#e0e0e0', color: '#7b7b7b', fontSize: 12 }}
        onClick={onClick}
    >
        Edit
    </Button>
);

type SigningTimelineStep = { step: string; completed: boolean; date: string | null };

const SigningStatusCard = ({ timeline }: { timeline: SigningTimelineStep[] }) => {
    const completedCount = timeline.filter(s => s.completed).length;
    return (
        <CardShell
            title="Signing Status"
            subtitle="E-signature timeline for the offer letter"
            action={
                timeline.length > 0 ? (
                    <div className="bg-[#f2f2f5] rounded-[14px] px-3 py-1 whitespace-nowrap">
                        <Text className="text-[11px] font-medium text-[#7b7b7b]">
                            {completedCount} of {timeline.length} steps complete
                        </Text>
                    </div>
                ) : undefined
            }
        >
            <div className="mt-4 flex flex-col gap-0">
                {timeline.map((step, i) => (
                    <div key={step.step} className="flex gap-4">
                        <div className="flex flex-col items-center" style={{ minWidth: 26 }}>
                            <div
                                className="flex items-center justify-center rounded-full shrink-0"
                                style={{
                                    width: 26,
                                    height: 26,
                                    backgroundColor: step.completed ? '#027A48' : '#e5e7eb',
                                    border: step.completed ? 'none' : '2px solid #d1d5db',
                                }}
                            >
                                {step.completed ? (
                                    <CheckOutlined style={{ color: '#fff', fontSize: 11 }} />
                                ) : (
                                    <ClockCircleOutlined
                                        style={{ color: '#9ca3af', fontSize: 11 }}
                                    />
                                )}
                            </div>
                            {i < timeline.length - 1 && (
                                <div
                                    className="bg-[#e5e7eb] w-[2px] flex-1 my-1"
                                    style={{ minHeight: 28 }}
                                />
                            )}
                        </div>
                        <div className="pb-5">
                            <Text
                                className="block text-[13px] font-medium"
                                style={{ color: step.completed ? '#141414' : '#667085' }}
                            >
                                {step.step}
                            </Text>
                            {step.completed && formatStepDate(step.step, step.date) && (
                                <Text className="text-[12px] text-[#969696]">
                                    {formatStepDate(step.step, step.date)}
                                </Text>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </CardShell>
    );
};

const NewHireProfile = () => {
    const location = useLocation();
    const employeeId = (location.state as { employeeId?: string } | undefined)?.employeeId;
    const { data, isLoading, refetch } = useGetNewHireProfile(employeeId);
    // Same committed-CTC source the (non-new-hire) Employee Profile's Salary Structure tab
    // reads from — anchored to the SalaryStructureVersion recorded when this new hire was
    // created, not a disconnected live recalculation with no real anchor.
    const {
        data: ctcData,
        isLoading: salaryLoading,
        refetch: refetchSalary,
    } = useGetEmployeeCtc(employeeId || null);
    const breakdown = ctcData ? adaptEmployeeCtcResponse(ctcData) : null;
    const { resendInvitation, isResending } = useResendOfferLetterInvitation();
    const { sendOfferLetter } = useSendOfferLetterForESign();
    const dispatch = useAppDispatch();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [detailsEditOpen, setDetailsEditOpen] = useState(false);
    const [compEditOpen, setCompEditOpen] = useState(false);

    const emailChangeFileInputRef = useRef<HTMLInputElement>(null);
    const [emailChangeFile, setEmailChangeFile] = useState<File | null>(null);
    const [emailChangeSignatureFields, setEmailChangeSignatureFields] = useState<SignatureField[]>(
        []
    );
    const [emailChangeSignerValues, setEmailChangeSignerValues] = useState<SignerValues>({
        name: '',
        email: '',
        phone: '',
    });
    const [emailChangeSignerExpanded, setEmailChangeSignerExpanded] = useState(true);
    const [isResendingWithDocument, setIsResendingWithDocument] = useState(false);

    if (isLoading) {
        return (
            <Flex vertical gap={16} className="p-6">
                <Skeleton avatar active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 6 }} />
            </Flex>
        );
    }

    if (!data) {
        return (
            <Flex justify="center" className="p-10">
                <Text type="secondary">New hire not found.</Text>
            </Flex>
        );
    }

    const personal = data.personalInformation || {};
    const employeeInfo = data.employeeInformation || {};
    const offerLetter = data.offerLetter || {};
    const statusMeta = offerStatusColor[offerLetter.status] || offerStatusColor.PENDING;
    const signingTimeline: SigningTimelineStep[] = Array.isArray(data.signingTimeline)
        ? data.signingTimeline
        : [];
    const grossSalary = breakdown?.grossSalary || 0;

    const resendDisabled =
        !offerLetter.eSignId ||
        offerLetter.status === 'SIGNED' ||
        offerLetter.status === 'EMAIL_CHANGED';
    let resendDisabledReason;
    if (!offerLetter.eSignId) {
        resendDisabledReason = "Offer letter hasn't been sent for e-signature yet.";
    } else if (offerLetter.status === 'SIGNED') {
        resendDisabledReason = 'Offer letter has already been signed.';
    } else if (offerLetter.status === 'EMAIL_CHANGED') {
        resendDisabledReason = 'Upload a new offer letter to send to the updated email address.';
    }
    const handleResend = () =>
        resendInvitation({
            eSignId: offerLetter.eSignId,
            email: personal.email,
            name: personal.fullName,
        });

    const handleEmailChangeFileSelect = (file: File) => {
        if (file.type !== 'application/pdf') {
            dispatch(showToast({ description: 'Please upload a PDF file.', variant: 'error' }));
            return;
        }
        if (file.size > MAX_OFFER_LETTER_SIZE) {
            dispatch(
                showToast({ description: 'File size must be smaller than 5 MB', variant: 'error' })
            );
            return;
        }
        setEmailChangeSignerValues({
            name: personal.fullName || '',
            email: personal.email || '',
            phone: '',
        });
        setEmailChangeSignatureFields([]);
        setEmailChangeSignerExpanded(true);
        setEmailChangeFile(file);
    };

    const closeEmailChangeModal = () => {
        setEmailChangeFile(null);
        setEmailChangeSignatureFields([]);
    };

    const handleResendWithNewDocument = async () => {
        if (!emailChangeFile) return;
        try {
            await offerLetterSignerSchema.validate(emailChangeSignerValues, { abortEarly: false });
        } catch {
            setEmailChangeSignerExpanded(true);
            dispatch(
                showToast({ description: 'Please fill the signer details.', variant: 'error' })
            );
            return;
        }
        if (!emailChangeSignatureFields.some(f => f.signerIndex === 0)) {
            dispatch(
                showToast({
                    description: 'Please place the signature field on the document.',
                    variant: 'error',
                })
            );
            return;
        }

        setIsResendingWithDocument(true);
        const result = await sendOfferLetter({
            employeeId: data.id,
            docketTitle: `Offer Letter - ${personal.fullName || ''}`.trim(),
            file: emailChangeFile,
            signatureFields: emailChangeSignatureFields,
            signerValues: emailChangeSignerValues,
        });
        setIsResendingWithDocument(false);

        dispatch(
            showToast({
                description: result.success
                    ? 'Offer letter resent successfully.'
                    : result.errorMessage || 'Failed to resend offer letter.',
                variant: result.success ? 'success' : 'error',
            })
        );
        if (!result.success) return;

        closeEmailChangeModal();
        refetch();
    };

    return (
        <Flex vertical gap={20} className="p-6">
            <Flex justify="space-between" wrap="wrap" gap={12}>
                <Flex gap={16} align="center">
                    <Avatar
                        size={56}
                        src={data.profileImage || undefined}
                        style={{ backgroundColor: '#FFF5F5', color: '#FF9F9F' }}
                    >
                        {personal.fullName?.[0]}
                    </Avatar>
                    <Flex vertical>
                        <Title level={4} className="!m-0">
                            {personal.fullName}
                        </Title>
                        <Text className="text-[#667085]">
                            {employeeInfo.designation}
                            {employeeInfo.dateOfJoin
                                ? ` · Joining ${dayjs(employeeInfo.dateOfJoin).format('DD-MM-YYYY')}`
                                : ''}
                        </Text>
                        <Tag
                            style={{
                                color: statusMeta.color,
                                backgroundColor: statusMeta.bg,
                                borderColor: 'transparent',
                                borderRadius: 9999,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                width: 'fit-content',
                            }}
                            className="mt-1"
                        >
                            <span
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    backgroundColor: statusMeta.color,
                                    display: 'inline-block',
                                }}
                            />
                            {statusMeta.label}
                        </Tag>
                    </Flex>
                </Flex>

                <Flex gap={8} wrap="wrap">
                    <Tooltip title={resendDisabledReason}>
                        <span>
                            <Button
                                icon={<MailOutlined />}
                                loading={isResending}
                                disabled={resendDisabled}
                                onClick={handleResend}
                            >
                                Resend Email
                            </Button>
                        </span>
                    </Tooltip>
                    <Tooltip
                        title={
                            offerLetter.status !== 'SIGNED'
                                ? 'Invite will be available once the employee signs the offer letter.'
                                : undefined
                        }
                    >
                        <span>
                            <Button
                                danger
                                type="primary"
                                icon={<UserAddOutlined />}
                                disabled={offerLetter.status !== 'SIGNED'}
                                onClick={() => setInviteOpen(true)}
                            >
                                Share ESS Invite
                            </Button>
                        </span>
                    </Tooltip>
                </Flex>
            </Flex>

            <Row gutter={[20, 20]}>
                <Col xs={24} lg={14}>
                    <Flex vertical gap={20}>
                        <SigningStatusCard timeline={signingTimeline} />

                        <CardShell
                            title="New Hire Details"
                            subtitle="Submitted during pre-boarding"
                            action={<EditButton onClick={() => setDetailsEditOpen(true)} />}
                        >
                            <Row gutter={[12, 12]} className="mt-4">
                                <Col span={12}>
                                    <DetailField label="Full Name" value={personal.fullName} />
                                </Col>
                                <Col span={12}>
                                    <DetailField label="Personal Email" value={personal.email} />
                                </Col>
                                <Col span={12}>
                                    <DetailField label="Gender" value={personal.gender} />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Date of Birth"
                                        value={
                                            personal.dateOfBirth
                                                ? dayjs(personal.dateOfBirth).format('DD-MM-YYYY')
                                                : undefined
                                        }
                                    />
                                </Col>
                                <Col span={12}>
                                    <DetailField label="Phone Number" value={personal.mobileNo} />
                                </Col>
                                <Col span={12}>
                                    <DetailField label="Nationality" value={personal.country} />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Department"
                                        value={employeeInfo.department?.departmentName}
                                    />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Job Title"
                                        value={employeeInfo.designation}
                                    />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Joining Date"
                                        value={
                                            employeeInfo.dateOfJoin
                                                ? dayjs(employeeInfo.dateOfJoin).format(
                                                      'DD-MM-YYYY'
                                                  )
                                                : undefined
                                        }
                                    />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Job Type"
                                        value={employeeInfo.contractType}
                                    />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Employee ID"
                                        value={employeeInfo.employeeId}
                                    />
                                </Col>
                                <Col span={12}>
                                    <DetailField
                                        label="Time Schedule"
                                        value={employeeInfo.timeSchedule}
                                    />
                                </Col>
                            </Row>
                        </CardShell>
                    </Flex>
                </Col>

                <Col xs={24} lg={10}>
                    <Flex vertical gap={20}>
                        <CardShell title="Offer Letter">
                            <div className="mt-1">
                                {offerLetter.documentUrl && (
                                    <div className="bg-[#f2f2f5] rounded-[10px] px-3 py-2.5 mb-4">
                                        <Text className="text-[12px] font-medium text-[#42526d] block">
                                            {`Offer_Letter_${(personal.fullName || 'document').replace(/\s/g, '_')}.pdf`}
                                        </Text>
                                        <Text className="text-[10px] text-[#969696]">
                                            {offerLetter.status === 'SIGNED'
                                                ? 'Signed'
                                                : 'Original (sent)'}
                                        </Text>
                                    </div>
                                )}

                                {offerLetter.documentUrl ? (
                                    <Button
                                        block
                                        icon={<DownloadOutlined />}
                                        style={{ borderRadius: 8, height: 44, marginBottom: 8 }}
                                        onClick={() =>
                                            window.open(offerLetter.documentUrl, '_blank')
                                        }
                                    >
                                        Download Offer Letter
                                    </Button>
                                ) : (
                                    <Text type="secondary">No offer letter uploaded yet.</Text>
                                )}

                                {offerLetter.documentUrl && (
                                    <Tooltip title={resendDisabledReason}>
                                        <span className="block">
                                            <Button
                                                block
                                                icon={<MailOutlined />}
                                                loading={isResending}
                                                disabled={resendDisabled}
                                                style={{ borderRadius: 8, height: 44 }}
                                                onClick={handleResend}
                                            >
                                                Resend Offer Email
                                            </Button>
                                        </span>
                                    </Tooltip>
                                )}

                                {offerLetter.status === 'EMAIL_CHANGED' && (
                                    <Flex vertical gap={8} className="mt-2">
                                        <Alert
                                            type="warning"
                                            showIcon
                                            message="Email address was changed"
                                            description="Upload a new offer letter to send to the updated email address."
                                        />
                                        <input
                                            ref={emailChangeFileInputRef}
                                            type="file"
                                            accept=".pdf"
                                            style={{ display: 'none' }}
                                            onChange={e => {
                                                const f = e.target.files?.[0];
                                                if (f) handleEmailChangeFileSelect(f);
                                                e.target.value = '';
                                            }}
                                        />
                                        <Button
                                            block
                                            icon={<UploadOutlined />}
                                            style={{ borderRadius: 8, height: 44 }}
                                            onClick={() => emailChangeFileInputRef.current?.click()}
                                        >
                                            Upload &amp; Re-send Offer Letter
                                        </Button>
                                    </Flex>
                                )}
                            </div>
                        </CardShell>

                        <CardShell
                            title="Compensation"
                            subtitle="Monthly package"
                            action={<EditButton onClick={() => setCompEditOpen(true)} />}
                        >
                            {salaryLoading ? null : (
                                <Flex vertical gap={8} className="mt-3">
                                    {(breakdown?.earnings || []).map(field => (
                                        <Flex justify="space-between" key={field.id}>
                                            <Text className="text-[13px] text-[#667085]">
                                                {field.componentName}
                                            </Text>
                                            <Text className="text-[13px] font-medium">
                                                ₹ {field.calculatedAmount.toLocaleString()}
                                            </Text>
                                        </Flex>
                                    ))}
                                    <div className="bg-[#fff5f5] border border-solid border-[#ffd2d2] rounded-[10px] px-3 py-3 mt-2">
                                        <Text className="text-[12px] text-[#7b3b3b] block">
                                            Total Monthly Package
                                        </Text>
                                        <Text className="text-[15px] font-bold text-[#ff4f4f]">
                                            ₹ {grossSalary.toLocaleString()} / month
                                        </Text>
                                    </div>
                                </Flex>
                            )}
                        </CardShell>
                    </Flex>
                </Col>
            </Row>

            <EssInviteModal
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                name={personal.fullName}
                email={personal.email}
                mobileNo={personal.mobileNo}
                employeeId={data.id}
            />

            <NewHireDetailsEditModal
                open={detailsEditOpen}
                onClose={() => setDetailsEditOpen(false)}
                employeeId={data.id}
                personalInformation={personal}
                employeeInformation={employeeInfo}
                onSuccess={refetch}
            />

            <NewHireCompensationEditModal
                open={compEditOpen}
                onClose={() => setCompEditOpen(false)}
                email={personal.email}
                onSuccess={refetchSalary}
            />

            <Modal
                open={!!emailChangeFile}
                onCancel={closeEmailChangeModal}
                width="90vw"
                style={{ maxWidth: 1400, top: 20 }}
                title="Upload & Re-send Offer Letter"
                okText="Resend"
                okButtonProps={{ danger: true, loading: isResendingWithDocument }}
                cancelButtonProps={{ disabled: isResendingWithDocument }}
                onOk={handleResendWithNewDocument}
                maskClosable={false}
                destroyOnClose
            >
                {emailChangeFile && (
                    <Flex gap={0} className="flex-col xl:flex-row" align="flex-start">
                        <Flex vertical className="flex-1 min-w-0 w-full">
                            <PDFViewer
                                file={emailChangeFile}
                                signatureFields={emailChangeSignatureFields}
                                editable
                                onFileRemove={closeEmailChangeModal}
                                onSignatureFieldsChange={setEmailChangeSignatureFields}
                                getSignerName={() => emailChangeSignerValues.name || 'Signer 1'}
                                getSignerColor={() => ({
                                    bg: '#D9EECC',
                                    border: '#05BE63',
                                    text: '#15803D',
                                })}
                            />
                        </Flex>
                        <Flex
                            vertical
                            gap={12}
                            className="w-full mt-4 xl:mt-0 xl:ml-6 xl:w-[300px] shrink-0"
                        >
                            <Text className="text-sm font-semibold text-[#1E293B]">
                                Employee Signature
                            </Text>
                            <OfferLetterSignerCard
                                values={emailChangeSignerValues}
                                fieldsCount={
                                    emailChangeSignatureFields.filter(f => f.signerIndex === 0)
                                        .length
                                }
                                isExpanded={emailChangeSignerExpanded}
                                onExpand={() => setEmailChangeSignerExpanded(prev => !prev)}
                                onChange={setEmailChangeSignerValues}
                            />
                        </Flex>
                    </Flex>
                )}
            </Modal>
        </Flex>
    );
};

export default NewHireProfile;
