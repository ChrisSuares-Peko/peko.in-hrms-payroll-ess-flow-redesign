import { useCallback, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import {
    getCommissionInvoice,
    previewCommissionInvoice,
    saveCommissionInvoiceBilledTo,
    searchCommissionInvoices,
    sendCommissionInvoice,
} from '../api/commissionInvoice';
import {
    CommissionInvoice,
    CommissionInvoiceBilledTo,
    CommissionInvoiceMatch,
    CommissionInvoicePlacement,
    CommissionInvoiceTarget,
} from '../types/commissionInvoice';

const placementOf = (source: CommissionInvoicePlacement): CommissionInvoicePlacement => ({
    placeOfSupply: source.placeOfSupply,
    taxCase: source.taxCase,
    taxLines: source.taxLines,
});

const useCommissionInvoice = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [matches, setMatches] = useState<CommissionInvoiceMatch[]>([]);
    const [searched, setSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [invoice, setInvoice] = useState<CommissionInvoice | null>(null);
    const [target, setTarget] = useState<CommissionInvoiceTarget | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [placement, setPlacement] = useState<CommissionInvoicePlacement | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const previewSerial = useRef(0);

    const auth = { userId: id, userType: role };

    const showInvoice = (loaded: CommissionInvoice) => {
        setInvoice(loaded);
        setPreviewHtml(loaded.html);
        setPlacement(placementOf(loaded));
    };

    const search = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            setSearched(trimmed);
            if (!trimmed) {
                setMatches([]);
                return [];
            }
            setIsSearching(true);
            const found = await searchCommissionInvoices({ ...auth, search: trimmed });
            setIsSearching(false);
            const list = found || [];
            setMatches(list);
            return list;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role]
    );

    const open = useCallback(
        async (next: CommissionInvoiceTarget) => {
            setTarget(next);
            setIsLoading(true);
            setNotFound(false);
            const loaded = await getCommissionInvoice({ ...auth, ...next });
            setIsLoading(false);
            if (loaded) {
                showInvoice(loaded);
            } else {
                setInvoice(null);
                setPreviewHtml('');
                setPlacement(null);
                setNotFound(loaded === null);
            }
            return loaded;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role]
    );

    const preview = useCallback(
        async (billedTo: CommissionInvoiceBilledTo | null) => {
            if (!target) return;
            previewSerial.current += 1;
            const serial = previewSerial.current;
            if (!billedTo) {
                if (invoice) {
                    setPreviewHtml(invoice.html);
                    setPlacement(placementOf(invoice));
                }
                return;
            }
            const result = await previewCommissionInvoice({ ...auth, ...target, billedTo });
            if (result && serial === previewSerial.current) {
                setPreviewHtml(result.html);
                setPlacement(placementOf(result));
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role, target, invoice]
    );

    const save = useCallback(
        async (billedTo: CommissionInvoiceBilledTo) => {
            if (!target) return false;
            setIsSaving(true);
            const result = await saveCommissionInvoiceBilledTo({ ...auth, ...target, billedTo });
            setIsSaving(false);
            if (result) showInvoice(result.invoice);
            return result;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role, target]
    );

    const send = useCallback(
        async (to: string[]) => {
            if (!target) return false;
            setIsSending(true);
            const result = await sendCommissionInvoice({ ...auth, ...target, to });
            setIsSending(false);
            if (result) setInvoice(result.invoice);
            return result;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, role, target]
    );

    const close = useCallback(() => {
        setTarget(null);
        setInvoice(null);
        setPreviewHtml('');
        setPlacement(null);
        setNotFound(false);
    }, []);

    return {
        matches,
        searched,
        isSearching,
        invoice,
        target,
        isLoading,
        notFound,
        previewHtml,
        placement,
        isSaving,
        isSending,
        search,
        open,
        preview,
        save,
        send,
        close,
    };
};

export default useCommissionInvoice;
