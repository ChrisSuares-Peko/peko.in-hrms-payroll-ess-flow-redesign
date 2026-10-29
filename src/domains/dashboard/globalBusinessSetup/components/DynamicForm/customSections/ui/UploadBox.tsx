import { useId } from 'react';

import { DeleteOutlined, FileOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

type FileDetails = { name: string; size?: number };

type UploadBoxProps = {
    accept?: string;
    // a freshly selected File, a saved FileDetails (from the API), or a URL/name string
    value?: unknown;
    onChange?: (file: File | undefined) => void;
    error?: string;
};

const isFileDetails = (value: unknown): value is FileDetails =>
    !!value && typeof value === 'object' && 'name' in value && 'size' in value;

const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileName = (value: unknown): string => {
    if (value instanceof File) return value.name;
    if (typeof value === 'string') return value.split('/').pop() || value;
    if (isFileDetails(value)) return value.name;

    return '';
};

const fileSize = (value: unknown): string => {
    if (value instanceof File) return formatSize(value.size);
    if (isFileDetails(value) && typeof value.size === 'number') return formatSize(value.size);

    return '';
};

export default function UploadBox({
    accept = '.pdf,.doc,.docx',
    value,
    onChange,
    error,
}: UploadBoxProps) {
    const inputId = useId();

    if (!value) {
        return (
            <div className="w-full">
                <label
                    htmlFor={inputId}
                    className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center ${
                        error
                            ? 'border-red-400 bg-red-50'
                            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                    }`}
                >
                    <InboxOutlined style={{ color: '#FF4F4F', fontSize: 28 }} />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">PDF or Word document</p>
                    {/* sr-only ensures the native input is fully hidden while remaining accessible */}
                    <input
                        id={inputId}
                        accept={accept}
                        className="sr-only"
                        type="file"
                        onChange={e => onChange?.(e.target.files?.[0])}
                    />
                </label>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }

    const name = fileName(value);
    const size = fileSize(value);

    return (
        <div className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 p-3">
            <div className="flex min-w-0 items-center gap-2">
                <FileOutlined className="shrink-0 text-gray-500 text-xl" />
                <Typography.Text className="line-clamp-1 text-sm font-medium text-gray-700">
                    {name}
                </Typography.Text>
                {size && (
                    <Typography.Text type="secondary" className="shrink-0 text-xs">
                        {size}
                    </Typography.Text>
                )}
            </div>
            <Button
                danger
                size="small"
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => onChange?.(undefined)}
            >
                Remove
            </Button>
        </div>
    );
}
