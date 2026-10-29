import { useState } from 'react';

import {
    Button,
    Divider,
    Drawer,
    Flex,
    Form,
    Input,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from 'antd';

import { complianceFormConfig } from '@src/domains/dashboard/Compliance/utils/complianceFormConfig';
import { complianceHealthItems } from '@src/domains/dashboard/Compliance/utils/data';
import { useAppSelector } from '@src/hooks/store';
import { formattedDateOnly } from '@utils/dateFormat';

import {
    AdminComplianceDocumentSigned,
    downloadAdminComplianceDocumentApi,
    getAdminComplianceDocumentsApi,
    viewAdminComplianceDocumentApi,
} from '../../api/compliance';
import {
    AdminComplianceAdminStatus,
    AdminComplianceRecord,
    AdminComplianceStatus,
    AdminComplianceUpdatePayload,
} from '../../types/compliance';

const { TextArea } = Input;

const ADMIN_STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Reopened', value: 'reopened' },
];

const STATUS_COLOR: Record<AdminComplianceStatus, string> = {
    pending: 'orange',
    in_review: 'blue',
    approved: 'green',
    rejected: 'red',
    reopened: 'purple',
};

const STATUS_LABEL: Record<AdminComplianceStatus, string> = {
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    rejected: 'Rejected',
    reopened: 'Reopened',
};

const ADMIN_STATUS_COLOR: Record<AdminComplianceAdminStatus, string> = {
    pending: 'default',
    under_review: 'blue',
    approved: 'green',
    rejected: 'red',
    reopened: 'purple',
};

interface Props {
    open: boolean;
    record: AdminComplianceRecord | null;
    isLoading: boolean;
    onClose: () => void;
    onUpdate: (payload: AdminComplianceUpdatePayload) => Promise<boolean>;
}

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <Flex className="gap-3 py-1">
        <Typography.Text className="text-gray-500 min-w-[140px] shrink-0">{label}:</Typography.Text>
        <Typography.Text>{value ?? 'N/A'}</Typography.Text>
    </Flex>
);

const renderFormDataSection = (formData: Record<string, unknown>, configKey: string) => {
    const fields = complianceFormConfig[configKey]?.fields ?? [];
    if (!fields.length || !formData || !Object.keys(formData).length) return null;

    const sections: Record<string, typeof fields> = {};
    fields.forEach(f => {
        if (f.type === 'note') return;
        const sec = f.section ?? 'General';
        if (!sections[sec]) sections[sec] = [];
        sections[sec].push(f);
    });

    return Object.entries(sections).map(([sec, secFields]) => {
        const hasData = secFields.some(
            f => formData[f.key] !== undefined && formData[f.key] !== null && formData[f.key] !== ''
        );
        if (!hasData) return null;
        return (
            <div key={sec}>
                <Typography.Text
                    strong
                    className="block text-gray-600 mb-1 text-xs uppercase tracking-wide"
                >
                    {sec}
                </Typography.Text>
                {secFields.map(f => {
                    const val = formData[f.key];
                    if (val === undefined || val === null || val === '') return null;

                    if (f.type === 'repeatable-table' && Array.isArray(val)) {
                        const cols = (f.columns ?? []).map(c => ({
                            title: c.label ?? c.key,
                            dataIndex: c.key,
                            key: c.key,
                            render: (v: unknown) =>
                                v !== null && v !== undefined && v !== '' ? String(v) : '—',
                        }));
                        return (
                            <div key={f.key} className="mb-3">
                                <Typography.Text className="text-gray-500 text-sm">
                                    {f.label ?? f.title}:
                                </Typography.Text>
                                <Table
                                    size="small"
                                    columns={cols}
                                    dataSource={(val as Record<string, unknown>[]).map(
                                        (row, i) => ({ ...row, _key: i })
                                    )}
                                    rowKey="_key"
                                    pagination={false}
                                    className="mt-1"
                                    scroll={{ x: 'max-content' }}
                                />
                            </div>
                        );
                    }

                    return <InfoRow key={f.key} label={f.label ?? f.key} value={String(val)} />;
                })}
            </div>
        );
    });
};

