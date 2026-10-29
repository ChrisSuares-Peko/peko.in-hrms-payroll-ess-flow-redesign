import React from 'react';

import { Button, Flex, Modal, Typography } from 'antd';

import clockIcon from '../../CorporateTravel/assets/icons/clock.svg';

interface SessionExpiredModalProps {
    open: boolean;
    onGoBack: () => void;
}

const SessionExpiredModal = ({ open, onGoBack }: SessionExpiredModalProps) => (
    <Modal open={open} footer={null} closable={false} centered width={560} maskClosable={false} styles={{ content: { borderRadius: 16, padding: '40px 48px' } }}>
        <Flex vertical align="center" gap={16} className="py-4 text-center">
            <img src={clockIcon} alt="session expired" style={{ width: 96, height: 96 }} />
            <Typography.Text className="text-lg font-semibold">
                Your flight booking session has expired
            </Typography.Text>
            <Typography.Text type="secondary" className="text-sm">
                Your flight booking session has expired due to inactivity. Fares and seat
                availability may have changed. Please start a new search to continue.
            </Typography.Text>
            <Button type="primary" danger onClick={onGoBack} className="px-8 mt-2">
                Go Back
            </Button>
        </Flex>
    </Modal>
);

export default SessionExpiredModal;
