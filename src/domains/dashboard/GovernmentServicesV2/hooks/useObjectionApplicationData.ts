import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { getGovernmentServiceApplicationApi, getGovtServicesListApi } from '../apis';
import { mapApiItem } from './useGovtServicesListApi';
import { setSelectedService } from '../slices';
import { ObjectionApplicantDetailsValues } from '../types';
import { EMPTY_OBJECTION_VALUES, OBJECTION_STEP_TITLES } from '../utils/objectionForm';

// Resolves everything TrademarkObjectionForm needs before it can render: the selected catalog
// service (rehydrated on a direct link, same as useTrademarkApplicationData) and the saved draft
// (gid/engagementId/current step/any previously-saved objection form data) via the same generic
// applications/drafts endpoint Trademark Registration already uses — that endpoint reads straight
// off governmentServicesApplication, which both services share, so nothing new was needed on the
// backend for this part.
export default function useObjectionApplicationData() {
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

    const [gid, setGid] = useState<string | null>(null);
    const [engagementId, setEngagementId] = useState<string | null>(null);
    const [applicationRowId, setApplicationRowId] = useState<number | null>(null);
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialValues, setInitialValues] =
        useState<ObjectionApplicantDetailsValues>(EMPTY_OBJECTION_VALUES);

    // Rehydrates selectedService when arriving here directly — mirrors
    // useTrademarkApplicationData's own copy of this exact effect.
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
            const savedForm = draft?.formData?.objectionForm as
                | Partial<ObjectionApplicantDetailsValues>
                | undefined;
            if (savedForm) {
                setInitialValues(prev => ({ ...prev, ...savedForm }));
            }
            const savedStep = draft?.formData?.currentStep as number | undefined;
            if (typeof savedStep === 'number') {
                setCurrentStep(Math.min(Math.max(savedStep, 0), OBJECTION_STEP_TITLES.length - 1));
            } else if (savedForm) {
                setCurrentStep(OBJECTION_STEP_TITLES.length - 1);
            }
            setHasCheckedDraft(true);
        });
    }, [selectedService?.accessKey, userId, role, navApplicationRowId]);

    return {
        userId,
        role,
        navigate,
        selectedService,
        isFetchingService,
        gid,
        engagementId,
        applicationRowId,
        hasCheckedDraft,
        currentStep,
        setCurrentStep,
        initialValues,
    };
}
