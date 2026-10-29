import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { resetSoftwareQueryParams } from '../../slice/softwareSlice';

const useResetQueryParams = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetSoftwareQueryParams());
    }, [dispatch]);
};

export default useResetQueryParams;
