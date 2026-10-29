import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useFileDownloader from '@src/hooks/useFileDownloader';
import { showToast } from '@src/slices/apiSlice';

import { ESIMBulkExcelTemplateApi, ESIMBulkExcelUploadApi } from '../api/eSIM';
import { BulkESIMUploadResponse, ESIMBulkExcelTemplateResponse } from '../types/eSIM';
// import { resetData, setBulkSoftwareProductsData } from '../../slices/bulkUpload';
// import {
//     BulkSoftwareUploadResponse,,
// } from '../types/eSIM';

export default function useEsimBulkUpload() {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isExcelUploading, setIsExcelUploading] = useState(false);
    const [isTemplateFileLoading, setIsTemplateFileLoading] = useState(false);
    const [isLoading] = useState(false);
    const { handleDownloadLink } = useFileDownloader();

    const getEsimBulkUploadTemplate = useCallback(async () => {
        setIsTemplateFileLoading(true);
        const response: ESIMBulkExcelTemplateResponse | false = await ESIMBulkExcelTemplateApi({
            userId: id,
            userType: role,
        });
        if (response && response.esimTemplateUrl) {
            handleDownloadLink(response.esimTemplateUrl);
        }
        setIsTemplateFileLoading(false);
    }, [handleDownloadLink, id, role]);

    const BulkUpload = async (file: File) => {
        setIsExcelUploading(true);
        const response: BulkESIMUploadResponse | false | string = await ESIMBulkExcelUploadApi({
            userId: id,
            userType: role,
            file,
        });
        if (response) {
            dispatch(
                showToast({
                    variant: 'success',
                    description: 'Bulk uploaded successfully',
                })
            );
        } else {
            dispatch(
                showToast({ variant: 'error', description: 'Bulk upload failed.Please try again' })
            );
        }
        return setIsExcelUploading(false);
    };

    // const BulkCreate = async (payload: any) => {
    //     setIsLoading(true);
    //     const response: BulkESIMUploadResponse | false = await ESIMBulkExcelUploadApi({
    //         ...payload,
    //         userId: id,
    //         userType: role,
    //     });
    //     if (response) {
    //         const { status,successfulPlans } = response;
    //         if (status === false) {
    //             // dispatch(setBulkSoftwareProductsData(successfulPlans));
    //             dispatch(
    //                 showToast({ variant: 'success', description: 'Please review the products' })
    //             );
    //             navigate(`${paths.systemUser.manage}/bulk`, {
    //                 state: { serviceName: 'softwareProducts' },
    //             });
    //         } else {
    //             // dispatch(resetData());
    //             dispatch(
    //                 showToast({
    //                     variant: 'success',
    //                     description: 'Software Products created successfully',
    //                 })
    //             );
    //             navigate(paths.systemUser.manage, { state: { activeKey: '1' } });
    //         }
    //     } else {
    //         // dispatch(resetData());
    //     }
    //     setIsLoading(false);
    // };

    return {
        isTemplateFileLoading,
        isExcelUploading,
        BulkUpload,
        // BulkCreate,
        getEsimBulkUploadTemplate,
        isLoading,
    };
}
