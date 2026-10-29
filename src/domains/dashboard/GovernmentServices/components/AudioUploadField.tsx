import { useState } from 'react';

import { CloseCircleOutlined, SoundOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Typography, Upload } from 'antd';
import { RcFile } from 'antd/es/upload';
import { getIn, useFormikContext } from 'formik';

import { useAppDispatch } from '@hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { normalizeDocumentFormat } from '../utils/application';

const { Text } = Typography;

interface AudioUploadFieldProps {
    name: string;
    label: string;
    isRequired?: boolean;
    subLabel?: string;
    maxDurationSeconds?: number;
    maxFileSizeKB?: number;
}

const AudioUploadField = ({
    name,
    label,
    isRequired = false,
    subLabel,
    maxDurationSeconds = 30,
    maxFileSizeKB = 5120,
}: AudioUploadFieldProps) => {
    const { setFieldValue, values, touched, errors } = useFormikContext<any>();
    const dispatch = useAppDispatch();
    const [fileName, setFileName] = useState<string>('');
    const [duration, setDuration] = useState<number | null>(null);

    const currentValue = getIn(values, name);
    const hasFile = !!currentValue;
    const isTouched = getIn(touched, name);
    const error = getIn(errors, name);
    const maxSizeMB = maxFileSizeKB / 1024;

    const beforeUpload = (file: RcFile): boolean => {
        const isMP3 = file.type === 'audio/mpeg' || file.type === 'audio/mp3';
        if (!isMP3) {
            dispatch(showToast({ description: 'Only MP3 files are accepted', variant: 'error' }));
            return false;
        }

        const maxSizeBytes = maxFileSizeKB * 1024;
        if (file.size > maxSizeBytes) {
            dispatch(showToast({
                description: `File size must not exceed ${maxSizeMB % 1 === 0 ? `${maxSizeMB} MB` : `${maxFileSizeKB} KB`}`,
                variant: 'error',
            }));
            return false;
        }

        const objectUrl = URL.createObjectURL(file);
        const audio = new Audio(objectUrl);
        audio.addEventListener('loadedmetadata', () => {
            URL.revokeObjectURL(objectUrl);
            if (audio.duration > maxDurationSeconds) {
                dispatch(showToast({
                    description: `Audio must not exceed ${maxDurationSeconds} seconds (uploaded: ${Math.round(audio.duration)}s)`,
                    variant: 'error',
                }));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    const format = normalizeDocumentFormat(file.type.split('/')[1], file.name);
                    setFieldValue(name, { base64, format, name: file.name });
                    setFileName(file.name);
                    setDuration(Math.round(audio.duration));
                }
            };
            reader.readAsDataURL(file);
        });
        audio.addEventListener('error', () => {
            URL.revokeObjectURL(objectUrl);
            dispatch(showToast({ description: 'Could not read audio file. Please try another file.', variant: 'error' }));
        });

        return false;
    };

    const handleRemove = () => {
        setFieldValue(name, null);
        setFileName('');
        setDuration(null);
    };

    return (
        <Form.Item
            label={<span>{label}</span>}
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
                        height: 48,
                        borderRadius: 12,
                        border: '1px dashed #FF4F4F',
                        padding: '0 12px',
                        backgroundColor: '#fff',
                    }}
                >
                    <SoundOutlined style={{ fontSize: 20, color: '#FF4F4F', flexShrink: 0 }} />
                    <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                        <Text className="text-sm font-medium text-zinc-800 truncate">
                            {fileName || currentValue?.name || 'Audio file'}
                        </Text>
                        {duration !== null && (
                            <Text className="text-xs" style={{ color: '#8C8C8C' }}>{duration}s</Text>
                        )}
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
                    accept=".mp3"
                    className="w-full [&_.ant-upload]:w-full"
                >
                    <Flex
                        align="center"
                        justify="space-between"
                        style={{
                            height: 48,
                            borderRadius: 12,
                            border: `1px dashed ${isTouched && error ? '#FF4F4F' : '#cbd5e1'}`,
                            padding: '0 12px 0 20px',
                            backgroundColor: '#fff',
                            cursor: 'pointer',
                            width: '100%',
                        }}
                    >
                        <Text className="text-sm font-medium text-neutral-400">Upload MP3</Text>
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

export default AudioUploadField;
