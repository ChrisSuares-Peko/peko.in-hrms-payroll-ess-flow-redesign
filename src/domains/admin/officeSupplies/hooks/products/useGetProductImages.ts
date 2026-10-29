import { useCallback, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getProductImages } from '../../api/products';
import { modalImage, productImageResp } from '../../types/products';

const useGetProductImages = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [loading, setIsLoading] = useState(false);
    const [productImages, setProductImages] = useState<modalImage>();
    const getProductImage = useCallback(
        async (prodId: number) => {
            setIsLoading(true);
            const data: productImageResp | false = await getProductImages({
                userId: id,
                userType: role,
                id: prodId,
            });
            if (data) {
                setProductImages({
                    productImage1: data.data.find(item => item.imageField === 'productImage1')
                        ?.productImageUrl!,
                    productImage2: data.data.find(item => item.imageField === 'productImage2')
                        ?.productImageUrl!,
                    productImage3: data.data.find(item => item.imageField === 'productImage3')
                        ?.productImageUrl!,
                });
                setIsLoading(false);
            }
        },
        [id, role]
    );

    return { productImages, getProductImage, loading };
};

export default useGetProductImages;
