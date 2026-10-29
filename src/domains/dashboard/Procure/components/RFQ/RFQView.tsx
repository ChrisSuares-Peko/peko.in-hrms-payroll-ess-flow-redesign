import React, { useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Flex, Grid, Row, Spin, Tabs, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import OverviewTab from './OverviewTab';
import ProposalTab from './ProposalTab';
import { useRFQ } from '../../hooks/useRFQ';
import UploadOfflineProposalModal from '../Proposals/UploadOfflineProposalModal';

const { Text, Title } = Typography;

const statusBadge: Record<string, { color: string; bg: string; dot: string }> = {
    Draft:     { color: '#8c8c8c', bg: '#f5f5f5', dot: '#8c8c8c' },
    Sent:      { color: '#1677ff', bg: '#e6f4ff', dot: '#1677ff' },
    Open:      { color: '#1677ff', bg: '#e6f4ff', dot: '#1677ff' },
    Active:    { color: '#03a254', bg: '#dfffee', dot: '#03a254' },
    Closed:    { color: '#8c8c8c', bg: '#f5f5f5', dot: '#8c8c8c' },
    Cancelled: { color: '#ff4d4f', bg: '#fff1f0', dot: '#ff4d4f' },
};

const RFQView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [proposalRefreshKey, setProposalRefreshKey] = useState(0);

    const screens = Grid.useBreakpoint();
    const isMobile = !screens.sm;

    const { detail, isLoading, sendReminder } = useRFQ(id);
    if (isLoading) return <Flex justify="center" className="p-16"><Spin /></Flex>;
    if (!detail)   return <Text className="p-8 block text-gray-400">RFQ not found.</Text>;

    const badge = statusBadge[detail.status] ?? { color: '#595959', bg: '#f5f5f5', dot: '#595959' };

    return (
        <Row gutter={24} justify="center">
        <Col xs={24} lg={15}>
        <Card
            style={{ borderRadius: 36, border: '1px solid #e6e3dd', boxShadow: '0px 1.56px 15.58px 1.43px rgba(0,0,0,0.06)' }}
            styles={{ body: { padding: 'clamp(20px, 3vw, 36px)' } }}
        >
            {/* Header row */}
            <Flex justify="space-between" align={isMobile ? 'flex-start' : 'center'} gap={12} style={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <Flex vertical gap={4} style={{ minWidth: 0, flex: 1 }}>
                    <Title level={5} style={{ margin: 0, fontWeight: 600, fontSize: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{detail.title}</Title>
                    <Text style={{ fontSize: 14, color: '#8c8c8c' }}>{detail.refNumber} · {detail.type}</Text>
                </Flex>
                <Flex vertical={isMobile} gap={10} align={isMobile ? 'stretch' : 'center'} style={{ flexShrink: 0, width: isMobile ? '100%' : 'auto' }} wrap="wrap">
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        color: badge.color, background: badge.bg,
                        borderRadius: 20, padding: '3px 12px',
                        fontSize: 14, fontWeight: 500, lineHeight: '22px',
                    }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: badge.dot, display: 'inline-block', flexShrink: 0 }} />
                        {detail.status}
                    </span>
                    {detail.status !== 'Draft' && (
                        <Button block={isMobile} danger style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
                            onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.proposals.index}/compare/${id}`)}>
                            Compare Proposal
                        </Button>
                    )}
                    {activeTab !== 'proposal' && (detail.status === 'Active' || detail.status === 'Draft') && (
                        <Button block={isMobile} danger style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
                            onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.rfq.index}/${id}/edit`)}>
                            Edit
                        </Button>
                    )}
                    {/* {!detail.reminderSentAt && (
                        <Button block={isMobile} danger style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
                            loading={isSubmitting} onClick={() => sendReminder(id!)}>
                            Send reminder
                        </Button>
                    )} */}
                    {activeTab === 'proposal' && (
                        <Button block={isMobile} type="primary" danger icon={<UploadOutlined />}
                            style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
                            onClick={() => setUploadModalOpen(true)}>
                            Upload Proposal
                        </Button>
                    )}
                </Flex>
            </Flex>

            <Divider style={{ margin: '16px 0 0' }} />

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                style={{ marginBottom: 16 }}
                items={[
                    { key: 'overview', label: 'Overview' },
                    { key: 'proposal', label: 'Proposal' },
                ]}
            />

            {activeTab === 'overview' && (
                <OverviewTab
                    record={detail}
                    onSendReminder={(email) => sendReminder(id!, email)}
                />
            )}
            {activeTab === 'proposal' && (
                <ProposalTab
                    rfqId={id!}
                    rfqTitle={detail.title}
                    refreshKey={proposalRefreshKey}
                />
            )}

            <UploadOfflineProposalModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                rfqId={id ? Number(id) : undefined}
                onSuccess={() => setProposalRefreshKey(k => k + 1)}
            />
        </Card>
        </Col>
        </Row>
    );
};

export default RFQView;
