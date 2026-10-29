import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getAllAgreementsApi } from '../../api/agreements';
import {
    AGREEMENT_STATUS_COUNTS_DEFAULT,
    mapAgreementStatus,
    toApiAgreementStatus,
} from '../../constants/agreement';
import {
    AgreementRow,
    AgreementStatusCounts,
    GetAllAgreementsPayload,
} from '../../types/agreement';

dayjs.extend(relativeTime);

const useAgreementData = (filters: GetAllAgreementsPayload) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [agreements, setAgreements] = useState<AgreementRow[]>([]);
    const [recordsTotal, setRecordsTotal] = useState(0);
    const [statusCounts, setStatusCounts] = useState<AgreementStatusCounts>(
        AGREEMENT_STATUS_COUNTS_DEFAULT
    );
    const [isLoading, setIsLoading] = useState(false);

    const fetchAgreements = useCallback(async () => {
        setIsLoading(true);
        const apiFilters = {
            ...filters,
            status: filters.status ? toApiAgreementStatus(filters.status) : undefined,
        };
        const resp = await getAllAgreementsApi({ userId: id, userType: role, ...apiFilters });
        if (resp && resp.status) {
            const rows: AgreementRow[] = resp.data.agreements.map(item => ({
                id: String(item.id),
                displayId: `${item.prefix ?? ''}${item.agreementNumber}`,
                customer: item.invoiceCustomerV2?.name ?? '-',
                quotationId: item.quotationId ?? null,
                quotationPrefix: item.quotation?.prefix ?? null,
                quotationInvoiceNumber: item.quotation?.invoiceNumber ?? null,
                startDate: item.startDate ? dayjs(item.startDate).format('MMMM D, YYYY') : '-',
                rawStartDate: item.startDate ?? undefined,
                value: 0,
                lastUpdated: dayjs(item.updatedAt).fromNow(),
                status: mapAgreementStatus(item.status),
                title: item.title,
                contractType: item.contractType,
                currency: item.currency,
                paymentTerms: item.paymentTerms,
                hasDocument: Boolean(item.documentUrl),
                documentUrl: item.documentUrl,
                description: item.description,
            }));
            setAgreements(rows);
            setRecordsTotal(resp.data.recordsTotal);
            setStatusCounts(resp.data.statusCounts);
        } else if (resp && !resp.status) {
            dispatch(showToast({ description: resp.message, variant: 'error' }));
        }
        setIsLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        dispatch,
        id,
        role,
        filters.page,
        filters.itemsPerPage,
        filters.searchText,
        filters.status,
        filters.customerId,
        filters.sortField,
        filters.sort,
    ]);

    useEffect(() => {
        fetchAgreements();
    }, [fetchAgreements]);

    return { agreements, recordsTotal, statusCounts, isLoading, refetch: fetchAgreements };
};

export default useAgreementData;
