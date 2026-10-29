import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { createRenewalRequest } from '../api/globalBusinessSetup';

interface RenewalRequestValues {
    is_external: boolean;
    company?: string;
    external_company?: {
        name?: string;
        country?: string;
        company_type?: string;
        freezone?: string;
    } | null;
    renewal_type: string;
    additional_fields?: Record<string, unknown>;
}

const buildRenewalFormData = (values: RenewalRequestValues): FormData => {
    const formData = new FormData();

    if (values.is_external) {
        const ec = values.external_company || {};
        formData.append(
            'external_company',
            JSON.stringify({
                name: ec.name,
                country: ec.country,
                company_type: ec.company_type,
                freezone: ec.freezone,
            })
        );
    } else if (values.company) {
        formData.append('company', values.company);
    }

    formData.append('renewal_type', values.renewal_type);

    const additional = values.additional_fields || {};
    const nonFileFields: Record<string, unknown> = {};

    Object.entries(additional).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(`af_${key}`, value);
        } else if (value instanceof FileList && value.length > 0) {
            formData.append(`af_${key}`, value[0]);
        } else if (value != null && value !== '') {
            nonFileFields[key] = value;
        }
    });
    if (Object.keys(nonFileFields).length > 0) {
        formData.append('additional_fields', JSON.stringify(nonFileFields));
    }

    return formData;
};

const useCreateRenewalRequest = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async (values: RenewalRequestValues) => {
        setIsSubmitting(true);
        try {
            const formData = buildRenewalFormData(values);
            const res = await createRenewalRequest({
                userId: id,
                userType: role,
                formData,
            });
            if (res) {
                dispatch(
                    showToast({
                        description: 'Renewal request submitted successfully.',
                        variant: 'success',
                    })
                );
                return res;
            }
            dispatch(
                showToast({
                    description: 'Failed to submit renewal request. Please try again.',
                    variant: 'error',
                })
            );
            return null;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { submit, isSubmitting };
};

export default useCreateRenewalRequest;
