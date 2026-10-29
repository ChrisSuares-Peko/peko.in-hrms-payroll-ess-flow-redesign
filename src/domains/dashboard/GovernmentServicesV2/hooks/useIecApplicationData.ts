import { useEffect, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useCompanyNameFallback } from '@domains/dashboard/profile/hooks/useCompanyNameFallback';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import { mapApiItem } from './useGovtServicesListApi';
import useVendorDirectors from './useVendorDirectors';
import {
    VendorBusiness,
    VendorServiceDocument,
    getGovernmentServiceApplicationApi,
    getGovtServicesListApi,
    getVendorBusinessesApi,
    getVendorServiceDocumentsApi,
} from '../apis';
import { getIecDropdownsApi } from '../apis/iec';
import { setSelectedService } from '../slices';
import { IecApplicantDetailsValues, Service } from '../types';
import { EMPTY_IEC_VALUES, IEC_STEP_TITLES } from '../utils/iecForm';

// What a successful upload (uploadVendorServiceDocumentApi) stores server-side under
// applicationData/formData.vendorServiceDocuments, keyed by document_Nid — same shape the backend
// controller writes, read back here to show already-uploaded state on resume.
export interface UploadedVendorDocument {
    fileUrl: string | null;
    fileName: string;
    docName: string | null;
}

