import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RcFile } from 'antd/es/upload';
import { FormikErrors } from 'formik';
import { debounce } from 'lodash';
import { NavigateFunction } from 'react-router-dom';

import { getStates } from '@domains/dashboard/profile/api/general';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    GstJurisdictionOption,
    HsnCodeResult,
    gstJurisdictionLookupApi,
    searchHsnCodeApi,
    submitGovernmentServiceApplicationApi,
    submitGstFilingApi,
    uploadGstDocumentApi,
} from '../apis';
import { GstApplicationValues, Service } from '../types';
import { EMPTY_GST_VALUES, GST_DOCUMENT_TYPES, GstDocumentKey } from '../utils/gstForm';

// HSN + SAC together are capped at 5 each (GST_Registration.pdf §E5); SAC search isn't confirmed
// by IndiaFilings yet, so sacItems stays empty and this cap only ever applies to hsnItems for now.
const MAX_HSN_SELECTIONS = 5;

interface UseGstFormActionsParams {
    values: GstApplicationValues;
    setFieldValue: (
        field: string,
        value: unknown,
        shouldValidate?: boolean
    ) => Promise<void | FormikErrors<GstApplicationValues>>;
    validateForm: () => Promise<FormikErrors<GstApplicationValues>>;
    setTouched: (touched: Record<string, boolean>, shouldValidate?: boolean) => void;
    setErrors: (errors: FormikErrors<GstApplicationValues>) => void;
    userId: number;
    role: string;
    selectedService: Service;
    applicationRowId: number | null;
    applicationNumber: string | null;
    engagementId: string | null;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    navigate: NavigateFunction;
}

const EMPTY_JURISDICTION_OPTIONS: GstJurisdictionOption[] = [];

