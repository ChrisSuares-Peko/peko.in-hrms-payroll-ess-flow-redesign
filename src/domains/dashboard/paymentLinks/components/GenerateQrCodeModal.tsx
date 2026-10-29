import { useEffect, useRef, useState } from 'react';

import { Flex, Modal, message } from 'antd';
import { saveAs } from 'file-saver';

import GenerateQrCodeForm from './generateQrCode/GenerateQrCodeForm';
import type { GenerateQrFormValues } from './generateQrCode/GenerateQrCodeModal.types';
import GenerateQrCodeSuccess from './generateQrCode/GenerateQrCodeSuccess';
import { useCreateDynamicQr } from '../hooks/useCreateDynamicQr';
import type { CreateDynamicQrResponse } from '../types/paymentLinkTypes';
import {
    canRenderAsImage,
    convertCanvasToPngBlob,
    createWhiteBackgroundCanvas,
    loadImage,
} from '../utils/data';

interface GenerateQrCodeModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
}

const GenerateQrCodeModal = ({ open, onClose, onSubmit }: GenerateQrCodeModalProps) => {
    const { loading, generateQr } = useCreateDynamicQr();
    const [qrData, setQrData] = useState<CreateDynamicQrResponse | null>(null);
    const [isQrImage, setIsQrImage] = useState(false);
    const [isCheckingImage, setIsCheckingImage] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const qrPreviewContainerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        let isCancelled = false;

        const resolveImagePreview = async () => {
            if (!qrData?.dynamic_qr_image) {
                setIsQrImage(false);
                setIsCheckingImage(false);
                return;
            }

            setIsCheckingImage(true);
            const isImage = await canRenderAsImage(qrData.dynamic_qr_image);

            if (!isCancelled) {
                setIsQrImage(isImage);
                setIsCheckingImage(false);
            }
        };

        resolveImagePreview().catch(() => {
            if (!isCancelled) {
                setIsQrImage(false);
                setIsCheckingImage(false);
            }
        });

        return () => {
            isCancelled = true;
        };
    }, [qrData?.dynamic_qr_image]);

    const resetState = () => {
        setQrData(null);
        setIsQrImage(false);
        setIsCheckingImage(false);
        setIsDownloading(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleCreateAnother = () => {
        resetState();
    };

    const copyValue = async (value: string, label: string) => {
        if (!value) {
            message.error(`${label} is not available`);
            return;
        }
        await navigator.clipboard.writeText(value);
        message.success(`${label} copied`);
    };

    const handleSubmit = async (values: GenerateQrFormValues) => {
        const response = await generateQr({
            amount: Number(values.amount),
            purpose_message: String(values.purpose_message || '').trim(),
            expiry_time: Number(values.expiry_time),
        });

        if (!response) {
            message.error('Failed to generate dynamic QR. Please try again.');
            return;
        }

        setQrData(response);
        onSubmit();
    };

    const downloadGeneratedQrCode = async () => {
        const canvas = qrPreviewContainerRef.current?.querySelector<HTMLCanvasElement>('canvas');
        if (canvas) {
            const whiteBackgroundCanvas = createWhiteBackgroundCanvas(canvas.width, canvas.height);
            if (!whiteBackgroundCanvas) {
                message.error('Unable to prepare QR image for download.');
                return;
            }

            whiteBackgroundCanvas.context.drawImage(canvas, 0, 0);
            const pngBlob = await convertCanvasToPngBlob(whiteBackgroundCanvas.canvas);

            if (!pngBlob) {
                message.error('Unable to prepare QR image for download.');
                return;
            }

            saveAs(pngBlob, 'Dynamic_QR.png');
            return;
        }

        const svg = qrPreviewContainerRef.current?.querySelector<SVGSVGElement>('svg');
        if (svg) {
            const svgMarkup = new XMLSerializer().serializeToString(svg);
            const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
            const svgObjectUrl = URL.createObjectURL(svgBlob);

            try {
                const svgImage = await loadImage(svgObjectUrl);
                const svgWidth = Math.round(svgImage.naturalWidth || svg.clientWidth || 220);
                const svgHeight = Math.round(svgImage.naturalHeight || svg.clientHeight || 220);
                const whiteBackgroundCanvas = createWhiteBackgroundCanvas(svgWidth, svgHeight);

                if (!whiteBackgroundCanvas) {
                    message.error('Unable to prepare QR image for download.');
                    return;
                }

                whiteBackgroundCanvas.context.drawImage(svgImage, 0, 0, svgWidth, svgHeight);
                const pngBlob = await convertCanvasToPngBlob(whiteBackgroundCanvas.canvas);

                if (!pngBlob) {
                    message.error('Unable to prepare QR image for download.');
                    return;
                }

                saveAs(pngBlob, 'Dynamic_QR.png');
                return;
            } catch {
                message.error('Unable to prepare QR image for download.');
            } finally {
                URL.revokeObjectURL(svgObjectUrl);
            }
        }

        message.error('QR preview is not ready for download. Please try again.');
    };

    const downloadImageQr = async (imageUrl: string) => {
        try {
            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error('failed');
            }

            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) {
                throw new Error('invalid-type');
            }

            const imageObjectUrl = URL.createObjectURL(blob);
            try {
                const image = await loadImage(imageObjectUrl);
                const imageWidth = Math.round(image.naturalWidth || 220);
                const imageHeight = Math.round(image.naturalHeight || 220);
                const whiteBackgroundCanvas = createWhiteBackgroundCanvas(imageWidth, imageHeight);

                if (!whiteBackgroundCanvas) {
                    throw new Error('canvas-failed');
                }

                whiteBackgroundCanvas.context.drawImage(image, 0, 0, imageWidth, imageHeight);
                const imageBlob = await convertCanvasToPngBlob(whiteBackgroundCanvas.canvas);

                if (!imageBlob) {
                    throw new Error('blob-failed');
                }

                saveAs(imageBlob, 'Dynamic_QR.png');
            } finally {
                URL.revokeObjectURL(imageObjectUrl);
            }
        } catch {
            const fallbackLink = document.createElement('a');
            fallbackLink.href = imageUrl;
            fallbackLink.download = 'Dynamic_QR.png';
            fallbackLink.target = '_blank';
            fallbackLink.rel = 'noopener noreferrer';
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
        }
    };

    const handleDownloadQr = async () => {
        if (!qrData?.dynamic_qr_image || isCheckingImage) {
            return;
        }

        setIsDownloading(true);
        try {
            if (isQrImage) {
                await downloadImageQr(qrData.dynamic_qr_image);
                return;
            }

            await downloadGeneratedQrCode();
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            footer={null}
            width={600}
            style={{ maxWidth: '95vw' }}
            centered
            classNames={{ content: '!rounded-3xl !p-0', body: '!p-0' }}
            destroyOnClose
        >
            <Flex vertical gap={18} className="rounded-3xl px-6 py-5 sm:px-7 sm:py-6">
                {!qrData ? (
                    <GenerateQrCodeForm loading={loading} onCancel={handleClose} onSubmit={handleSubmit} />
                ) : (
                    <GenerateQrCodeSuccess
                        qrData={qrData}
                        isCheckingImage={isCheckingImage}
                        isQrImage={isQrImage}
                        isDownloading={isDownloading}
                        qrPreviewContainerRef={qrPreviewContainerRef}
                        onQrImageError={() => setIsQrImage(false)}
                        onCopyQrUrl={() => copyValue(qrData.dynamic_qr_image, 'QR URL')}
                        onDownloadQr={handleDownloadQr}
                        onOpenQr={() => window.open(qrData.dynamic_qr_image, '_blank', 'noopener,noreferrer')}
                        onCreateAnother={handleCreateAnother}
                    />
                )}
            </Flex>
        </Modal>
    );
};

export default GenerateQrCodeModal;
