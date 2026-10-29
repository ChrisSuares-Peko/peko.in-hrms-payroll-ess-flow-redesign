import { useCallback, useState } from 'react';

import { saveAs } from 'file-saver';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    createAgreementApi,
    getAgreementDocumentApi,
    sendSignRequestApi,
    updateAgreementApi,
    uploadDocumentApi,
} from '../../api/agreements';
import {
    CreateAgreementPayload,
    SendSignRequestPayload,
    UpdateAgreementPayload,
} from '../../types/agreement';

const useAgreementActions = (onSuccess?: (id?: number) => void) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [isSendingSignRequest, setIsSendingSignRequest] = useState(false);

    const createAgreement = useCallback(
        async (payload: CreateAgreementPayload) => {
            setIsLoading(true);
            const resp = await createAgreementApi({ userId: id, userType: role, ...payload });
            if (resp && resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'success' }));
                onSuccess?.(resp.data.id);
                setIsLoading(false);
                return resp.data;
            } if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return null;
        },
        [dispatch, id, role, onSuccess]
    );

    const updateAgreement = useCallback(
        async (agreementId: number | string, payload: UpdateAgreementPayload) => {
            setIsLoading(true);
            const resp = await updateAgreementApi(agreementId, {
                userId: id,
                userType: role,
                ...payload,
            });
            if (resp && resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'success' }));
                onSuccess?.();
                setIsLoading(false);
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return false;
        },
        [dispatch, id, role, onSuccess]
    );

    const uploadDocument = useCallback(
        async (agreementId: number | string, payload: { documentBase64: string }) => {
            const resp = await uploadDocumentApi(agreementId, {
                userId: id,
                userType: role,
                ...payload,
            });
            if (resp && resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'success' }));
                return true;
            }
            if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            return false;
        },
        [dispatch, id, role]
    );

    const downloadAgreement = useCallback(
        async (agreementId: string | number, filename: string) => {
            if (!agreementId) return;
            setDownloadingId(String(agreementId));
            const blob = await getAgreementDocumentApi(agreementId, { userId: id, userType: role });
            if (blob) {
                saveAs(blob, `${filename}.pdf`);
            } else {
                dispatch(showToast({ description: 'Failed to download document.', variant: 'error' }));
            }
            setDownloadingId(null);
        },
        [dispatch, id, role]
    );

    const sendSignRequest = useCallback(
        async (payload: SendSignRequestPayload) => {
            setIsSendingSignRequest(true);
            const resp = await sendSignRequestApi({ userId: id, userType: role, ...payload });
            setIsSendingSignRequest(false);
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Agreement sent for signature successfully',
                        variant: 'success',
                    })
                );
                return true;
            }
            if (resp && !resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'Failed to send for signature',
                        variant: 'error',
                    })
                );
            }
            return false;
        },
        [dispatch, id, role]
    );

    return {
        createAgreement,
        updateAgreement,
        uploadDocument,
        downloadAgreement,
        sendSignRequest,
        isLoading,
        downloadingId,
        isDownloading: downloadingId !== null,
        isSendingSignRequest,
    };
};

export default useAgreementActions;
