import { useCallback, useRef, useState } from 'react';

import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { applySync, getSyncPreview } from '../api/packageSync';
import { PackageSyncType, SyncApplyResult, SyncPreview, SyncSelection } from '../types/packageSync';
import { buildApplyPartners, countSelected, defaultSelection, summarizeApply, toggleOps } from '../utils/packageSync';

const usePackageSync = (type: PackageSyncType) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useDispatch();
    const [preview, setPreview] = useState<SyncPreview | null>(null);
    const [previewing, setPreviewing] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [selection, setSelection] = useState<SyncSelection>({});
    const [applying, setApplying] = useState(false);
    const [result, setResult] = useState<SyncApplyResult | null>(null);
    const requestRef = useRef(0);

    const reset = useCallback(() => {
        requestRef.current += 1;
        setPreview(null);
        setPreviewError(null);
        setSelection({});
        setResult(null);
        setPreviewing(false);
    }, []);

    const loadPreview = useCallback(
        async (accessKey: string, partnerIds: string[]) => {
            requestRef.current += 1;
            const requestId = requestRef.current;
            setPreviewing(true);
            setPreviewError(null);
            setResult(null);
            setSelection({});
            const res = await getSyncPreview({ userId: id, userType: role, accessKey, type, partnerIds });
            if (requestId !== requestRef.current) return;
            if (res.ok) {
                setPreview(res.data);
                setSelection(defaultSelection(res.data));
            } else {
                setPreview(null);
                setPreviewError(res.message);
            }
            setPreviewing(false);
        },
        [id, role, type]
    );

    const toggle = useCallback((partnerId: string, opIds: string[], checked: boolean) => {
        setSelection(prev => toggleOps(prev, partnerId, opIds, checked));
    }, []);

    const apply = useCallback(
        async (accessKey: string) => {
            if (!preview) return false;
            setApplying(true);
            const res = await applySync({
                userId: id,
                userType: role,
                accessKey,
                type,
                partners: buildApplyPartners(preview, selection),
            });
            setApplying(false);
            if (res) {
                setResult(res);
                dispatch(showToast({ description: summarizeApply(res), variant: 'success' }));
            }
            return res;
        },
        [id, role, type, preview, selection, dispatch]
    );

    return {
        preview,
        previewing,
        previewError,
        selection,
        selectedCount: countSelected(selection),
        applying,
        result,
        loadPreview,
        reset,
        toggle,
        apply,
    };
};

export default usePackageSync;
