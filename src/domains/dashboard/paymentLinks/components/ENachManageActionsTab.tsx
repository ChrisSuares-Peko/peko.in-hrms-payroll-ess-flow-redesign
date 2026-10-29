import { Button, Space, Typography } from 'antd';

interface ENachManageActionsTabProps {
    isManageAndInitiateLocked: boolean;
    isCancelling: boolean;
    onCancelMandate: () => void;
}

const ENachManageActionsTab = ({
    isManageAndInitiateLocked,
    isCancelling,
    onCancelMandate,
}: ENachManageActionsTabProps) => (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
            Use these actions to manage the selected eNACH mandate.
        </Typography.Text>
        <Button
            danger
            loading={isCancelling}
            disabled={isManageAndInitiateLocked}
            onClick={onCancelMandate}
            style={{ width: 'fit-content' }}
        >
            Cancel Mandate
        </Button>
    </Space>
);

export default ENachManageActionsTab;
