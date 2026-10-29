import React, { ReactNode, useRef } from 'react';

import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Form, Typography, Card, Flex, Tooltip } from 'antd';
import { useField, useFormikContext } from 'formik';
import { useDispatch } from 'react-redux';

import { showToast } from '@src/slices/apiSlice';

const { Text } = Typography;

interface Props {
    name: string;
    label?: string | ReactNode;
    required?: boolean;
    accept?: string;
    maxSize?: number;
    description?: string;
    placeholder?: string;
    disabled?: boolean;
    // Constraint hint (allowed formats / size cap) shown as an info tooltip.
    hint?: string;
}

export default function CustomFileUpload({
    name,
    label,
    required = false,
    accept,
    maxSize,
    description,
    placeholder,
    disabled = false, // 👈 default
    hint,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { setFieldValue } = useFormikContext<any>();
    const [field, meta] = useField(name);
    const dispatch = useDispatch();
    const rawValue = field.value as unknown;
    const fileDescriptor: { name: string; isUploaded: boolean } | null = (() => {
        if (!rawValue) return null;
        if (rawValue instanceof File) {
            return { name: rawValue.name, isUploaded: false };
        }
        if (typeof rawValue === 'string') {
            return { name: rawValue.split('/').pop() || rawValue, isUploaded: true };
        }
        if (typeof rawValue === 'object') {
            const o = rawValue as { name?: string; url?: string; _id?: string };
            if (o.name) return { name: o.name, isUploaded: Boolean(o._id || o.url) };
            if (o.url) return { name: o.url.split('/').pop() || 'Uploaded', isUploaded: true };
        }
        return null;
    })();
    const hasFile = fileDescriptor !== null;
    const displayName = fileDescriptor?.name || placeholder || 'Upload File';

    const chooseFile = () => {
        if (disabled) return;
        inputRef.current?.click();
    };

    const isFileTypeAllowed = (f: File) => {
        if (!accept) return true;

        const allowedExt = accept.split(',').map(ext => ext.trim().replace('.', '').toLowerCase());

        const fileExt = f.name.split('.').pop()?.toLowerCase();

        return fileExt ? allowedExt.includes(fileExt) : false;
    };

    const formatAllowedTypes = (): string => {
        if (!accept) return 'a supported';
        const parts = accept
            .split(',')
            .map(s => s.trim().replace(/^\./, '').toUpperCase())
            .filter(Boolean);
        if (parts.length === 0) return 'a supported';
        if (parts.length === 1) return parts[0];
        return `${parts.slice(0, -1).join(', ')}, or ${parts[parts.length - 1]}`;
    };

    const isLtMaxFileSizeKB = (f: File) => {
        if (!maxSize) return true;
        return f.size / 1024 <= maxSize * 1024;
    };

    const resetInput = () => {
        setFieldValue(name, null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;

        if (!isFileTypeAllowed(f)) {
            dispatch(
                showToast({
                    description: `Please upload ${formatAllowedTypes()} file.`,
                    variant: 'error',
                })
            );
            resetInput();
            return;
        }

        if (!isLtMaxFileSizeKB(f)) {
            dispatch(
                showToast({
                    description: `File size must be smaller than ${maxSize} MB`,
                    variant: 'error',
                })
            );
            resetInput();
            return;
        }

        setFieldValue(name, f);
    };

    return (
        <Form.Item
            validateStatus={meta.touched && meta.error ? 'error' : ''}
            help={(meta.touched && meta.error) || description}
            name={name}
            label={label}
            required={required}
            style={{ width: '100%' }}
        >
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                disabled={disabled}
                style={{ display: 'none' }}
                onChange={handleChange}
            />

            <Card
                className={`rounded-[10px] border border-dashed ${
                    meta.error ? 'border-red-500' : 'border-gray-300'
                }`}
                // onClick={chooseFile}
                styles={{ body: { padding: '12px 16px' } }}
            >
                {/*
                  Responsive: filename on its own row on mobile (gets the
                  full card width) and side-by-side with the buttons on
                  ≥sm. `vertical` sets flex-direction: column inline for
                  mobile; `sm:!flex-row` uses Tailwind's important
                  modifier to beat AntD's inline column on ≥sm screens.
                  Tooltip surfaces the full filename when ellipsized.
                */}
                <Flex
                    gap={8}
                    align="center"
                    wrap="wrap"
                    style={{ justifyContent: 'space-between' }}
                >
                    <Tooltip title={hasFile ? displayName : ''}>
                        <Text
                            className="text-black/70 truncate block"
                            style={{ flex: 1, minWidth: 80 }}
                        >
                            {displayName}
                        </Text>
                    </Tooltip>

                    <Flex gap={8} align="center" className="shrink-0">
                        {hint && (
                            <Tooltip title={<span className="whitespace-pre-line">{hint}</span>}>
                                <InfoCircleOutlined className="text-gray-400" />
                            </Tooltip>
                        )}
                        <Button
                            type="default"
                            size="small"
                            disabled={disabled}
                            onClick={e => {
                                e.stopPropagation();
                                chooseFile();
                            }}
                            className="px-4 rounded-md"
                        >
                            {hasFile ? 'Change File' : 'Browse File'}
                        </Button>

                        {hasFile && (
                            <Button
                                danger
                                size="small"
                                disabled={disabled}
                                onClick={e => {
                                    e.stopPropagation();
                                    resetInput();
                                }}
                            >
                                Remove
                            </Button>
                        )}
                    </Flex>
                </Flex>
            </Card>
        </Form.Item>
    );
}
