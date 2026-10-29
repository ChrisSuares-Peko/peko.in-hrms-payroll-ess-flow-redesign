import { RefObject } from 'react';

import { PaperClipOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import inboxIcon from '../../assets/inbox.svg';
import { linkDocumentCopy } from '../../utils/linkDocumentData';
import { TransactionDocumentRef } from '../../utils/transactionsData';

const { Text } = Typography;

interface LinkDocumentUploadTabProps {
    inputRef: RefObject<HTMLInputElement>;
    uploadedFile: File | null;
    attachedDocuments: TransactionDocumentRef[];
    handleFiles: (files: FileList | null) => void;
}

const LinkDocumentUploadTab = ({
    inputRef,
    uploadedFile,
    attachedDocuments,
    handleFiles,
}: LinkDocumentUploadTabProps) => (
    <Flex vertical gap={8}>
        <Flex
            vertical
            align="center"
            justify="center"
            gap={10}
            role="button"
            tabIndex={0}
            aria-label="Upload document from your device"
            onClick={() => inputRef.current?.click()}
            onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    inputRef.current?.click();
                }
            }}
            onDragOver={event => event.preventDefault()}
            onDrop={event => {
                event.preventDefault();
                handleFiles(event.dataTransfer.files);
            }}
            className="w-full cursor-pointer rounded-[20px] border border-dashed border-slate-300 bg-neutral-50 px-4 py-14 text-center transition-colors hover:border-danger"
        >
            <img src={inboxIcon} alt="" aria-hidden className="size-12" />
            <Flex vertical gap={2} align="center">
                <Text className="text-base text-[rgba(0,0,0,0.85)]">
                    {linkDocumentCopy.uploadTitle}
                </Text>
                <Text className="text-xs text-slate-400">{linkDocumentCopy.uploadHint}</Text>
            </Flex>
            <input
                ref={inputRef}
                type="file"
                accept={linkDocumentCopy.uploadAccept}
                className="hidden"
                onChange={event => handleFiles(event.target.files)}
            />
        </Flex>
        {uploadedFile && (
            <Text className="break-words text-sm text-bodyText">
                Selected: <span className="font-medium">{uploadedFile.name}</span>
            </Text>
        )}

        {attachedDocuments.length > 0 && (
            <Flex vertical gap={6} className="pt-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Attached documents
                </Text>
                {attachedDocuments.map(doc => (
                    <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 break-all text-sm font-medium text-bodyText hover:text-ink"
                    >
                        <PaperClipOutlined className="!text-xs" />
                        {doc.name}
                    </a>
                ))}
            </Flex>
        )}
    </Flex>
);

export default LinkDocumentUploadTab;
