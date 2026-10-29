import { Modal, Typography } from 'antd';

type GateConfirmModalProps = {
    open: boolean;
    turningOff: boolean;
    isSaving: boolean;
    onCancel: () => void;
    onConfirm: () => void;
};

export const GATE_OFF_TITLE = 'Turn the approval gate off?';
export const GATE_OFF_BODY =
    'Every switched-on service becomes visible to corporates at once, approved or not. Use this only while developing or testing. A red warning stays on every accounting page until the gate is turned back on.';
export const GATE_ON_TITLE = 'Turn the approval gate on?';
export const GATE_ON_BODY =
    'Only approved services stay visible to corporates. Services that are switched on but not yet approved go offline for their partner’s corporates the moment you confirm.';

const GateConfirmModal = ({
    open,
    turningOff,
    isSaving,
    onCancel,
    onConfirm,
}: GateConfirmModalProps) => (
    <Modal
        open={open}
        onCancel={onCancel}
        onOk={onConfirm}
        okText={turningOff ? 'Turn off' : 'Turn on'}
        okButtonProps={{ danger: turningOff, loading: isSaving }}
        title={turningOff ? GATE_OFF_TITLE : GATE_ON_TITLE}
        destroyOnHidden
    >
        <Typography.Text className="text-sm text-textBody">
            {turningOff ? GATE_OFF_BODY : GATE_ON_BODY}
        </Typography.Text>
    </Modal>
);

export default GateConfirmModal;
