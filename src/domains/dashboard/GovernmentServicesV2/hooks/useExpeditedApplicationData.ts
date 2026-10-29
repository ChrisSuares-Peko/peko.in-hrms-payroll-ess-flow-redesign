import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import {
    VendorBusiness,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessesApi,
} from '../apis';
import { mapApiItem } from './useGovtServicesListApi';
import { setSelectedService } from '../slices';
import { ExpeditedApplicantDetailsValues } from '../types';
import { EMPTY_EXPEDITED_VALUES, EXPEDITED_STEP_TITLES } from '../utils/expeditedTrademarkForm';

// Resolves everything ExpeditedTrademarkRegistrationForm needs before it can render: the selected
// catalog service (rehydrated on a direct link, same as useObjectionApplicationData/
// useProtectionApplicationData), the saved draft (gid/engagementId/current step/any previously-
// saved form data), and the vendor's business list backing the Applicant Name picker (doc §2's
// business-picker substitute — see ExpeditedApplicationDetailsStep's own comment).
export default function useExpeditedApplicationData() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const navApplicationRowId =
        (location.state as { applicationRowId?: number } | null)?.applicationRowId ?? null;
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const selectedService = useAppSelector(
        state => state.reducer.governmentServices.selectedService
    );
    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);
    const serviceIdNum = Number(serviceId);
    const [isFetchingService, setIsFetchingService] = useState(false);

    const [gid, setGid] = useState<string | null>(null);
    const [engagementId, setEngagementId] = useState<string | null>(null);
    const [applicationRowId, setApplicationRowId] = useState<number | null>(null);
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialValues, setInitialValues] =
        useState<ExpeditedApplicantDetailsValues>(EMPTY_EXPEDITED_VALUES);
    const [businesses, setBusinesses] = useState<VendorBusiness[]>([]);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);

    // Rehydrates selectedService when arriving here directly — mirrors
    // useObjectionApplicationData's own copy of this exact effect.
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
            setGid(draft?.gid ?? null);
            setEngagementId(draft?.engagementId ?? null);
            setApplicationRowId(draft?.id ?? null);
            const savedForm = draft?.formData?.expeditedForm as
                | Partial<ExpeditedApplicantDetailsValues>
                | undefined;
            if (savedForm) {
                setInitialValues(prev => ({ ...prev, ...savedForm }));
            }
            const savedStep = draft?.formData?.currentStep as number | undefined;
            if (typeof savedStep === 'number') {
                setCurrentStep(Math.min(Math.max(savedStep, 0), EXPEDITED_STEP_TITLES.length - 1));
            } else if (savedForm) {
                setCurrentStep(EXPEDITED_STEP_TITLES.length - 1);
            }
            setHasCheckedDraft(true);
        });
    }, [selectedService?.accessKey, userId, role, navApplicationRowId]);

    // Doc §2's Applicant Name picker — substituted with the vendor's own Business List (see
    // ExpeditedApplicationDetailsStep's own comment), same vendor call Trademark Registration's own
    // Trademark Owner field already uses.
    useEffect(() => {
        if (!selectedService?.accessKey) {
            setIsLoadingBusinesses(false);
            return;
        }
        setIsLoadingBusinesses(true);
        getVendorBusinessesApi(userId, role, gid).then(list => {
            setBusinesses(list);
            setIsLoadingBusinesses(false);
        });
    }, [selectedService?.accessKey, gid, userId, role]);

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
        businesses,
        isLoadingBusinesses,
    };
}
