import { useMemo, useState } from 'react';

import { Button, Flex, Tabs, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import TypographyText from '@components/atomic/typography/typographyText';

import CollectPaymentModal from '../components/collectPayment/CollectPaymentModal';
import InvoicePaymentsTab from '../components/payments/InvoicePaymentsTab';
import OverviewTab from '../components/payments/OverviewTab';
import PaymentTrackingTab from '../components/payments/PaymentTrackingTab';
import RecordPaymentDrawer from '../components/payments/RecordPaymentDrawer';
import RemindersTab from '../components/payments/RemindersTab';
import useRecordPayment from '../hooks/collectPayment/useRecordPayment';
import { CollectPaymentStep } from '../types/CollectPayment';
import { DocumentRow } from '../types/documents';

const Payments = () => {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<DocumentRow | null>(null);
    const [collectStep, setCollectStep] = useState<CollectPaymentStep>('options');
    const {
        invoices: recordPaymentInvoice,
        isLoading: recordPaymentLoading,
        totalRecords: recordPaymentTotal,
        page: recordPaymentPage,
        setPage: setRecordPaymentPage,
        itemsPerPage: recordPaymentItemsPerPage,
    } = useRecordPayment(drawerOpen);

    const handleSelectInvoice = (inv: DocumentRow) => {
        setSelectedInvoice(inv);
        setCollectStep('options');
        setDrawerOpen(false);
    };

    const handleCollectClose = () => {
        setSelectedInvoice(null);
        setCollectStep('options');
    };

    const [trackingKey, setTrackingKey] = useState(0);
    const [overviewKey, setOverviewKey] = useState(0);

    const refreshAfterPayment = () => {
        setOverviewKey(prev => prev + 1);
        setTrackingKey(prev => prev + 1);
    };

    const handlePaymentSuccess = () => {
        refreshAfterPayment();
        handleCollectClose();
    };

    const handleTabChange = (key: string) => {
        if (key === 'tracking') {
            setTrackingKey(prev => prev + 1);
        }
    };

    const tabItems = useMemo(
        () => [
            { key: 'overview', label: 'Overview', children: <OverviewTab key={overviewKey} /> },
            {
                key: 'invoicePayments',
                label: 'Invoice Payments',
                children: <InvoicePaymentsTab />,
            },
            {
                key: 'tracking',
                label: 'Payment tracking',
                children: (
                    <PaymentTrackingTab
                        key={trackingKey}
                        onPaymentRecorded={refreshAfterPayment}
                    />
                ),
            },
            {
                key: 'reminders',
                label: 'Reminders',
                children: <RemindersTab />,
            },
        ],
        [trackingKey, overviewKey]
    );

    return (
        <Content className="px-0">
            <Flex justify="space-between" align="center" className="mt-4 mb-6">
                <Flex vertical gap={2}>
                    <TypographyText className="text-xl font-semibold leading-7">
                        Payments
                    </TypographyText>
                    <Typography.Text className="text-[#475569] text-sm">
                        Track payments, monitor outstanding invoices, and manage collections.
                    </Typography.Text>
                </Flex>
                <Flex gap={12}>
                    <Button
                        type="primary"
                        className="h-9 px-4 bg-[#FF4F4F] border-[#FF4F4F] text-white font-medium text-sm rounded-lg hover:bg-[#e64444]"
                        onClick={() => setDrawerOpen(true)}
                    >
                        Record payment
                    </Button>
                </Flex>
            </Flex>

            <Tabs
                defaultActiveKey="overview"
                items={tabItems}
                className="[&_.ant-tabs-nav]:mb-6"
                onChange={handleTabChange}
            />

            <RecordPaymentDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSelectInvoice={handleSelectInvoice}
                invoices={recordPaymentInvoice}
                isLoading={recordPaymentLoading}
                totalRecords={recordPaymentTotal}
                page={recordPaymentPage}
                itemsPerPage={recordPaymentItemsPerPage}
                onPageChange={setRecordPaymentPage}
            />

            <CollectPaymentModal
                open={!!selectedInvoice}
                onClose={handleCollectClose}
                invoice={selectedInvoice}
                step={collectStep}
                onStepChange={setCollectStep}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </Content>
    );
};

export default Payments;
