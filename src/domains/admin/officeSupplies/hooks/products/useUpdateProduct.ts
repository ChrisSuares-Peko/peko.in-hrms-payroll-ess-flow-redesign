import { useCallback, useEffect, useState } from 'react';

import { DropDown } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';

import { getVendors, getCategories, createProduct, updateProduct } from '../../api/products';
import {
    Category,
    CategoryData,
    NewProduct,
    Product,
    VenderData,
    search,
    Vendor,
} from '../../types/products';

const useUpdateProduct = ({ searchCategories, searchVendors }: search) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [categoryData, setCategoryData] = useState<DropDown>();
    const [allVendors, setAllvendors] = useState<Vendor[]>();
    const [vendorData, setVendorData] = useState<DropDown>();
    const getAllCategories = useCallback(async () => {
        const data: CategoryData | false = await getCategories({
            userId: id,
            userType: role,
            searchCategories,
        });
        if (data) {
            const arr = data.categoryData.map((item: Category) => ({
                value: item.id.toString(),
                label: item.categoryName,
            }));
            setCategoryData(arr);
        }
    }, [id, role, searchCategories]);
    const getAllVendors = useCallback(async () => {
        const data: VenderData | false = await getVendors({
            userId: id,
            userType: role,
            searchVendors,
        });
        if (data) {
            setAllvendors(data.result);
            const arr = data.result.map((item: Vendor) => ({
                value: item.id.toString(),
                label: item.vendorName,
            }));
            setVendorData(arr);
        }
    }, [id, role, searchVendors]);

    const createProducts = useCallback(
        async (payload: NewProduct) => {
            const data: any = await createProduct({
                userId: id,
                userType: role,
                ...payload,
            });

            // return data

            if (data && data.status) {
                return true;
            }
            return data.message;
        },
        [id, role]
    );
    const updateProducts = useCallback(
        async (payload: NewProduct) => {
            const data: Product | false = await updateProduct({
                userId: id,
                userType: role,
                ...payload,
            });

            if (data) {
                return true;
            }
            return false;
        },
        [id, role]
    );

    useEffect(() => {
        getAllCategories();
        getAllVendors();
    }, [getAllCategories, getAllVendors]);

    return { vendorData, categoryData, updateProducts, createProducts, allVendors };
};

export default useUpdateProduct;
