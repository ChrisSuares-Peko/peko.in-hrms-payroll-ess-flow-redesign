import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    VendorBusinessDetail,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessDetailApi,
} from '../apis';
import { mapApiItem } from './useGovtServicesListApi';
import useVendorDirectors from './useVendorDirectors';
import { setSelectedService } from '../slices';
import { GstCancellationValues } from '../types';
import { CANCELLATION_STEP_TITLES, EMPTY_CANCELLATION_VALUES } from '../utils/gstCancellationForm';

// Resolves everything GstCancellationForm needs before it can render — mirrors
// useObjectionApplicationData's shape (selectedService rehydration, saved draft via the same
// generic applications/drafts endpoint) plus one addition Objection never needed: looking up the
// business this cancellation is for. That business was already chosen pre-payment (the Select
// Business dropdown on ServiceProfileForm, see GST_Cancellation_Implementation_Plan.md §5.3) and its
// application_id was stored in the application row under formData.vendor.applicationId — the exact
// same field GST Registration/Trademark already write at Continue time
// (useServiceDetailActions.ts), so no backend change is needed to read it back here.
export default function useCancellationApplicationData() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const navApplicationRowId =
        (location.state as { applicationRowId?: number } | null)?.applicationRowId ?? null;
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const reduxService = useAppSelector(state => state.reducer.governmentServices.selectedService);
    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);
    const serviceIdNum = Number(serviceId);
    const selectedService = reduxService?.id === serviceIdNum ? reduxService : null;
    const [isFetchingService, setIsFetchingService] = useState(false);

    const [engagementId, setEngagementId] = useState<string | null>(null);
    const [applicationRowId, setApplicationRowId] = useState<number | null>(null);
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialValues, setInitialValues] =
        useState<GstCancellationValues>(EMPTY_CANCELLATION_VALUES);
    const [vendorBusiness, setVendorBusiness] = useState<VendorBusinessDetail | null>(null);
    const [isFetchingBusiness, setIsFetchingBusiness] = useState(false);
    const { directors, isSavingDirector, addDirector, setDirectors } = useVendorDirectors(userId, role);

    // Rehydrates selectedService when arriving here directly — same copy as
    // useObjectionApplicationData/useTrademarkApplicationData's own effect.
    useEffect(() => {
        if (selectedService) return;

        const cached = servicesList.find(s => s.id === serviceIdNum);
        if (cached) {
            dispatch(setSelectedService(cached));
            return;
        }

        setIsFetchingService(true);
        getGovtServicesListApi(userId, role).then(rawData => {
            const match = rawData.map(mapApiItem).find(s => s.id === serviceIdNum);
            if (match) {
                dispatch(setSelectedService(match));
            }
            setIsFetchingService(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceIdNum, selectedService]);

    useEffect(() => {
        if (!selectedService?.accessKey) return;
        getGovernmentServiceApplicationApi(
            userId,
            role,
            selectedService.accessKey,
            navApplicationRowId
        ).then(draft => {
            setEngagementId(draft?.engagementId ?? null);
            setApplicationRowId(draft?.id ?? null);
            const savedForm = draft?.formData?.cancellationForm as
                | Partial<GstCancellationValues>
                | undefined;
            const vendorApplicationId = (
                draft?.formData?.vendor as { applicationId?: string | number } | undefined
            )?.applicationId;
            if (savedForm) {
                setInitialValues(prev => ({ ...prev, ...savedForm }));
            } else if (vendorApplicationId) {
                // First time landing on the wizard post-payment — seed selectedVendorBusinessId
                // from the business chosen pre-payment rather than leaving it blank.
                setInitialValues(prev => ({
                    ...prev,
                    selectedVendorBusinessId: String(vendorApplicationId),
                }));
            }
            const savedStep = draft?.formData?.currentStep as number | undefined;
            if (typeof savedStep === 'number') {
                setCurrentStep(Math.min(Math.max(savedStep, 0), CANCELLATION_STEP_TITLES.length - 1));
            } else if (savedForm) {
                setCurrentStep(CANCELLATION_STEP_TITLES.length - 1);
            }
            setHasCheckedDraft(true);

            const resolvedApplicationId = savedForm?.selectedVendorBusinessId || vendorApplicationId;
            if (resolvedApplicationId) {
                setIsFetchingBusiness(true);
                getVendorBusinessDetailApi(userId, role, resolvedApplicationId).then(result => {
                    setVendorBusiness(result?.business ?? null);
                    // Seeds useVendorDirectors from this same call's directors — no separate fetch
                    // needed (the business-detail endpoint already returns both).
                    setDirectors(result?.directors ?? []);
                    setIsFetchingBusiness(false);
                });
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedService?.accessKey, userId, role, navApplicationRowId]);

    return {
        userId,
        role,
        navigate,
        selectedService,
        isFetchingService,
        engagementId,
        applicationRowId,
        hasCheckedDraft,
        currentStep,
        setCurrentStep,
        initialValues,
        vendorBusiness,
        isFetchingBusiness,
        directors,
        isSavingDirector,
        addDirector,
    };
}