const ComplianceDetailModal = ({ open, record, isLoading, onClose, onUpdate }: Props) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [signedDocs, setSignedDocs] = useState<AdminComplianceDocumentSigned[]>([]);
    const [docsLoading, setDocsLoading] = useState(false);
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const ctx = { userType: role, userId };

    const loadSignedDocs = async () => {
        if (!record) return;
        setDocsLoading(true);
        const docs = await getAdminComplianceDocumentsApi(
            { userType: role, userId },
            record.complianceId
        );
        if (docs) setSignedDocs(Array.isArray(docs) ? docs : []);
        setDocsLoading(false);
    };

    const watchedStatus = Form.useWatch('adminStatus', form);
    const configKey =
        complianceHealthItems.find(i => i.title === record?.title)?.complianceType ??
        record?.complianceType ??
        '';
    const docOptions = (complianceFormConfig[configKey]?.docs ?? []).map(d => ({
        label: d.label,
        value: d.key,
    }));
    const fieldOptions = (complianceFormConfig[configKey]?.fields ?? [])
        .filter(f => f.type !== 'note' && f.label)
        .map(f => ({ label: f.label, value: f.key }));

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            const ok = await onUpdate({ id: record!.id, ...values });
            if (ok) onClose();
        } finally {
            setSubmitting(false);
        }
    };

    if (!record) return null;

    return (
        <Drawer
            title="Compliance Record Details"
            open={open}
            onClose={onClose}
            afterOpenChange={isOpen => {
                if (isOpen) loadSignedDocs();
            }}
            width={560}
            footer={
                <Flex justify="end" gap={12}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        type="primary"
                        loading={submitting || isLoading}
                        onClick={handleSubmit}
                        className="!bg-[#ff4f4f] !border-[#ff4f4f] hover:!bg-[#e03e3e] hover:!border-[#e03e3e]"
                    >
                        Update Status
                    </Button>
                </Flex>
            }
        >
            <Flex vertical gap={8}>
                <Typography.Title level={5} className="m-0">
                    User Information
                </Typography.Title>
                <InfoRow label="User Name" value={record.corporateUser?.name} />
                <InfoRow label="Email" value={record.corporateUser?.email} />
                <InfoRow label="Mobile" value={record.corporateUser?.mobileNo} />

                <Divider className="my-3" />

                <Typography.Title level={5} className="m-0">
                    Compliance Details
                </Typography.Title>
                <InfoRow label="Compliance ID" value={record.complianceId} />
                <InfoRow label="Title" value={record.title} />
                <InfoRow label="Compliance Type" value={record.complianceType} />
                <InfoRow label="Category" value={record.category} />
                <InfoRow label="Section" value={record.section} />
                <InfoRow
                    label="Due Date"
                    value={record.dueDate ? formattedDateOnly(new Date(record.dueDate)) : undefined}
                />
                <InfoRow
                    label="User Status"
                    value={
                        <Tag color={STATUS_COLOR[record.status]}>
                            {STATUS_LABEL[record.status] ?? record.status}
                        </Tag>
                    }
                />
                <InfoRow
                    label="Admin Status"
                    value={
                        <Tag color={ADMIN_STATUS_COLOR[record.adminStatus]}>
                            {record.adminStatus
                                ?.replace(/_/g, ' ')
                                .replace(/\b\w/g, c => c.toUpperCase())}
                        </Tag>
                    }
                />
                {record.notes && <InfoRow label="Notes" value={record.notes} />}
                {record.adminRemarks && (
                    <InfoRow label="Admin Remarks" value={record.adminRemarks} />
                )}

                {record.formData && Object.keys(record.formData).length > 0 && (
                    <>
                        <Divider className="my-3" />
                        <Typography.Title level={5} className="m-0 mb-2">
                            Submitted Form Data
                        </Typography.Title>
                        <Flex vertical gap={12}>
                            {renderFormDataSection(record.formData, configKey)}
                        </Flex>
                    </>
                )}

                <Divider className="my-3" />

                <Typography.Title level={5} className="m-0">
                    Uploaded Documents
                </Typography.Title>
                {docsLoading && (
                    <Typography.Text type="secondary">Loading documents...</Typography.Text>
                )}
                {!docsLoading && signedDocs.length > 0 && (
                    <Flex vertical gap={6}>
                        {signedDocs.map(doc => (
                            <Flex key={doc.id} justify="space-between" align="center">
                                <Typography.Text>{doc.name}</Typography.Text>
                                <Space>
                                    <Typography.Text type="secondary" className="text-xs">
                                        {doc.uploadedAt
                                            ? formattedDateOnly(new Date(doc.uploadedAt))
                                            : ''}
                                    </Typography.Text>
                                    <Button
                                        size="small"
                                        type="link"
                                        disabled={!doc.url}
                                        onClick={() => viewAdminComplianceDocumentApi(ctx, doc.url)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="small"
                                        type="link"
                                        disabled={!doc.url}
                                        onClick={() =>
                                            downloadAdminComplianceDocumentApi(
                                                ctx,
                                                doc.url,
                                                doc.name
                                            )
                                        }
                                    >
                                        Download
                                    </Button>
                                </Space>
                            </Flex>
                        ))}
                    </Flex>
                )}
                {!docsLoading && signedDocs.length === 0 && (
                    <Typography.Text type="secondary">No documents uploaded.</Typography.Text>
                )}

                <Divider className="my-3" />

                <Typography.Title level={5} className="m-0">
                    Update Admin Status
                </Typography.Title>
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        adminStatus: record.adminStatus,
                        adminRemarks: record.adminRemarks ?? '',
                    }}
                >
                    <Form.Item
                        label="Admin Status"
                        name="adminStatus"
                        rules={[{ required: true, message: 'Please select a status' }]}
                    >
                        <Select options={ADMIN_STATUS_OPTIONS} placeholder="Select status" />
                    </Form.Item>
                    <Form.Item label="Admin Remarks" name="adminRemarks">
                        <TextArea
                            rows={4}
                            placeholder="Add remarks or comments..."
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>
                    {watchedStatus === 'reopened' && docOptions.length > 0 && (
                        <Form.Item label="Documents to Re-upload" name="rejectedDocumentKeys">
                            <Select
                                mode="multiple"
                                options={docOptions}
                                placeholder="Select documents the user must re-upload"
                            />
                        </Form.Item>
                    )}
                    {watchedStatus === 'reopened' && fieldOptions.length > 0 && (
                        <Form.Item label="Form Fields to Correct" name="rejectedFormFields">
                            <Select
                                mode="multiple"
                                options={fieldOptions}
                                placeholder="Select form fields the user must correct (optional)"
                            />
                        </Form.Item>
                    )}
                </Form>
            </Flex>
        </Drawer>
    );
};

export default ComplianceDetailModal;
