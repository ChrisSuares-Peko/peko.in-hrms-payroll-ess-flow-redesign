import { CopyOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Modal, Typography } from 'antd';

import type { VirtualAccountAccountDetails } from '../types/paymentLinkTypes';
import { copyAllDetails, copyToClipboard, type BankDetailItem } from '../utils/data';

interface VirtualAccountDetailsModalProps {
    open: boolean;
    onClose: () => void;
    accountDetails: VirtualAccountAccountDetails | null;
}

const VirtualAccountDetailsModal = ({ open, onClose, accountDetails }: VirtualAccountDetailsModalProps) => {
    const details: BankDetailItem[] = accountDetails
        ? [
              { label: 'Account Name', value: accountDetails.accountName ?? '—' },
              { label: 'Virtual Account Number', value: accountDetails.virtualAccountNumber },
              { label: 'IFSC Code', value: accountDetails.ifsc ?? '—' },
          ]
        : [];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={560}
            centered
            classNames={{ content: '!rounded-3xl' }}
        >
            <Flex vertical gap={24} className="p-4 pb-5">
                <Flex vertical gap={4}>
                    <Typography.Title level={4} className="!mb-0 !font-bold">
                        Virtual Account Details
                    </Typography.Title>
                    <Typography.Text className="text-gray-500">
                        Use these details for direct transfers to your virtual account
                    </Typography.Text>
                </Flex>

                <Card
                    bordered={false}
                    className="rounded-2xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                    styles={{ body: { padding: 20 } }}
                >
                    <Flex vertical gap={20}>
                        <Flex vertical gap={12}>
                            {details.map(detail => (
                                <Card
                                    bordered={false}
                                    key={detail.label}
                                    className="rounded-xl overflow-hidden !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                                    styles={{ body: { padding: '10px 16px', background: '#F9FAFB' } }}
                                >
                                    <Flex justify="space-between" align="center" gap={12}>
                                        <Flex vertical gap={3}>
                                            <Typography.Text className="text-xs text-gray-400">
                                                {detail.label}
                                            </Typography.Text>
                                            <Typography.Text className="font-medium text-sm break-all">
                                                {detail.value}
                                            </Typography.Text>
                                        </Flex>
                                        <CopyOutlined
                                            className="cursor-pointer bg-red-50 text-red-400 p-3 rounded-lg"
                                            onClick={() => copyToClipboard(detail.value)}
                                        />
                                    </Flex>
                                </Card>
                            ))}
                        </Flex>

                        <Button
                            type="primary"
                            danger
                            size="large"
                            icon={<CopyOutlined />}
                            block
                            onClick={() => copyAllDetails(details)}
                        >
                            Copy all Details
                        </Button>
                    </Flex>
                </Card>
            </Flex>
        </Modal>
    );
};

export default VirtualAccountDetailsModal;
