import { useState } from 'react';

import { ArrowLeftOutlined, CopyOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Image, Input, Modal, Row, Select, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';

import { mapCategoryToDisplay } from '@src/domains/dashboard/officeSupplies/utils/issueTaxonomy';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';
import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Pill, SidebarCard } from './detail/DetailPrimitives';
import useIssueRespond from '../hooks/useIssueRespond';
import { ADMIN_RESPONSE_ACTIONS, AdminIssueStatus } from '../types/adminOndcIssue';

const { TextArea } = Input;
const { Text } = Typography;

const TERMINAL_ISSUE_STATUSES = ['RESOLVED', 'REJECTED', 'CLOSED'];

const ACTION_LABELS: Record<string, string> = {
    ACKNOWLEDGED: 'Acknowledge',
    INFO_REQUESTED: 'Request more info',
    RESOLVED: 'Resolve',
    REJECTED: 'Reject',
};

const AMBER = { bg: '#FFEBC9', color: '#D97706' };
const BLUE = { bg: '#f5f6ff', color: '#3b48d5' };
const GREEN = { bg: '#E7FFEC', color: '#008000' };
const RED = { bg: '#fef2f2', color: '#ef4444' };
const GRAY = { bg: '#f5f5f5', color: '#595959' };

const STATUS_PILL: Record<string, { bg: string; color: string; label: string }> = {
    OPEN: { ...AMBER, label: 'Open' },
    ACKNOWLEDGED: { ...BLUE, label: 'Acknowledged' },
    INFO_REQUESTED: { ...AMBER, label: 'Info requested' },
    RESPONSE_RECEIVED: { ...BLUE, label: 'Response received' },
    RESOLVED: { ...GREEN, label: 'Resolved' },
    REJECTED: { ...RED, label: 'Rejected' },
    ESCALATED: { ...AMBER, label: 'Escalated' },
    CLOSED: { ...GRAY, label: 'Closed' },
};

const getStatusPill = (s: string) => STATUS_PILL[s] || { ...GRAY, label: s };

