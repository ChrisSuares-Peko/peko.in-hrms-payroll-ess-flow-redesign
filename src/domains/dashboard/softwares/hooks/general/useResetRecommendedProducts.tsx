import { useEffect } from 'react';

import { useDispatch } from 'react-redux';

import { resetSoftwareRecommendedProducts } from '../../slice/softwareSlice';

const useResetRecommendedProducts = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(resetSoftwareRecommendedProducts());
    }, [dispatch]);
};

export default useResetRecommendedProducts;
