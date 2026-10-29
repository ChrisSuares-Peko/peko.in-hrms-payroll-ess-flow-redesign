import { CloseCircleOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

const { Title, Text } = Typography;

interface UnableToDeleteModalProps {
    isOpen: boolean;
    handleClose: () => void;
    title?: string;
    description?: string;
}

const UnableToDeleteModal = ({
    isOpen,
    handleClose,
    title = 'Unable to delete member',
    description = 'This member cannot be deleted because they currently have active cards associated with their account.',
}: UnableToDeleteModalProps) => (
    <Modal
        open={isOpen}
        onCancel={handleClose}
        centered
        destroyOnClose
        width={440}
        title={null}
        footer={null}
        classNames={{ content: '!rounded-2xl' }}
        closeIcon={<CloseCircleOutlined className="text-base text-textHeadings" />}
    >
        <Flex vertical gap={8} className="py-1">
            <Title level={4} className="!mb-0 !text-textHeadings">
                {title}
            </Title>
            <Text className="text-sm text-textBody">{description}</Text>
            <Button danger block onClick={handleClose} className="mt-4 font-medium">
                Close
            </Button>
        </Flex>
    </Modal>
);

export default UnableToDeleteModal;
