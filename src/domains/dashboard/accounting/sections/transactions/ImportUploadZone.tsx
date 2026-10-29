import type { RefObject } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { importTransactionsModal } from '../../utils/transactionsData';

const { Text } = Typography;

interface ImportUploadZoneProps {
    fileInputRef: RefObject<HTMLInputElement>;
    fileName: string | null;
    onFiles: (files: FileList | null) => void;
}

const ImportUploadZone = ({ fileInputRef, fileName, onFiles }: ImportUploadZoneProps) => (
    <Flex vertical gap={8} className="w-full">
        <Flex
            vertical
            align="center"
            justify="center"
            gap={10}
            role="button"
            tabIndex={0}
            aria-label="Upload file to import"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    fileInputRef.current?.click();
                }
            }}
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
                event.preventDefault();
                onFiles(event.dataTransfer.files);
            }}
            className="min-h-[212px] w-full cursor-pointer rounded-[20px] border border-dashed border-slate-300 bg-surfaceGray px-4 py-6 text-center transition-colors hover:border-danger"
        >
            <InboxOutlined className="text-4xl text-danger" />
            <Text className="text-sm font-medium text-ink">
                {importTransactionsModal.uploadCta}
            </Text>
            <Text className="text-xs text-slate-400">{importTransactionsModal.uploadHint}</Text>
            <input
                ref={fileInputRef}
                type="file"
                accept={importTransactionsModal.uploadAccept}
                className="hidden"
                onChange={event => onFiles(event.target.files)}
            />
        </Flex>
        {fileName && (
            <Text className="break-words text-sm text-bodyText">
                Selected: <span className="font-medium">{fileName}</span>
            </Text>
        )}
    </Flex>
);

export default ImportUploadZone;
