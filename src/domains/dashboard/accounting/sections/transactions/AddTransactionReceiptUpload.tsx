import type { RefObject } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { addTransactionModal } from '../../utils/transactionsData';

const { Text } = Typography;

interface AddTransactionReceiptUploadProps {
    fileInputRef: RefObject<HTMLInputElement>;
    receiptName: string | null;
    handleFiles: (files: FileList | null) => void;
}

const AddTransactionReceiptUpload = ({
    fileInputRef,
    receiptName,
    handleFiles,
}: AddTransactionReceiptUploadProps) => (
    <Flex vertical gap={8}>
        <Text className="text-base font-semibold text-ink">{addTransactionModal.receiptLabel}</Text>
        <Flex
            vertical
            align="center"
            justify="center"
            gap={8}
            role="button"
            tabIndex={0}
            aria-label="Upload receipt"
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
                handleFiles(event.dataTransfer.files);
            }}
            className="w-full cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-surfaceGray px-4 py-10 text-center transition-colors hover:border-danger"
        >
            <InboxOutlined className="text-3xl text-danger" />
            <Text className="text-base font-medium text-ink">{addTransactionModal.uploadCta}</Text>
            <Text className="text-xs text-slate-400">{addTransactionModal.uploadHint}</Text>
            <input
                ref={fileInputRef}
                type="file"
                accept={addTransactionModal.uploadAccept}
                className="hidden"
                onChange={event => handleFiles(event.target.files)}
            />
        </Flex>
        {receiptName && (
            <Text className="break-words text-sm text-bodyText">
                Selected: <span className="font-medium">{receiptName}</span>
            </Text>
        )}
    </Flex>
);

export default AddTransactionReceiptUpload;
