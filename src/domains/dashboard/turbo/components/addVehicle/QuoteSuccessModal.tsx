import { Button, Flex, Modal, Typography } from 'antd';

interface QuoteSuccessModalProps {
    open: boolean;
    handleClose: () => void;
    message?: string;
}

const QuoteSuccessModal = ({ open, handleClose, message }: QuoteSuccessModalProps) => (
    <Modal
        open={open}
        onCancel={handleClose}
        closeIcon={null}
        centered
        width={480}
        footer={null}
        styles={{
            content: { borderRadius: 16, padding: 20 },
            body: { padding: 0 },
        }}
    >
        <Flex vertical gap={12} align="start">
            <Typography.Text className="text-lg font-semibold">
                Quote Requested
            </Typography.Text>
            <Typography.Text type="secondary" className="text-sm">
                {message ||
                    'Your request for quote has been received. We will get in touch with you shortly.'}
            </Typography.Text>
            <Button
                onClick={handleClose}
                className="!bg-lightRed hover:!opacity-90 !border-lightRed !text-white !font-medium !w-[110px] transition-colors"
            >
                Done
            </Button>
        </Flex>
    </Modal>
);

export default QuoteSuccessModal;
