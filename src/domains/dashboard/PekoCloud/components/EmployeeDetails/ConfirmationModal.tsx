import { Button, Flex, Modal, Typography } from 'antd';

interface ConfirmationModalProps {
    isOpen: boolean;
    handleCancel: () => void;
    title: string;
    subTitle?: string;
    handleSubmit: () => void;
    isLoading: boolean;
    size?: 'medium' | 'small' | 'large';
}
const ConfirmationModal = ({
    isOpen,
    handleCancel,
    title,
    subTitle,
    handleSubmit,
    isLoading,
    size,
}: ConfirmationModalProps) => (
    <Modal
        title={
            <Flex vertical align="start" className="font-medium mb-5">
                <Typography.Text className=" text-base">{title}</Typography.Text>
                <Typography.Text className=" text-base">{subTitle}</Typography.Text>
            </Flex>
        }
        open={isOpen}
        onCancel={handleCancel}
        closeIcon={null}
        centered
        // eslint-disable-next-line no-nested-ternary
        width={size === 'small' ? 300 : size === 'large' ? 500 : 400}
        footer={[
            <Flex className=" w-full" justify="flex-end" gap={10} key="">
                <Button key="back" onClick={handleCancel} className=" rounded-sm ">
                    No
                </Button>
                <Button
                    key="submit"
                    type="primary"
                    danger
                    loading={isLoading}
                    onClick={() => {
                        handleSubmit();
                    }}
                    className=" rounded-sm"
                >
                    Yes
                </Button>
            </Flex>,
        ]}
    />
);

export default ConfirmationModal;
