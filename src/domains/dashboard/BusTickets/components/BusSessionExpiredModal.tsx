import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

interface BusSessionExpiredModalProps {
    open: boolean;
    onGoBack: () => void;
}

const BusSessionExpiredModal = ({ open, onGoBack }: BusSessionExpiredModalProps) => (
    <Modal open={open} footer={null} closable={false} centered width={440} maskClosable={false}>
        <Flex vertical align="center" gap={16} className="py-4 text-center">
            <ClockCircleOutlined style={{ fontSize: 56, color: '#d9d9d9' }} />
            <Typography.Text className="text-lg font-semibold">
                Your bus booking session has expired
            </Typography.Text>
            <Typography.Text type="secondary" className="text-sm">
                Your seat reservation has expired. Seat availability and fares may have changed.
                Please start a new search to continue.
            </Typography.Text>
            <Button type="primary" danger onClick={onGoBack} className="px-8 mt-2">
                Go Back
            </Button>
        </Flex>
    </Modal>
);

export default BusSessionExpiredModal;
