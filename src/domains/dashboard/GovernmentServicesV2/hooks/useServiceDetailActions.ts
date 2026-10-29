import { Dispatch, SetStateAction, useState } from 'react';

import * as Yup from 'yup';

import { PAN_REGEX, parsePanHolder } from '@domains/dashboard/BusinessRegistration/utils/pan';
import { showToast } from '@src/slices/apiSlice';
import { AppDispatch } from '@src/store/store';

import {
    createVendorBusinessApi,
    getVendorBusinessDetailApi,
    submitGovernmentServiceApplicationApi,
    verifyVendorPanApi,
} from '../apis';
import { profileDetailsSchema } from '../schema';
import { setVendorGid } from '../slices';
import { Service } from '../types';
import { isGstCancellationService } from '../utils/gstCancellationForm';
import { isGstRegistrationService } from '../utils/gstForm';
import { ProfileValues, deriveEntityTypeFromPan } from '../utils/serviceDetailForm';

interface UseServiceDetailActionsParams {
    userId: number;
    role: string;
    dispatch: AppDispatch;
    selectedService: Service;
    isVendorCatalogService: boolean;
    profileValues: ProfileValues;
    setProfileValues: Dispatch<SetStateAction<ProfileValues>>;
    setFieldErrors: Dispatch<SetStateAction<Record<string, string>>>;
    verifiedPan: string;
    setVerifiedPan: Dispatch<SetStateAction<string>>;
    isPanPrefilled: boolean;
    setIsPanPrefilled: Dispatch<SetStateAction<boolean>>;
    totalAmount: number;
    proceedToPayment: () => Promise<void>;
    // Only used by GST Cancellation (selected on ServiceProfileForm's Select Business dropdown) —
    // identifies the EXISTING business this cancels, so handleContinue can skip Create Business
    // entirely rather than registering a new one (see handleContinue's isCancellation branch).
    selectedVendorBusinessId?: string | null;
}

