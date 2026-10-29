import { Button, Flex, Modal } from 'antd';

interface ConfirmationModalProps {
    isOpen: boolean;
    handleCancel: () => void;
    title: string;
    description?: string;
    handleSubmit: () => void;
    isLoading: boolean;
    customBody?: React.ReactNode;
}
const ConfirmationModal = ({
    isOpen,
    handleCancel,
    title,
    handleSubmit,
    description,
    isLoading,
    customBody,
}: ConfirmationModalProps) => (
    <Modal
        title={
            <Flex gap={5} vertical>
                <Flex gap={16} align="start" className="font-medium mb-5">
                    {title}
                </Flex>
                {description && (
                    <Flex gap={16} align="start" className="mb-5 text-sm font-normal">
                        {description}
                    </Flex>
                )}
                {customBody && (
                    <Flex gap={16} align="start" className="font-medium text-sm">
                        {customBody}
                    </Flex>
                )}
            </Flex>
        }
        open={isOpen}
        onCancel={handleCancel}
        closeIcon={null}
        centered
        width={400}
        footer={[
            <Flex className="w-full " justify="flex-end" gap={10} key="">
                <Button
                    key="submit"
                    type="primary"
                    danger
                    loading={isLoading}
                    onClick={() => {
                        handleSubmit();
                    }}
                    className="rounded-sm "
                >
                    Yes
                </Button>
                <Button key="back" onClick={handleCancel} className="rounded-sm ">
                    No
                </Button>
            </Flex>,
        ]}
    />
);

export default ConfirmationModal;
