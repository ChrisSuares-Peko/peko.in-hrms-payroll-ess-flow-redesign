import { RefObject } from 'react';

import { CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Input, QRCode, Typography } from 'antd';

import { CreateDynamicQrResponse } from '../../types/paymentLinkTypes';

interface GenerateQrCodeSuccessProps {
    qrData: CreateDynamicQrResponse;
    isCheckingImage: boolean;
    isQrImage: boolean;
    isDownloading: boolean;
    qrPreviewContainerRef: RefObject<HTMLElement>;
    onQrImageError: () => void;
    onCopyQrUrl: () => void;
    onDownloadQr: () => void;
    onOpenQr: () => void;
    onCreateAnother: () => void;
}

const GenerateQrCodeSuccess = ({
    qrData,
    isCheckingImage,
    isQrImage,
    isDownloading,
    qrPreviewContainerRef,
    onQrImageError,
    onCopyQrUrl,
    onDownloadQr,
    onOpenQr,
    onCreateAnother,
}: GenerateQrCodeSuccessProps) => {
    const renderQrPreview = () => {
        if (isCheckingImage) {
            return (
                <Typography.Text className="text-center text-[12px] text-[#667085]">
                    Checking QR preview...
                </Typography.Text>
            );
        }

        if (isQrImage) {
            return (
                <img
                    src={qrData.dynamic_qr_image}
                    alt="Dynamic QR"
                    className="h-[220px] w-[220px] rounded-lg object-contain"
                    onError={onQrImageError}
                />
            );
        }

        return <QRCode value={qrData.dynamic_qr_image || ''} size={220} bgColor="#FFFFFF" />;
    };

    return (
        <Flex vertical gap={16}>
            <Flex vertical align="center" gap={6}>
                <Typography.Title level={4} className="!mb-0 !text-center">
                    Dynamic QR Created
                </Typography.Title>
                <Typography.Text className="text-center text-[#667085]">
                    Share this QR with your customer to collect payment
                </Typography.Text>
            </Flex>

            <Flex
                vertical
                align="center"
                justify="center"
                className="rounded-xl p-4 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                gap={10}
                ref={qrPreviewContainerRef}
            >
                {renderQrPreview()}
            </Flex>

            <Flex vertical gap={8}>
                <Typography.Text className="text-[13px] font-semibold text-[#1F2A44]">
                    QR Image URL
                </Typography.Text>
                <Flex gap={8}>
                    <Input value={qrData.dynamic_qr_image} readOnly className="!text-[12px]" />
                    <Button icon={<CopyOutlined />} onClick={onCopyQrUrl} />
                </Flex>
            </Flex>

            <Flex vertical gap={8} className="rounded-xl p-4 !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]">
                <Typography.Text className="text-[12px] text-[#667085]">
                    Reference ID: <span className="font-medium text-[#1F2A44]">{qrData.reference_id}</span>
                </Typography.Text>
                <Typography.Text className="text-[12px] text-[#667085]">
                    Decentro Txn ID:{' '}
                    <span className="font-medium text-[#1F2A44]">{qrData.decentro_txn_id || '—'}</span>
                </Typography.Text>
                <Typography.Text className="text-[12px] text-[#667085]">
                    Status:{' '}
                    <span className="font-medium text-[#1F2A44]">
                        {qrData.transaction_status
                            ? qrData.transaction_status.charAt(0).toUpperCase() + qrData.transaction_status.slice(1).toLowerCase()
                            : ''}
                    </span>
               
                </Typography.Text>
            </Flex>

            <Flex gap={12} wrap="wrap">
                <Button
                    size="large"
                    className="min-w-[160px] flex-1"
                    icon={<DownloadOutlined />}
                    loading={isDownloading}
                    disabled={isCheckingImage}
                    onClick={onDownloadQr}
                >
                    Download QR
                </Button>
                <Button size="large" className="min-w-[160px] flex-1" onClick={onCreateAnother}>
                    Create another
                </Button>
            </Flex>
        </Flex>
    );
};

export default GenerateQrCodeSuccess;
