import React from 'react';

import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Modal } from 'antd';

import CenteredHeader from './CenteredHeader';

interface ComingSoonModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ open, onClose, title, description }) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        closeIcon={null}
        centered
        width={400}
        className="[&_.ant-modal-content]:rounded-[30px] [&_.ant-modal-content]:p-8"
    >
        <Flex vertical align="center" gap={24}>
            <CenteredHeader
                icon={<ClockCircleOutlined className="text-[#FF4F4F] text-2xl" />}
                outerClass="bg-[#FEE2E2]"
                title={title}
                description={description}
            />
            <Button
                type="primary"
                danger
                block
                className="h-10 text-sm font-medium rounded-lg"
                onClick={onClose}
            >
                Got it
            </Button>
        </Flex>
    </Modal>
);

export default ComingSoonModal;
