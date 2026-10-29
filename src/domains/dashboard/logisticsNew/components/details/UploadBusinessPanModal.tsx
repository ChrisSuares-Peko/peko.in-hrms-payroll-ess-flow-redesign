import { useState } from 'react';

import { CloseCircleOutlined, InfoCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Flex, Modal, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';

import { useAppSelector } from '@src/hooks/store';
import { RootState } from '@store/store';

import { uploadBusinessPanApi } from '../../api';

const { Text } = Typography;
const { Dragger } = Upload;

interface Props {
    open: boolean;
    onCancel: () => void;
    onContinue: (panUrl: string | null) => void;
}

const UploadBusinessPanModal = ({ open, onCancel, onContinue }: Props) => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { id: userId, role: userType } = useAppSelector((state: RootState) => state.reducer.auth);

    const handleContinue = async () => {
        const file = fileList[0]?.originFileObj as File | undefined;
        if (file) {
            setIsUploading(true);
            const url = await uploadBusinessPanApi({ userType, userId, file });
            setIsUploading(false);
            onContinue(url);
        } else {
            onContinue(null);
        }
    };

    return (
        <Modal
            open={open}
            footer={null}
            closable={false}
            width={577}
            centered
            styles={{ content: { borderRadius: 30, padding: 36 } }}
        >
            <Flex vertical gap={30}>
                {/* Header */}
                <Flex justify="space-between" align="center">
                    <Text
                        style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: '#1e293b',
                            lineHeight: '28px',
                        }}
                    >
                        Upload Business PAN
                    </Text>
                    <button
                        type="button"
                        onClick={onCancel}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 0,
                        }}
                    >
                        <CloseCircleOutlined style={{ fontSize: 24, color: '#94a3b8' }} />
                    </button>
                </Flex>

                <Flex vertical gap={18}>
                    {/* Info box */}
                    <div
                        className="rounded-xl px-4 py-[14px] flex gap-[10px] items-start"
                        style={{ backgroundColor: '#ecfdf5' }}
                    >
                        <InfoCircleOutlined
                            style={{ fontSize: 22, color: '#43b75d', marginTop: 2, flexShrink: 0 }}
                        />
                        <div>
                            <Text
                                className="block font-semibold text-base"
                                style={{ color: '#43b75d', lineHeight: '24px' }}
                            >
                                Why we need this
                            </Text>
                            <Text
                                className="text-sm"
                                style={{ color: '#43b75d', lineHeight: '22px' }}
                            >
                                Business PAN is required for compliance checks on logistics
                                payments. This is a one-time collection — you won&apos;t need to
                                provide it again after verification.
                            </Text>
                        </div>
                    </div>

                    {/* Upload zone */}
                    <Dragger
                        fileList={fileList}
                        onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
                        accept=".pdf,.jpg,.jpeg,.png"
                        maxCount={1}
                        beforeUpload={() => false}
                        style={{
                            borderRadius: 18,
                            borderColor: '#cbd5e1',
                            backgroundColor: 'white',
                            padding: '20px 24px',
                        }}
                    >
                        <Flex vertical gap={8} align="center" justify="center">
                            <div
                                className="flex items-center justify-center rounded-2xl border border-[#e5e7eb]"
                                style={{ width: 64, height: 64, backgroundColor: '#f9fafb' }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M9 17.75H15M12 14.75V6.75M12 6.75L9.5 9.25M12 6.75L14.5 9.25"
                                        stroke="#6B7280"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M3 15.75C3 18.65 4.5 20.25 7.5 20.25H16.5C19.5 20.25 21 18.65 21 15.75"
                                        stroke="#6B7280"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <Text
                                className="font-semibold text-base text-center"
                                style={{ color: '#1f2937' }}
                            >
                                Drag &amp; drop your PAN here or click to browse from your device
                            </Text>
                            <Text className="text-sm" style={{ color: '#475569' }}>
                                PDF, JPG, PNG · max 5 MB
                            </Text>
                        </Flex>
                    </Dragger>
                </Flex>

                {/* Footer actions */}
                <Flex vertical gap={18} align="center">
                    <Flex gap={18} className="w-full">
                        <Button
                            block
                            style={{
                                height: 48,
                                borderColor: '#ff4f4f',
                                color: '#ff4f4f',
                                borderRadius: 8,
                                fontSize: 16,
                                fontWeight: 500,
                            }}
                            onClick={onCancel}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                        <Button
                            danger
                            type="primary"
                            block
                            loading={isUploading}
                            style={{ height: 48, borderRadius: 8, fontSize: 16, fontWeight: 500 }}
                            onClick={handleContinue}
                        >
                            Continue to Pay
                        </Button>
                    </Flex>
                    <Flex gap={6} align="center">
                        <LockOutlined style={{ fontSize: 16, color: '#475569' }} />
                        <Text style={{ fontSize: 12, color: '#475569', lineHeight: '18px' }}>
                            Your document is encrypted and stored securely
                        </Text>
                    </Flex>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default UploadBusinessPanModal;
