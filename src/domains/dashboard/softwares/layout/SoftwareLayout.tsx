import { useEffect } from 'react';

import { Outlet } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';

import { resetSoftwareStateKeepSearch } from '../slice/softwareSlice';

const SoftwareLayout = () => {
    const dispatch = useAppDispatch();
    useEffect(
        () => () => {
            dispatch(resetSoftwareStateKeepSearch());
        },
        [dispatch]
    );

    return <Outlet />;
};

export default SoftwareLayout;
