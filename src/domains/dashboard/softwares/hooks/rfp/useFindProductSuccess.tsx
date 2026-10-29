import { useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

const useFindProductSuccess = () => {
    const navigate = useNavigate();

    const { recommendedProducts: products } = useAppSelector(state => state.reducer.software);

    useEffect(() => {
        if (products.length < 1) {
            navigate(`/${paths.softwares.index}/${paths.softwares.findSoftware}`);
        }
    }, [navigate, products]);

    return {
        products,
    };
};

export default useFindProductSuccess;
