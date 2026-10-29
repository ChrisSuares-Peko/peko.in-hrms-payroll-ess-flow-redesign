import { useCallback, useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getOndcProductByIdApi, setOndcProductVisibilityApi } from '../../api/ondcProducts';
import { setProductListingPositionApi } from '../../api/ondcSellerCategories';
import { AdminOndcProductDetail } from '../../types/ondcProduct';
import { ListingPosition } from '../../types/ondcSellerCategory';

/** Single ONDC product (admin catalog detail) + visibility toggle + listing position. */
const useOndcProductDetail = (id?: string) => {
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [product, setProduct] = useState<AdminOndcProductDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const fetchProduct = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        const data = await getOndcProductByIdApi({ userId, userType: role, id });
        if (data) setProduct(data);
        else setNotFound(true);
        setIsLoading(false);
    }, [id, userId, role]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const toggleVisibility = async () => {
        if (!product) return;
        setIsToggling(true);
        const next = !product.visibleOnPeko;
        const ok = await setOndcProductVisibilityApi({ userId, userType: role, id: product.id, visible: next });
        if (ok) setProduct(p => (p ? { ...p, visibleOnPeko: next } : p));
        setIsToggling(false);
    };

    /** The product's own listing position, or `null` to follow its seller category. */
    const setListingPosition = async (listingPosition: ListingPosition | null) => {
        if (!product) return;
        const ok = await setProductListingPositionApi({ userId, userType: role, productId: product.id, listingPosition });
        if (ok) setProduct(p => (p ? { ...p, listingPositionOverride: listingPosition } : p));
    };

    return { product, isLoading, notFound, isToggling, toggleVisibility, setListingPosition };
};

export default useOndcProductDetail;
