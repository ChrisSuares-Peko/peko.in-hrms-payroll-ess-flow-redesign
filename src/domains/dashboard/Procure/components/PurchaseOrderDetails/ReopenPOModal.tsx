import React from 'react';

import { Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

const { Text } = Typography;

type Props = {
    open:      boolean;
    onClose:   () => void;
    onConfirm: () => void;
    isLoading: boolean;
    poRef:     string;
    vendor:    string;
};

const ReopenPOModal: React.FC<Props> = ({ open, onClose, onConfirm, isLoading, poRef, vendor }) => (
    <ConfirmationModal
        isOpen={open}
        handleCancel={onClose}
        title={`Re-open ${poRef}?`}
        handleSubmit={onConfirm}
        isLoading={isLoading}
        customBody={
            <Text style={{ fontSize: 14, color: '#505051', lineHeight: '22px', fontWeight: 400 }}>
                Re-opening <Text strong>{poRef}</Text> will move it back to PO Issued
                and unlock the vendor portal so <Text strong>{vendor}</Text> can submit again if needed.
            </Text>
        }
    />
);

export default ReopenPOModal;
