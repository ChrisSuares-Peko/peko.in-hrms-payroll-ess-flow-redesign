import { useEffect, useState } from 'react';

import { Flex, Modal, Progress, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    confirmStatementImport,
    discardStatementImport,
    parseStatement,
    ParsedStatementResult,
} from '../../api/transactions';
import { onboardingSteps } from '../../utils/data';
import { getCurrentMonthYear } from '../../utils/greeting';
import { uploadModal } from '../../utils/uploadData';
import OnboardingSteps from '../OnboardingSteps';
import CategorizeStep from './CategorizeStep';
import ImportSuccessStep from './ImportSuccessStep';
import PasswordPrompt from './PasswordPrompt';
import UploadStep from './UploadStep';

const { Title, Text } = Typography;

interface UploadStatementModalProps {
    open: boolean;
    onClose: () => void;
    onImported?: () => void;
}

const readAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });

const UploadStatementModal = ({ open, onClose, onImported }: UploadStatementModalProps) => {
    const dispatch = useAppDispatch();
    const user = useAppSelector(state => state.reducer.user.user);
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [parsed, setParsed] = useState<ParsedStatementResult | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    const [lockedFile, setLockedFile] = useState<File | null>(null);
    const [passwordError, setPasswordError] = useState(false);
    const [progress, setProgress] = useState(0);

    // Fake a ~4s progress ramp while parsing so the wait feels responsive. It climbs to 95%
    // over roughly four seconds and holds there until the real request resolves.
    useEffect(() => {
        if (!loading) {
            setProgress(0);
            return undefined;
        }
        setProgress(8);
        const id = setInterval(() => {
            setProgress(prev => (prev >= 95 ? 95 : prev + 87 / 40));
        }, 100);
        return () => clearInterval(id);
    }, [loading]);

    const companyName = user?.companyName?.trim();
    const subtitle = [companyName, getCurrentMonthYear()].filter(Boolean).join(' · ');

    const reset = () => {
        setStep(1);
        setParsed(null);
        setConfirmed(false);
        setLockedFile(null);
        setPasswordError(false);
        setLoading(false);
    };

    // Cancelling before confirming discards the draft import so no orphan rows remain.
    const handleClose = () => {
        if (parsed && !confirmed) {
            discardStatementImport({ userId, userType, batchId: parsed.batchId });
        }
        onClose();
    };

    const handleUpload = async (file?: File, password?: string) => {
        // UploadStep validates that a file was chosen inline before ever calling onContinue.
        if (!file) return;
        const format = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!uploadModal.allowedExtensions.includes(format)) {
            dispatch(showToast({ variant: 'error', description: uploadModal.invalidFileMessage }));
            return;
        }

        setLoading(true);
        try {
            const fileBase64 = await readAsDataUrl(file);
            // Keep the progress bar visible for ~4s even if the parse resolves sooner.
            const [result] = await Promise.all([
                parseStatement({
                    userId,
                    userType,
                    fileBase64,
                    fileName: file.name,
                    format,
                    mimeType: file.type || uploadModal.mimeTypesByExtension[format],
                    password,
                }),
                new Promise(resolve => {
                    setTimeout(resolve, 4000);
                }),
            ]);
            if (!result) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Could not read this statement. Please try another file.',
                    })
                );
                return;
            }
            // Password-protected PDF — prompt (or re-prompt on wrong password).
            if ('locked' in result) {
                setLockedFile(file);
                setPasswordError(Boolean(result.invalidPassword));
                return;
            }
            setLockedFile(null);
            setPasswordError(false);
            setParsed(result);
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!parsed) return;
        setLoading(true);
        try {
            const ok = await confirmStatementImport({ userId, userType, batchId: parsed.batchId });
            if (!ok) {
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Could not confirm the import. Please try again.',
                    })
                );
                return;
            }
            setConfirmed(true);
            setStep(3);
            onImported?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            afterClose={reset}
            footer={null}
            closable={false}
            centered
            width="min(800px, 92vw)"
            styles={{
                content: { borderRadius: 28, padding: 0, overflow: 'hidden' },
                body: { padding: 0 },
            }}
        >
            <Flex
                vertical
                gap={24}
                className="max-h-[90vh] overflow-y-auto px-6 py-8 [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5 sm:px-9 sm:py-11"
            >
                <Flex vertical gap={4}>
                    <Title
                        level={3}
                        className="!mb-0 !text-xl !font-semibold !text-ink md:!text-xl"
                    >
                        {uploadModal.title}
                    </Title>
                    <Text className="text-sm text-slate-500 md:text-base">{subtitle}</Text>
                </Flex>

                <OnboardingSteps
                    steps={onboardingSteps}
                    currentStep={step}
                    widthClassName=""
                    dividerOrientation="horizontal"
                />

                {loading ? (
                    <Flex
                        vertical
                        align="center"
                        justify="center"
                        gap={16}
                        className="min-h-[280px] w-full px-4 text-center"
                    >
                        <Text className="text-base font-medium text-ink md:text-lg">
                            Analyzing your statement…
                        </Text>
                        <Progress
                            percent={Math.round(progress)}
                            status="active"
                            strokeColor="#43B75D"
                            className="w-full max-w-[420px]"
                        />
                        <Text className="text-sm text-slate-400">
                            Extracting and categorizing your transactions
                        </Text>
                    </Flex>
                ) : (
                    <>
                        {step === 1 &&
                            (lockedFile ? (
                                <PasswordPrompt
                                    fileName={lockedFile.name}
                                    error={passwordError}
                                    onSubmit={pw => handleUpload(lockedFile, pw)}
                                    onCancel={handleClose}
                                />
                            ) : (
                                <UploadStep onContinue={handleUpload} onCancel={handleClose} />
                            ))}
                        {step === 2 && parsed && (
                            <CategorizeStep
                                transactions={parsed.transactions}
                                quality={parsed.quality}
                                onContinue={handleConfirm}
                                onCancel={handleClose}
                            />
                        )}
                        {step === 3 && parsed && (
                            <ImportSuccessStep
                                summary={parsed.summary}
                                onUploadAnother={reset}
                                onViewTransactions={onClose}
                            />
                        )}
                    </>
                )}
            </Flex>
        </Modal>
    );
};

export default UploadStatementModal;
