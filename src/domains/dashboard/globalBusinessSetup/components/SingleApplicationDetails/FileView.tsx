import { Typography, Button } from 'antd';

import { useDownloadVendorFile } from '../../hooks/useDownloadVendorFile';
import { FileDetails } from '../../types';
import formatBytes from '../../utils/formatFileSize';

const { Text } = Typography;

type FileViewProps = {
    file: FileDetails | string | null | undefined;
    showDownload?: boolean;
    className?: string;
    linkClassName?: string;
};

export default function FileView({
    file,
    showDownload = true,
    className,
    linkClassName,
}: FileViewProps) {
    const downloadVendorFile = useDownloadVendorFile();

    if (!file) {
        return <Text type="secondary">-</Text>;
    }

    if (typeof file === 'string') {
        const truncatedName = file.length > 50 ? `${file.slice(0, 50)}…` : file;

        return (
            <div className={`flex items-center gap-2 text-sm ${className || ''}`}>
                <Text title={file} ellipsis className="truncate">
                    {truncatedName}
                </Text>
            </div>
        );
    }

    const { _id, name, size, url } = file;

    if (!name && !_id && !url) {
        return <Text type="secondary">File not found</Text>;
    }

    const displayName = name || 'File';
    const truncatedName =
        displayName.length > 50 ? `${displayName.substring(0, 50)}…` : displayName;

    const sizeText = size ? formatBytes(size) : null;

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center pe-2 pt-1 pb-2 ${className || ''}`}
            style={{ gap: 12 }}
        >
            <div className="flex flex-col min-w-0 flex-1 gap-1">
                <Text title={displayName} ellipsis className="truncate text-sm">
                    {truncatedName}
                </Text>

                {sizeText && (
                    <Text type="secondary" className="text-xs">
                        {sizeText}
                    </Text>
                )}
            </div>

            {showDownload && (_id || url) && (
                <div className="shrink-0 sm:w-[90px] flex sm:justify-end">
                    {_id ? (
                        <Button
                            danger
                            size="small"
                            onClick={() => downloadVendorFile(_id)}
                            className={linkClassName}
                        >
                            Download
                        </Button>
                    ) : (
                        <Button
                            danger
                            size="small"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={linkClassName}
                        >
                            Download
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
