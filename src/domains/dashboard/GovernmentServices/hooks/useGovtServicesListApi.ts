import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { GovtServiceApiItem, getGovtServicesListApi } from '../apis';
import { setServicesList } from '../slices';
import { Service, ServiceAuthority, ServiceCategory, ServiceTab } from '../types';
import { serviceDetailsMap } from '../utils';

interface Params {
    searchText?: string;
    category?: ServiceCategory;
    tag?: ServiceTab;
    authority?: ServiceAuthority;
}

type TabCounts = Record<ServiceTab, number>;

const TABS: ServiceTab[] = ['Mandatory', 'Regulatory Dependent', 'Good-to-have'];

const HIDDEN_ACCESS_KEYS = new Set(['govt_gst_composition']);
const filterHidden = (items: GovtServiceApiItem[]) =>
    items.filter((i) => !HIDDEN_ACCESS_KEYS.has(i.accessKey));

export const mapApiItem = (item: GovtServiceApiItem): Service => {
    const detail = serviceDetailsMap[item.id];
    const rawGovtFee = item.govtFee;
    const govtFee: number | 'Free' =
        rawGovtFee === null || rawGovtFee === 'Free' || Number(rawGovtFee) === 0
            ? 'Free'
            : Number(rawGovtFee);
    return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        accessKey: item.accessKey,
        description: item.description ?? '',
        category: item.category,
        tab: item.tag,
        duration: item.processingTime ?? detail?.timeline?.[0]?.description ?? '',
        price: Number(item.price),
        govtFee,
    };
};

export default function useGovtServicesListApi(params: Params) {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [services, setServices] = useState<Service[]>([]);
    const [tabCounts, setTabCounts] = useState<TabCounts>({
        Mandatory: 0,
        'Regulatory Dependent': 0,
        'Good-to-have': 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isCountsLoading, setIsCountsLoading] = useState(true);

    // Fetch all services once — compute tab counts and store full list in Redux
    useEffect(() => {
        setIsCountsLoading(true);
        getGovtServicesListApi(id, role).then((rawData) => {
            const allData = filterHidden(rawData);
            const counts = TABS.reduce((acc, tab) => ({ ...acc, [tab]: 0 }), {} as TabCounts);
            allData.forEach((item) => {
                if (counts[item.tag as ServiceTab] !== undefined) {
                    counts[item.tag as ServiceTab] += 1;
                }
            });
            setTabCounts(counts);
            dispatch(setServicesList(allData.map(mapApiItem)));
            setIsCountsLoading(false);
        });
    }, [id, role, dispatch]);

    // Fetch filtered services whenever params change
    useEffect(() => {
        setIsLoading(true);

        const apiParams: Record<string, string> = {};
        if (params.searchText) apiParams.searchText = params.searchText;
        if (params.category && params.category !== 'All') apiParams.category = params.category;
        if (params.tag) apiParams.tag = params.tag;
        if (params.authority && params.authority !== 'All') apiParams.authority = params.authority;

        getGovtServicesListApi(id, role, apiParams).then((data) => {
            setServices(filterHidden(data).map(mapApiItem));
            setIsLoading(false);
        });
    }, [id, role, params.searchText, params.category, params.tag, params.authority]);

    return { services, tabCounts, isLoading: isLoading || isCountsLoading };
}
