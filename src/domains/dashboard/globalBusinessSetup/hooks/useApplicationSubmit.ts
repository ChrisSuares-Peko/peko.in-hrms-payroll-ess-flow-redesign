import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { submitApplication } from '../api/globalBusinessSetup';
import { finalizeCustomSections } from '../components/DynamicForm/customSections/finalizeCustomSections';
import { setApplicationId } from '../slices/globalBusinessSetupSlice';
import { SubmissionMeta } from '../types/forms';
import { objectToFormData, transformToSubmissionPayload } from '../utils/objectToFormData';

export type FinalSubmitResult =
    | { ok: true; vendorApplicationId: string }
    | { ok: false; message: string; errors?: string[] };

export const useCompanyApplicationSubmit = (formSchema: any) => {
    const [savingDraft, setSavingDraft] = useState(false);
    const [submittingFinal, setSubmittingFinal] = useState(false);
    const { role, id, username } = useAppSelector(state => state.reducer.auth);
    const { metrics, countryData, applicationId, pricingData, quoteConfig } = useAppSelector(
        state => state.reducer.globalBusinessSetup
    );
    const dispatch = useAppDispatch();

    const submit = async (values: any, status: 'draft' | 'saved', skipAiValidation = false) => {
        const customObj: SubmissionMeta = {
            status,
            reference_id: username,
            metrics,
            countryData,
            ...(pricingData && {
                pricingId: pricingData._id,
                quoteConfig,
            }),
        };

        const payload = transformToSubmissionPayload(formSchema, values, customObj);

        // Documents are generated only at final submission — drafts (including
        // the per-page auto-save on "Next") persist form values only and may be
        // incomplete, so running the doc generators then is both pointless and
        // liable to fail on empty custom-section data. On final submit a failure
        // aborts the save — sending without the generated docs would silently
        // submit an incomplete application (vendor parity).
        if (status === 'saved') {
            try {
                await finalizeCustomSections(formSchema, payload);
            } catch (err) {
                // finalizeCustomSections isolates per-document failures internally,
                // so reaching here means a catastrophic error (not a single
                // generator). Log the real cause — the toast alone hid it before.
                console.error('[globalBusinessSetup] finalizeCustomSections failed', err);
                dispatch(
                    showToast({
                        description: 'Failed to prepare documents. Please try again.',
                        variant: 'error',
                    })
                );
                return null;
            }
        }

        const formData = new FormData();
        objectToFormData(payload, formData);

        const res = await submitApplication({
            formData,
            userId: id,
            userType: role,
            applicationId: applicationId || '',
            skipAiValidation,
        });

        if (res?.vendorApplicationId) {
            dispatch(setApplicationId(res.vendorApplicationId));
        }

        return res;
    };

    return {
        saveDraft: async (values: any, status: 'draft' | 'saved', silent = false) => {
            try {
                if (status === 'saved') {
                    setSubmittingFinal(true);
                } else {
                    setSavingDraft(true);
                }

                const res = await submit(values, 'draft');

                if (res && !silent) {
                    const isEdit = Boolean(applicationId);
                    let description = '';

                    if (status === 'saved') {
                        description =
                            'Details saved successfully. Review your application before final submission';
                    } else if (isEdit) {
                        description = 'Draft updated successfully';
                    } else {
                        description = 'Draft saved successfully';
                    }

                    dispatch(
                        showToast({
                            description,
                            variant: 'success',
                        })
                    );
                }

                return res;
            } finally {
                setSavingDraft(false);
                setSubmittingFinal(false);
            }
        },

        finalSubmit: async (values: any, skipAiValidation = false): Promise<FinalSubmitResult> => {
            setSubmittingFinal(true);

            try {
                const res = await submit(values, 'saved', skipAiValidation);

                if (res?.vendorApplicationId) {
                    const appId = res.vendorApplicationId;
                    const toastKey = `submit-toast-shown:${appId}`;

                    const alreadyShown = sessionStorage.getItem(toastKey);

                    if (!alreadyShown) {
                        dispatch(
                            showToast({
                                description:
                                    'Application submitted. Please complete payment to proceed',
                                variant: 'success',
                            })
                        );

                        sessionStorage.setItem(toastKey, 'true');
                    }

                    return { ok: true, vendorApplicationId: res.vendorApplicationId };
                }

                return { ok: false, message: 'Application submission failed' };
            } catch (err: any) {
                const data = err?.response?.data;
                return {
                    ok: false,
                    message: data?.message ?? 'Application submission failed',
                    errors: Array.isArray(data?.errors) ? data.errors : undefined,
                };
            } finally {
                setSubmittingFinal(false);
            }
        },

        savingDraft,
        submittingFinal,
    };
};