// PAN verification and the Continue handler — both act on useServiceDetailData's profileValues,
// so kept as their own hook rather than folded into that one, purely for readability (this file
// is "what happens when the corporate interacts", that one is "what's prefilled on load").
export default function useServiceDetailActions({
    userId,
    role,
    dispatch,
    selectedService,
    isVendorCatalogService,
    profileValues,
    setProfileValues,
    setFieldErrors,
    verifiedPan,
    setVerifiedPan,
    isPanPrefilled,
    setIsPanPrefilled,
    totalAmount,
    proceedToPayment,
    selectedVendorBusinessId,
}: UseServiceDetailActionsParams) {
    const [isVerifyingPan, setIsVerifyingPan] = useState(false);
    const [isApplying, setIsApplying] = useState(false);

    // Verified only while the entered PAN matches the one we last verified — editing the PAN
    // after verifying invalidates it and requires re-verifying.
    const isPanVerified = Boolean(profileValues.pan) && profileValues.pan === verifiedPan;
    const showPanVerify = isVendorCatalogService && !isPanPrefilled;

    // PAN verification (doc §12) — required before creating a new vendor business from this PAN.
    const handleVerifyPan = async () => {
        if (!PAN_REGEX.test(profileValues.pan)) {
            setFieldErrors(prev => ({ ...prev, pan: 'Enter a valid 10-character PAN' }));
            return;
        }
        setIsVerifyingPan(true);
        const res = await verifyVendorPanApi(userId, role, profileValues.pan);
        setIsVerifyingPan(false);
        const holder = res ? parsePanHolder(res) : null;
        if (!holder) {
            setFieldErrors(prev => ({ ...prev, pan: 'Could not verify this PAN' }));
            return;
        }
        setVerifiedPan(profileValues.pan);
        setFieldErrors(prev => ({ ...prev, pan: '' }));
        // Deliberately NOT auto-filling Legal Business Name from holder.fullName — it's the PAN
        // cardholder's personal name, and since Create Business is idempotent per PAN, prefilling
        // it previously caused businesses to get registered under a person's name instead of what
        // the user intended to type. Entity Type is safe to prefill since it's a fixed set of
        // options rather than free text, and getting it wrong just means picking a different one.
        const derivedEntityType = deriveEntityTypeFromPan(profileValues.pan, holder.fullName);
        if (derivedEntityType) {
            setProfileValues(prev => ({ ...prev, entityType: derivedEntityType }));
        }
    };

    const onPanChange = (value: string) => {
        setProfileValues(prev => ({ ...prev, pan: value }));
        setIsPanPrefilled(false);
    };

    const isGstRegistration = isGstRegistrationService(selectedService.serviceId);
    const isCancellation = isGstCancellationService(selectedService.serviceId);

    // Continue: validate the profile form, create the vendor business, submit the application,
    // then hand off to the shared payment page (useGovtServicePayment handles pricing/surcharge).
    const handleContinue = async () => {
        try {
            await profileDetailsSchema.validate(profileValues, { abortEarly: false });
            setFieldErrors({});
        } catch (err) {
            if (err instanceof Yup.ValidationError) {
                const newErrors: Record<string, string> = {};
                err.inner.forEach(e => {
                    if (e.path && !newErrors[e.path]) {
                        newErrors[e.path] = e.message;
                    }
                });
                setFieldErrors(newErrors);
            }
            return;
        }

        // Proposed Name is mandatory for GST Registration only (GST_Registration.pdf §A2) — kept
        // as a plain manual check rather than folded into profileDetailsSchema, which every other
        // vendor-catalog service also validates against.
        if (isGstRegistration && !profileValues.proposedName.trim()) {
            setFieldErrors(prev => ({
                ...prev,
                proposedName: 'Please enter the proposed business name',
            }));
            return;
        }

        // Cancellation acts on an EXISTING GSTIN-bearing business — it must never create a new
        // one, unlike every other vendor-catalog service below. Required here (not just in
        // gstCancellationDetailsSchema) because this value lives on ServiceProfileForm's Select
        // Business dropdown, a different form than the one just validated above.
        if (isCancellation && !selectedVendorBusinessId) {
            setFieldErrors(prev => ({
                ...prev,
                legalBusinessName: 'Please select the business to cancel',
            }));
            return;
        }

        setIsApplying(true);

        // Create Lead + Create Business (doc §6/§23) — called on every Continue click; both are
        // idempotent on the vendor side, so repeat calls are safe.
        let vendorApplicationId: number | null = null;
        let vendorGid: string | null = null;
        if (isCancellation) {
            // Resolve gid/GSTIN from the already-registered business instead — see this block's
            // own comment above and GST_Cancellation_Implementation_Plan.md §5.4.
            const detail = await getVendorBusinessDetailApi(
                userId,
                role,
                selectedVendorBusinessId!
            );
            if (!detail?.business) {
                setIsApplying(false);
                setFieldErrors(prev => ({
                    ...prev,
                    legalBusinessName: 'Could not load the selected business. Please try again.',
                }));
                dispatch(
                    showToast({
                        description: 'Could not load the selected business. Please try again.',
                        variant: 'error',
                    })
                );
                return;
            }
            vendorApplicationId = Number(selectedVendorBusinessId);
            vendorGid = detail.business.gid != null ? String(detail.business.gid) : null;
            dispatch(setVendorGid(vendorGid));
        } else if (isVendorCatalogService) {
            const created = await createVendorBusinessApi(
                userId,
                role,
                profileValues.pan,
                profileValues.entityType,
                // GST Registration sends the newly-typed Proposed Name (a trade name being
                // registered), not legalBusinessName (an existing business identity) — every other
                // service keeps using legalBusinessName as before.
                isGstRegistration ? profileValues.proposedName : profileValues.legalBusinessName,
                profileValues.stateOfRegistration,
                profileValues.name,
                profileValues.email,
                profileValues.phoneNumber,
                selectedService.accessKey
            );
            if (!created?.applicationId) {
                setIsApplying(false);
                // Field-level highlight follows this file's existing PAN-error convention (see
                // handleVerifyPan above); the message itself stays generic rather than blaming PAN
                // specifically — Create Business can also fail on entity_type, not just a bad PAN.
                setFieldErrors(prev => ({
                    ...prev,
                    pan: 'Could not register this business. Please try again.',
                }));
                dispatch(
                    showToast({
                        description: 'Could not register this business. Please try again.',
                        variant: 'error',
                    })
                );
                return;
            }
            vendorApplicationId = created.applicationId;
            vendorGid = created.gid;
            // Stored in Redux so it survives the navigate() into the shared payment page, where
            // useGovtServicePayment reads it back for the vendor Create Order call (doc §19).
            dispatch(setVendorGid(vendorGid));
            if (created.alreadyExists) {
                dispatch(
                    showToast({
                        description: created.message || 'Business already exists',
                        variant: 'info',
                    })
                );
            }
        }

        const result = await submitGovernmentServiceApplicationApi({
            userId,
            userType: role,
            accessKey: selectedService.accessKey,
            formData: {
                profile: {
                    legalBusinessName: profileValues.legalBusinessName,
                    stateOfRegistration: profileValues.stateOfRegistration,
                    name: profileValues.name,
                    email: profileValues.email,
                    phoneNumber: profileValues.phoneNumber,
                    pan: profileValues.pan,
                    entityType: profileValues.entityType,
                    ...(isGstRegistration
                        ? {
                              proposedName: profileValues.proposedName,
                              alternateName: profileValues.alternateName,
                          }
                        : {}),
                },
                // Carried through so the payment handler can Create Order (§19) without a fresh
                // vendor-business lookup; gid is stored server-side on the application row.
                ...(isVendorCatalogService
                    ? {
                          vendor: {
                              applicationId: vendorApplicationId,
                              ...(vendorGid ? { gid: vendorGid } : {}),
                          },
                      }
                    : {}),
                // Quoted price before surcharge, so "My Applications" shows an amount pre-payment.
                amount: totalAmount,
            },
        });
        setIsApplying(false);
        if (result) {
            await proceedToPayment();
        }
    };

    return {
        isVerifyingPan,
        isPanVerified,
        showPanVerify,
        handleVerifyPan,
        onPanChange,
        isApplying,
        handleContinue,
    };
}
