import { ReactNode } from 'react';

import { DownloadOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';

const { Text } = Typography;

interface DocumentPreviewCardProps {
    title: string;
    children: ReactNode;
    // Generates the draft on demand (signed URL) — omitted where no API exists yet.
    onDownload?: () => void;
    downloading?: boolean;
}

// Read-only document preview with a Download action (Figma 1848:30491).
const DocumentPreviewCard = ({ title, children, onDownload, downloading }: DocumentPreviewCardProps) => (
    <div className="border border-[#e4e4e7] rounded-[16px] overflow-hidden">
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
                <FilePdfOutlined className="text-[#ff4f4f]" style={{ fontSize: 18 }} />
                <Text className="!text-[15px] !font-semibold !text-[#1e293b]">{title}</Text>
            </div>
            <Button
                type="text"
                icon={<DownloadOutlined />}
                loading={downloading}
                onClick={onDownload}
                className="!text-[13px] !text-[#ff4f4f]"
            >
                Download
            </Button>
        </div>
        <div className="h-px w-full bg-[#ebebeb]" />
        <div className="p-4 flex flex-col gap-2 text-[13px] text-[#475569] leading-[20px]">
            {children}
        </div>
    </div>
);

export default DocumentPreviewCard;