// Resolves everything IecRegistrationForm needs before it can render: the selected catalog
// service (rehydrated on a direct link), the saved draft (created by ServiceDetail's own
// Continue → vendor business → payment flow, same as Trademark Registration/Objection — IEC now
// has a payment step too, so this just resumes the row like useObjectionApplicationData.ts does,
// rather than creating one itself), the linked business's name, the selected business's own
// vendor directors (View Business) for the Authorised Person picker, and the configured document
// types.
export default function useIecApplicationData() {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const navState = location.state as { applicationRowId?: number; fallbackService?: Service } | null;
    const navApplicationRowId = navState?.applicationRowId ?? null;
    const fallbackService = navState?.fallbackService ?? null;
    const dispatch = useAppDispatch();
    const { role, id: userId } = useAppSelector((state) => state.reducer.auth);
    const reduxService = useAppSelector((state) => state.reducer.governmentServices.selectedService);
    const servicesList = useAppSelector((state) => state.reducer.governmentServices.servicesList);
    const serviceIdNum = Number(serviceId);
    // Only trusted when it actually matches this route's service — a stale Redux value from a
    // previously visited service must not leak into this one (see useTrademarkApplicationData.ts
    // and useObjectionApplicationData.ts, which both got this same fix after exactly that bug).
    const selectedService = reduxService?.id === serviceIdNum ? reduxService : null;
    const [isFetchingService, setIsFetchingService] = useState(false);

    const { name: companyNameFallback } = useCompanyNameFallback();
    // Starts from the generic fallback, same as before, but overridden once a business is picked
    // from the new Business dropdown (onSelectBusiness in IecRegistrationForm.tsx) — mirrors
    // Trademark's own applyBusinessToValues prefilling entityType/authorizedPerson on selection.
    const [businessName, setBusinessName] = useState('');

    const [applicationRowId, setApplicationRowId] = useState<number | null>(null);
    // Create Lead's (doc v1.1 §6) customer_id — scopes the Business dropdown's list to this
    // application's own vendor account, same as Trademark's own gid-scoped business list.
    const [gid, setGid] = useState<string | null>(null);
    // Create Order's (doc v1.1 §19) engagement_id — now that IEC has a real payment step, this
    // resolves the same way Trademark/Objection's own engagementId does (off the saved draft),
    // feeding the RM card and the filed-application tracking state.
    const [engagementId, setEngagementId] = useState<string | null>(null);
    const [hasCheckedDraft, setHasCheckedDraft] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [initialValues, setInitialValues] = useState<IecApplicantDetailsValues>(EMPTY_IEC_VALUES);

    const { directors, isLoadingDirectors, isSavingDirector, loadDirectors, addDirector } = useVendorDirectors(userId, role);

    // Doc list for the Documents step — same vendor "documents list" call ServiceDetail.tsx uses
    // for the business-creation page's own Required Documents list, scoped by this service's own
    // vendor serviceId, so every upload field is driven by the vendor's own catalog rather than an
    // internal entity-type table.
    const [vendorDocuments, setVendorDocuments] = useState<VendorServiceDocument[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    // Keyed by document_Nid — seeded from the resumed draft's own saved upload state, then updated
    // locally as each upload succeeds (see IecRegistrationForm.tsx's handleFileSelect).
    const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedVendorDocument>>({});

    const [businesses, setBusinesses] = useState<VendorBusiness[]>([]);
    const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);

    // Doc "Dropdowns API" (service_id=11/operation=iec_details) — Import Details/Export Details'
    // shared combined options list, fetched live from the vendor (no static fallback copy anymore).
    // goods/services are kept separately (not just the combined display list) so the submit payload
    // can split a selected Import/Export Details item back into import_goods/import_services (doc
    // §4.2 "Split Goods and Services") — the vendor needs them as separate keys even though the
    // SmartForm shows them merged.
    const [importExportOptions, setImportExportOptions] = useState<{ label: string; value: string }[]>([]);
    const [isLoadingImportExportOptions, setIsLoadingImportExportOptions] = useState(true);
    const [iecGoods, setIecGoods] = useState<string[]>([]);
    const [iecServices, setIecServices] = useState<string[]>([]);

    useEffect(() => {
        getIecDropdownsApi(userId, role).then((options) => {
            const goods = options?.goods ?? [];
            const services = options?.services ?? [];
            setIecGoods(goods);
            setIecServices(services);
            setImportExportOptions([...goods, ...services].map((option) => ({ label: option, value: option })));
            setIsLoadingImportExportOptions(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Rehydrates selectedService when arriving here directly — mirrors
    // useTrademarkApplicationData's own copy of this exact effect.
    useEffect(() => {
        if (selectedService) return;

        const cached = servicesList.find((s) => s.id === serviceIdNum);
        if (cached) {
            dispatch(setSelectedService(cached));
            return;
        }

        setIsFetchingService(true);
        getGovtServicesListApi(userId, role).then((rawData) => {
            const match = rawData.map(mapApiItem).find((s) => s.id === serviceIdNum);
            if (match) {
                dispatch(setSelectedService(match));
            } else if (fallbackService) {
                dispatch(setSelectedService(fallbackService));
            }
            setIsFetchingService(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceIdNum, selectedService]);

    // Doc §4.1 "Open Application"/"Load Saved Draft" — the row already exists by the time this
    // page loads (created by ServiceDetail's Continue → vendor business → payment, same as
    // Trademark/Objection), so this only ever resumes it, never creates one.
    useEffect(() => {
        if (!selectedService?.accessKey) return;
        getGovernmentServiceApplicationApi(userId, role, selectedService.accessKey, navApplicationRowId).then((draft) => {
            setApplicationRowId(draft?.id ?? null);
            setGid(draft?.gid ?? null);
            setEngagementId(draft?.engagementId ?? null);
            const savedForm = draft?.formData?.iecForm as Partial<IecApplicantDetailsValues> | undefined;
            if (savedForm) setInitialValues((prev) => ({ ...prev, ...savedForm }));
            const savedDocuments = draft?.formData?.vendorServiceDocuments as Record<string, UploadedVendorDocument> | undefined;
            if (savedDocuments) setUploadedDocuments(savedDocuments);
            const savedStep = draft?.formData?.currentStep as unknown as number | undefined;
            if (typeof savedStep === 'number') {
                setCurrentStep(Math.min(Math.max(savedStep, 0), IEC_STEP_TITLES.length - 1));
            } else if (savedForm) {
                setCurrentStep(IEC_STEP_TITLES.length - 1);
            }
            setHasCheckedDraft(true);
        });
    }, [selectedService?.accessKey, userId, role, navApplicationRowId]);

    // Business dropdown (same mechanism as Trademark's "Trademark Owner" field) — fetched once the
    // draft lookup resolves a gid (or null, which falls back to every business on this account).
    useEffect(() => {
        if (!hasCheckedDraft) return;
        setIsLoadingBusinesses(true);
        getVendorBusinessesApi(userId, role, gid).then((rows) => {
            setBusinesses(rows);
            // Resuming a draft that already picked a business — re-derive the display name from
            // the fetched list since businessName itself isn't persisted in formData.iecForm.
            const picked = rows.find((b) => String(b.application_id) === initialValues.businessApplicationId);
            if (picked) {
                setBusinessName(picked.business_name);
                loadDirectors(picked.application_id);
            }
            setIsLoadingBusinesses(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasCheckedDraft, gid, userId, role]);

    // Falls back to the generic company-name hook until a business is actually picked from the
    // dropdown above (or resumed into, via the effect above).
    useEffect(() => {
        if (businessName || !companyNameFallback) return;
        setBusinessName(companyNameFallback);
    }, [businessName, companyNameFallback]);

    // Not needed on the first (Application Details) step — only fetched once the corporate
    // actually reaches the Documents step.
    useEffect(() => {
        if (currentStep === 0 || selectedService?.serviceId == null) return;
        setIsLoadingDocuments(true);
        getVendorServiceDocumentsApi(userId, role, selectedService.serviceId).then((rows) => {
            setVendorDocuments(rows);
            setIsLoadingDocuments(false);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, selectedService?.serviceId]);

    return {
        userId,
        role,
        navigate,
        selectedService,
        isFetchingService,
        applicationRowId,
        gid,
        engagementId,
        hasCheckedDraft,
        currentStep,
        setCurrentStep,
        initialValues,
        businessName,
        setBusinessName,
        businesses,
        isLoadingBusinesses,
        importExportOptions,
        isLoadingImportExportOptions,
        iecGoods,
        iecServices,
        directors,
        isLoadingDirectors,
        isSavingDirector,
        loadDirectors,
        addDirector,
        vendorDocuments,
        isLoadingDocuments,
        uploadedDocuments,
        setUploadedDocuments,
    };
}
