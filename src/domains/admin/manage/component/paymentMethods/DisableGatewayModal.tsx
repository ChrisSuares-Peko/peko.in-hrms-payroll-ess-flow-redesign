import { CloseCircleOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Flex, Modal, Typography } from 'antd';

import { PaymentMethod } from '../../types/paymentMethods';
import { getPartnerLabel } from '../../utils/paymentMethods';

const { Title, Text } = Typography;

type DisableGatewayModalProps = {
    paymentMethod?: PaymentMethod;
    isLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
};

const DisableGatewayModal = ({
    paymentMethod,
    isLoading,
    onConfirm,
    onCancel,
}: DisableGatewayModalProps) => {
    const summary = [
        { label: 'Partner', value: paymentMethod ? getPartnerLabel(paymentMethod) : 'N/A' },
        { label: 'Payment gateway', value: paymentMethod?.pgProviderName || 'N/A' },
        { label: 'Services affected', value: `${paymentMethod?.serviceList.length ?? 0}` },
    ];

    return (
        <Modal
            open={!!paymentMethod}
            onCancel={onCancel}
            closable={!isLoading}
            maskClosable={!isLoading}
            keyboard={!isLoading}
            centered
            destroyOnHidden
            width={440}
            title={null}
            footer={null}
            classNames={{ content: '!rounded-2xl' }}
            closeIcon={<CloseCircleOutlined className="text-base text-textHeadings" />}
        >
            <Flex vertical gap={20} className="py-1">
                <Flex
                    align="center"
                    justify="center"
                    className="h-12 w-12 rounded-full bg-warning-surface"
                >
                    <ExclamationCircleFilled className="text-2xl text-warning" />
                </Flex>

                <Flex vertical gap={8}>
                    <Title level={4} className="!mb-0 !text-textHeadings">
                        Disable the last payment gateway?
                    </Title>
                    <Text className="text-sm text-textBody">
                        This partner has no other active payment gateway. Once disabled, its
                        customers can&apos;t pay through a payment gateway until another one is
                        enabled. Wallet payments are not affected.
                    </Text>
                </Flex>

                <Flex
                    vertical
                    gap={10}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                    {summary.map(({ label, value }) => (
                        <Flex key={label} justify="space-between" align="center" gap={16}>
                            <Text className="text-sm text-textBody">{label}</Text>
                            <Text className="break-words text-right text-sm font-medium text-textHeadings">
                                {value}
                            </Text>
                        </Flex>
                    ))}
                </Flex>

                <Flex gap={12}>
                    <Button block onClick={onCancel} disabled={isLoading} className="font-medium">
                        Cancel
                    </Button>
                    <Button
                        block
                        type="primary"
                        danger
                        loading={isLoading}
                        onClick={onConfirm}
                        className="font-medium"
                    >
                        Disable gateway
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default DisableGatewayModal;
