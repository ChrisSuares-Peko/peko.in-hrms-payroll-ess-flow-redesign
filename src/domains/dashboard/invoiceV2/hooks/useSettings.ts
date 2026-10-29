import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    getProfileAddressesApi,
    getProfileCompanyApi,
    getSettingsApi,
    saveSettingsApi,
} from '../api/settings';
import {
    DEFAULT_DOCUMENT_PREFIXES,
    buildDefaultNotes,
    buildDefaultTerms,
} from '../constants/settings';
import {
    BusinessDetailsValues,
    DocumentSettingsValues,
    SettingsFormValues,
} from '../types/settings';
import { fileToPayload } from '../utils/helperFunctions';
import { prefixArrayToRecord, prefixRecordToArray } from '../utils/settingsUtils';

const useSettings = ({ autoFetch = true, skipProfile = false } = {}) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [settings, setSettings] = useState<SettingsFormValues | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const hasFetched = useRef(false);

    const fetchSettings = useCallback(
        async (force = false, silent = false) => {
            if (hasFetched.current && !force) return;
            if (!silent) setIsLoading(true);
            const [resp, company, addresses] = await Promise.all([
                getSettingsApi({ userId: id, userType: role }),
                skipProfile
                    ? Promise.resolve(null)
                    : getProfileCompanyApi({ userId: id, userType: role }),
                skipProfile
                    ? Promise.resolve([])
                    : getProfileAddressesApi({ userId: id, userType: role }),
                skipProfile
                    ? Promise.resolve(null)
                    : getProfileCompanyApi({ userId: id, userType: role }),
                skipProfile
                    ? Promise.resolve([])
                    : getProfileAddressesApi({ userId: id, userType: role }),
            ]);
            if (resp && resp.status) {
                hasFetched.current = true;
                const d = resp.data;

                const defaultAddr =
                    (addresses as Awaited<ReturnType<typeof getProfileAddressesApi>>).find(
                        a => a.default === 1
                    ) ??
                    (addresses as Awaited<ReturnType<typeof getProfileAddressesApi>>)[0] ??
                    null;
                const addressLine = [defaultAddr?.addressLine1, defaultAddr?.addressLine2]
                    .filter(Boolean)
                    .join(', ');

                const city = company?.city || defaultAddr?.city || '';
                const rawTerms = d.termsAndConditions ?? buildDefaultTerms(city);

                setSettings({
                    businessName: company?.name || '',
                    address: addressLine,
                    city,
                    state: company?.state || defaultAddr?.state || '',
                    pincode: defaultAddr?.zipCode || '',
                    phone: company?.mobileNo || '',
                    email: company?.email || '',
                    gstNo: company?.gstNumber || '',
                    selectedDocumentType: 'Invoice',
                    autoUpdateDocNumber: d.autoUpdateDocumentNumber ?? true,
                    autoAddItemsToCatalog: d.autoAddToCatalog ?? false,
                    gstPercent: d.gstPercent ?? '5',
                    currency: d.currency ?? 'INR',
                    paymentMode: d.paymentMode ?? undefined,
                    defaultDueDays: d.defaultDueDays ?? 14,
                    documentPrefixes: d.documentNumberPrefix?.length
                        ? prefixArrayToRecord(d.documentNumberPrefix)
                        : DEFAULT_DOCUMENT_PREFIXES,
                    termsAndConditions: city
                        ? rawTerms.replace('[Business City]', city)
                        : rawTerms,
                    notes:
                        d.notes ?? buildDefaultNotes(company?.email || '', company?.mobileNo || ''),
                    logoUrl: company?.logo || null,
                    signature: null,
                    signatureUrl: d.signatureUrl || null,
                });
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            if (!silent) setIsLoading(false);
        },
        [id, role, dispatch, skipProfile]
    );

    const saveSettings = useCallback(
        async (
            values: {
                businessDetails: BusinessDetailsValues;
                documentSettings: DocumentSettingsValues;
            },
            options?: { silent?: boolean }
        ) => {
            setIsLoading(true);
            const { documentSettings: d } = values;
            const signature =
                d.signature instanceof File ? await fileToPayload(d.signature) : undefined;
            const resp = await saveSettingsApi({
                userId: id,
                userType: role,
                autoUpdateDocumentNumber: d.autoUpdateDocNumber,
                autoAddToCatalog: d.autoAddItemsToCatalog,
                gstPercent: d.gstPercent,
                currency: d.currency,
                paymentMode: d.paymentMode || undefined,
                defaultDueDays: d.defaultDueDays,
                termsAndConditions: d.termsAndConditions || '',
                notes: d.notes || '',
                signature,
                removeSignature: d.removeSignature || undefined,
                documentPrefixes: d.documentPrefixes
                    ? prefixRecordToArray(d.documentPrefixes)
                    : undefined,
            });
            if (resp && resp.status) {
                if (!options?.silent) {
                    dispatch(
                        showToast({ description: 'Settings saved successfully.', variant: 'success' })
                    );
                }
                await fetchSettings(true);
            } else if (resp && !resp.status) {
                dispatch(showToast({ description: resp.message, variant: 'error' }));
            }
            setIsLoading(false);
            return !!(resp && resp.status);
        },
        [id, role, dispatch, fetchSettings]
    );

    const saveSignature = useCallback(
        async (file: File) => {
            const payload = await fileToPayload(file);
            const resp = await saveSettingsApi({ userId: id, userType: role, signature: payload });
            if (resp && resp.status) {
                fetchSettings(true, true);
                return true;
            }
            return false;
        },
        [id, role, fetchSettings]
    );

    useEffect(() => {
        if (autoFetch) fetchSettings();
    }, [fetchSettings, autoFetch]);

    return { settings, saveSettings, saveSignature, isLoading, fetchSettings };
};

export default useSettings;
