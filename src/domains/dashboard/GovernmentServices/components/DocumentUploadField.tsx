import { useState } from 'react';

import { CloseCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Progress, Typography, Upload } from 'antd';
import { RcFile } from 'antd/es/upload';
import { getIn, useFormikContext } from 'formik';
import { ReactSVG } from 'react-svg';

import PDFIcon from '@domains/dashboard/GovernmentServices/assets/icons/pdf.svg';
import { useAppDispatch } from '@hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { normalizeDocumentFormat } from '../utils/application';

const { Text } = Typography;

const MIME_TO_LABEL: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPG',
    'image/jpg': 'JPG',
    'image/png': 'PNG',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'video/mp4': 'MP4',
    'audio/mpeg': 'MP3',
    'audio/mp3': 'MP3',
};

const MIME_TO_EXT: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg,.jpeg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'video/mp4': '.mp4',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
};

const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/mp3'];

const DEFAULT_ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const DEFAULT_MAX_SIZE_MB = 5;

interface DocumentUploadFieldProps {
    name: string;
    label: string;
    size?: 'small' | 'normal';
    isRequired?: boolean;
    subLabel?: string;
    allowedFileTypes?: string[];
    maxFileSize?: number; // in KB
}

const DocumentUploadField = ({
    name,
    label,
    size = 'normal',
    isRequired = false,
    subLabel,
    allowedFileTypes = DEFAULT_ALLOWED_TYPES,
    maxFileSize,
}: DocumentUploadFieldProps) => {
    const maxSizeMB = maxFileSize !== undefined ? maxFileSize / 1024 : DEFAULT_MAX_SIZE_MB;
    const { setFieldValue, values, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const [fileName, setFileName] = useState<string>('');
    const [uploadedMimeType, setUploadedMimeType] = useState<string>('');

    const currentValue = getIn(values, name);
    const hasFile = !!currentValue;
    const isTouched = getIn(touched, name);
    const error = getIn(errors, name);
    const fieldHeight = size === 'small' ? 40 : 48;

    const beforeUpload = (file: RcFile): boolean => {
        if (!allowedFileTypes.includes(file.type)) {
            const formatLabels = [...new Set(allowedFileTypes.map(t => MIME_TO_LABEL[t] ?? t.split('/')[1].toUpperCase()))];
            dispatch(
                showToast({
                    description: `Valid accepted formats are: ${formatLabels.join(', ')}`,
                    variant: 'error',
                })
            );
            return false;
        }
        if (file.size / 1024 / 1024 > maxSizeMB) {
            dispatch(
                showToast({
                    description: `File size must not exceed ${maxSizeMB % 1 === 0 ? `${maxSizeMB} MB` : `${maxFileSize} KB`}`,
                    variant: 'error',
                })
            );
            return false;
        }

        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                const base64 = reader.result.split(',')[1];
                const format = normalizeDocumentFormat(file.type.split('/')[1], file.name);
                setFieldValue(name, { base64, format, name: file.name });
                setFileName(file.name);
                setUploadedMimeType(file.type);
            }
        };
        reader.readAsDataURL(file);
        return false;
    };

    const handleRemove = () => {
        setFieldValue(name, null);
        setFileName('');
    };

    return (
        <Form.Item
            label={<span title="">{label}</span>}
            colon={false}
            required={isRequired}
            validateStatus={isTouched && error ? 'error' : ''}
            help={isTouched && error ? error : undefined}
        >
            {subLabel ? (
                <Typography.Text type="secondary" className="whitespace-nowrap text-xs">
                    {subLabel}
                </Typography.Text>
            ) : (
                <div className="text-xs" style={{ visibility: 'hidden' }}>&nbsp;</div>
            )}
            {hasFile ? (
                <Flex
                    align="center"
                    gap={8}
                    style={{
                        height: fieldHeight,
                        borderRadius: 12,
                        border: '1px dashed #FF4F4F',
                        padding: '0 12px',
                        backgroundColor: '#fff',
                    }}
                >
                    {AUDIO_MIME_TYPES.includes(uploadedMimeType) ? (
                        <SoundOutlined style={{ fontSize: 20, color: '#FF4F4F' }} />
                    ) : (
                        <ReactSVG src={PDFIcon} />
                    )}
                    <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                        <Text className="text-sm font-medium text-zinc-800 truncate">
                            {fileName || currentValue?.name || 'Document'}
                        </Text>
                        <Progress
                            percent={100}
                            size="small"
                            showInfo={false}
                            strokeColor="#FF4F4F"
                            trailColor="#cbd5e1"
                            style={{ marginBottom: 0 }}
                        />
                    </Flex>
                    <CloseCircleOutlined
                        onClick={handleRemove}
                        style={{ fontSize: 16, color: '#52525b', cursor: 'pointer' }}
                    />
                </Flex>
            ) : (
                <Upload
                    beforeUpload={beforeUpload}
                    showUploadList={false}
                    accept={[...new Set(allowedFileTypes.flatMap(t => (MIME_TO_EXT[t] ?? `.${t.split('/')[1]}`).split(',')))].join(',')}
                    className="w-full [&_.ant-upload]:w-full"
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        style={{
                            height: fieldHeight,
                            borderRadius: 12,
                            border: `1px dashed ${isTouched && error ? '#FF4F4F' : '#cbd5e1'}`,
                            padding: '0 12px 0 20px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            width: '100%',
                        }}
                    >
                        <Text className="text-sm font-medium text-neutral-400">Upload File</Text>
                        <Button
                            size="small"
                            className="!rounded-lg !border-slate-300 !text-zinc-600 !font-medium !text-sm"
                        >
                            Browse File
                        </Button>
                    </Flex>
                </Upload>
            )}
        </Form.Item>
    );
};

export default DocumentUploadField;
