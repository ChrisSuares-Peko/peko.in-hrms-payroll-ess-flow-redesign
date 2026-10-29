import { useState } from 'react';

import { useField } from 'formik';

import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { useDocumentUpload } from '../context/documentUpload';

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

// On-the-go doc upload for FileUploadField / PhotoUpload: pushes the file to the
// vendor on pick, keeping just the filename on success or clearing it on error.
export const useDocAutoUpload = (name: string) => {
    const [, , helpers] = useField(name);
    const uploadDoc = useDocumentUpload();
    const dispatch = useAppDispatch();
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const upload = async (file: { name: string; base64: string }) => {
        setError(null);
        helpers.setValue(file);
        if (!uploadDoc) return;
        setStatus('uploading');
        const res = await uploadDoc(name, file);
        if (res.ok) {
            // Base64 dropped after upload — keep the filename so the field stays filled.
            helpers.setValue(file.name);
            setStatus('done');
        } else if (res.skipped) {
            // No applicationId yet — keep the bytes for the batch upload on Next.
            setStatus('idle');
        } else {
            // Clear the rejected file so it can never be saved as uploaded; keep the reason inline.
            helpers.setValue('');
            setStatus('error');
            setError(res.error || 'Upload failed');
            dispatch(showToast({ description: res.error || 'Upload failed', variant: 'error' }));
        }
    };

    return { status, error, upload, setStatus };
};
