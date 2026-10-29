import { useState, useCallback, useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { issueTypeListing } from '../api/index';
import { setIssueData } from '../slices/supportSlice';
import { issueListingResponse, IssueOption } from '../types/type';

export const useGetIssueListingType = () => {
    const [issueTypeData, setissueTypeData] = useState<IssueOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();
    const getIssueTypeList = useCallback(async () => {
        const data: issueListingResponse | false = await issueTypeListing();
        if (data) {
            const { issueTypes } = data;
            setissueTypeData(issueTypes);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        getIssueTypeList();
    }, [getIssueTypeList]);
    dispatch(setIssueData(issueTypeData));

    return { issueTypes: issueTypeData, isLoading };
};
