import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    deleteKybDocuments,
    getUploadedKybDocuments,
    KybChecklistDocument,
    KybUploadedDocument,
    uploadKybDocuments,
} from '../../api/admin/kybStatusApi';
import { KYB_UPLOAD } from '../../utils/kybData';
import { DocumentSaveState, KybFileValue } from '../../utils/types';

export type UploadedDocumentMap = Record<string, KybUploadedDocument>;
export type DocumentStateMap = Record<string, DocumentSaveState>;

export const useKybDocuments = (enabled: boolean) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);

    const [uploaded, setUploaded] = useState<UploadedDocumentMap>({});
    const [states, setStates] = useState<DocumentStateMap>({});
    const [isLoading, setIsLoading] = useState(enabled);
    const [restoreFailed, setRestoreFailed] = useState(false);

    const queueRef = useRef<Record<string, Promise<unknown>>>({});
    const latestRef = useRef<Record<string, number>>({});
    const tokenRef = useRef(0);

    const setState = (documentName: string, state: DocumentSaveState | null) =>
        setStates(current => {
            if (state === null) {
                const next = { ...current };
                delete next[documentName];
                return next;
            }
            return { ...current, [documentName]: state };
        });

    const fetchUploaded = useCallback(async () => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const res = await getUploadedKybDocuments(role, id);
        setRestoreFailed(!res);
        if (res) setUploaded(res.data?.corporateDocuments ?? {});
        setIsLoading(false);
    }, [enabled, role, id]);

    useEffect(() => {
        fetchUploaded();
    }, [fetchUploaded]);

    const enqueue = (documentName: string, task: () => Promise<void>) => {
        const previous = queueRef.current[documentName] ?? Promise.resolve();
        const next = previous.then(task, task);
        queueRef.current[documentName] = next;
        return next;
    };

    const saveDocument = (doc: KybChecklistDocument, file: KybFileValue) => {
        tokenRef.current += 1;
        const token = tokenRef.current;
        latestRef.current[doc.documentName] = token;
        setState(doc.documentName, 'saving');

        return enqueue(doc.documentName, async () => {
            const res = await uploadKybDocuments(role, id, [
                {
                    documentName: doc.documentName,
                    fileBase: file.base64,
                    fileFormat: file.format,
                    fileName: file.name,
                },
            ]);

            if (latestRef.current[doc.documentName] !== token) return;

            if (!res) {
                setState(doc.documentName, 'failed');
                return;
            }

            setUploaded(current => ({
                ...current,
                [doc.documentName]: {
                    fileName: file.name,
                    documentType: file.format,
                    expiryDate: null,
                    status: 'UPLOADED',
                    uploadedAt: null,
                },
            }));
            setState(doc.documentName, 'saved');
        });
    };

    const removeDocument = (doc: KybChecklistDocument) => {
        tokenRef.current += 1;
        const token = tokenRef.current;
        latestRef.current[doc.documentName] = token;
        setState(doc.documentName, 'removing');

        return enqueue(doc.documentName, async () => {
            const res = await deleteKybDocuments(role, id, [doc.documentName]);

            if (latestRef.current[doc.documentName] !== token) return;

            if (!res) {
                setState(doc.documentName, 'saved');
                dispatch(
                    showToast({
                        variant: 'error',
                        description: KYB_UPLOAD.removeFailed,
                    })
                );
                return;
            }

            setUploaded(current => {
                const next = { ...current };
                delete next[doc.documentName];
                return next;
            });
            setState(doc.documentName, null);
        });
    };

    const isSaved = (doc: KybChecklistDocument) => {
        const state = states[doc.documentName];
        return !!uploaded[doc.documentName] && (state === undefined || state === 'saved');
    };

    return {
        uploaded,
        states,
        isLoading,
        restoreFailed,
        saveDocument,
        removeDocument,
        isSaved,
        refetch: fetchUploaded,
    };
};
