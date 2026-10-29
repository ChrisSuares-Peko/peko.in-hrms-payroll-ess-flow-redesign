import { useEffect, useMemo, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { GovtServiceApiItem, getGovtServicesListApi } from '../apis';
import { setServicesList } from '../slices';
import { Service, ServiceAuthority, ServiceCategory, ServiceTab } from '../types';

interface Params {
    searchText?: string;
    category?: ServiceCategory;
    tag?: ServiceTab;
    authority?: ServiceAuthority;
}

type TabCounts = Record<ServiceTab, number>;

const TABS: ServiceTab[] = ['Mandatory', 'Regulatory Dependent', 'Good-to-have'];

// V2 catalog rows have no accessKey/slug/category/tag — filled with best-effort fallbacks below just so the list renders.
const slugify = (value: string) =>
    value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const mapApiItem = (item: GovtServiceApiItem): Service => {
    const numericId = Number(item.id);
    return {
        id: Number.isFinite(numericId) ? numericId : 0,
        serviceId: item.service_id ?? null,
        name: item.service_name ?? item.variant_name ?? '',
        slug: slugify(item.service_name ?? item.id),
        accessKey: item.id,
        description: item.description ?? item.about ?? '',
        category: item.variant_name ?? '',
        tab: 'Mandatory',
        duration: item.unit ?? '',
        price: Number(item.price) || 0,
        govtFee: Number(item.government_fee_amount) || 'Free',
    };
};

export default function useGovtServicesListApi(params: Params) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [tabCounts, setTabCounts] = useState<TabCounts>({
        Mandatory: 0,
        'Regulatory Dependent': 0,
        'Good-to-have': 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all services once and store the full list in Redux; tabCounts is just a count since mapApiItem hardcodes 'Mandatory'.
    // The endpoint only supports service_id, so searchText/category/tag/authority are filtered client-side below instead of re-fetching.
    useEffect(() => {
        setIsLoading(true);
        getGovtServicesListApi(id, role).then((rawData) => {
            const mapped = rawData.map(mapApiItem);
            const counts = TABS.reduce((acc, tab) => ({ ...acc, [tab]: 0 }), {} as TabCounts);
            mapped.forEach((item) => {
                counts[item.tab] += 1;
            });
            setTabCounts(counts);
            dispatch(setServicesList(mapped));
            setAllServices(mapped);
            setIsLoading(false);
        });
    }, [id, role, dispatch]);

    const services = useMemo(() => {
        if (!params.searchText) return allServices;
        const needle = params.searchText.toLowerCase();
        return allServices.filter(
            (s) => s.name.toLowerCase().includes(needle) || s.description.toLowerCase().includes(needle)
        );
    }, [allServices, params.searchText]);

    return { services, tabCounts, isLoading };
}
