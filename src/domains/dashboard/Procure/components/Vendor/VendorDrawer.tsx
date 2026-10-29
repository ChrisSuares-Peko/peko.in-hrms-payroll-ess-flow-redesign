import React from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Button, Flex, Tag, Typography } from 'antd';

import { VendorDetail } from '../../types';

const { Text } = Typography;

const statusColors: Record<string, { color: string; bg: string }> = {
    Active:      { color: '#03a254', bg: '#ecfdf5' },
    Inactive:    { color: '#CF1322', bg: '#FFF1F0' },
    Blacklisted: { color: '#f5222d', bg: '#fff1f0' },
};

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <Flex vertical gap={6}>
        <Text style={{ color: '#a9acb4', fontSize: 14, fontWeight: 500 }}>{label}</Text>
        <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
        }}>
            <Text style={{ color: '#1e293b', fontSize: 14, fontWeight: 400 }}>{value || '—'}</Text>
        </div>
    </Flex>
);

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
    <Text style={{ color: '#a9acb4', fontSize: 16, fontWeight: 500, display: 'block' }}>{label}</Text>
);

interface Props {
    record: VendorDetail;
    onClose?: () => void;
    onEdit?: () => void;
}

const VendorDrawer: React.FC<Props> = ({ record, onClose, onEdit }) => {
    const statusCfg = statusColors[record.status] ?? { color: '#595959', bg: '#f5f5f5' };

    return (
        <Flex vertical style={{ padding: '34px 38px' }} gap={24}>
            {/* Header: vendor name + Edit button */}
            <Flex justify="space-between" align="center">
                <Text style={{ fontSize: 24, fontWeight: 500, color: '#000', lineHeight: '1.48' }}>
                    {record.businessName}
                </Text>
                {onEdit && (
                    <Button
                        icon={<EditOutlined />}
                        style={{ borderColor: '#cbd5e1', color: '#475569', height: 40, width: 138, fontSize: 14, borderRadius: 8 }}
                        onClick={onEdit}
                    >
                        Edit
                    </Button>
                )}
            </Flex>

            {/* Card */}
            <div style={{
                background: '#fff',
                border: '0.881px solid #d9d9d9',
                borderRadius: 26,
                boxShadow: '0px 1.236px 6.182px rgba(122,122,122,0.06)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
            }}>
                {/* Business Information */}
                <Flex vertical gap={14}>
                    <SectionTitle label="Business Information" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <Field label="Business Name"        value={record.businessName} />
                        <Field label="GSTIN"                value={record.gstin} />
                        <Field label="Contact Person"       value={record.contactPerson} />
                        <Field label="Email"                value={record.email} />
                        <Field label="Phone"                value={record.phone} />

                        {/* Tags */}
                        <Flex vertical gap={6}>
                            <Text style={{ color: '#a9acb4', fontSize: 14, fontWeight: 500 }}>Tags</Text>
                            <Flex gap={6} wrap="wrap">
                                {record.tags?.length
                                    ? record.tags.map(tag => (
                                        <Tag
                                            key={tag}
                                            style={{
                                                border: '1.263px solid #cbd5e1',
                                                borderRadius: 20,
                                                padding: '6px 9px',
                                                fontSize: 12,
                                                fontWeight: 500,
                                                color: '#1e293b',
                                                background: '#fff',
                                                margin: 0,
                                            }}
                                        >
                                            {tag}
                                        </Tag>
                                    ))
                                    : <Text style={{ color: '#1e293b', fontSize: 14 }}>—</Text>
                                }
                            </Flex>
                        </Flex>

                        {/* Status badge */}
                        <Flex vertical gap={6}>
                            <Text style={{ color: '#a9acb4', fontSize: 14, fontWeight: 500 }}>Status</Text>
                            <Tag style={{
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                border: 'none',
                                borderRadius: 20,
                                padding: '2.5px 10px',
                                fontSize: 15,
                                fontWeight: 500,
                                margin: 0,
                                width: 'fit-content',
                            }}>
                                {record.status}
                            </Tag>
                        </Flex>
                    </div>
                </Flex>

                {/* Banking Information */}
                <Flex vertical gap={14}>
                    <SectionTitle label="Banking Information" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <Field label="Bank name"      value={record.bankName} />
                        <Field label="Account number" value={record.accountNumber} />
                        <Field label="IFSC code"      value={record.ifscCode} />
                    </div>
                </Flex>

                {/* Close button */}
                {onClose && (
                    <Flex justify="center">
                        <Button
                            type="primary"
                            danger
                            style={{ height: 40, width: 136, borderRadius: 8, fontSize: 14, fontWeight: 500 }}
                            onClick={onClose}
                        >
                            Close
                        </Button>
                    </Flex>
                )}
            </div>
        </Flex>
    );
};

export default VendorDrawer;
