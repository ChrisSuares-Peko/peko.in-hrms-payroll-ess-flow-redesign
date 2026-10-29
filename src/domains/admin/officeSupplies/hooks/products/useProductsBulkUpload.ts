import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useFileDownloader from '@src/hooks/useFileDownloader';
import { showToast } from '@src/slices/apiSlice';

import { paths } from '../../../../../routes/paths';
import {
    BulkProductsExcelUploadApi,
    BulkProductsJSONUploadApi,
    ProductBulkExcelTemplateApi,
} from '../../api/products';
import { resetData, setBulkProductsData } from '../../slices/bulkProducts';
import {
    BulkProductsUploadPayload,
    BulkProductsUploadResponse,
    ProductBulkExcelTemplateResponse,
} from '../../types/products';

export function useProductsBulkUpload() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [isTempLoading, setTempIsLoading] = useState(false);
    const { handleDownloadLink } = useFileDownloader();

    const getProductBulkUploadTemplate = useCallback(async () => {
        setTempIsLoading(true);
        const response: ProductBulkExcelTemplateResponse | false =
            await ProductBulkExcelTemplateApi({ userId: id, userType: role });
        if (response && response.productsTemplateUrl) {
            handleDownloadLink(response.productsTemplateUrl);
        }
        setTempIsLoading(false);
    }, [handleDownloadLink, id, role]);

    const BulkUpload = async (payload: BulkProductsUploadPayload) => {
        setIsLoading(true);
        const response: BulkProductsUploadResponse | false | string =
            await BulkProductsExcelUploadApi({
                ...payload,
                userId: id,
                userType: role,
            });
        if (typeof response === 'string')
            return dispatch(showToast({ variant: 'error', description: response }));

        if (response) {
            dispatch(setBulkProductsData(response?.productsJsonData));
     
            setTimeout(() => {
                dispatch(
                    showToast({ variant: 'success', description: 'Please review the records' })
                );
            }, 1000);
            navigate(`${paths.systemUser.manage}/bulk-upload`);
        } else {
            dispatch(
                showToast({ variant: 'error', description: 'Bulk upload failed.Please try again' })
            );
        }

        setIsLoading(false);
        return null;
    };

    const BulkCreate = async (payload: BulkProductsUploadPayload) => {
        setIsLoading(true);
        const response: BulkProductsUploadResponse | false = await BulkProductsJSONUploadApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            const { productsCreated, productsJsonData } = response;
            if (productsCreated === false) {
                dispatch(setBulkProductsData(productsJsonData));
                dispatch(
                    showToast({ variant: 'success', description: 'Please review the products' })
                );
            } else {
                dispatch(resetData());
                dispatch(
                    showToast({ variant: 'success', description: 'Products created successfully' })
                );
            }
        } else {
            dispatch(resetData());
        }
        setIsLoading(false);
    };

    return { getProductBulkUploadTemplate, BulkUpload, BulkCreate, isLoading, isTempLoading };
}
