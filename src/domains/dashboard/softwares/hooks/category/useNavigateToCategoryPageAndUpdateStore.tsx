import { useCallback } from 'react';

import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { setQueryParams } from '../../slice/softwareSlice';

const useNavigateToCategoryPageAndUpdateStore = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const navigateAndUpdateStore = useCallback(
        (weburl: string) => {
            dispatch(setQueryParams({ category: weburl }));
            navigate(`/${paths.softwares.index}/${paths.softwares.category}?weburl=${weburl}`);
        },
        [navigate, dispatch]
    );

    return { navigateAndUpdateStore };
};

export default useNavigateToCategoryPageAndUpdateStore;
