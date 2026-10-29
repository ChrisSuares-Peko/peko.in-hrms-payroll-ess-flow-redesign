import { useRef, useState } from 'react';

import { Flex, Typography } from 'antd';

import StepFooter from './StepFooter';
import inboxIcon from '../../assets/inbox.svg';
import { supportedBanks, uploadModal } from '../../utils/uploadData';

const { Text } = Typography;

interface UploadStepProps {
    onContinue: (file?: File) => void;
    onCancel: () => void;
}

const isAllowedFile = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const withinSize = file.size <= uploadModal.maxSizeMb * 1024 * 1024;
    return uploadModal.allowedExtensions.includes(extension) && withinSize;
};

const UploadStep = ({ onContinue, onCancel }: UploadStepProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const openPicker = () => inputRef.current?.click();

    const handleFiles = (files: FileList | null) => {
        const file = files?.[0];
        if (!file) return;
        if (!isAllowedFile(file)) {
            setError(uploadModal.invalidFileMessage);
            return;
        }
        setError(null);
        onContinue(file);
    };

    return (
        <Flex vertical gap={16} className="w-full">
            <Flex vertical gap={10} className="w-full">
                <Flex
                    vertical
                    align="center"
                    justify="center"
                    gap={10}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload bank statement file"
                    onClick={openPicker}
                    onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openPicker();
                        }
                    }}
                    onDragOver={event => event.preventDefault()}
                    onDrop={event => {
                        event.preventDefault();
                        handleFiles(event.dataTransfer.files);
                    }}
                    className={`w-full cursor-pointer rounded-[20px] border border-dashed bg-neutral-50 px-4 py-14 text-center transition-colors hover:border-danger ${
                        error ? 'border-danger-border' : 'border-slate-300'
                    }`}
                >
                    <img src={inboxIcon} alt="" aria-hidden className="size-12" />
                    <Flex vertical gap={2} align="center">
                        <Text className="text-base text-[rgba(0,0,0,0.85)]">
                            {uploadModal.dropTitle}
                        </Text>
                        <Text className="text-xs font-medium text-danger">
                            {uploadModal.orPrefix}{' '}
                            <span className="underline">{uploadModal.browse}</span>
                        </Text>
                    </Flex>
                    <input
                        ref={inputRef}
                        type="file"
                        accept={uploadModal.accept}
                        className="hidden"
                        onChange={event => handleFiles(event.target.files)}
                    />
                </Flex>
                {error ? (
                    <Text className="text-xs text-danger">{error}</Text>
                ) : (
                    <Text className="text-xs text-slate-400">{uploadModal.formatsHint}</Text>
                )}
            </Flex>

            <Text className="w-full text-center text-base text-slate-500">
                {uploadModal.worksWithLabel}
            </Text>

            <Flex gap={12} className="w-full flex-wrap">
                {supportedBanks.map(bank => (
                    <Flex
                        key={bank}
                        align="center"
                        justify="center"
                        className="min-w-[4.5rem] flex-1 basis-0 rounded-lg border border-borderStrong px-2.5 py-2"
                    >
                        <Text className="whitespace-nowrap text-sm font-medium text-slate-500">
                            {bank}
                        </Text>
                    </Flex>
                ))}
            </Flex>

            <Text className="w-full text-center text-base text-slate-500">
                {uploadModal.securityNote}
            </Text>

            <StepFooter
                secondaryLabel={uploadModal.cancelLabel}
                onSecondary={onCancel}
                primaryLabel={uploadModal.continueLabel}
                onPrimary={() => setError('Please choose a statement file.')}
            />
        </Flex>
    );
};

export default UploadStep;
