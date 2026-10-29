import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { getProductDetailsApi } from '../api/product';
import { ProductDetails, ProductDetailsResponse, ProductImage } from '../types/productDetails';
import { OndcProduct } from '../types/products';

export function useProductDetailsApi(ondcProductId: string) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const navigate = useNavigate();

    const [productDetails, setProductDetails] = useState<ProductDetails>();
    const [relatedProducts, setRelatedProducts] = useState<OndcProduct[]>([]);
    const [productImages, setProductImages] = useState<ProductImage[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const getProductDetails = useCallback(async () => {
        setIsLoading(true);
        const data: ProductDetailsResponse | false = await getProductDetailsApi({
            userId: id,
            userType: role,
            ondcProductId,
        });
        if (data) {
            const detail = data as ProductDetailsResponse;
            setProductDetails(detail);
            // Build the image gallery from the ONDC images[] array (fallback to symbol).
            let urls: string[] = [];
            if (detail.images?.length) {
                urls = detail.images;
            } else if (detail.symbol) {
                urls = [detail.symbol];
            }
            setProductImages(
                urls.map((url, index) => ({
                    id: index,
                    productImageUrl: url,
                    imageField: `image-${index}`,
                    productId: detail.id,
                }))
            );
            setRelatedProducts([]);
            setIsLoading(false);
        } else {
            navigate(`/${paths.officeSupplies.index}`);
            setIsLoading(false);
        }
    }, [id, role, ondcProductId, navigate]);

    useEffect(() => {
        getProductDetails();
    }, [getProductDetails]);

    return { relatedProducts, productImages, productDetails, isLoading };
}
