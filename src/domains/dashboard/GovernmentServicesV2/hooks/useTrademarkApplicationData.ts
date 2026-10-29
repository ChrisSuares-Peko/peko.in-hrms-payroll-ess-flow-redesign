import { useEffect, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import {
    VendorBusiness,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getTrademarkLanguagesApi,
    getVendorBusinessDetailApi,
    getVendorBusinessesApi,
} from '../apis';
import { mapApiItem } from './useGovtServicesListApi';
import { setSelectedService } from '../slices';
import { ApplicantDetailsValues, Service } from '../types';
import { EMPTY_VALUES, STEP_TITLES, isIndividualEntity } from '../utils/trademarkForm';

export default function useTrademarkApplicationData() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const navState = location.state as {
        applicationRowId?: number;
        fallbackService?: Service;
    } | null;
    const navApplicationRowId = navState?.applicationRowId ?? null;

    const fallbackService = navState?.fallbackService ?? null;
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const reduxService = useAppSelector(state => state.reducer.governmentServices.selectedService);
    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);
    const serviceIdNum = Number(serviceId);
    const selectedService = reduxService?.id === serviceIdNum ? reduxService : null;

    const [isFetchingService, setIsFetchingService] = useState(false);

    const [businesses, setBusinesses] = useState<VendorBusiness[]>([]);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    // Display name only — the actual base64/format live in Formik's logo/logoFormat fields.
    const [logoFileName, setLogoFileName] = useState('');

    // Language master list, fetched once from the BE; the Select itself is searchable.
    const [languageOptions, setLanguageOptions] = useState<{ label: string; value: string }[]>([]);

    // Tracks the last pincode a lookup ran for, so retyping the same value doesn't re-fire it.
    const lastLookedUpPincode = useRef('');

    // gid (Create Lead's customer_id) and Create Business application number, read off the saved
    // draft — scope the Business List/View Business calls below to this corporate's own business.
    const [gid, setGid] = useState<string | null>(null);
    const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
    // Create Order's (doc §19) engagement_id, required by Smart Form submission (doc §21).
    const [engagementId, setEngagementId] = useState<string | null>(null);
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    // This application's own DB row id — used to save each step back via the same
    // applications/save endpoint ServiceDetail.tsx's profile step uses.
    const [applicationRowId, setApplicationRowId] = useState<number | null>(null);
    // Previously saved applicationData.trademarkForm, overlaid on the resolved vendor business
    // fields below so a corporate's own edits survive a reload instead of being clobbered.
    const [draftFormValues, setDraftFormValues] = useState<
        (Partial<ApplicantDetailsValues> & { logoFileName?: string }) | null
    >(null);
    // Seeds Formik's initialValues once resolved below (Formik only reads this at mount).
    const [initialValues, setInitialValues] = useState<ApplicantDetailsValues>(EMPTY_VALUES);

    useEffect(() => {
        getTrademarkLanguagesApi(userId, role).then(languages => {
            setLanguageOptions(languages.map(language => ({ label: language, value: language })));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Rehydrates selectedService when arriving here directly (My Applications' "Continue" on an
    // already-paid application skips ServiceDetail entirely) and Redux hasn't been populated yet.
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
            } else if (fallbackService) {
                dispatch(setSelectedService(fallbackService));
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
            setApplicationNumber(draft?.applicationNumber ?? null);
            setEngagementId(draft?.engagementId ?? null);
            setApplicationRowId(draft?.id ?? null);
            const savedForm =
                (draft?.formData?.trademarkForm as
                    | (Partial<ApplicantDetailsValues> & { logoFileName?: string })
                    | undefined) ?? null;
            setDraftFormValues(savedForm);
            // handleNext saves the step it's advancing TO, so resume lands exactly there.
            const savedStep = draft?.formData?.currentStep as number | undefined;
            if (typeof savedStep === 'number') {
                setCurrentStep(Math.min(Math.max(savedStep, 0), STEP_TITLES.length - 1));
            } else if (savedForm) {
                // Older drafts saved before step tracking existed — Review is the best guess.
                setCurrentStep(STEP_TITLES.length - 1);
            }
            setHasCheckedDraft(true);
        });
    }, [selectedService?.accessKey, userId, role, navApplicationRowId]);

    // Business List (by gid) + View Business (by application_id) together resolve the fullest
    // record for this application — View Business wins on overlapping fields since it's specific
    // to this application rather than the shared gid-wide list.
    useEffect(() => {
        if (!hasCheckedDraft) return;
        if (!gid) {
            if (draftFormValues) {
                setInitialValues(prev => ({
                    ...prev,
                    ...draftFormValues,
                    // usedSinceDisplay isn't persisted (see types/index.ts) — re-derived here from
                    // the resumed usedSince so the field shows DD-MM-YYYY instead of coming up blank.
                    usedSinceDisplay: draftFormValues.usedSince
                        ? dayjs(draftFormValues.usedSince, 'YYYY-MM-DD').format('DD-MM-YYYY')
                        : '',
                }));
                setLogoFileName(draftFormValues.logoFileName ?? '');
                lastLookedUpPincode.current = draftFormValues.pincode ?? '';
            }
            setIsLoadingBusinesses(false);
            return;
        }

        Promise.all([
            getVendorBusinessesApi(userId, role, gid),
            applicationNumber
                ? getVendorBusinessDetailApi(userId, role, applicationNumber)
                : Promise.resolve(null),
        ]).then(([list, detailResult]) => {
            setBusinesses(list);

            const listMatch = applicationNumber
                ? list.find(b => String(b.application_id) === String(applicationNumber))
                : list[0];
            const detail = detailResult?.business ?? null;

            const constitution = detail?.constitution || listMatch?.constitution || '';
            const businessName = detail?.business_name || listMatch?.business_name || '';
            const contactName = detail?.name || listMatch?.name || '';
            const authorizedPerson = isIndividualEntity(constitution) ? businessName : contactName;
            const address = [
                detail?.address_line1 || listMatch?.address_line1,
                detail?.address_line2 || listMatch?.address_line2,
            ]
                .filter(Boolean)
                .join(', ');
            const pincodeValue = detail?.pincode ?? listMatch?.pincode;
            const pincode = pincodeValue != null && pincodeValue !== '' ? String(pincodeValue) : '';
            const state = detail?.state || listMatch?.state || '';
            const district = detail?.district || listMatch?.district || '';
            const country = detail?.country || listMatch?.country || '';
            // Not shown in the UI — only needed at Smart Form submission time (doc §21).
            const city = detail?.city || listMatch?.city || '';

            setInitialValues(prev => ({
                ...prev,
                trademarkOwner:
                    applicationNumber ?? (listMatch ? String(listMatch.application_id) : ''),
                entityType: constitution,
                authorizedPerson,
                address,
                pincode,
                state,
                district,
                country,
                city,
                // A previously-saved draft wins over the vendor's defaults so a corporate's own
                // edits aren't clobbered on reload.
                ...(draftFormValues || {}),
            }));
            setLogoFileName(draftFormValues?.logoFileName ?? '');
            // Counts this prefilled pincode as already resolved so the lookup below only
            // re-fires once the corporate types a genuinely different one.
            lastLookedUpPincode.current = draftFormValues?.pincode ?? pincode;
            setIsLoadingBusinesses(false);
        });
    }, [hasCheckedDraft, gid, applicationNumber, userId, role, draftFormValues]);

    const goBack = () => {
        navigate(
            `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${serviceId}`
        );
    };

    return {
        userId,
        role,
        selectedService,
        isFetchingService,
        businesses,
        isLoadingBusinesses,
        currentStep,
        setCurrentStep,
        logoFileName,
        setLogoFileName,
        languageOptions,
        lastLookedUpPincode,
        gid,
        applicationNumber,
        engagementId,
        applicationRowId,
        initialValues,
        goBack,
        navigate,
    };
}
