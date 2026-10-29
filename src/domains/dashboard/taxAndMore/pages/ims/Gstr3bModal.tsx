import { RightOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

interface Gstr3bModalProps {
    open: boolean;
    pendingCount: number;
    hasUnsavedChanges: boolean;
    isProceeding: boolean;
    isSaving: boolean;
    onClose: () => void;
    onProceed: () => void;
    onSaveAndProceed: () => void;
}

const Gstr3bModal = ({
    open,
    pendingCount,
    hasUnsavedChanges,
    isProceeding,
    isSaving,
    onClose,
    onProceed,
    onSaveAndProceed,
}: Gstr3bModalProps) => (
    <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        closable={false}
        width={400}
        centered
        styles={{
            content: { padding: 20, borderRadius: 16, border: '0.6px solid #cbd5e1' },
            body: { padding: 0 },
        }}
    >
        <Flex vertical gap={16}>
            {hasUnsavedChanges ? (
                <>
                    <Flex vertical gap={6}>
                        <Typography.Text
                            className="font-semibold"
                            style={{ fontSize: 16, lineHeight: '24px', color: '#1e293b' }}
                        >
                            You have unsaved changes.
                        </Typography.Text>
                        <Typography.Text
                            style={{ fontSize: 13, lineHeight: '20px', color: '#475569' }}
                        >
                            Your accept/reject actions haven&apos;t been saved to the GST portal
                            yet.
                        </Typography.Text>
                    </Flex>
                    <Flex gap={12}>
                        <Button
                            block
                            loading={isSaving}
                            disabled={isProceeding}
                            icon={<SaveOutlined />}
                            style={{ height: 36, fontSize: 13, fontWeight: 500 }}
                            onClick={onSaveAndProceed}
                        >
                            Save &amp; Proceed
                        </Button>
                        <Button
                            block
                            disabled={isSaving}
                            loading={isProceeding}
                            style={{
                                height: 36,
                                fontSize: 13,
                                fontWeight: 500,
                                borderColor: '#FF4F4F',
                                color: '#FF4F4F',
                            }}
                            onClick={onProceed}
                        >
                            Proceed Anyway
                        </Button>
                    </Flex>
                </>
            ) : (
                <>
                    <Flex vertical gap={6}>
                        <Typography.Text
                            className="font-semibold"
                            style={{ fontSize: 16, lineHeight: '24px', color: '#1e293b' }}
                        >
                            {pendingCount > 0
                                ? `${pendingCount} invoices not reviewed`
                                : 'All invoices reviewed'}
                        </Typography.Text>
                        <Typography.Text
                            style={{ fontSize: 13, lineHeight: '20px', color: '#475569' }}
                        >
                            {pendingCount > 0
                                ? 'Unreviewed invoices will be auto-accepted. You can verify your ITC in GSTR-2B before filing GSTR-3B.'
                                : 'You can verify your ITC in GSTR-2B before filing GSTR-3B.'}
                        </Typography.Text>
                    </Flex>
                    <Flex gap={12}>
                        <Button
                            block
                            style={{
                                height: 36,
                                fontSize: 13,
                                fontWeight: 500,
                                borderColor: '#FF4F4F',
                                color: '#FF4F4F',
                            }}
                            onClick={onClose}
                        >
                            Go Back
                        </Button>
                        <Button
                            type="primary"
                            danger
                            block
                            icon={<RightOutlined />}
                            iconPosition="end"
                            loading={isProceeding}
                            style={{ height: 36, fontSize: 13, fontWeight: 500 }}
                            onClick={onProceed}
                        >
                            Proceed
                        </Button>
                    </Flex>
                </>
            )}
        </Flex>
    </Modal>
);

export default Gstr3bModal;
