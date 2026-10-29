import { useEffect, useState } from 'react';

import { DownloadOutlined } from '@ant-design/icons';
import { Button, Flex, Image } from 'antd';
import QRCodeLib from 'qrcode';

import TypographyText from '@components/atomic/typography/typographyText';

interface Props {
    value: string;
}

function QrCode({ value }: Props) {
    const [dataUrl, setDataUrl] = useState<string>('');

    useEffect(() => {
        if (!value) return;
        QRCodeLib.toDataURL(value, { width: 500, margin: 2, errorCorrectionLevel: 'L' }).then(
            setDataUrl
        );
    }, [value]);

    const handleDownload = () => {
        if (!dataUrl) return;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'signed-qr-code.png';
        a.click();
    };

    return (
        <Flex
            gap={16}
            className="bg-white border border-[#E4E4E7] rounded-2xl p-5 flex-col items-center sm:flex-row sm:items-center"
        >
            <Flex justify="center" align="center" className="w-40 h-40 flex-shrink-0">
                {dataUrl ? (
                    <Image
                        src={dataUrl}
                        alt="Signed QR Code"
                        className="w-full h-full"
                        preview={false}
                    />
                ) : (
                    <TypographyText className="text-xs text-[#9CA3AF]">QR Code</TypographyText>
                )}
            </Flex>
            <Flex vertical gap={6} className="items-center sm:items-start">
                <TypographyText className="text-sm font-semibold text-center sm:text-left">
                    Signed QR Code
                </TypographyText>
                <TypographyText className="text-[#6B7280] text-xs text-center sm:text-left">
                    Embed this QR code on the printed invoice as per GST mandate
                </TypographyText>
                <Button
                    icon={<DownloadOutlined />}
                    className="w-full sm:w-fit"
                    onClick={handleDownload}
                    disabled={!dataUrl}
                >
                    Download QR
                </Button>
            </Flex>
        </Flex>
    );
}

export default QrCode;
