import React, { useEffect, useState } from 'react';

import { Input, Modal, Typography } from 'antd';

const { Text } = Typography;

type Props = {
    open:      boolean;
    onClose:   () => void;
    onConfirm: (reason: string) => void;
    isLoading: boolean;
    poRef:     string;
    vendor:    string;
};

const MIN_REASON = 3;

const CancelPOModal: React.FC<Props> = ({ open, onClose, onConfirm, isLoading, poRef, vendor }) => {
    const [reason, setReason] = useState('');

    useEffect(() => { if (!open) setReason(''); }, [open]);

    const trimmed = reason.trim();

    return (
        <Modal
            open={open}
            title={`Cancel ${poRef}?`}
            onCancel={onClose}
            onOk={() => onConfirm(trimmed)}
            okText="Cancel PO"
            cancelText="Keep PO"
            okButtonProps={{ danger: true, disabled: trimmed.length < MIN_REASON, loading: isLoading }}
            destroyOnClose
        >
            <Text style={{ fontSize: 14, color: '#505051', lineHeight: '22px', display: 'block', marginBottom: 12 }}>
                The PO will move to Cancelled and stay on record. <Text strong>{vendor}</Text> will be notified by email.
            </Text>
            <Input.TextArea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Reason for cancelling"
                maxLength={500}
                showCount
                autoSize={{ minRows: 3, maxRows: 6 }}
            />
        </Modal>
    );
};

export default CancelPOModal;
