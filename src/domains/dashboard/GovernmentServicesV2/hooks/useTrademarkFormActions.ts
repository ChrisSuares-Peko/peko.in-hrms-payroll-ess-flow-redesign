import { MutableRefObject, useRef, useState } from 'react';

import { RcFile } from 'antd/es/upload';
import { FormikErrors } from 'formik';
import { NavigateFunction } from 'react-router-dom';

import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import {
    SimilarTrademark,
    TrademarkClassDescription,
    VendorBusiness,
    getTrademarkClassApi,
    locationLookupApi,
    searchSimilarTrademarksApi,
    submitGovernmentServiceApplicationApi,
    submitTrademarkFilingApi,
    uploadTrademarkLogoApi,
} from '../apis';
import { ApplicantDetailsValues, Service } from '../types';
import { EMPTY_VALUES, isIndividualEntity } from '../utils/trademarkForm';

// Doc §3 Step 3 — the vendor logo must be exactly 450×450px.
const REQUIRED_LOGO_DIMENSION = 450;

const getImageDimensions = (file: RcFile): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Unable to read image dimensions'));
        };
        img.src = objectUrl;
    });

interface UseTrademarkFormActionsParams {
    values: ApplicantDetailsValues;
    setFieldValue: (field: string, value: unknown) => void;
    validateForm: () => Promise<FormikErrors<ApplicantDetailsValues>>;
    setTouched: (touched: Record<string, boolean>, shouldValidate?: boolean) => void;
    setErrors: (errors: FormikErrors<ApplicantDetailsValues>) => void;
    userId: number;
    role: string;
    selectedService: Service;
    applicationRowId: number | null;
    applicationNumber: string | null;
    engagementId: string | null;
    businesses: VendorBusiness[];
    currentStep: number;
    setCurrentStep: (step: number) => void;
    logoFileName: string;
    setLogoFileName: (name: string) => void;
    lastLookedUpPincode: MutableRefObject<string>;
    navigate: NavigateFunction;
}

