import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';

import { getActivities, getAddressTypes, getCompanySizes, getStates } from '../api/general';
import {
    ActivityResponse,
    AddressTypesResponse,
    CompanySizesResponse,
    StatesResponse,
} from '../types/index';

export default function useGeneralApi() {
    const [addressTypesList, setAddressTypesList] = useState<DropDown>([]);
    const [companySizesList, setCompanySizesList] = useState<{ id: number; name: string }[]>();
    const [activityList, setActivityList] = useState<{ id: number; name: string }[]>();
    const [statesList, setStatesList] = useState<{ label: string; value: string }[]>();

    const getAddressTypesList = async () => {
        const data: AddressTypesResponse | false = await getAddressTypes();
        if (data) {
            setAddressTypesList(data.addressType);
        }
    };

    const getCompanySizesList = async () => {
        const data: CompanySizesResponse | false = await getCompanySizes();
        if (data) {
            setCompanySizesList(data.companySize);
        }
    };

    const getStatesList = useCallback(async () => {
        const data: StatesResponse | false = await getStates();
        if (data) {
            setStatesList(data.states);
        }
    }, []);

    const getCompanyActivityList = async () => {
        const data: ActivityResponse | false = await getActivities();
        if (data) {
            setActivityList(data.companyActivity);
        }
    };

    useEffect(() => {
        getAddressTypesList();
        getCompanySizesList();
        getStatesList();
        getCompanyActivityList();
    }, [getStatesList]);

    return { addressTypesList, companySizesList, statesList, activityList };
}
