import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAgreementByIdApi, getAgreementDocumentApi } from '../../api/agreements';
import { AgreementApiItem } from '../../types/agreement';

const useAgreementDetail = (agreementId?: string) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [agreement, setAgreement] = useState<AgreementApiItem | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const fetchAgreement = useCallback(async () => {
        if (!agreementId) return;
        setIsLoading(true);
        setIsPdfLoading(true);

        // Fire both in parallel — PDF resolves independently, doesn't block the spinner
        getAgreementDocumentApi(agreementId, { userId: id, userType: role }).then(blob => {
            if (blob)
                setPdfFile(
                    new File([blob], `agreement-${agreementId}.pdf`, { type: 'application/pdf' })
                );
            setIsPdfLoading(false);
        });

        const resp = await getAgreementByIdApi(agreementId, { userId: id, userType: role });
        if (resp && resp.status) {
            setAgreement(resp.data);
        } else if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsLoading(false);
    }, [agreementId, id, role, dispatch]);

    useEffect(() => {
        fetchAgreement();
    }, [fetchAgreement]);

    return { agreement, isLoading, refetch: fetchAgreement, pdfFile, isPdfLoading };
};

export default useAgreementDetail;
