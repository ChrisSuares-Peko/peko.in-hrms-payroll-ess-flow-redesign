import React from 'react';

import { Button, Flex, Modal, Typography } from 'antd';

const { Title, Text } = Typography;

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

type Props = {
    open:         boolean;
    onClose:      () => void;
    onConfirm:    () => void;
    isLoading:    boolean;
    poRef:        string;
    vendor:       string;
    vendorEmail?: string;
    totalAmount?: string;
    currency?:    string;
    linkedRfq?:   string;
};

const IssuePOModal: React.FC<Props> = ({
    open, onClose, onConfirm, isLoading,
    poRef, vendor, vendorEmail, totalAmount, currency, linkedRfq,
}) => {
    const sym = CURRENCY_SYMBOLS[(currency ?? 'INR').toUpperCase()] ?? '₹';

    const rows = [
        { label: 'Vendor',     value: vendor },
        { label: 'Email',      value: vendorEmail ?? '-' },
        { label: 'Total',      value: totalAmount ? `${sym}${Number(totalAmount).toLocaleString('en-IN')}` : '-' },
        { label: 'Linked RFQ', value: linkedRfq ?? '-' },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
            styles={{
                content: { borderRadius: 41, padding: '36px 38px' },
                body: { padding: 0 },
            }}
        >
            <Flex vertical gap={18}>
                <Title level={3} style={{ margin: 0, fontSize: 24, fontWeight: 500 }}>
                    Issue PO to vendor?
                </Title>

                <Text style={{ fontSize: 16, color: '#505051', lineHeight: '22px' }}>
                    Are you sure you want to issue{' '}
                    <Text style={{ fontSize: 16, fontWeight: 500 }}>{poRef}</Text>
                    {' to '}
                    <Text style={{ fontSize: 16, fontWeight: 500 }}>{vendor}</Text>
                    ? They&apos;ll receive the PO document and may start billing against it.
                </Text>

                <div style={{
                    border: '0.881px solid #d9d9d9',
                    borderRadius: 26,
                    padding: 33,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                    boxShadow: '0px 1.236px 6.182px rgba(122,122,122,0.06)',
                }}>
                    {rows.map(({ label, value }) => (
                        <Flex key={label} justify="space-between" align="center">
                            <Text style={{ fontSize: 14, color: '#a9acb4', fontWeight: 500 }}>{label}</Text>
                            <Text style={{ fontSize: 16, color: '#505051', fontWeight: 500 }}>{value}</Text>
                        </Flex>
                    ))}
                </div>

                <Flex gap={12} align="center">
                    <Button
                        type="primary"
                        danger
                        loading={isLoading}
                        style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                        onClick={onConfirm}
                    >
                        Issue PO to vendor
                    </Button>
                    <Button
                        danger
                        variant="outlined"
                        style={{ height: 40, fontSize: 14, fontWeight: 500, borderRadius: 8 }}
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default IssuePOModal;
