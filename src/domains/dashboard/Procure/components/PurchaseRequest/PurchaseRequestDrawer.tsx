import React, { useState } from 'react';

import { DeleteOutlined, EditOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Flex, Image, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';
import InvoicingDocumentIcon from '@src/domains/dashboard/Procure/assets/icons/invoicingDocumentIcon.svg';
import { paths } from '@src/routes/paths';

import { usePurchaseRequestApi } from '../../hooks/usePurchaseRequestApi';
import { PurchaseRequestDetail } from '../../types';
import { formatShortDate } from '../../utils';

const { Text, Title } = Typography;

const statusColors: Record<string, { color: string; bg: string }> = {
    'Draft': { color: '#595959', bg: '#F5F5F5' },
    'Open': { color: '#03a254', bg: '#dfffee' },
    'Converted to RFQ': { color: '#fa8c16', bg: '#fff7e6' },
    'Converted to PO': { color: '#52c41a', bg: '#f6ffed' },
    'Closed': { color: '#CF1322', bg: '#FFF1F0' },
    'Rejected': { color: '#CF1322', bg: '#FFF1F0' },
};

const SectionBox: React.FC<{ icon?: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', borderRadius: 22, overflow: 'hidden', marginBottom: 14 }}>
        <Flex gap={10} align="center" style={{ padding: '12px 20px', borderBottom: '1px solid #eaeaea', background: '#fff' }}>
            {icon && (
                <div style={{ width: 37, height: 37, borderRadius: 10, background: '#fff4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {icon}
                </div>
            )}
            <Text strong style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif' }}>{label}</Text>
        </Flex>
        <div style={{ padding: '16px 20px', background: '#fff' }}>{children}</div>
    </div>
);

const FieldRow: React.FC<{ children: React.ReactNode; last?: boolean }> = ({ children, last }) => (
    <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 30px',
        paddingBottom: 16, marginBottom: last ? 0 : 16,
        borderBottom: last ? 'none' : '1px solid #eaeaea',
    }}>
        {children}
    </div>
);

const Field: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Text style={{ fontSize: 11, color: '#969696', letterSpacing: '0.33px', fontFamily: 'Roboto, sans-serif' }}>{label}</Text>
        <Text style={{ fontSize: 14, color: '#070707', fontWeight: 500, fontFamily: 'Roboto, sans-serif' }}>{value || '—'}</Text>
    </div>
);

interface Props {
    record: PurchaseRequestDetail;
    onRefresh?: () => void;
}

