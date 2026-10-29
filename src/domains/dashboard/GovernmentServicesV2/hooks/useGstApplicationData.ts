import { useEffect, useRef, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import {
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessDetailApi,
} from '../apis';
import { mapApiItem } from './useGovtServicesListApi';
import { setSelectedService } from '../slices';
import { GstApplicationValues } from '../types';
import { EMPTY_GST_VALUES, GST_STEP_TITLES } from '../utils/gstForm';

// GST's Step 1 Business Name/PAN/Entity Type come from a single business record tied to this
// application (GST_Registration.pdf §E2/§E4: "Business Name is selected via parent workspace
// postMessage. It resolves to the business record created from the Proposed Name at payment
// success — the customer does not retype it") — unlike Trademark, there's no "pick from this
// gid's businesses" dropdown to build here.
export default function useGstApplicationData() {
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
    const [isLoadingBusiness, setIsLoadingBusiness] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    // Tracks the last pincode a jurisdiction lookup ran for (Phase 2) — kept here so
    // useGstFormActions doesn't need its own ref threaded separately, same as Trademark's.
    const lastLookedUpPincode = useRef('');

    // gid (Create Lead's customer_id) and Create Business application number, read off the saved
    // draft — scopes the View Business call below to this corporate's own business.
    const [gid, setGid] = useState<string | null>(null);
    const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
    // Create Order's engagement_id, required by Smart Form submission.
    const [engagementId, setEngagementId] = useState<string | null>(null);
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    // This application's own DB row id — used to save each step back via the same
    // applications/save endpoint ServiceDetail.tsx's profile step uses.
    const [applicationRowId, setApplicationRowId] = useState<number | null>(null);
    // Previously saved applicationData.gstForm, overlaid on the resolved vendor business fields
    // below so a corporate's own edits survive a reload instead of being clobbered.
    const [draftFormValues, setDraftFormValues] = useState<Partial<GstApplicationValues> | null>(
        null
    );
    // Pre-payment profile (ServiceDetail's Primary Details step) — email/mobile/PAN fallback when
    // the vendor Business API hasn't returned them yet (its email/mobile fields are Base64-encoded
    // per the IndiaFilings x PEKO API guide §1.1/§22 and are not decoded here, so they're not used
    // as a prefill source for those two fields).
    const [profileSnapshot, setProfileSnapshot] = useState<Record<string, string> | null>(null);
    // Seeds Formik's initialValues once resolved below (Formik only reads this at mount).
    const [initialValues, setInitialValues] = useState<GstApplicationValues>(EMPTY_GST_VALUES);

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
            setProfileSnapshot(
                (draft?.formData?.profile as Record<string, string> | undefined) ?? null
            );
            const savedForm =
                (draft?.formData?.gstForm as Partial<GstApplicationValues> | undefined) ?? null;
            setDraftFormValues(savedForm);
            // handleNext saves the step it's advancing TO, so resume lands exactly there.
            const savedStep = draft?.formData?.currentStep as number | undefined;
            if (typeof savedStep === 'number') {
                setCurrentStep(Math.min(Math.max(savedStep, 0), GST_STEP_TITLES.length - 1));
            } else if (savedForm) {
                // Older drafts saved before step tracking existed — GST Information is the best guess.
                setCurrentStep(GST_STEP_TITLES.length - 1);
            }
            setHasCheckedDraft(true);
        });
    }, [selectedService?.accessKey, userId, role, navApplicationRowId]);

    // View Business (single record, scoped by this application's own vendor application number) —
    // a previously-saved draft wins over the vendor's defaults so a corporate's own edits aren't
    // clobbered on reload, same precedence as Trademark's business resolution.
    useEffect(() => {
        if (!hasCheckedDraft) return;
        if (!applicationNumber) {
            if (draftFormValues) {
                setInitialValues(prev => ({ ...prev, ...draftFormValues }));
            }
            setIsLoadingBusiness(false);
            return;
        }

        getVendorBusinessDetailApi(userId, role, applicationNumber).then(result => {
            const business = result?.business ?? null;
            const constitution = business?.constitution || '';
            const businessName = business?.business_name || business?.trade_name || '';
            const pan = business?.pan || profileSnapshot?.pan || '';
            const cin = business?.cin || '';
            // Seeds the Authorized Persons list with one entry from the business's registered
            // contact, marked as the primary Authorized Person — the user fills in/edits the rest
            // (PAN, DOB, relationship, etc.) and can add more people on Step 1. Only seeded when the
            // business actually has a name and the list is still empty, so this never clobbers a
            // draft's already-edited list (a previously-saved draft still wins overall via the
            // spread below).
            const seededPersonKey = crypto.randomUUID();
            const seededAuthorizedPersons: GstApplicationValues['authorizedPersons'] =
                business?.name
                    ? [
                          {
                              key: seededPersonKey,
                              salutation: '',
                              fullName: business.name,
                              pan: '',
                              dob: '',
                              mobile: '',
                              email: '',
                              relationship: '',
                          },
                      ]
                    : [];

            setInitialValues(prev => ({
                ...prev,
                businessName,
                entityType: constitution,
                authorizedPersons: prev.authorizedPersons.length
                    ? prev.authorizedPersons
                    : seededAuthorizedPersons,
                // Only point at seededPersonKey when a person was actually seeded (business?.name
                // truthy) — otherwise this would set a phantom key matching no real person, which
                // silently blocks GstApplicantDetailsStep's addPerson() from ever auto-selecting
                // the first person added (its check is `if (!primaryAuthorizedPersonKey)`, and a
                // dangling non-empty string reads as "already set"). Confirmed live 2026-09-29.
                primaryAuthorizedPersonKey:
                    !prev.authorizedPersons.length && seededAuthorizedPersons.length
                        ? seededPersonKey
                        : prev.primaryAuthorizedPersonKey,
                pan,
                cin,
                email: profileSnapshot?.email || prev.email,
                mobileNumber: profileSnapshot?.phoneNumber || prev.mobileNumber,
                // A previously-saved draft wins over the vendor's/profile's defaults.
                ...(draftFormValues || {}),
            }));
            setIsLoadingBusiness(false);
        });
    }, [hasCheckedDraft, applicationNumber, userId, role, draftFormValues, profileSnapshot]);

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
        isLoadingBusiness,
        currentStep,
        setCurrentStep,
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
