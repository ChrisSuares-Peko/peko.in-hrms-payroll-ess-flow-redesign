import { useCallback, useEffect, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createDocument, getVehicleDocuments, updateDocument } from '../api';

interface SaveDocArgs {
    docType: string;
    expiryDate: string;
    documentBase: string;
    documentFormat: string;
    existingDocId?: number;
}

export default function useVehicleDocuments(vehicleId?: number) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();

    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchDocs = useCallback(async () => {
        if (!vehicleId) return;
        setLoading(true);
        const data: any = await getVehicleDocuments({ userId: id, userType: role, vehicleId });
        if (data) {
            setDocs(data.data || []);
        }
        setLoading(false);
    }, [id, role, vehicleId]);

    useEffect(() => {
        fetchDocs();
    }, [fetchDocs]);

    const insuranceDoc = docs.find(d => d.type === 'Insurance');
    const pucDoc = docs.find(d => d.type === 'PUC');

    const saveDoc = useCallback(
        async ({ docType, expiryDate, documentBase, documentFormat, existingDocId }: SaveDocArgs) => {
            const payload: any = {
                userId: id,
                userType: role,
                type: docType,
                expiryDate,
                documentBase,
                documentFormat,
            };
            const res: any = existingDocId
                ? await updateDocument({ ...payload, docId: existingDocId })
                : await createDocument({ ...payload, vehicleId });

            const ok = Boolean(res && res.status);
            dispatch(
                showToast({
                    description: ok
                        ? 'Document uploaded successfully'
                        : 'Failed to upload document',
                    variant: ok ? 'success' : 'error',
                })
            );
            if (ok) await fetchDocs();
            return ok;
        },
        [id, role, vehicleId, dispatch, fetchDocs]
    );

    return { insuranceDoc, pucDoc, loading, saveDoc, refetch: fetchDocs };
}
