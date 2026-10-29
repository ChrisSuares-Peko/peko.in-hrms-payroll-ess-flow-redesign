import { CopyOutlined, DownloadOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Image, Modal, Typography } from 'antd';

import BulbIcon from '../assets/icons/bulb.svg';
import useDownloadBankDetailsPdf from '../hooks/useDownloadBankDetailsPdf';
import { OnboardingRecord } from '../types/paymentLinkTypes';
import {
    copyAllDetails,
    copyToClipboard,
    getBankDetails,
    shareViaWhatsApp,
    transferMethods,
} from '../utils/data';

interface ShareBankDetailsModalProps {
    open: boolean;
    onClose: () => void;
    bankDetailsData?: OnboardingRecord | null;
}

const ShareBankDetailsModal = ({ open, onClose, bankDetailsData }: ShareBankDetailsModalProps) => {
    const { isDownloading, downloadPdf } = useDownloadBankDetailsPdf();
    const bankDetails = getBankDetails(bankDetailsData);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width="45%"
            centered
            classNames={{ content: '!rounded-3xl' }}
        >
            <Flex vertical gap={24} className="p-4 pb-5">
                {/* Header */}
                <Flex vertical gap={4}>
                    <Typography.Title level={4} className="!mb-0 !font-bold">
                        Bank Transfer Details
                    </Typography.Title>
                    <Typography.Text className="text-gray-500">
                        Share these details with your customer for NEFT, RTGS, or IMPS transfers
                    </Typography.Text>
                </Flex>

                {/* Virtual Account card */}
                <Card
                    bordered={false}
                    className="rounded-2xl !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                    styles={{ body: { padding: 20 } }}
                >
                    <Flex vertical gap={20}>
                        <Flex vertical gap={4}>
                            <Typography.Text className="font-bold text-base">
                                Virtual Account
                            </Typography.Text>
                            <Typography.Text className="text-sm text-gray-500">
                                Use for direct bank transfers
                            </Typography.Text>
                        </Flex>

                        <Flex vertical gap={12}>
                            {bankDetails.map(detail => (
                                <Card
                                    bordered={false}
                                    key={detail.label}
                                    className="rounded-xl overflow-hidden !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                                    styles={{ body: { padding: '10px 16px', background: '#F9FAFB' } }}
                                >
                                    <Flex justify="space-between" align="center">
                                        <Flex vertical gap={3}>
                                            <Typography.Text className="text-xs text-gray-400">
                                                {detail.label}
                                            </Typography.Text>
                                            <Typography.Text className="font-medium text-sm">
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
                            onClick={() => copyAllDetails(bankDetails)}
                        >
                            Copy all Details
                        </Button>

                        <Flex gap={12} wrap="wrap">
                            <Button
                                size="large"
                                icon={<DownloadOutlined />}
                                className="flex-1 min-w-[140px] bg-gray-100 border-none hover:!bg-gray-200 hover:!text-black"
                                loading={isDownloading}
                                disabled={isDownloading}
                                onClick={downloadPdf}
                            >
                                Download PDF
                            </Button>
                            <Button
                                size="large"
                                icon={<WhatsAppOutlined />}
                                className="flex-1 min-w-[140px] bg-gray-100 border-none hover:!bg-gray-200 hover:!text-black"
                                onClick={() => shareViaWhatsApp(bankDetails)}
                            >
                                Share via Whatsapp
                            </Button>
                        </Flex>
                    </Flex>
                </Card>

                {/* Supported Transfer Methods */}
                <Flex vertical gap={12}>
                    <Flex align="center" gap={8}>
                        <Image src={BulbIcon} width={15} height={15} preview={false} />
                        <Typography.Text className="font-bold text-base">
                            Supported Transfer Methods
                        </Typography.Text>
                    </Flex>
                    <Flex vertical gap={8}>
                        {transferMethods.map(method => (
                            <Typography.Text key={method.name} className="text-sm">
                                {'• '}
                                <span className="font-semibold">{method.name}</span>
                                <span className="text-gray-500"> - {method.description}</span>
                            </Typography.Text>
                        ))}
                    </Flex>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default ShareBankDetailsModal;