// HSN/SAC search handlers are added here in Phase 3 once the SAC endpoint is confirmed — see
// GST_REGISTRATION_IMPLEMENTATION_PLAN.md. Step-navigation, the Step 2 jurisdiction lookup, and
// final filing submit are built, following the same structure useTrademarkFormActions.ts uses.
export default function useGstFormActions({
    values,
    setFieldValue,
    validateForm,
    setTouched,
    setErrors,
    userId,
    role,
    selectedService,
    applicationRowId,
    applicationNumber,
    engagementId,
    currentStep,
    setCurrentStep,
    navigate,
}: UseGstFormActionsParams) {
    const dispatch = useAppDispatch();
    const [isSubmittingFiling, setIsSubmittingFiling] = useState(false);

    // Step 2 — GST Applying State options, fetched once on mount (same source ServiceDetail's
    // profile step uses).
    const [statesOptions, setStatesOptions] = useState<{ label: string; value: string }[]>([]);
    useEffect(() => {
        getStates().then(data => {
            if (data) setStatesOptions(data.states);
        });
    }, []);

    // Step 2 — pincode -> jurisdiction lookup (GST_Registration.pdf §E6). Cleared on every pincode
    // change per the spec, re-populated once a 6-digit pincode resolves.
    const [circleOptions, setCircleOptions] = useState<GstJurisdictionOption[]>(
        EMPTY_JURISDICTION_OPTIONS
    );
    const [commissionerateOptions, setCommissionerateOptions] = useState<GstJurisdictionOption[]>(
        EMPTY_JURISDICTION_OPTIONS
    );
    const [divisionOptions, setDivisionOptions] = useState<GstJurisdictionOption[]>(
        EMPTY_JURISDICTION_OPTIONS
    );
    const [rangeOptions, setRangeOptions] = useState<GstJurisdictionOption[]>(
        EMPTY_JURISDICTION_OPTIONS
    );
    const [isLookingUpJurisdiction, setIsLookingUpJurisdiction] = useState(false);
    // Guards a stale response from a fast-typed earlier pincode overwriting a later one.
    const lastLookedUpPincode = useRef('');

    // Auto-selects the single option a lookup usually returns (real jurisdiction lookups seen so
    // far return exactly one Circle/Commissionerate/Division/Range each) — the user only sees a
    // dropdown to pick from when a pincode genuinely resolves to more than one option.
    const autoSelect = (options: GstJurisdictionOption[], idField: string, nameField: string) => {
        if (options.length !== 1) return;
        setFieldValue(idField, options[0].value);
        setFieldValue(nameField, options[0].label);
    };

    const clearJurisdictionFields = () => {
        setCircleOptions(EMPTY_JURISDICTION_OPTIONS);
        setCommissionerateOptions(EMPTY_JURISDICTION_OPTIONS);
        setDivisionOptions(EMPTY_JURISDICTION_OPTIONS);
        setRangeOptions(EMPTY_JURISDICTION_OPTIONS);
        setFieldValue('circle', '');
        setFieldValue('circleId', '');
        setFieldValue('commissionerate', '');
        setFieldValue('commissionerateId', '');
        setFieldValue('division', '');
        setFieldValue('divisionId', '');
        setFieldValue('range', '');
        setFieldValue('rangeId', '');
    };

    const handlePincodeChange = async (pincode: string) => {
        // The four dropdowns are cleared on every change, per §E6 — not just when a new lookup
        // starts, so stale jurisdiction data never lingers against a pincode that no longer matches.
        clearJurisdictionFields();
        setFieldValue('district', '');
        setFieldValue('city', '');
        setFieldValue('place', '');
        if (pincode.length !== 6) return;

        lastLookedUpPincode.current = pincode;
        setIsLookingUpJurisdiction(true);
        const result = await gstJurisdictionLookupApi(userId, role, pincode);
        setIsLookingUpJurisdiction(false);
        // A later pincode edit already fired its own lookup — this response is stale.
        if (lastLookedUpPincode.current !== pincode) return;
        if (!result) {
            dispatch(
                showToast({
                    description:
                        'Could not find GST jurisdiction details for this pincode. Please check it and try again.',
                    variant: 'error',
                })
            );
            return;
        }

        setFieldValue('district', result.district || '');
        setFieldValue('city', result.city || '');
        setFieldValue('place', result.place || '');
        setCircleOptions(result.circle);
        setCommissionerateOptions(result.commissionerate);
        setDivisionOptions(result.division);
        setRangeOptions(result.range);
        autoSelect(result.circle, 'circleId', 'circle');
        autoSelect(result.commissionerate, 'commissionerateId', 'commissionerate');
        autoSelect(result.division, 'divisionId', 'division');
        autoSelect(result.range, 'rangeId', 'range');
    };

    const handleNext = async () => {
        // Validates against the current step's schema only; steps with no schema yet are a no-op.
        const validationErrors = await validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const touchedFields = Object.keys(EMPTY_GST_VALUES).reduce<Record<string, boolean>>(
                (acc, key) => ({ ...acc, [key]: true }),
                {}
            );
            setTouched(touchedFields, false);
            setErrors(validationErrors);
            return;
        }

        if (selectedService?.accessKey && applicationRowId) {
            await submitGovernmentServiceApplicationApi({
                userId,
                userType: role,
                accessKey: selectedService.accessKey,
                applicationId: applicationRowId,
                formData: {
                    gstForm: values,
                    currentStep: currentStep + 1,
                },
            });
        }
        setCurrentStep(currentStep + 1);
    };

    // Step 3 — HSN search (Top 5 Goods & Services, GST_Registration.pdf §E5). SAC search isn't
    // confirmed by IndiaFilings yet — see GST_REGISTRATION_PDF_SPEC.md — so only HSN is wired up;
    // sacItems stays permanently empty until that endpoint is confirmed.
    const [hsnSearchResults, setHsnSearchResults] = useState<HsnCodeResult[]>([]);
    const [isSearchingHsn, setIsSearchingHsn] = useState(false);

    const runHsnSearch = useMemo(
        () =>
            debounce(async (searchTerm: string) => {
                if (!searchTerm.trim()) {
                    setHsnSearchResults([]);
                    setIsSearchingHsn(false);
                    return;
                }
                const results = await searchHsnCodeApi(userId, role, searchTerm);
                setHsnSearchResults(results);
                setIsSearchingHsn(false);
            }, 400),
        [userId, role]
    );

    const handleHsnSearch = useCallback(
        (searchTerm: string) => {
            setIsSearchingHsn(true);
            runHsnSearch(searchTerm);
        },
        [runHsnSearch]
    );

    // Codes the Select currently shows selected — the raw antd Select this backs only speaks in
    // plain string values, so hsnItems' {code, description} pairs are reduced to codes for it.
    const hsnSelectedCodes = values.hsnItems.map(item => item.code);

    const handleHsnSelectionChange = (selectedCodes: string[]) => {
        if (selectedCodes.length > MAX_HSN_SELECTIONS) {
            dispatch(
                showToast({
                    description: `You can select up to ${MAX_HSN_SELECTIONS} HSN codes.`,
                    variant: 'info',
                })
            );
            return;
        }
        // A code's description comes from whichever list currently has it — the live search
        // results, or (for a code selected earlier, now scrolled out of the search results) the
        // already-selected items themselves. Both share the same {code, description} shape.
        const lookup = [...hsnSearchResults, ...values.hsnItems];
        const nextItems = selectedCodes.map(code => {
            const match = lookup.find(item => item.code === code);
            return { code, description: match?.description ?? '' };
        });
        setFieldValue('hsnItems', nextItems);
    };

    // Step 4 — Documents. Business/address-proof documents (see the comment on
    // GstApplicationValues.documents in types/index.ts) — mirrors useTrademarkFormActions.ts's
    // handleLogoFile exactly (base64 read -> upload -> only reflect in Formik on success).
    const [isUploadingDocument, setIsUploadingDocument] = useState<Record<GstDocumentKey, boolean>>(
        GST_DOCUMENT_TYPES.reduce(
            (acc, { key }) => ({ ...acc, [key]: false }),
            {} as Record<GstDocumentKey, boolean>
        )
    );

    const handleDocumentFileSelect =
        (key: GstDocumentKey, vendorDocType: string) => (file: RcFile) => {
            const isAllowedType = ['image/jpeg', 'image/png', 'application/pdf'].includes(
                file.type
            );
            if (!isAllowedType) return false;
            const reader = new FileReader();
            reader.onload = async () => {
                if (typeof reader.result !== 'string') return;
                const base64 = reader.result.split(',')[1];

                if (!selectedService?.accessKey) {
                    dispatch(
                        showToast({
                            description: 'Unable to upload the document. Please try again.',
                            variant: 'error',
                        })
                    );
                    return;
                }
                setIsUploadingDocument(prev => ({ ...prev, [key]: true }));
                const uploaded = await uploadGstDocumentApi(
                    userId,
                    role,
                    selectedService.accessKey,
                    base64,
                    file.name,
                    vendorDocType,
                    applicationRowId
                );
                setIsUploadingDocument(prev => ({ ...prev, [key]: false }));
                if (uploaded) {
                    setFieldValue(`documents.${key}`, {
                        docUrl: uploaded.docUrl,
                        fileName: file.name,
                    });
                    dispatch(
                        showToast({
                            description: 'Document uploaded successfully.',
                            variant: 'success',
                        })
                    );
                } else {
                    setFieldValue(`documents.${key}`, null);
                    dispatch(
                        showToast({
                            description: 'Unable to upload the document. Please try again.',
                            variant: 'error',
                        })
                    );
                }
            };
            reader.readAsDataURL(file);
            return false;
        };

    const handleDocumentRemove = (key: GstDocumentKey) => {
        setFieldValue(`documents.${key}`, null);
    };

    // GST Information (last step)'s Submit — files the Smart Form and marks the application
    // COMPLETED. Mirrors Trademark's handleSubmitFiling, including the fabricated
    // TrackedApplication object passed to the Tracking page via router state.
    const handleSubmitFiling = async () => {
        if (!selectedService?.accessKey) return;

        const validationErrors = await validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const touchedFields = Object.keys(EMPTY_GST_VALUES).reduce<Record<string, boolean>>(
                (acc, key) => ({ ...acc, [key]: true }),
                {}
            );
            setTouched(touchedFields, false);
            setErrors(validationErrors);
            return;
        }

        setIsSubmittingFiling(true);
        const result = await submitGstFilingApi(
            userId,
            role,
            selectedService.accessKey,
            { ...values },
            applicationRowId
        );
        setIsSubmittingFiling(false);
        if (!result) {
            dispatch(
                showToast({
                    description: 'Unable to submit the GST application. Please try again.',
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(
            showToast({
                description: 'GST application submitted successfully.',
                variant: 'success',
            })
        );

        navigate(`${paths.dashboard.governmentServices}/${paths.governmentServices.tracking}`, {
            state: {
                application: {
                    id: result.applicationId,
                    applicationId: applicationNumber,
                    engagementId,
                    status: 'COMPLETED',
                    paymentStatus: 'COMPLETED',
                    createdOn: new Date().toISOString(),
                    serviceName: selectedService.name,
                    serviceId: selectedService.serviceId,
                    legalBusinessName: values.businessName,
                },
            },
        });
    };

    return {
        handleNext,
        isSubmittingFiling,
        handleSubmitFiling,
        statesOptions,
        circleOptions,
        commissionerateOptions,
        divisionOptions,
        rangeOptions,
        isLookingUpJurisdiction,
        handlePincodeChange,
        hsnSearchResults,
        isSearchingHsn,
        handleHsnSearch,
        hsnSelectedCodes,
        handleHsnSelectionChange,
        isUploadingDocument,
        handleDocumentFileSelect,
        handleDocumentRemove,
    };
}
