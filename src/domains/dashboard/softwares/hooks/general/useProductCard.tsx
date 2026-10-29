import { useMemo } from 'react';

import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import useScreenSize from '@src/hooks/useScreenSize';
import { paths } from '@src/routes/paths';

import { setQueryParams } from '../../slice/softwareSlice';
import { IProductCard } from '../../types';

const useProductCard = (product: IProductCard) => {
    const navigate = useNavigate();
    const screens = useScreenSize();
    const { pathname } = useLocation();
    const dispatch = useDispatch();

    const { cardImageSize } = useMemo(() => {
        let card = 60;

        if (screens.xs) {
            card = 40;
        } else if (screens.md) {
            card = 50;
        } else if (screens.lg) {
            card = 40;
        }

        return {
            cardImageSize: card,
        };
    }, [screens]);

    const routeToProductPage = (weburl: string) => {
        const splitRoute = pathname.split('/');
        const route = splitRoute[splitRoute.length - 1];
        let navigatePath = '';

        switch (route) {
            case paths.softwares.index:
                navigatePath = `/${paths.softwares.index}/${paths.softwares.product}?weburl=${weburl}`;
                break;
            case paths.softwares.category:
                navigatePath = `${paths.softwares.product}?weburl=${weburl}`;
                break;
            case paths.softwares.searchResults:
                navigatePath = `${paths.softwares.product}?weburl=${weburl}`;
                break;
            case paths.softwares.success:
                navigatePath = `${paths.softwares.product}?weburl=${weburl}`;
                break;
            default:
                navigatePath = `/${paths.softwares.index}`;
        }

        dispatch(setQueryParams({ product: weburl }));
        navigate(navigatePath);
    };

    return {
        cardImageSize,
        routeToProductPage,
    };
};

export default useProductCard;
