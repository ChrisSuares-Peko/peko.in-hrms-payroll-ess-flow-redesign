import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { fetchLegalDocuments } from '../api';
import CommercialRentIcon from '../assets/icons/commerial.svg';
import DocAltIcon from '../assets/icons/document-1.svg';
import EmploymentIcon from '../assets/icons/employe_contract.svg';
import FoundersIcon from '../assets/icons/founder-agreement.svg';
import IPIcon from '../assets/icons/ip.svg';
import LoanIcon from '../assets/icons/money_bag.svg';
import NDAIcon from '../assets/icons/non-disclosure.svg';
import SaaSIcon from '../assets/icons/saas-subscription.svg';
import ShareholderIcon from '../assets/icons/share_holder.svg';
import VendorIcon from '../assets/icons/vendor.svg';
import type { RecentDocument } from '../types';

const ICON_SRC_MAP: Record<string, string> = {
    nda: NDAIcon,
    employment: EmploymentIcon,
    founders: FoundersIcon,
    ip: IPIcon,
    shareholder: ShareholderIcon,
    vendor: VendorIcon,
    loan: LoanIcon,
    saas: SaaSIcon,
    commercial: CommercialRentIcon,
};

const mapDocToRecent = (d: any): RecentDocument => ({
    id: String(d.id),
    title: d.title,
    subTitle: `${d.legalTemplate?.category ?? ''} • ${new Date(d.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    date: d.createdAt,
    status: (() => { if (d.status === 'DRAFT') return 'Draft'; if (d.status === 'SENT') return 'Sent'; return 'Signed'; })(),
    iconSrc: d.legalTemplate?.iconKey ? (ICON_SRC_MAP[d.legalTemplate.iconKey] ?? DocAltIcon) : DocAltIcon,
});

const useDocuments = ({
    limit,
    searchText,
    status,
    page,
}: { limit?: number; searchText?: string; status?: string; page?: number } = {}) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [documents, setDocuments] = useState<RecentDocument[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        const resp = await fetchLegalDocuments({ userId: id, userType: role, limit, searchText, status, page });
        if (resp) {
            setDocuments((resp.data ?? []).map(mapDocToRecent));
            setTotal(resp.count ?? 0);
        }
        setIsLoading(false);
    }, [id, role, limit, searchText, status, page]);

    useEffect(() => { load(); }, [load]);

    return { documents, total, isLoading, reload: load };
};

export default useDocuments;
