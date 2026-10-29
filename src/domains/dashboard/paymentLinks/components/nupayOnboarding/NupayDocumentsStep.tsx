import { ArrowRightOutlined, CheckCircleFilled, LoadingOutlined, PaperClipOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Input, Row, Typography, Upload } from 'antd';

import { getEntityOnboardingFields, OnboardingField } from './entityDocuments';
import { NupayDocRef } from '../../api';

interface Props {
    entityType: string;
    docRefs: Record<string, NupayDocRef>;
    uploading: Record<string, boolean>;
    usedBytes: number;
    maxTotalMb: number;
    textValues: Record<string, string>;
    onFile: (name: string, file: File | null) => void;
    onText: (name: string, value: string) => void;
    onBack: () => void;
    onSubmit: () => void;
    submitting?: boolean;
}

const labelNode = (field: OnboardingField) => (
    <Flex vertical gap={2} className="mb-1">
        <Typography.Text className="text-[13px] font-medium text-[#344054]">
            {field.label} {field.required && <span className="text-[#FF4D4F]">*</span>}
        </Typography.Text>
        {field.hint && (
            <Typography.Text className="text-[11px] leading-4 text-[#98A2B3]">{field.hint}</Typography.Text>
        )}
    </Flex>
);

// Step 3 — Documents Upload. Fields render dynamically per selected entity type.
const NupayDocumentsStep = ({
    entityType,
    docRefs,
    uploading,
    usedBytes,
    maxTotalMb,
    textValues,
    onFile,
    onText,
    onBack,
    onSubmit,
    submitting,
}: Props) => {
    const fields = getEntityOnboardingFields(entityType);
    const usedMb = usedBytes / (1024 * 1024);
    const overLimit = usedMb > maxTotalMb;

    return (
        <Flex vertical gap={20} className="mt-2">
            <Flex
                justify="space-between"
                align="center"
                className="rounded-lg bg-[#F8FAFC] px-3 py-2"
            >
                <Typography.Text className="text-[12px] text-[#667085]">Total documents size</Typography.Text>
                <Typography.Text
                    className={`text-[12px] font-medium ${overLimit ? '!text-[#FF4D4F]' : 'text-[#344054]'}`}
                >
                    {usedMb.toFixed(1)} MB / {maxTotalMb} MB
                </Typography.Text>
            </Flex>
            <Row gutter={[24, 18]}>
                {fields.map(field => (
                    <Col xs={24} lg={12} key={field.name}>
                        {labelNode(field)}
                        {field.type === 'text' ? (
                            <Input
                                placeholder={`Enter ${field.label}`}
                                value={textValues[field.name] || ''}
                                onChange={e => onText(field.name, e.target.value)}
                                className="!h-11 !rounded-lg"
                            />
                        ) : (
                            <Flex align="center" gap={10} className="rounded-lg border border-[#D0D5DD] px-3 py-1.5">
                                <Flex align="center" gap={6} className="min-w-0 flex-1">
                                    {uploading[field.name] ? (
                                        <LoadingOutlined style={{ color: '#FF4D4F', fontSize: 13 }} />
                                    ) : (
                                        docRefs[field.name] && (
                                            <CheckCircleFilled style={{ color: '#12B76A', fontSize: 13 }} />
                                        )
                                    )}
                                    <Typography.Text className="truncate text-[13px] text-[#667085]">
                                        {uploading[field.name]
                                            ? 'Uploading…'
                                            : docRefs[field.name]?.filename || 'Upload File'}
                                    </Typography.Text>
                                </Flex>
                                <Upload
                                    maxCount={1}
                                    showUploadList={false}
                                    beforeUpload={file => {
                                        onFile(field.name, file as File);
                                        return false;
                                    }}
                                >
                                    <Button
                                        size="small"
                                        loading={uploading[field.name]}
                                        icon={<PaperClipOutlined />}
                                    >
                                        Browse File
                                    </Button>
                                </Upload>
                            </Flex>
                        )}
                    </Col>
                ))}
            </Row>

            <Flex justify="end" gap={12} className="mt-2">
                <Button onClick={onBack} className="!h-10 !border-[#FF4D4F] !px-6 !text-[#FF4D4F]">
                    Back
                </Button>
                <Button
                    type="primary"
                    loading={submitting}
                    onClick={onSubmit}
                    className="!h-10 !border-0 !bg-[#FF4D4F] !px-6 font-semibold"
                >
                    Activate Now <ArrowRightOutlined />
                </Button>
            </Flex>
        </Flex>
    );
};

export default NupayDocumentsStep;