export default function useTrademarkFormActions({
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
    businesses,
    currentStep,
    setCurrentStep,
    logoFileName,
    setLogoFileName,
    lastLookedUpPincode,
    navigate,
}: UseTrademarkFormActionsParams) {
    const dispatch = useAppDispatch();

    const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);

    // Trademark Class Identification (doc §24) results for the last goods/service search,
    // filtered by the selected Class to build the Description multi-select's options.
    const [classDescriptions, setClassDescriptions] = useState<TrademarkClassDescription[]>([]);
    const [isSearchingGoodsOrService, setIsSearchingGoodsOrService] = useState(false);
    const goodsSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Similar Trademark Search — backs the Brand field's search icon (Step 2).
    const [isSearchingSimilar, setIsSearchingSimilar] = useState(false);
    const [similarTrademarks, setSimilarTrademarks] = useState<SimilarTrademark[]>([]);
    const [isSimilarModalOpen, setIsSimilarModalOpen] = useState(false);
    const [similarClassFilter, setSimilarClassFilter] = useState('all');

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isSubmittingFiling, setIsSubmittingFiling] = useState(false);

    // Manual re-selection from the Trademark Owner dropdown (e.g. this gid has more than one
    // business). Sourced from the already-fetched Business List — no fresh View Business call,
    // since the list already has the full address.
    const applyBusinessToValues = (business: VendorBusiness | undefined) => {
        if (!business) return;
        const constitution = business.constitution ?? '';
        const address = [business.address_line1, business.address_line2].filter(Boolean).join(', ');
        const pincode = business.pincode != null ? String(business.pincode) : '';
        const state = business.state ?? '';
        const district = business.district ?? '';
        const country = business.country ?? '';
        const city = business.city ?? '';
        // Individual entities have no separate authorized person — the applicant themself is
        // used; otherwise it's the business's registered contact.
        const authorizedPerson = isIndividualEntity(constitution)
            ? (business.business_name ?? '')
            : (business.name ?? '');

        setFieldValue('entityType', constitution);
        setFieldValue('address', address);
        setFieldValue('pincode', pincode);
        setFieldValue('state', state);
        setFieldValue('district', district);
        setFieldValue('country', country);
        setFieldValue('city', city);
        setFieldValue('authorizedPerson', authorizedPerson);
        // Came from the Business API, not a typed address — don't treat as a fresh lookup target.
        lastLookedUpPincode.current = pincode;
    };

    // Re-derives State/District/Country via the vendor's pincode lookup once the corporate types
    // a genuinely different 6-digit PIN code.
    const handlePincodeChange = async (value: string) => {
        if (!/^[1-9]\d{5}$/.test(value)) {
            lastLookedUpPincode.current = '';
            return;
        }
        if (value === lastLookedUpPincode.current) return;
        lastLookedUpPincode.current = value;
        setIsLookingUpPincode(true);
        const loc = await locationLookupApi(userId, role, value);
        setIsLookingUpPincode(false);
        if (!loc) {
            lastLookedUpPincode.current = '';
            return;
        }
        setFieldValue('state', loc.state ?? '');
        setFieldValue('district', loc.district ?? '');
        setFieldValue('country', loc.country ?? '');
        setFieldValue('city', loc.city ?? '');
    };

    // Doc §24 — runs as the corporate types (debounced), not on a button click; auto-fills Class
    // from the first matched Nice class and reloads Description's options accordingly.
    const runGoodsOrServiceSearch = async (query: string) => {
        setIsSearchingGoodsOrService(true);
        const result = await getTrademarkClassApi(userId, role, query);
        setIsSearchingGoodsOrService(false);
        setClassDescriptions(result?.descriptions ?? []);
        setFieldValue('trademarkClass', result?.classesIdentified?.[0] ?? '');
        setFieldValue('description', []);
    };

    const handleGoodsOrServiceChange = (value: string) => {
        if (goodsSearchTimeout.current) clearTimeout(goodsSearchTimeout.current);
        if (!value.trim()) {
            // Cleared — the previously identified Class/Description no longer apply.
            setClassDescriptions([]);
            setFieldValue('trademarkClass', '');
            setFieldValue('description', []);
            return;
        }
        goodsSearchTimeout.current = setTimeout(() => runGoodsOrServiceSearch(value), 500);
    };

    // Warns about existing marks that might conflict with the Brand, before submit.
    const handleBrandSearch = async () => {
        if (!values.brand.trim()) return;
        setIsSearchingSimilar(true);
        const result = await searchSimilarTrademarksApi(userId, role, values.brand);
        setIsSearchingSimilar(false);
        setSimilarTrademarks(result);
        setSimilarClassFilter('all');
        setIsSimilarModalOpen(true);
    };

    const uploadLogoFile = (file: RcFile) => {
        const reader = new FileReader();
        reader.onload = async () => {
            if (typeof reader.result !== 'string') return;
            const base64 = reader.result.split(',')[1];

            // Only reflect the file in Formik/the preview once the vendor upload succeeds, so a
            // failed upload never leaves a stale logo for Smart Form submit to pick up.
            if (!selectedService?.accessKey) {
                dispatch(
                    showToast({
                        description: 'Unable to upload the logo. Please try again.',
                        variant: 'error',
                    })
                );
                return;
            }
            setIsUploadingLogo(true);
            const uploaded = await uploadTrademarkLogoApi(
                userId,
                role,
                selectedService.accessKey,
                base64,
                file.name,
                applicationRowId
            );
            setIsUploadingLogo(false);
            if (uploaded) {
                setFieldValue('logo', base64);
                setFieldValue('logoFormat', file.type.split('/')[1]);
                setLogoFileName(file.name);
                dispatch(
                    showToast({ description: 'Logo uploaded successfully.', variant: 'success' })
                );
            } else {
                setFieldValue('logo', null);
                setFieldValue('logoFormat', undefined);
                setLogoFileName('');
                dispatch(
                    showToast({
                        description: 'Unable to upload the logo. Please try again.',
                        variant: 'error',
                    })
                );
            }
        };
        reader.readAsDataURL(file);
    };

    const handleLogoFile = (file: RcFile) => {
        const isAllowedType = ['image/jpeg', 'image/png', 'image/bmp'].includes(file.type);
        if (!isAllowedType) return false;

        // Doc requires the vendor logo at exactly 450×450px — checked against the real decoded
        // image, not just trusted from file metadata, before the file ever reaches the upload API.
        getImageDimensions(file)
            .then(({ width, height }) => {
                if (width !== REQUIRED_LOGO_DIMENSION || height !== REQUIRED_LOGO_DIMENSION) {
                    dispatch(
                        showToast({
                            description: `Logo must be exactly ${REQUIRED_LOGO_DIMENSION} × ${REQUIRED_LOGO_DIMENSION} pixels. This image is ${width} × ${height}.`,
                            variant: 'error',
                        })
                    );
                    return;
                }
                uploadLogoFile(file);
            })
            .catch(() => {
                dispatch(showToast({ description: 'Unable to read the image. Please try a different file.', variant: 'error' }));
            });

        return false;
    };

    const removeLogoFile = () => {
        setFieldValue('logo', null);
        setFieldValue('logoFormat', undefined);
        setLogoFileName('');
    };

    const handleNext = async () => {
        // Validates against the current step's schema only; Steps 2/3 have none, so this is a no-op there.
        const validationErrors = await validateForm();
        if (Object.keys(validationErrors).length > 0) {
            const touchedFields = Object.keys(EMPTY_VALUES).reduce<Record<string, boolean>>(
                (acc, key) => ({ ...acc, [key]: true }),
                {}
            );
            setTouched(touchedFields, false);
            setErrors(validationErrors);
            return;
        }

        if (selectedService?.accessKey && applicationRowId) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { logo: _logo, logoFormat: _logoFormat, usedSinceDisplay: _usedSinceDisplay, ...valuesForDb } = values;
            await submitGovernmentServiceApplicationApi({
                userId,
                userType: role,
                accessKey: selectedService.accessKey,
                applicationId: applicationRowId,
                formData: {
                    trademarkForm: { ...valuesForDb, logoFileName },
                    currentStep: currentStep + 1,
                },
            });
        }
        setCurrentStep(currentStep + 1);
    };

    // Trademark Owner is stored as the vendor's application_id; resolved to the business name
    // here since the Smart Form and Preview both need the name.
    const ownerName =
        businesses.find(b => String(b.application_id) === values.trademarkOwner)?.business_name ??
        values.trademarkOwner;

    // Preview step's Submit — files the Smart Form (doc §21) and marks the application COMPLETED.
    const handleSubmitFiling = async () => {
        if (!selectedService?.accessKey) return;
        setIsSubmittingFiling(true);
        const result = await submitTrademarkFilingApi(
            userId,
            role,
            selectedService.accessKey,
            { ...values, businessName: ownerName },
            applicationRowId
        );
        setIsSubmittingFiling(false);
        if (!result) {
            dispatch(
                showToast({
                    description: 'Unable to submit the trademark application. Please try again.',
                    variant: 'error',
                })
            );
            return;
        }
        dispatch(
            showToast({
                description: 'Trademark application submitted successfully.',
                variant: 'success',
            })
        );

        // Business Registration's own post-submit landing is its Tracking page — mirrored here
        // rather than a separate one-off success screen, passing the just-submitted application
        // through the same way MyApplications.tsx's goToTracking does.
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
                    legalBusinessName: ownerName,
                },
            },
        });
    };

    return {
        applyBusinessToValues,
        handlePincodeChange,
        isLookingUpPincode,
        classDescriptions,
        isSearchingGoodsOrService,
        handleGoodsOrServiceChange,
        isSearchingSimilar,
        similarTrademarks,
        isSimilarModalOpen,
        setIsSimilarModalOpen,
        similarClassFilter,
        setSimilarClassFilter,
        handleBrandSearch,
        isUploadingLogo,
        handleLogoFile,
        removeLogoFile,
        handleNext,
        ownerName,
        isSubmittingFiling,
        handleSubmitFiling,
    };
}
