import React, { useState } from 'react';

import { Button, Card, Col, Flex, Grid, Modal, Row, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import JourneyTab from '../components/PurchaseOrderDetails/JourneyTab';
import NotesTab from '../components/PurchaseOrderDetails/NotesTab';
import OverviewTab from '../components/PurchaseOrderDetails/OverviewTab';
import POHeader from '../components/PurchaseOrderDetails/POHeader';
import { usePurchaseOrder } from '../hooks/usePurchaseOrder';

const { Text } = Typography;

const TABS = ['Overview', 'Notes', 'History'] as const;
type Tab = (typeof TABS)[number];

const PurchaseOrderDetailsPage: React.FC = () => {
    const { poId } = useParams<{ poId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('Overview');

    const { detail, isLoading, isSubmitting, updateStatus, cancel, downloadPdf, fetchJourney, fetchNotes, addNote, vendorEmailError, clearVendorEmailError } = usePurchaseOrder(poId);
    const { md } = Grid.useBreakpoint();

    if (isLoading) return <Flex justify="center" className="p-16"><Spin /></Flex>;
    if (!detail)   return <Text className="p-8 block text-gray-400">Purchase order not found.</Text>;


    return (
        <>
        <Modal
            open={!!vendorEmailError}
            title="Vendor Email Missing"
            onCancel={clearVendorEmailError}
            footer={[
                <Button key="cancel" onClick={clearVendorEmailError}>Cancel</Button>,
                ...(vendorEmailError?.vendorsWithoutEmail?.length === 1
                    ? [<Button key="go" type="primary" danger onClick={() => { clearVendorEmailError(); navigate(`${paths.dashboard.procure}/vendor/edit/${vendorEmailError.vendorsWithoutEmail[0].id}`); }}>Go to Vendor</Button>]
                    : []),
            ]}
        >
            <p style={{ marginBottom: 12 }}>
                The vendor doesn&apos;t have an email address. Please add one before issuing this purchase order:
            </p>
            <ul style={{ paddingLeft: 20, margin: 0 }}>
                {vendorEmailError?.vendorsWithoutEmail?.map(v => (
                    <li key={v.id} style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 500 }}>{v.businessName}</span>
                    </li>
                ))}
            </ul>
        </Modal>
        <Row gutter={24} justify="center">
        <Col xs={24} lg={15}>
        <Flex vertical gap={16}>
            <Card className="rounded-[38px] shadow-sm" styles={{ body: { padding: md ? '30px' : '16px' } }}>
                <POHeader
                    poId={detail.id}
                    poRef={detail.refNumber}
                    title={detail.title}
                    vendor={detail.vendor?.businessName ?? '-'}
                    vendorEmail={detail.vendor?.email}
                    totalAmount={detail.totalAmount}
                    currency={detail.currency}
                    linkedRfq={(detail as any).rfq?.refNumber}
                    status={detail.status}
                    billingState={detail.billingState}
                    cancelReason={detail.cancelReason}
                    isUpdating={isSubmitting}
                    onStatusChange={updateStatus}
                    onCancel={reason => cancel(detail.id, reason)}
                    onDownload={() => downloadPdf(detail.id)}
                    onEdit={() => navigate(
                        `${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${detail.id}/edit`
                    )}
                />
            </Card>

            <Flex gap={0} className="border-b border-[#f0f0f0]">
                {TABS.map(tab => (
                    <button
                        type="button"
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm bg-transparent border-0 cursor-pointer border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'border-[#ff4d4f] text-[#ff4d4f] font-medium'
                                : 'border-transparent text-gray-500'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </Flex>

            <div>
                {activeTab === 'Overview'  && <OverviewTab record={detail} poId={detail.id} />}
{activeTab === 'Notes' && (
                    <Card className="rounded-[38px] shadow-sm overflow-hidden" styles={{ body: { padding: '20px' } }}>
                        <NotesTab poId={detail.id} fetchNotes={fetchNotes} addNote={addNote} />
                    </Card>
                )}
                {activeTab === 'History' && (
                    <JourneyTab poId={detail.id} fetchJourney={fetchJourney} />
                )}
            </div>
        </Flex>
        </Col>
        </Row>
        </>
    );
};

export default PurchaseOrderDetailsPage;
