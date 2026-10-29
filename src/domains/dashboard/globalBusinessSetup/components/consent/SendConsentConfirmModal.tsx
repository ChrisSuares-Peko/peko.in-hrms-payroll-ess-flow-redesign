import React from 'react';

import { Avatar, Button, Flex, Modal, Typography } from 'antd';

interface SendConsentConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    clientName?: string;
    clientEmail?: string;
}

const SendConsentConfirmModal: React.FC<SendConsentConfirmModalProps> = ({
    open,
    onClose,
    onConfirm,
    loading,
    clientName,
    clientEmail,
}) => (
    <Modal
        open={open}
        onCancel={onClose}
        title="Send Consent Confirmation"
        width={480}
        footer={[
            <Button key="cancel" onClick={onClose}>
                Cancel
            </Button>,
            <Button key="send" type="primary" danger loading={loading} onClick={onConfirm}>
                Send Consent
            </Button>,
        ]}
    >
        <Flex vertical gap={12}>
            <Typography.Text className="text-sm text-neutral-600">
                The consent document will be emailed to this client for e-signature.
            </Typography.Text>
            <Flex
                align="center"
                gap={12}
                className="rounded-xl"
                style={{ background: '#F5F5F5', padding: 12 }}
            >
                <Avatar style={{ background: '#FFF0F0', color: '#FF4F4F', fontWeight: 600 }}>
                    {(clientName || 'C').charAt(0).toUpperCase()}
                </Avatar>
                <Flex vertical style={{ minWidth: 0 }}>
                    <Typography.Text className="text-sm font-semibold truncate">
                        {clientName || 'Client'}
                    </Typography.Text>
                    <Typography.Text className="text-xs text-neutral-500 truncate">
                        {clientEmail || '—'}
                    </Typography.Text>
                </Flex>
            </Flex>
        </Flex>
    </Modal>
);

export default SendConsentConfirmModal;
