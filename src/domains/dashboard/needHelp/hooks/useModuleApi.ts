import { useState, useCallback, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { moduleTypeListing } from '../api/index';
import { setModuleData } from '../slices/supportSlice';
import { ModuleListingResponse, ModuleOption } from '../types/type';

export const useGetModuleListingType = () => {
    const [moduleData, setModuleDataL] = useState<ModuleOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();
    const getModuleList = useCallback(async () => {
        const data: ModuleListingResponse | false = await moduleTypeListing();
        if (data) {
            const { modules } = data;

            setModuleDataL(modules);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getModuleList();
    }, [getModuleList]);
    dispatch(setModuleData(moduleData));

    return { moduleTypes: moduleData, isLoading };
};
