import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useFileDownloader from '@src/hooks/useFileDownloader';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    BulkSoftwareJSONUploadApi,
    SoftwareBulkExcelTemplateApi,
    SoftwareBulkExcelUploadApi,
} from '../../api/subscription';
import { resetData, setBulkSoftwareProductsData } from '../../slices/bulkUpload';
import {
    BulkSoftwareUploadResponse,
    SoftwareBulkExcelTemplateResponse,
} from '../../types/subscription';

export default function useSoftwareBulkUpload() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isExcelUploading, setIsExcelUploading] = useState(false);
    const [isTemplateFileLoading, setIsTemplateFileLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { handleDownloadLink } = useFileDownloader();

    const getSoftwareBulkUploadTemplate = useCallback(async () => {
        setIsTemplateFileLoading(true);
        const response: SoftwareBulkExcelTemplateResponse | false =
            await SoftwareBulkExcelTemplateApi({ userId: id, userType: role });
        if (response && response.softwareTemplateUrl) {
            handleDownloadLink(response.softwareTemplateUrl);
        }
        setIsTemplateFileLoading(false);
    }, [handleDownloadLink, id, role]);

    const BulkUpload = async (file: File) => {
        setIsExcelUploading(true);
        const response: BulkSoftwareUploadResponse | false | string =
            await SoftwareBulkExcelUploadApi({
                userId: id,
                userType: role,
                file,
            });
        if (response) {
            setIsExcelUploading(false);
            if (typeof response === 'string')
                return dispatch(showToast({ variant: 'error', description: response }));

            if (response.softwaresJsonData.length === 0) {
                dispatch(
                    showToast({
                        variant: 'warning',
                        description: 'Please add atleast one software product in your excel file',
                    })
                );
                return null;
            }
            dispatch(setBulkSoftwareProductsData(response?.softwaresJsonData));
            dispatch(
                showToast({
                    variant: 'success',
                    description: 'Please review the software products',
                })
            );
            navigate(`${paths.systemUser.manage}/bulk`, {
                state: { serviceName: 'softwareProducts' },
            });
        } else {
            dispatch(
                showToast({ variant: 'error', description: 'Bulk upload failed.Please try again' })
            );
        }
        return setIsExcelUploading(false);
    };

    const BulkCreate = async (payload: any) => {
        setIsLoading(true);
        const response: BulkSoftwareUploadResponse | false = await BulkSoftwareJSONUploadApi({
            ...payload,
            userId: id,
            userType: role,
        });
        if (response) {
            const { softwaresCreated, softwaresJsonData } = response;
            if (softwaresCreated === false) {
                dispatch(setBulkSoftwareProductsData(softwaresJsonData));
                dispatch(
                    showToast({ variant: 'success', description: 'Please review the products' })
                );
                navigate(`${paths.systemUser.manage}/bulk`, {
                    state: { serviceName: 'softwareProducts' },
                });
            } else {
                dispatch(resetData());
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Software Products created successfully',
                    })
                );
                navigate(paths.systemUser.manage, { state: { activeKey: '1' } });
            }
        } else {
            dispatch(resetData());
        }
        setIsLoading(false);
    };

    return {
        isTemplateFileLoading,
        getSoftwareBulkUploadTemplate,
        isExcelUploading,
        BulkUpload,
        BulkCreate,
        isLoading,
    };
}
