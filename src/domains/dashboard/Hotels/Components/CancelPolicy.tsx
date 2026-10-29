import { Divider, Flex, Modal, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

interface modalProps {
    isModalOpen: boolean;
    handleCancel: () => void;
    cancellationPolicy?: Array<{
        FromDate: string;
        ChargeType: string;
        CancellationCharge: number;
    }>;
}

const CancelPolicy = ({ isModalOpen, handleCancel, cancellationPolicy }: modalProps) => (
    <Modal
        title="Cancellation Policy Details"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
    >
        <Divider />
        <Content className="px-4">
            {cancellationPolicy && cancellationPolicy.length > 0 ? (
                <Flex vertical gap={15}>
                    {cancellationPolicy.map((policy, index) => (
                        <Flex key={index} vertical>
                            <Typography.Text className="pt-1 text-xs font-bold">
                                Policy {index + 1}:
                            </Typography.Text>
                            <Typography.Text className="pt-1 text-sm text-slate-500">
                                From Date: {policy.FromDate ? policy.FromDate.split(' ')[0] : 'N/A'}
                            </Typography.Text>
                            <Typography.Text className="pt-1 text-sm">
                                Charge Type: {policy.ChargeType}
                            </Typography.Text>
                            <Typography.Text className="pt-1 text-sm">
                                Cancellation Charge: {policy.CancellationCharge}%
                            </Typography.Text>
                            {index < cancellationPolicy.length - 1 && <Divider />}
                        </Flex>
                    ))}
                </Flex>
            ) : (
                <Typography className="mt-3 text-justify" style={{ lineHeight: '1.5' }}>
                    Cancellation policy details are not available at this time.
                </Typography>
            )}
        </Content>
    </Modal>
);

export default CancelPolicy;
