import { Button, Modal, Typography } from 'antd';

import { MODAL_CLOSE_ICON, ROUNDED_MODAL_CLASSNAMES } from './modalProps';

const { Title, Text } = Typography;

interface ConfirmActionModalProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    /** Destructive styling (solid red) for reject-style actions; primary styling otherwise. */
    danger?: boolean;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/** Centered "Are you sure?" confirmation before an approve/reject decision (Figma: Reject Transaction popup). */
const ConfirmActionModal = ({
    open,
    title,
    description,
    confirmLabel,
    danger,
    loading,
    onCancel,
    onConfirm,
}: ConfirmActionModalProps) => (
    <Modal
        open={open}
        onCancel={onCancel}
        footer={null}
        centered
        classNames={ROUNDED_MODAL_CLASSNAMES}
        closeIcon={MODAL_CLOSE_ICON}
    >
        <div className="flex flex-col items-center gap-4 py-2 text-center">
            <Title level={4} className="!mb-0 !text-textHeadings">
                {title}
            </Title>
            <Text className="text-sm text-textBody">{description}</Text>
            <div className="grid w-full grid-cols-2 gap-3">
                <Button disabled={loading} onClick={onCancel} className="font-medium">
                    Cancel
                </Button>
                <Button
                    danger={danger}
                    type="primary"
                    loading={loading}
                    onClick={onConfirm}
                    className="font-medium"
                >
                    {confirmLabel}
                </Button>
            </div>
        </div>
    </Modal>
);

export default ConfirmActionModal;
