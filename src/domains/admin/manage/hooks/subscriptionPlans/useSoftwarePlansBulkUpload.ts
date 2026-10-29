import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useFileDownloader from '@src/hooks/useFileDownloader';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    BulkSoftwarePlansJSONUploadApi,
    SoftwarePlansBulkTemplateApi,
    SoftwarePlansBulkUploadApi,
} from '../../api/subscriptionPlans';
import { resetData, setBulkSoftwarePlansData } from '../../slices/bulkUpload';
import {
    BulkSoftwarePlansUploadResponse,
    SoftwarePlansBulkTemplateResponse,
} from '../../types/subscriptionPlans';

export default function useSoftwareBulkUpload() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isExcelUploading, setIsExcelUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isTemplateFileLoading, setIsTemplateFileLoading] = useState(false);
    const { handleDownloadLink } = useFileDownloader();

    const getSoftwarePlansBulkUploadTemplate = useCallback(async () => {
        setIsTemplateFileLoading(true);
        const response: SoftwarePlansBulkTemplateResponse | false =
            await SoftwarePlansBulkTemplateApi({ userId: id, userType: role });
        if (response && response.planTemplateUrl) {
            handleDownloadLink(response.planTemplateUrl);
        }
        setIsTemplateFileLoading(false);
    }, [handleDownloadLink, id, role]);

    const BulkUpload = async (file: File) => {
        setIsExcelUploading(true);
        const response: BulkSoftwarePlansUploadResponse | false | string =
            await SoftwarePlansBulkUploadApi({
                userId: id,
                userType: role,
                file,
            });
        if (typeof response === 'string') {
            setIsExcelUploading(false);
            return dispatch(showToast({ variant: 'error', description: response }));
        }

        if (response) {
            dispatch(setBulkSoftwarePlansData(response?.softwaresJsonData));
            dispatch(
                showToast({
                    variant: 'success',
                    description: 'Please review the software plans',
                })
            );
            navigate(`${paths.systemUser.manage}/bulk`, {
                state: { serviceName: 'softwarePlans' },
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
        const response: BulkSoftwarePlansUploadResponse | false =
            await BulkSoftwarePlansJSONUploadApi({
                ...payload,
                userId: id,
                userType: role,
            });
        if (response) {
            const { plansCreated, softwaresJsonData } = response;
            if (plansCreated) {
                dispatch(resetData());
                dispatch(
                    showToast({
                        variant: 'success',
                        description: 'Software Plans created successfully',
                    })
                );
                navigate(paths.systemUser.manage, { state: { activeKey: '2' } });
            } else {
                dispatch(setBulkSoftwarePlansData(softwaresJsonData));
                dispatch(
                    showToast({ variant: 'success', description: 'Please review the products' })
                );
                navigate(`${paths.systemUser.manage}/bulk`, {
                    state: { serviceName: 'softwarePlans' },
                });
            }
        } else {
            dispatch(resetData());
        }
        setIsLoading(false);
    };

    return {
        isTemplateFileLoading,
        getSoftwarePlansBulkUploadTemplate,
        isExcelUploading,
        BulkUpload,
        BulkCreate,
        isLoading,
    };
}