// Evidence thumbnails on a thread event (public URLs) — click to preview.
const EventThumbnails = ({ images }: { images?: string[] }) => {
    if (!images || images.length === 0) return null;
    return (
        <Flex gap={8} wrap="wrap" className="mt-2" align="center">
            {images.map((url, i) => {
                const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');
                if (isPdf) {
                    return (
                        <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-[#e4e7ec] bg-[#f9fafb] px-3 py-2 text-[13px] font-medium text-[#344054] hover:bg-[#f3f4f6] transition-colors"
                        >
                            <FilePdfOutlined className="text-red-500 text-[16px]" />
                            <span>View Document</span>
                        </a>
                    );
                }
                return <Image key={i} src={url} width={64} height={64} className="!rounded-lg !object-cover" />;
            })}
        </Flex>
    );
};

const actorLabel = (actorType: string) => {
    if (actorType === 'COMPLAINANT') return 'Corporate';
    if (actorType === 'RESPONDENT') return 'Peko Support';
    return 'System';
};

const IssueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { issue, isLoading, isResponding, respond } = useIssueRespond(id ? Number(id) : null);

    const [respondOpen, setRespondOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [action, setAction] = useState<AdminIssueStatus>('ACKNOWLEDGED');

    const backToIssues = () => navigate(`${paths.systemUser.manage}/${paths.manage.issues}`);

    const openRespond = (defaultAction: AdminIssueStatus) => {
        setAction(defaultAction);
        setMessage('');
        setRespondOpen(true);
    };

    const handleSubmit = async () => {
        if (!message.trim()) return;
        const ok = await respond(message, action);
        if (ok) {
            setRespondOpen(false);
            dispatch(showToast({ variant: 'success', description: 'Your response has been sent to the seller.' }));
        }
    };

    if (isLoading) {
        return (
            <Flex vertical gap={24}>
                <Skeleton active paragraph={{ rows: 2 }} />
                <Skeleton active paragraph={{ rows: 8 }} />
            </Flex>
        );
    }
    if (!issue) {
        return (
            <Flex vertical gap={16} align="start">
                <Text className="text-lg font-medium">Issue not found.</Text>
                <Button danger onClick={backToIssues}>
                    Back to issues
                </Button>
            </Flex>
        );
    }

    const orderedEvents = [...issue.events].reverse(); // oldest-first
    const complaint = orderedEvents.find(e => e.actorType === 'COMPLAINANT');
    const raisedAt = issue.createdAt || complaint?.occurredAt;
    const isTerminal = TERMINAL_ISSUE_STATUSES.includes(issue.status);
    const isGrievance = issue.status === 'ESCALATED';
    const levelPill = isGrievance ? { ...AMBER, label: 'Grievance' } : { ...BLUE, label: 'Issue' };
    const statusPill = getStatusPill(issue.status);

    const copyId = () => {
        navigator.clipboard.writeText(issue.displayId);
        dispatch(showToast({ variant: 'success', description: 'Issue ID copied.' }));
    };

    return (
        <Flex vertical gap={16}>
            <Button
                type="link"
                className="!px-0 !text-[#475156] w-fit"
                icon={<ArrowLeftOutlined />}
                onClick={backToIssues}
            >
                Back to issues
            </Button>

            {/* Header */}
            <Flex vertical gap={4}>
                <Flex align="center" gap={12} wrap="wrap">
                    <Text className="text-[24px] font-semibold text-[#101828]">{issue.displayId}</Text>
                    <CopyOutlined className="cursor-pointer text-[#475156]" onClick={copyId} />
                    <Pill bg={levelPill.bg} color={levelPill.color}>
                        {levelPill.label}
                    </Pill>
                    <Pill bg={statusPill.bg} color={statusPill.color}>
                        {statusPill.label}
                    </Pill>
                </Flex>
                <Text className="text-[15px] text-[#868686]">
                    {raisedAt
                        ? `Raised ${formattedDateOnly(new Date(raisedAt))} · ${formattedTime(new Date(raisedAt))}`
                        : 'Raised —'}
                    {issue.corporateName && issue.corporateName !== '-' ? ` — ${issue.corporateName}` : ''}
                    {issue.corporateCode ? ` (${issue.corporateCode})` : ''}
                </Text>
            </Flex>

            <Row gutter={[24, 24]}>
                {/* LEFT */}
                <Col xs={24} lg={16}>
                    <Flex vertical gap={24}>
                        <Card title="Issue summary" className="!rounded-xl">
                            <Flex vertical gap={14}>
                                <Flex gap={8}>
                                    <Text className="text-[#868686]">Category:</Text>
                                    <Text className="text-[#101828]">
                                        {mapCategoryToDisplay(issue.category)}
                                        {issue.subCategory ? ` — ${issue.subCategory}` : ''}
                                    </Text>
                                </Flex>
                                <Flex gap={8}>
                                    <Text className="text-[#868686]">Description:</Text>
                                    <Text className="text-[#101828]">{complaint?.message || '-'}</Text>
                                </Flex>
                                {complaint?.images && complaint.images.length > 0 && (
                                    <Flex vertical gap={6}>
                                        <Text className="text-[13px] text-[#868686]">
                                            Images from the corporate
                                        </Text>
                                        <EventThumbnails images={complaint.images} />
                                    </Flex>
                                )}
                            </Flex>
                        </Card>

                        <Card title="Conversation" className="!rounded-xl">
                            <Flex vertical gap={16}>
                                {orderedEvents.map((event, idx) => {
                                    if (event.actorType === 'SYSTEM') {
                                        return (
                                            <div key={idx} className="flex justify-center my-1">
                                                <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                                                    {event.message} (
                                                    {dayjs(event.occurredAt).format('hh:mm A')})
                                                </span>
                                            </div>
                                        );
                                    }
                                    const isRespondent = event.actorType === 'RESPONDENT';
                                    return (
                                        <Flex vertical gap={4} key={idx}>
                                            <Text className="text-[13px] text-[#868686]">
                                                {actorLabel(event.actorType)} ·{' '}
                                                {formattedDateOnly(new Date(event.occurredAt))} ·{' '}
                                                {formattedTime(new Date(event.occurredAt))}
                                            </Text>
                                            <div
                                                className={`rounded-xl p-4 border ${
                                                    isRespondent
                                                        ? 'bg-[#FFF7F8] border-[#FEE2E2]'
                                                        : 'bg-[#F7F7F7] border-[#E4E7EC]'
                                                }`}
                                            >
                                                <Text className="text-[15px] text-[#101828]">
                                                    {event.message}
                                                </Text>
                                                <EventThumbnails images={event.images} />
                                            </div>
                                        </Flex>
                                    );
                                })}
                            </Flex>
                        </Card>
                    </Flex>
                </Col>

                {/* RIGHT */}
                <Col xs={24} lg={8}>
                    <Flex vertical gap={16}>
                        <SidebarCard title="Order">
                            <Text
                                className={`block text-[15px] font-medium ${
                                    issue.ondcOrderId
                                        ? 'text-[#3b48d5] underline cursor-pointer'
                                        : 'text-[#101828]'
                                }`}
                                onClick={() =>
                                    issue.ondcOrderId &&
                                    navigate(
                                        `${paths.systemUser.manage}/${paths.manage.orders}/details/${issue.ondcOrderId}`
                                    )
                                }
                            >
                                {issue.orderId || '-'}
                            </Text>
                            <Text className="text-[13px] text-[#868686]">
                                {issue.corporateName} · {issue.vendorName}
                            </Text>
                            {issue.orderTotal && (
                                <Text className="block text-[15px] font-medium text-[#101828] mt-1">
                                    ₹{formatNumberWithLocalString(Number(issue.orderTotal))}
                                </Text>
                            )}
                        </SidebarCard>

                        <SidebarCard title="Status">
                            <Flex vertical gap={10}>
                                <Flex justify="space-between" align="center">
                                    <Text className="text-[#4a5565]">Level</Text>
                                    <Pill bg={levelPill.bg} color={levelPill.color}>
                                        {levelPill.label}
                                    </Pill>
                                </Flex>
                                <Flex justify="space-between" align="center">
                                    <Text className="text-[#4a5565]">Status</Text>
                                    <Pill bg={statusPill.bg} color={statusPill.color}>
                                        {statusPill.label}
                                    </Pill>
                                </Flex>
                                <Flex justify="space-between">
                                    <Text className="text-[#4a5565]">Raised</Text>
                                    <Text className="font-medium text-[#252430]">
                                        {raisedAt ? formattedDateOnly(new Date(raisedAt)) : '-'}
                                    </Text>
                                </Flex>
                            </Flex>
                        </SidebarCard>

                        {!isTerminal && (
                            <SidebarCard title="Actions">
                                <Flex vertical gap={10}>
                                    <Button
                                        type="primary"
                                        danger
                                        block
                                        onClick={() => openRespond('ACKNOWLEDGED')}
                                    >
                                        Respond
                                    </Button>
                                    <Button block onClick={() => openRespond('RESOLVED')}>
                                        Mark resolved
                                    </Button>
                                </Flex>
                            </SidebarCard>
                        )}
                    </Flex>
                </Col>
            </Row>

            <Modal
                title="Respond to issue"
                open={respondOpen}
                onCancel={() => setRespondOpen(false)}
                maskClosable={false}
                footer={[
                    <Button key="cancel" onClick={() => setRespondOpen(false)}>
                        Cancel
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        danger
                        loading={isResponding}
                        disabled={!message.trim() || isResponding}
                        onClick={handleSubmit}
                    >
                        Submit response
                    </Button>,
                ]}
            >
                <Flex vertical gap={12}>
                    <TextArea
                        rows={4}
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type your response to the customer"
                        disabled={isResponding}
                    />
                    <Flex vertical gap={4}>
                        <Text className="text-[13px] text-[#868686]">Action</Text>
                        <Select
                            value={action}
                            onChange={setAction}
                            disabled={isResponding}
                            options={ADMIN_RESPONSE_ACTIONS.map(a => ({
                                value: a,
                                label: ACTION_LABELS[a] || a,
                            }))}
                        />
                    </Flex>
                </Flex>
            </Modal>
        </Flex>
    );
};

export default IssueDetails;
