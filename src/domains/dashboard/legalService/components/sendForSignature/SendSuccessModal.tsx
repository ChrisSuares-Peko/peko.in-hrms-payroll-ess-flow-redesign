import { Button, Flex, Modal, Typography } from 'antd';

import tickCircle from '../../assets/icons/tick-circle.svg';

interface SendSuccessModalProps {
    open: boolean;
    onClose: () => void;
    onTrackStatus: () => void;
    signerCount: number;
}

const SendSuccessModal = ({ open, onClose, onTrackStatus, signerCount }: SendSuccessModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        centered
        footer={null}
        closeIcon={null}
        maskClosable={false}
        width={520}
        styles={{ content: { borderRadius: 24, padding: '44px 40px' } }}
    >
        <Flex vertical align="center" gap={20}>
            <Flex className="p-4 bg-green-100 rounded-full">
                <img src={tickCircle} alt="success" className="w-20 h-20" />
            </Flex>

            <Flex vertical align="center" gap={8}>
                <Typography.Text className="!text-2xl !font-semibold !text-[#1E293B] text-center block">
                    Sent successfully!
                </Typography.Text>
                <Typography.Text className="!text-base !text-[#475569] text-center block">
                    E-sign requests sent to {signerCount} signer{signerCount !== 1 ? 's' : ''} via email.
                </Typography.Text>
            </Flex>

            <div className="w-full px-4 py-3 bg-neutral-100 rounded-xl">
                <Typography.Text className="!text-base !text-[#4B5563] text-center block">
                    You will receive a notification once all parties have signed
                </Typography.Text>
            </div>

            <Flex gap={14} className="w-full">
                <Button
                    size="large"
                    onClick={onClose}
                    className="flex-1 !h-12 border-[#FF3A3A] !text-[#FF3A3A] hover:!border-[#e02020] hover:!text-[#e02020] !rounded-lg !font-medium"
                >
                    Close
                </Button>
                <Button
                    type="primary"
                    size="large"
                    onClick={onTrackStatus}
                    className="flex-1 !h-12 !bg-[#FF3A3A] hover:!bg-[#e02020] !border-[#FF3A3A] !rounded-lg !font-medium"
                >
                    Track status
                </Button>
            </Flex>
        </Flex>
    </Modal>
);

export default SendSuccessModal;
