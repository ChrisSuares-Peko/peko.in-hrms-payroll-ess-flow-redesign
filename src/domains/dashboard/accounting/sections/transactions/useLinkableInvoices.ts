import { useEffect, useState } from 'react';

import useDebounce from '@src/hooks/useDebounce';

import { getLinkableInvoices, LinkableInvoice } from '../../api/transactions';
import { LinkDocumentTabKey } from '../../utils/linkDocumentData';

interface UseLinkableInvoicesParams {
    open: boolean;
    activeTab: LinkDocumentTabKey;
    search: string;
    userId: number;
    userType: string;
}

const useLinkableInvoices = ({
    open,
    activeTab,
    search,
    userId,
    userType,
}: UseLinkableInvoicesParams) => {
    const [invoices, setInvoices] = useState<LinkableInvoice[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const debouncedSearch = useDebounce(search, 400);

    useEffect(() => {
        if (!open || activeTab !== 'invoice') return undefined;
        let active = true;
        setLoadingInvoices(true);
        getLinkableInvoices({
            userId,
            userType,
            searchText: debouncedSearch.trim() || undefined,
            itemsPerPage: 20,
        }).then(data => {
            if (!active) return;
            setInvoices(data ? data.invoices : []);
            setLoadingInvoices(false);
        });
        return () => {
            active = false;
        };
    }, [open, activeTab, debouncedSearch, userId, userType]);

    return { invoices, loadingInvoices, setInvoices };
};

export default useLinkableInvoices;
