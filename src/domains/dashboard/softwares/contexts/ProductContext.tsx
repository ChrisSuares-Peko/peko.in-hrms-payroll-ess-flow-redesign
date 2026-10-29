import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// import { EventScheduledEvent, useCalendlyEventListener } from 'react-calendly';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { fetchProductDetails } from '../api';
import useGetAssistance from '../hooks/general/useGetAssistance';
import useNavigateFromProductPage from '../hooks/product/useNavigateFromProductPage';
import { IProduct } from '../types';

const ratingsKeys = {
    ease_of_use: 'Ease of Use',
    breadth_of_features: 'Breadth Of Features',
    ease_of_implementation: 'Ease Of Implementation',
    value_for_money: 'Value For Money',
    customer_support: 'Customer Support',
} as const;

type RatingKey = keyof typeof ratingsKeys;

type RatingFactor = {
    key: RatingKey;
    label: string;
    value: number;
};

type ProductContextType = {
    product: IProduct | null;
    isLoading: boolean;
    getAssistanceIsLoading: boolean;
    ratingFactorsList: RatingFactor[];
    routeToNextPage: () => void;
    accessibleImages: string[];
    playingVideoIndex: number | null;
    setPlayingVideoIndex: (index: number | null) => void;
    // calendlyOpen: boolean
    // setCalendlyOpen: React.Dispatch<React.SetStateAction<boolean>>
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProductContext = () => {
    const context = useContext(ProductContext);

    if (!context) {
        throw new Error('useProductContext must be used within ProductContextProvider');
    }

    return context;
};

type Props = {
    children: React.ReactNode;
};

const ProductContextProvider = ({ children }: Props) => {
    const [product, setProduct] = useState<IProduct | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchParams] = useSearchParams();
    const rawUrl = searchParams.get('weburl');
    const { queryParams } = useAppSelector(state => state.reducer.software);

    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { navigateFromProductPage } = useNavigateFromProductPage();
    const { isLoading: getAssistanceIsLoading, requestAssistance } = useGetAssistance(); // THIS SAME ONE WE NEED TO USE FROM THE SUBSCRIPTION PLANS PAGE SO THAT IT HAS BEEN CREATED AS A HOOK

    const currentProduct = rawUrl || queryParams.product || '';
    const [accessibleImages, setAccessibleImages] = useState<string[]>([]);
    const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null);

    // const [calendlyOpen, setCalendlyOpen] = useState(false);

    useEffect(() => {
        if (!product?.snapshots?.length) return;

        const snapshots = product.snapshots.map(el => el.Location).filter(Boolean);

        const checkAccessibility = async () => {
            const results = await Promise.allSettled(
                snapshots.map(
                    url =>
                        new Promise<string | null>(resolve => {
                            const img = new Image();
                            img.onload = () => resolve(url);
                            img.onerror = () => resolve(null);
                            img.src = url;
                        })
                )
            );

            const accessible = results
                .map(result => (result.status === 'fulfilled' ? result.value : null))
                .filter((url): url is string => url !== null);

            setAccessibleImages(accessible);
        };

        checkAccessibility();
    }, [product]);

    useEffect(() => {
        if (!currentProduct) {
            navigateFromProductPage();
        }
    }, [currentProduct, navigateFromProductPage]);

    const getProductDetails = useCallback(async () => {
        if (!id || !role) return;

        setIsLoading(true);

        const data = await fetchProductDetails({
            userId: id,
            userType: role,
            weburl: currentProduct,
        });

        if (data && data.product) setProduct(data.product);
        else navigate(paths.softwares.index, { replace: true });

        setIsLoading(false);
    }, [currentProduct, id, role, navigate]);

    useEffect(() => {
        if (currentProduct) {
            getProductDetails();
        }
    }, [getProductDetails, currentProduct]);

    const ratingFactorsList = useMemo<RatingFactor[]>(() => {
        if (!product?.ratings) return [];

        return (Object.entries(ratingsKeys) as [RatingKey, string][])
            .filter(([key]) => product.ratings[key] !== undefined)
            .map(([key, label]) => ({
                key,
                label,
                value: product.ratings[key] ?? 0,
            }));
    }, [product]);

    const routeToNextPage = useCallback(() => {
        if (!product) return;
        if (product.hasPurchaseOptions || product.pricing.length > 0) {
            const path = `${paths.softwares.viewPlans}?weburl=${currentProduct}`;

            navigate(path, { state: { product } });
        } else {
            requestAssistance(product.weburl);
        }
    }, [product, currentProduct, navigate, requestAssistance]);

    //  // calendly --------------------
    // const calendlyHandlers = useMemo(
    //     () => ({
    //         onEventScheduled: (e: EventScheduledEvent) => {
    //             console.log('Meeting scheduled:', e.data.payload);
    //              navigate(`${paths.softwares.getAssistanceSuccess}`)
    //             setCalendlyOpen(false);
    //         },
    //     }),
    //     [navigate]
    // );
    // useCalendlyEventListener(calendlyHandlers);

    const value = useMemo(
        () => ({
            product,
            isLoading,
            ratingFactorsList,
            routeToNextPage,
            getAssistanceIsLoading,
            accessibleImages,
            playingVideoIndex,
            setPlayingVideoIndex,
            // calendlyOpen,
            // setCalendlyOpen
        }),
        [
            product,
            isLoading,
            ratingFactorsList,
            routeToNextPage,
            getAssistanceIsLoading,
            accessibleImages,
            playingVideoIndex,
            // calendlyOpen,
            // setCalendlyOpen
        ]
    );

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export default ProductContextProvider;
