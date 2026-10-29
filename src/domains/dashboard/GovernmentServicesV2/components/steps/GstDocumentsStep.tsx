import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Spin, Typography, Upload } from 'antd';
import { RcFile } from 'antd/es/upload';
import { useFormikContext } from 'formik';

import { GstApplicationValues } from '../../types';
import { GST_DOCUMENT_TYPES, GstDocumentKey } from '../../utils/gstForm';

const { Title, Paragraph, Text } = Typography;

interface GstDocumentsStepProps {
    values: GstApplicationValues;
    isUploadingDocument: Record<GstDocumentKey, boolean>;
    onFileSelect: (key: GstDocumentKey, vendorDocType: string) => (file: RcFile) => boolean;
    onRemove: (key: GstDocumentKey) => void;
}

// Step 4 — Documents. Business/address-proof documents for GST Registration (service 79's own
// vendor checklist — NOT personal KYC per Authorized Person, see the comment on
// GstApplicationValues.documents in types/index.ts). Only one is realistically applicable per
// business, so every card is individually optional; the step-level requirement (at least one
// upload) is enforced by gstDocumentsSchema and surfaced as a single message below the cards —
// not gated by `touched`, for the same reason noted in gstDocumentsSchema: Next's blanket
// setTouched(EMPTY_GST_VALUES keys) only marks the top-level `documents` key, which is enough
// here since the error itself lives at that same top-level path.
const GstDocumentsStep = ({
    values,
    isUploadingDocument,
    onFileSelect,
    onRemove,
}: GstDocumentsStepProps) => {
    const { errors, touched } = useFormikContext<GstApplicationValues>();
    const documentsError =
        touched.documents && typeof errors.documents === 'string' ? errors.documents : undefined;

    return (
        <div className="flex flex-col gap-4 w-full">
            <div>
                <Title level={4} className="!mb-1">
                    Documents
                </Title>
                <Paragraph className="!mb-0 text-[#8C8C8C]">
                    Upload at least one supporting document for your business
                </Paragraph>
            </div>

            {GST_DOCUMENT_TYPES.map(({ key, vendorDocType, label }) => {
                const uploaded = values.documents[key];
                const isUploading = isUploadingDocument[key];
                return (
                    <Flex vertical gap={8} key={key}>
                        <Text strong className="!text-[14px]">
                            {label}
                        </Text>
                        <Upload
                            accept="image/jpeg,image/png,application/pdf"
                            multiple={false}
                            maxCount={1}
                            showUploadList={false}
                            beforeUpload={onFileSelect(key, vendorDocType)}
                        >
                            <div
                                className="p-6 rounded-2xl border border-dashed cursor-pointer w-full text-left transition-colors hover:!border-[#ff4f4f] hover:bg-[#fff8f8]"
                                style={{ borderColor: '#e4e7ec', backgroundColor: '#fafafa' }}
                            >
                                <Flex gap={16} align="center">
                                    <div className="flex-shrink-0 bg-[#fff2f2] rounded-full w-10 h-10 flex items-center justify-center text-[#ff4f4f]">
                                        <UploadOutlined style={{ fontSize: 18 }} />
                                    </div>
                                    <Text className="!text-[14px] !text-[#1e293b]">
                                        Click to upload {label.toLowerCase()} (JPG, PNG or PDF)
                                    </Text>
                                </Flex>
                            </div>
                        </Upload>
                        {isUploading && (
                            <Flex align="center" gap={8} className="px-1">
                                <Spin size="small" />
                                <Text type="secondary" className="text-xs">
                                    Uploading…
                                </Text>
                            </Flex>
                        )}
                        {!isUploading && uploaded?.docUrl && (
                            <Flex justify="space-between" align="center" className="px-1">
                                <Text className="text-blue-500 line-clamp-1">
                                    {uploaded.fileName}
                                </Text>
                                <Button
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    danger
                                    type="text"
                                    onClick={() => onRemove(key)}
                                />
                            </Flex>
                        )}
                    </Flex>
                );
            })}

            {documentsError && (
                <Text type="danger" className="!text-xs">
                    {documentsError}
                </Text>
            )}
        </div>
    );
};

export default GstDocumentsStep;