const PurchaseRequestDrawer: React.FC<Props> = ({ record, onRefresh }) => {
    const navigate = useNavigate();
    const { remove, reopen } = usePurchaseRequestApi();
    const statusCfg = statusColors[record.status] ?? { color: '#595959', bg: '#f5f5f5' };

    const handleConvertToRFQ = () => {
        navigate(
            `${paths.dashboard.procure}/${paths.procure.rfq.index}/${paths.procure.rfq.create}`,
            { state: { fromPR: record } }
        );
    };

    const [openConfirmModal, setOpenConfirmModal] = useState(false);
    const [openReopenModal, setOpenReopenModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isReopening, setIsReopening] = useState(false);

    const handleReopen = async () => {
        setIsReopening(true);
        await reopen(record.id);
        setIsReopening(false);
        setOpenReopenModal(false);
        onRefresh?.();
    };

    const handleEdit = () => {
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${record.id}/edit`);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const ok = await remove(record.id);
        setIsDeleting(false);
        setOpenConfirmModal(false);
        if (ok) navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}`);
    };



    const docIcon = <Image src={InvoicingDocumentIcon} alt="icon" preview={false} style={{ width: 20, height: 20 }} />;

    return (
        <>
            {/* Title row — same grid as below so badge aligns to left-column right edge */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, marginBottom: 16 }}>
                <div>
                    <Flex align="center" justify="space-between" style={{ marginBottom: 4 }}>
                        <Title level={4} style={{ marginBottom: 0, fontSize: 24, fontWeight: 500, fontFamily: 'Roboto, sans-serif' }}>
                            {record.refNumber}
                        </Title>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: statusCfg.bg, color: statusCfg.color,
                            borderRadius: 20, padding: '2px 10px 2px 8px', fontSize: 14, fontWeight: 500,
                        }}>
                            <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusCfg.color, display: 'inline-block' }} />
                            {record.status}
                        </span>
                    </Flex>
                    {record.title && (
                        <Text style={{ fontSize: 14, lineHeight: '22px', fontFamily: 'Roboto, sans-serif', color: '#000' }}>
                            {record.title}
                        </Text>
                    )}
                </div>
                <div /> {/* empty — keeps right column aligned */}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, alignItems: 'start' }}>
                {/* Left column */}
                <div>
                    {/* Request Details */}
                    <SectionBox icon={docIcon} label="Request Details">
                        <FieldRow>
                            <Field label="Requested By" value={record.requestedBy} />
                            <Field label="Category" value={record.category} />
                        </FieldRow>
                        <FieldRow last>
                            <Field label="Needed By" value={formatShortDate(record.neededBy)} />
                            <Field label="Submitted" value={formatShortDate(record.createdAt)} />
                        </FieldRow>
                    </SectionBox>

                    {/* Description */}
                    <SectionBox icon={docIcon} label="Description">
                        {record.lineItems && record.lineItems.length > 0 ? (
                            <div style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden' }}>
                                {/* Table header */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 80px 100px 40px',
                                    padding: '10px 16px', background: '#fcfcfc',
                                    borderBottom: '1px solid #eaeaea',
                                }}>
                                    <Text style={{ fontSize: 12, color: '#999' }}>Item name</Text>
                                    <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>Qty</Text>
                                    <Text style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>Unit</Text>
                                    <span />
                                </div>
                                {/* Rows */}
                                {record.lineItems.map((item, i) => (
                                    <div
                                        key={item.key ?? i}
                                        style={{
                                            display: 'grid', gridTemplateColumns: '1fr 80px 100px 40px',
                                            padding: '12px 16px', alignItems: 'center',
                                            borderBottom: i < record.lineItems!.length - 1 ? '1px solid #eaeaea' : 'none',
                                        }}
                                    >
                                        {/* Item name + inline description */}
                                        <Flex gap={8} align="center">
                                            <Text style={{ fontSize: 14 }}>{item.itemName || '—'}</Text>
                                            {item.description && (
                                                <Text style={{ fontSize: 13, color: '#aaa' }}>{item.description}</Text>
                                            )}
                                        </Flex>
                                        <Text style={{ fontSize: 14, textAlign: 'center' }}>{item.qty}</Text>
                                        <Text style={{ fontSize: 14, textAlign: 'center' }}>{item.unit || '—'}</Text>
                                        <span />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Text style={{ fontSize: 14, color: '#555' }}>
                                {record.description || 'No description provided.'}
                            </Text>
                        )}
                        {record.notes && (
                            <div style={{ marginTop: 12 }}>
                                <Text style={{ fontSize: 11, color: '#969696', display: 'block', marginBottom: 2 }}>Notes</Text>
                                <Text style={{ fontSize: 14, color: '#555', whiteSpace: 'pre-wrap' }}>{record.notes}</Text>
                            </div>
                        )}
                    </SectionBox>
                </div>

                {/* Right column */}
                <div>
                    {/* Attachments */}
                    <SectionBox icon={docIcon} label="Attachments">
                        {record.attachments?.length > 0 ? (
                            record.attachments.map((file, i) => (
                                <a key={i} href={file.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                                    <Flex
                                        align="center"
                                        gap={10}
                                        style={{ padding: '8px 10px', background: '#fff', boxShadow: '0 1px 4px 0 rgba(0,0,0,0.07)', borderRadius: 8, cursor: 'pointer', marginBottom: 6 }}
                                    >
                                        <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 18, flexShrink: 0 }} />
                                        <Text style={{ fontSize: 14, color: '#292d32' }}>{file.fileName}</Text>
                                    </Flex>
                                </a>
                            ))
                        ) : (
                            <Text style={{ fontSize: 14, color: '#aaa' }}>No attachments.</Text>
                        )}
                    </SectionBox>

                    {/* Action buttons */}
                    <Flex gap={10} justify="center" style={{ marginTop: 4 }}>
                        {record.status === 'Open' && (
                            <>
                                <Button
                                    type="primary"
                                    danger
                                    style={{ borderRadius: 8, height: 40, fontFamily: 'Roboto, sans-serif', flex: '0 0 auto' }}
                                    onClick={handleConvertToRFQ}
                                >
                                    → Convert to RFQ
                                </Button>
                                <Button
                                    icon={<EditOutlined />}
                                    style={{ borderRadius: 8, height: 40, borderColor: '#ff4f4f', color: '#ff4f4f' }}
                                    onClick={handleEdit}
                                >
                                    Edit
                                </Button>
                                <Button
                                    icon={<DeleteOutlined />}
                                    style={{ borderRadius: 8, height: 40, borderColor: '#ff4f4f', color: '#ff4f4f' }}
                                    onClick={() => setOpenConfirmModal(true)}
                                >
                                    Delete
                                </Button>
                            </>
                        )}
                        {record.status === 'Draft' && (
                            <Button
                                icon={<EditOutlined />}
                                style={{ borderRadius: 8, height: 40, borderColor: '#ff4f4f', color: '#ff4f4f' }}
                                onClick={handleEdit}
                            >
                                Edit
                            </Button>
                        )}
                        {record.status === 'Cancelled' && (
                            <Button
                                danger
                                style={{ borderRadius: 8, height: 40 }}
                                loading={isReopening}
                                onClick={() => setOpenReopenModal(true)}
                            >
                                Re-open
                            </Button>
                        )}
                    </Flex>
                </div>
            </div>

            <ConfirmationModal
                isOpen={openConfirmModal}
                handleCancel={() => setOpenConfirmModal(false)}
                title="Are you sure you want to delete this purchase request?"
                handleSubmit={handleDelete}
                isLoading={isDeleting}
            />
            <ConfirmationModal
                isOpen={openReopenModal}
                handleCancel={() => setOpenReopenModal(false)}
                title="Are you sure you want to re-open this purchase request?"
                handleSubmit={handleReopen}
                isLoading={isReopening}
            />
        </>
    );
};

export default PurchaseRequestDrawer;
