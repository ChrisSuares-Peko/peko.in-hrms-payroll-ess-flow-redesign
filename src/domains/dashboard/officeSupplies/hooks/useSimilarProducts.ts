import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProductList } from '../api/product';
import { OndcProduct, ProductCardProps } from '../types/products';
import { mapProductsWithImages } from '../utils/mapProductCard';

/**
 * Similar products = same-category products for the product's city, excluding
 * the current one. Uses the existing product listing (categoryId keyword path).
 */
export function useSimilarProducts(product?: OndcProduct | null) {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [products, setProducts] = useState<ProductCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const city = product?.city?.[0];
    const categoryId = product?.categoryId;
    const currentId = product?.id;

    useEffect(() => {
        let cancelled = false;
        if (!city) {
            setProducts([]);
            return () => {
                cancelled = true;
            };
        }
        setIsLoading(true);
        getProductList({
            userId: id,
            userType: role,
            city,
            search: '',
            categoryId: categoryId || undefined,
            limit: 10,
            offset: 0,
        })
            .then(data => {
                if (cancelled) return;
                const rows = data ? data.rows : [];
                setProducts(
                    mapProductsWithImages(rows)
                        .filter(p => p.id !== currentId)
                        .slice(0, 8)
                );
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [city, categoryId, currentId, id, role]);

    return { products, isLoading };
}
