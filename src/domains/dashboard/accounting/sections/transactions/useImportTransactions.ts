import { useRef, useState } from 'react';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { validateImportFile } from './importTransaction.helpers';

interface UseImportTransactionsArgs {
    onClose: () => void;

    onImport?: (file: File) => Promise<void> | void;
    onImported?: () => void;
}

export const useImportTransactions = ({
    onClose,
    onImport,
    onImported,
}: UseImportTransactionsArgs) => {
    const dispatch = useAppDispatch();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setFile(null);
        setSubmitting(false);
    };

    const handleFiles = (files: FileList | null) => {
        const selected = files?.[0];
        if (!selected) return;
        const error = validateImportFile(selected);
        if (error) {
            dispatch(showToast({ variant: 'error', description: error }));
            return;
        }
        setFile(selected);
    };

    const handleSubmit = async () => {
        if (!file) {
            dispatch(showToast({ variant: 'error', description: 'Select a file to import.' }));
            return;
        }

        setSubmitting(true);
        try {
            await onImport?.(file);
            dispatch(
                showToast({ variant: 'success', description: 'Transactions imported successfully' })
            );
            onImported?.();
            onClose();
        } catch {
            dispatch(
                showToast({ variant: 'error', description: 'Could not import transactions.' })
            );
        } finally {
            setSubmitting(false);
        }
    };

    return {
        fileInputRef,
        fileName: file?.name ?? null,
        submitting,
        reset,
        handleFiles,
        handleSubmit,
    };
};
