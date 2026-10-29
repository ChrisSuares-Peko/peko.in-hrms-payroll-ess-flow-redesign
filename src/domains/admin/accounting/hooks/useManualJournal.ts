import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    generateManualJournalSplit,
    getManualJournal,
    getManualJournalAccounts,
    postManualJournal,
    previewManualJournal,
} from '../api/manualJournal';
import {
    ManualJournalAccount,
    ManualJournalEntryPayload,
    ManualJournalKey,
    ManualJournalSetup,
    ManualJournalLookup,
    ManualJournalPreviewPayload,
} from '../types/manualJournal';

const useManualJournal = (corporateTxnId: string | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [lookup, setLookup] = useState<ManualJournalLookup | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [accounts, setAccounts] = useState<ManualJournalAccount[]>([]);
    const loadedFor = useRef<string | null>(null);

    const load = useCallback(async () => {
        if (!corporateTxnId) {
            loadedFor.current = null;
            setLookup(null);
            setNotFound(false);
            return;
        }
        if (loadedFor.current !== corporateTxnId) {
            setLookup(null);
            setNotFound(false);
        }
        setIsLoading(true);
        const result = await getManualJournal({ userId: id, userType: role, corporateTxnId });
        loadedFor.current = corporateTxnId;
        setLookup(result || null);
        setNotFound(result === null);
        setIsLoading(false);
    }, [corporateTxnId, id, role]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        let active = true;
        getManualJournalAccounts({ userId: id, userType: role }).then(result => {
            if (active && result) setAccounts(result);
        });
        return () => {
            active = false;
        };
    }, [id, role]);

    const preview = useCallback(
        (journalKey: ManualJournalKey, body: ManualJournalPreviewPayload) =>
            previewManualJournal({
                userId: id,
                userType: role,
                corporateTxnId: corporateTxnId || '',
                journalKey,
                ...body,
            }),
        [corporateTxnId, id, role]
    );

    const generateSplit = useCallback(
        (journalKey: ManualJournalKey, setup: ManualJournalSetup) =>
            generateManualJournalSplit({
                userId: id,
                userType: role,
                corporateTxnId: corporateTxnId || '',
                journalKey,
                setup,
            }),
        [corporateTxnId, id, role]
    );

    const post = useCallback(
        (journalKey: ManualJournalKey, body: ManualJournalEntryPayload) =>
            postManualJournal({
                userId: id,
                userType: role,
                corporateTxnId: corporateTxnId || '',
                journalKey,
                ...body,
            }),
        [corporateTxnId, id, role]
    );

    return { lookup, notFound, isLoading, accounts, refetch: load, preview, generateSplit, post };
};

export default useManualJournal;
