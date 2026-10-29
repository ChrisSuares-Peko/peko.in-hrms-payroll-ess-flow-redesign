import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { getStates } from '@domains/dashboard/profile/api/general';
import useBasicInfoApi from '@domains/dashboard/profile/hooks/useBasicInfoApi';
import { useCompanyNameFallback } from '@domains/dashboard/profile/hooks/useCompanyNameFallback';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import {
    VendorBusiness,
    VendorServiceDocument,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessesApi,
    getVendorServiceDocumentsApi,
} from '../apis';
import { mapApiItem } from './useGovtServicesListApi';
import { setSelectedService } from '../slices';
import { Service } from '../types';
import { getServiceDetailByAccessKey, resolveGovtServiceFormSegment } from '../utils';
import { isGstCancellationService } from '../utils/gstCancellationForm';
import { isGstRegistrationService } from '../utils/gstForm';
import { EMPTY_PROFILE_VALUES } from '../utils/serviceDetailForm';

export default function useServiceDetailData() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    // Only set when arriving via "Complete form submission" on My Applications; a plain "Apply
    // Now" click carries no state and always lands on a fresh registration form.
    const navState = location.state as {
        resumeExisting?: boolean;
        applicationRowId?: number;
        fallbackService?: Service;
    } | null;
    const resumeExisting = Boolean(navState?.resumeExisting);
    // Identifies exactly which application row to resume — without it, the draft lookup below
    // would resolve to whichever application for this service is most recently created, not
    // necessarily the one whose "Continue application" button was clicked (see MyApplications.tsx).
    const applicationRowId = navState?.applicationRowId ?? null;

    const fallbackService = navState?.fallbackService ?? null;
    const dispatch = useAppDispatch();
    const [isFetching, setIsFetching] = useState(false);

    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const reduxService = useAppSelector(state => state.reducer.governmentServices.selectedService);
    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);
    const serviceIdNum = Number(serviceId);

    const { data: basicInfo, isLoading: isBasicInfoLoading } = useBasicInfoApi({});
    const { name: companyName } = useCompanyNameFallback();
    const [profileValues, setProfileValues] = useState(EMPTY_PROFILE_VALUES);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [hasHydratedName, setHasHydratedName] = useState(false);
    const [hasHydratedBasicInfo, setHasHydratedBasicInfo] = useState(false);
    const [hasHydratedPan, setHasHydratedPan] = useState(false);
    // A previously-saved draft takes priority over the profile/company hooks' fresh data below —
    // nothing else prefills until we know whether one exists, avoiding a race between the two.
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    const [draftProfile, setDraftProfile] = useState<Record<string, string> | null>(null);
    const [hasHydratedVendorBusiness, setHasHydratedVendorBusiness] = useState(false);
    const [vendorBusinesses, setVendorBusinesses] = useState<VendorBusiness[]>([]);
    const [vendorDocuments, setVendorDocuments] = useState<VendorServiceDocument[]>([]);
    const [verifiedPan, setVerifiedPan] = useState('');
    // True once PAN is auto-filled from a trusted source (saved draft or Business List match) —
    // hides Verify; reset the moment the corporate edits the field.
    const [isPanPrefilled, setIsPanPrefilled] = useState(false);
    const [statesList, setStatesList] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        getStates().then(data => {
            if (data) setStatesList(data.states);
        });
    }, []);

    // Hydration completes once the fetch finishes loading (not once data shows up), so an empty
    // profile still unblocks the form. Held until hasCheckedDraft so a saved draft always wins.
    useEffect(() => {
        if (!hasCheckedDraft || hasHydratedName) return;
        const draftName = draftProfile?.legalBusinessName;
        if (draftName) {
            setProfileValues(prev => ({ ...prev, legalBusinessName: draftName }));
        } else if (companyName) {
            setProfileValues(prev => ({ ...prev, legalBusinessName: companyName }));
        }
        if (!isBasicInfoLoading) {
            setHasHydratedName(true);
        }
    }, [hasCheckedDraft, draftProfile, companyName, hasHydratedName, isBasicInfoLoading]);

    useEffect(() => {
        if (!hasCheckedDraft || hasHydratedBasicInfo) return;
        if (draftProfile) {
            setProfileValues(prev => ({
                ...prev,
                stateOfRegistration: draftProfile.stateOfRegistration || prev.stateOfRegistration,
                name: draftProfile.name || prev.name,
                email: draftProfile.email || prev.email,
                phoneNumber: draftProfile.phoneNumber || prev.phoneNumber,
                // GST Registration only — no company-profile fallback exists for these (see
                // ProfileValues in utils/serviceDetailForm.ts), so a saved draft is the only source.
                proposedName: draftProfile.proposedName || prev.proposedName,
                alternateName: draftProfile.alternateName || prev.alternateName,
            }));
        } else if (basicInfo) {
            setProfileValues(prev => ({
                ...prev,
                stateOfRegistration: basicInfo.state ?? prev.stateOfRegistration,
                name: basicInfo.contactPersonName ?? prev.name,
                email: basicInfo.email ?? prev.email,
                phoneNumber: basicInfo.mobileNo ?? prev.phoneNumber,
            }));
        }
        if (!isBasicInfoLoading) {
            setHasHydratedBasicInfo(true);
        }
    }, [hasCheckedDraft, draftProfile, basicInfo, hasHydratedBasicInfo, isBasicInfoLoading]);

    // PAN is deliberately NOT auto-filled from the company's profile PAN — it needs its own vendor
    // verification and may differ, so it starts blank unless a prior draft saved one. Entity Type
    // rides along here too since it's derived from this same PAN.
    useEffect(() => {
        if (!hasCheckedDraft || hasHydratedPan) return;
        if (draftProfile?.pan) {
            setProfileValues(prev => ({
                ...prev,
                pan: draftProfile.pan,
                entityType: draftProfile.entityType || prev.entityType,
            }));
            setIsPanPrefilled(true);
        }
        setHasHydratedPan(true);
    }, [hasCheckedDraft, draftProfile, hasHydratedPan]);

    const selectedService = reduxService?.id === serviceIdNum ? reduxService : null;

    // Existing draft for this service — its saved profile values take priority over the
    // profile/company hooks above (see hasCheckedDraft gating there). The redirect straight into
    // the Trademark form below only fires when resumeExisting is set.
    useEffect(() => {
        if (!selectedService?.accessKey || hasCheckedDraft) return;
        // The draft lookup only matters for the resumeExisting redirect below — skip the network
        // call entirely for a plain "Apply Now" visit, which always lands on a fresh form anyway.
        if (!resumeExisting) {
            setHasCheckedDraft(true);
            return;
        }
        getGovernmentServiceApplicationApi(
            userId,
            role,
            selectedService.accessKey,
            applicationRowId
        ).then(draft => {
            if (draft?.paymentStatus === 'COMPLETED') {
                // Trademark Registration, Trademark Objection, Expedited Trademark, GST
                // Registration, GST Cancellation and Import Export Code are separate forms — pick
                // the right one by service name/serviceId rather than assuming Registration (see
                // MyApplications.tsx's goToService for the same check on the other entry point into
                // these forms).
                let formSegment: string;
                if (selectedService.name?.toLowerCase().includes('import export code')) {
                    formSegment = paths.governmentServices.iec;
                } else if (isGstRegistrationService(selectedService.serviceId)) {
                    formSegment = paths.governmentServices.gstRegister;
                } else if (isGstCancellationService(selectedService.serviceId)) {
                    formSegment = paths.governmentServices.cancellation;
                } else {
                    formSegment = resolveGovtServiceFormSegment(selectedService.name);
                }
                navigate(
                    `${paths.dashboard.governmentServices}/${paths.governmentServices.service}/${selectedService.id}/${formSegment}`,
                    { state: { applicationRowId: draft.id } }
                );
                return;
            }
            const profile = draft?.formData?.profile as Record<string, string> | undefined;
            setDraftProfile(profile ?? null);
            setHasCheckedDraft(true);
        });
    }, [
        selectedService?.accessKey,
        hasCheckedDraft,
        userId,
        role,
        navigate,
        selectedService?.id,
        selectedService?.name,
        selectedService?.serviceId,
        resumeExisting,
        applicationRowId,
    ]);

    // Catalog-sourced services (Trademark et al.) get their accessKey from the vendor catalog row
    // id, not the old fixed list's govt_* strings.
    const isVendorCatalogService = Boolean(
        selectedService && !selectedService.accessKey.startsWith('govt_')
    );
    // Trademark Objection has no document upload step of its own — skip the Required documents
    // panel for it entirely rather than showing a list that's never actually collected.
    const isTrademarkObjectionService = Boolean(
        selectedService?.name?.toLowerCase().includes('objection')
    );

    // IndiaFilings vendor business prefill (doc §22). A single business is unambiguous and
    // prefilled directly; when the corporate has registered more than one, guessing by name match
    // was unreliable, so the corporate picks explicitly via the Select Business dropdown instead
    // (see handleSelectVendorBusiness) — that prefills the same fields once chosen. Doesn't gate
    // whether Continue calls Create Business (that's unconditional either way).
    useEffect(() => {
        if (!isVendorCatalogService || hasHydratedVendorBusiness || !hasHydratedName) return;
        getVendorBusinessesApi(userId, role).then(businesses => {
            setVendorBusinesses(businesses);
            if (businesses.length === 1) {
                const business = businesses[0];
                setProfileValues(prev => ({
                    ...prev,
                    legalBusinessName: business.business_name || prev.legalBusinessName,
                    pan: business.pan || prev.pan,
                    entityType: business.constitution || prev.entityType,
                }));
                if (business.pan) setIsPanPrefilled(true);
            }
            setHasHydratedVendorBusiness(true);
        });
    }, [isVendorCatalogService, hasHydratedVendorBusiness, hasHydratedName, userId, role]);

    // Selecting a business from the dropdown prefills the same fields the single-business auto-fill
    // above already uses.
    const handleSelectVendorBusiness = (applicationId: string) => {
        const business = vendorBusinesses.find(b => String(b.application_id) === applicationId);
        if (!business) return;
        setProfileValues(prev => ({
            ...prev,
            legalBusinessName: business.business_name || prev.legalBusinessName,
            pan: business.pan || prev.pan,
            entityType: business.constitution || prev.entityType,
        }));
        if (business.pan) setIsPanPrefilled(true);
    };

    // Preselects the dropdown when resuming a draft (or after the corporate has already picked
    // once) by matching whichever business's PAN/name is currently in the profile fields.
    const matchedVendorBusiness = vendorBusinesses.find(
        b =>
            (profileValues.pan && b.pan === profileValues.pan) ||
            (profileValues.legalBusinessName && b.business_name === profileValues.legalBusinessName)
    );
    const selectedVendorBusinessId = matchedVendorBusiness
        ? String(matchedVendorBusiness.application_id)
        : null;

    // Required documents (v4/docs/Service) — fetched from the vendor for catalog-sourced services.
    useEffect(() => {
        if (
            !isVendorCatalogService ||
            isTrademarkObjectionService ||
            selectedService?.serviceId == null
        )
            return;
        getVendorServiceDocumentsApi(userId, role, selectedService.serviceId).then(
            setVendorDocuments
        );
    }, [
        isVendorCatalogService,
        isTrademarkObjectionService,
        selectedService?.serviceId,
        userId,
        role,
    ]);

    // Rehydrates selectedService on a direct link/refresh (servicesList is empty in Redux then).
    // Re-fetches the full V2 catalog list since it has no single-item lookup endpoint.
    useEffect(() => {
        if (selectedService) return;

        const cached = servicesList.find(s => s.id === serviceIdNum);
        if (cached) {
            dispatch(setSelectedService(cached));
            return;
        }

        setIsFetching(true);
        getGovtServicesListApi(userId, role).then(rawData => {
            const match = rawData.map(mapApiItem).find(s => s.id === serviceIdNum);
            if (match) {
                dispatch(setSelectedService(match));
            } else if (fallbackService) {
                dispatch(setSelectedService(fallbackService));
            } else {
                navigate(`${paths.dashboard.governmentServices}/explore`);
            }
            setIsFetching(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceIdNum]);

    const detail = selectedService
        ? getServiceDetailByAccessKey(selectedService.accessKey)
        : undefined;
    const documents = isVendorCatalogService
        ? vendorDocuments.map(doc => doc.doc_name)
        : (detail?.documents ?? []);
    const isProfileLoading =
        !hasHydratedName ||
        !hasHydratedBasicInfo ||
        !hasHydratedPan ||
        (isVendorCatalogService && !hasHydratedVendorBusiness);

    return {
        userId,
        role,
        dispatch,
        navigate,
        selectedService,
        isFetching,
        resumeExisting,
        hasCheckedDraft,
        isVendorCatalogService,
        documents,
        statesList,
        isProfileLoading,
        profileValues,
        setProfileValues,
        fieldErrors,
        setFieldErrors,
        verifiedPan,
        setVerifiedPan,
        isPanPrefilled,
        setIsPanPrefilled,
        vendorBusinesses,
        selectedVendorBusinessId,
        handleSelectVendorBusiness,
    };
}
