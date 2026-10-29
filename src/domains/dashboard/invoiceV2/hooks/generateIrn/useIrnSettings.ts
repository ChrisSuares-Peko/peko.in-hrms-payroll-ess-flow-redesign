import { useCallback, useEffect, useRef, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getEInvoiceNextNumberApi } from '../../api/eInvoice';
import { getProfileAddressesApi, getProfileCompanyApi } from '../../api/settings';
import { SellerFormValues } from '../../types/generateIrn';
import useSettings from '../useSettings';

// Maps e-invoice document type codes → settings prefix keys
const IRN_TYPE_TO_SETTINGS_KEY: Record<string, string> = {
    INV: 'Invoice',
    CRN: 'Invoice',
    DBN: 'Invoice',
};

const useIrnSettings = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { gstin: eInvoiceGstin } = useAppSelector(state => state.reducer.eInvoiceAuth);

    // autoFetch: true + skipProfile: true → only calls getSettingsApi on mount (for prefixMap)
    // company + addressDetails are fetched separately on demand when advancing to step 2
    const { settings, isLoading: isSettingsLoading } = useSettings({
        autoFetch: true,
        skipProfile: true,
    });

    const [nextNumber, setNextNumber] = useState<string>('');
    const [isNextNumberLoading, setIsNextNumberLoading] = useState(false);
    const [sellerDefaults, setSellerDefaults] = useState<SellerFormValues>({
        sellerGstin: eInvoiceGstin || '',
        legalName: '',
        tradeName: '',
        address1: '',
        location: '',
        pinCode: '',
        state: '',
    });
    const [isSellerDefaultsLoading, setIsSellerDefaultsLoading] = useState(false);
    const hasFetchedSellerDefaults = useRef(false);

    const fetchNextNumber = useCallback(async () => {
        setIsNextNumberLoading(true);
        const data = await getEInvoiceNextNumberApi({ userId: id, userType: role });
        if (data) setNextNumber(String(data.nextNumber));
        setIsNextNumberLoading(false);
    }, [id, role]);

    useEffect(() => {
        fetchNextNumber();
    }, [fetchNextNumber]);

    // Called when the user advances from step 1 → step 2
    const fetchSellerDefaults = useCallback(async () => {
        if (hasFetchedSellerDefaults.current) return;
        setIsSellerDefaultsLoading(true);
        const [company, addresses] = await Promise.all([
            getProfileCompanyApi({ userId: id, userType: role }),
            getProfileAddressesApi({ userId: id, userType: role }),
        ]);
        const defaultAddr =
            (addresses as Awaited<ReturnType<typeof getProfileAddressesApi>>).find(
                a => a.default === 1
            ) ??
            (addresses as Awaited<ReturnType<typeof getProfileAddressesApi>>)[0] ??
            null;
        const addressLine = [defaultAddr?.addressLine1, defaultAddr?.addressLine2]
            .filter(Boolean)
            .join(', ');
        setSellerDefaults({
            sellerGstin: eInvoiceGstin || '',
            legalName: company?.name || '',
            tradeName: '',
            address1: addressLine,
            location: company?.city || defaultAddr?.city || '',
            pinCode: defaultAddr?.zipCode || '',
            state: company?.state || defaultAddr?.state || '',
        });
        hasFetchedSellerDefaults.current = true;
        setIsSellerDefaultsLoading(false);
    }, [id, role, eInvoiceGstin]);

    const prefixMap: Record<string, string> = Object.fromEntries(
        Object.entries(IRN_TYPE_TO_SETTINGS_KEY).map(([irnKey, settingsKey]) => [
            irnKey,
            settings?.documentPrefixes?.[settingsKey] ?? '',
        ])
    );

    return {
        prefixMap,
        sellerDefaults,
        nextNumber,
        isNextNumberLoading,
        isSettingsLoading,
        isSellerDefaultsLoading,
        fetchSellerDefaults,
    };
};

export default useIrnSettings;
