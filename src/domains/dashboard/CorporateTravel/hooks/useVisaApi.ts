import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';
import {
    getCountryFlags,
    getNationalityAndResidency,
    getOrderStatus,
    getVisaCountries,
    getVisaDestinations,
    getVisaProductDocuments,
    searchVisaOptions,
    stageVisaDocument,
} from '../api/visa';
import { setSelectedVisaProduct, setVisaLoading, setVisaSearchResults } from '../store/visaSlice';
import {
    CountryFlag,
    NatResCountry,
    StagedVisaDocument,
    VisaAddOn,
    VisaCountry,
    VisaDestination,
    VisaOrderDetails,
    VisaProduct,
} from '../types/visa';
import { type VisaOption } from '../utils/data';

// ─── GST State Code Lookup ────────────────────────────────────────────────────

const GST_STATE_CODES: Record<string, string> = {
    'Jammu and Kashmir': '01',
    'Himachal Pradesh': '02',
    Punjab: '03',
    Chandigarh: '04',
    Uttarakhand: '05',
    Haryana: '06',
    Delhi: '07',
    Rajasthan: '08',
    'Uttar Pradesh': '09',
    Bihar: '10',
    Sikkim: '11',
    'Arunachal Pradesh': '12',
    Nagaland: '13',
    Manipur: '14',
    Mizoram: '15',
    Tripura: '16',
    Meghalaya: '17',
    Assam: '18',
    'West Bengal': '19',
    Jharkhand: '20',
    Odisha: '21',
    Chhattisgarh: '22',
    'Madhya Pradesh': '23',
    Gujarat: '24',
    Goa: '30',
    Maharashtra: '27',
    Karnataka: '29',
    Kerala: '32',
    'Tamil Nadu': '33',
    Telangana: '36',
    'Andhra Pradesh': '37',
    Puducherry: '34',
    'Andaman and Nicobar Islands': '35',
    Lakshadweep: '31',
    'Dadra and Nagar Haveli and Daman and Diu': '26',
    Ladakh: '38',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const parseDurationDays = (duration: string): number => {
    const match = duration.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 30;
    if (duration.includes('M')) return num * 30;
    return num;
};

const parseEntryType = (entries: string): string => {
    if (entries.trim().toLowerCase().includes('single')) return 'Single Entry';
    const n = parseInt(entries, 10);
    if (!Number.isNaN(n) && n <= 1) return 'Single Entry';
    return 'Multiple Entry';
};

export const mapProductToVisaOption = (
    p: VisaProduct,
    counts = { adult: 1, child: 0, infant: 0 }
): VisaOption => {
    const { adult, child, infant } = p.age_cost_breakup;
    // API returns TOTALS for the searched count, not per-person
    const platformFee = adult['Platform Fee'] ?? 0;
    const gst = adult['Total Tax'] ?? 0;
    const serviceFee = adult['Service Fee'] ?? 0;
    const embassyFee = adult['Embassy Fees'] ?? 0;
    const totalPayNow = platformFee + gst + serviceFee;
    const adultCount = Math.max(counts.adult, 1);

    return {
        id: String(p.product_id),
        productId: p.product_id,
        days: parseDurationDays(p.visa_duration),
        name: p.visa_name,
        visaType: p.visa_type,
        entryType: parseEntryType(p.entries_allowed),
        processingTime: p.embassy_tat
            ? `${p.embassy_tat}–${p.embassy_tat + 2} Business Days`
            : '3–5 Business Days',
        price: p.breakup.total_value,
        pricePerPerson: (adult.Total ?? 0) / adultCount,
        platformPayNow: totalPayNow,
        serviceFee,
        platformFee,
        gst,
        totalPayNow,
        embassyFee,
        visaInfo:
            p.notes.filter(Boolean).join('. ') ||
            `Valid for ${p.visa_duration} from date of entry.`,
        requiredDocuments: [
            'Valid Passport (min. 6 months validity)',
            'Passport-size photo (white background)',
            'Return flight ticket',
            'Confirmed hotel booking',
        ],
        adultAge: (() => {
            const def = p.age_definition?.find(d => d.adult)?.adult;
            if (!def) return undefined;
            return { minAge: parseInt(String(def.min_age), 10) };
        })(),
        childAge: (() => {
            const def = p.age_definition?.find(d => d.child)?.child;
            if (!def) return undefined;
            return { minAge: def.min_age, maxAge: def.max_age };
        })(),
        infantAge: (() => {
            const def = p.age_definition?.find(d => d.infant)?.infant;
            if (!def) return undefined;
            return { minAge: def.min_age, maxAge: def.max_age };
        })(),
        childServiceFee: child?.['Service Fee'],
        childPlatformFee: child?.['Platform Fee'],
        childGst: child?.['Total Tax'],
        childEmbassyFee: child?.['Embassy Fees'],
        childTotalPayNow: child
            ? (child['Platform Fee'] ?? 0) + (child['Total Tax'] ?? 0) + (child['Service Fee'] ?? 0)
            : undefined,
        childPricePerPerson: child?.Total,
        infantServiceFee: infant?.['Service Fee'],
        infantPlatformFee: infant?.['Platform Fee'],
        infantGst: infant?.['Total Tax'],
        infantEmbassyFee: infant?.['Embassy Fees'],
        infantTotalPayNow: infant
            ? (infant['Platform Fee'] ?? 0) +
              (infant['Total Tax'] ?? 0) +
              (infant['Service Fee'] ?? 0)
            : undefined,
        infantPricePerPerson: infant?.Total,
        breakupComponents: p.breakup?.components ?? [],
        breakupServiceFee: p.breakup?.total_service_fee ?? 0,
        breakupTaxServiceFee: p.breakup?.total_tax_service_fee ?? 0,
        totalGovtFees: p.breakup?.total_govt_fees ?? 0,
    };
};

// ─── useVisaCountries ─────────────────────────────────────────────────────────

export const useVisaCountries = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [countries, setCountries] = useState<VisaCountry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getVisaCountries({ userType: role, userId: id })
            .then(data => {
                if (data) setCountries(data);
            })
            .finally(() => setIsLoading(false));
    }, [role, id]);

    const countryOptions = countries.map(c => ({ label: c.name, value: c.id }));

    return { countries, countryOptions, isLoading };
};

// ─── useNationalityAndResidency ───────────────────────────────────────────────

const toSortedOptions = (list: NatResCountry[]) =>
    [...list]
        // Entries with no vendor code (`code` null/undefined) can't be searched — the vendor API
        // rejects them — so they're hidden here rather than offered as a dead end.
        .filter(c => c.code !== null && c.code !== undefined && !Number.isNaN(Number(c.code)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => ({ label: c.name, value: Number(c.code) }));

export const useNationalityAndResidency = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [nationalityList, setNationalityList] = useState<NatResCountry[]>([]);
    const [residencyList, setResidencyList] = useState<NatResCountry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getNationalityAndResidency({ userType: role, userId: id })
            .then(data => {
                if (data) {
                    setNationalityList(data.nationality);
                    setResidencyList(data.residency);
                }
            })
            .finally(() => setIsLoading(false));
    }, [role, id]);

    const nationalityOptions = useMemo(() => toSortedOptions(nationalityList), [nationalityList]);
    const residencyOptions = useMemo(() => toSortedOptions(residencyList), [residencyList]);

    const indiaId = useMemo(() => {
        const india =
            nationalityList.find(c => c.name === 'India') ??
            residencyList.find(c => c.name === 'India');
        return india ? Number(india.code) : null;
    }, [nationalityList, residencyList]);

    return { nationalityOptions, residencyOptions, isLoading, indiaId };
};

// ─── useVisaDestinations ──────────────────────────────────────────────────────

export const useVisaDestinations = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [destinations, setDestinations] = useState<VisaDestination[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getVisaDestinations({ userType: role, userId: id })
            .then(data => {
                if (data) setDestinations(data);
            })
            .finally(() => setIsLoading(false));
    }, [role, id]);

    return { destinations, isLoading };
};

// ─── useCountryFlags ───────────────────────────────────────────────────────────
// Fetches the full name/code/flag list once and exposes a case-insensitive name lookup, since the
// destination/nationality strings we already have on hand (from indiaSheet-backed vendor data) carry no
// ISO code to match on.

export const useCountryFlags = () => {
    const [flags, setFlags] = useState<CountryFlag[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Public/static data, not scoped to the signed-in user — fetch once, not per role/id.
    useEffect(() => {
        setIsLoading(true);
        getCountryFlags()
            .then(data => {
                if (data) setFlags(data);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const flagsByName = useMemo(
        () => new Map(flags.map(f => [f.name.trim().toLowerCase(), f])),
        [flags]
    );

    const getFlagImageByName = useCallback(
        (name?: string | null) =>
            name ? flagsByName.get(name.trim().toLowerCase())?.image : undefined,
        [flagsByName]
    );

    return { flags, isLoading, getFlagImageByName };
};

// ─── useVisaAddOns ────────────────────────────────────────────────────────────

export const useVisaAddOns = (countryId: number | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [addOns, setAddOns] = useState<VisaAddOn[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!countryId) return;
        setIsLoading(true);
        getVisaDestinations({ userType: role, userId: id })
            .then(data => {
                if (data) {
                    const dest = data.find(d => d.country_id === countryId);
                    setAddOns(dest?.add_on ?? []);
                }
            })
            .finally(() => setIsLoading(false));
    }, [countryId, role, id]);

    return { addOns, isLoading };
};

// ─── useVisaSearch ────────────────────────────────────────────────────────────

const DEFAULT_ADULT_AGE_LABEL = '18+ years';
const DEFAULT_CHILD_AGE_LABEL = '2–17 years';
const DEFAULT_INFANT_AGE_LABEL = '0–2 years';

export const useVisaSearch = (params: {
    residency?: number;
    nationality?: number;
    destination?: number;
    travelDate?: string;
    category?: string;
    adult?: number;
    child?: number;
    infant?: number;
}) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { searchResults, isLoading } = useAppSelector(state => state.reducer.visa);
    const [visaOptions, setVisaOptions] = useState<VisaOption[]>([]);
    const requestIdRef = useRef(0);

    useEffect(() => {
        const totalTravellers = (params.adult ?? 0) + (params.child ?? 0) + (params.infant ?? 0);
        if (!params.destination || totalTravellers === 0) return;
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;
        dispatch(setVisaLoading(true));
        searchVisaOptions({
            userType: role,
            userId: id,
            residency: params.residency ?? 103,
            nationality: params.nationality ?? 103,
            destination: params.destination,
            travelDate: params.travelDate ?? '',
            category: params.category ?? 'Tourist',
            adult: params.adult ?? 0,
            child: params.child ?? 0,
            infant: params.infant ?? 0,
        })
            .then(products => {
                if (requestId !== requestIdRef.current) return;
                if (products) {
                    dispatch(setVisaSearchResults(products));
                    const counts = {
                        adult: params.adult ?? 0,
                        child: params.child ?? 0,
                        infant: params.infant ?? 0,
                    };
                    setVisaOptions(products.map(p => mapProductToVisaOption(p, counts)));
                }
            })
            .finally(() => {
                if (requestId === requestIdRef.current) dispatch(setVisaLoading(false));
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        params.adult,
        params.child,
        params.infant,
        params.destination,
        params.nationality,
        params.residency,
        params.travelDate,
        params.category,
    ]);

    const selectProduct = useCallback(
        (option: VisaOption) => {
            const product = searchResults.find(p => p.product_id === option.productId) ?? null;
            dispatch(setSelectedVisaProduct(product));
        },
        [dispatch, searchResults]
    );

    const supportsChild = searchResults.some(
        p => !!p.age_cost_breakup?.child || p.age_definition?.some(d => !!d.child)
    );
    const supportsInfant = searchResults.some(
        p => !!p.age_cost_breakup?.infant || p.age_definition?.some(d => !!d.infant)
    );

    const firstWithDef = searchResults.find(p => p.age_definition && p.age_definition.length > 0);
    const childDef = firstWithDef?.age_definition?.find(d => d.child)?.child;
    const infantDef = firstWithDef?.age_definition?.find(d => d.infant)?.infant;
    const adultDef = firstWithDef?.age_definition?.find(d => d.adult)?.adult;

    const adultAgeLabel = adultDef
        ? `${String(adultDef.min_age).replace('+', '')}+ years`
        : DEFAULT_ADULT_AGE_LABEL;
    const childAgeLabel = childDef
        ? `${childDef.min_age}–${childDef.max_age} years`
        : DEFAULT_CHILD_AGE_LABEL;
    const infantAgeLabel = infantDef
        ? `${infantDef.min_age}–${infantDef.max_age} years`
        : DEFAULT_INFANT_AGE_LABEL;

    return {
        visaOptions,
        isLoading,
        selectProduct,
        supportsChild,
        supportsInfant,
        adultAgeLabel,
        childAgeLabel,
        infantAgeLabel,
    };
};

// ─── useVisaProductDocuments ──────────────────────────────────────────────────

export const useVisaProductDocuments = () => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [docsByProduct, setDocsByProduct] = useState<Record<number, string[]>>({});
    const cacheRef = useRef<Record<number, boolean>>({});

    const fetchDocuments = useCallback(
        async (productId: number) => {
            if (cacheRef.current[productId]) return;
            cacheRef.current[productId] = true;
            const docs = await getVisaProductDocuments({
                userType: role,
                userId: id,
                product_id: productId,
            });
            if (docs && docs.length > 0) {
                setDocsByProduct(prev => ({
                    ...prev,
                    [productId]: docs.map(d => d.display_value),
                }));
            }
        },
        [role, id]
    );

    return { docsByProduct, fetchDocuments };
};

// ─── useVisaProductDocumentsForUpload ─────────────────────────────────────────

export const useVisaProductDocumentsForUpload = (productId: number | null) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [documents, setDocuments] = useState<import('../types/visa').VisaProductDocument[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!productId) return;
        setIsLoading(true);
        getVisaProductDocuments({ userType: role, userId: id, product_id: productId })
            .then(docs => {
                if (docs) setDocuments(docs);
            })
            .finally(() => setIsLoading(false));
    }, [productId, role, id]);

    return { documents, isLoading };
};

// ─── useStageVisaDocuments ─────────────────────────────────────────────────────
// Uploads documents to S3 only (no vendor/order call) — the vendor order and
// its documents are only created/submitted at payment time (see useVisaPayment).

export const useStageVisaDocuments = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);

    const stageDocuments = useCallback(
        async (documents?: Record<string, File | null>): Promise<StagedVisaDocument[] | false> => {
            setIsLoading(true);

            const uploads: Array<{ document_code: string; file: File }> = [];
            if (documents) {
                // eslint-disable-next-line no-restricted-syntax
                for (const [code, file] of Object.entries(documents)) {
                    if (file) uploads.push({ document_code: code, file });
                }
            }

            const staged: StagedVisaDocument[] = [];
            // eslint-disable-next-line no-restricted-syntax
            for (const u of uploads) {
                // eslint-disable-next-line no-await-in-loop
                const resp = await stageVisaDocument({
                    userType: role,
                    userId: id,
                    file: u.file,
                    document_code: u.document_code,
                });
                if (!resp || !resp.status) {
                    setIsLoading(false);
                    dispatch(
                        showToast({
                            description: 'Failed to upload document. Please try again.',
                            variant: 'error',
                        })
                    );
                    return false;
                }
                staged.push({ document_code: u.document_code, s3Key: resp.data.s3Key });
            }

            setIsLoading(false);
            return staged;
        },
        [dispatch, role, id]
    );

    return { stageDocuments, isLoading };
};

// ─── useVisaPayment ───────────────────────────────────────────────────────────
// Order creation (vendor call + document submission) and payment now happen
// together, inside the wallet-payment request — see travel/visa/payment/wallet.

interface PaymentApplicantInput {
    firstName: string;
    lastName: string;
    dob: string;
    passportNo: string;
    contactNumber?: string;
    documents?: StagedVisaDocument[];
}

interface VisaPaymentInput {
    visa: VisaOption;
    travellers: { adults: number; children: number; infants: number };
    selectedAddOns: Array<{ key: string; label: string; price: number; flat: boolean }>;
    totalPayNow: number;
    visaAmount: number;
    companyName?: string;
    billingEmail?: string;
    phoneNumber?: string;
    billingAddress?: string;
    destinationName?: string;
    category?: string;
    productId: number;
    travelDate: string;
    applicants: PaymentApplicantInput[];
    billingAddressLine1?: string;
    billingAddressLine2?: string;
    billingCity?: string;
    billingState?: string;
    billingPincode?: string;
    productBreakup?: {
        breakup: import('../types/visa').VisaBreakup;
        age_cost_breakup: import('../types/visa').VisaProduct['age_cost_breakup'];
    };
}

export const useVisaPayment = () => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const navigate = useNavigate();
    const totalTravellers = (t: VisaPaymentInput['travellers']) =>
        t.adults + t.children + t.infants;

    const initiatePayment = useCallback(
        async (input: VisaPaymentInput): Promise<void> => {
            const {
                visa,
                travellers,
                selectedAddOns,
                totalPayNow,
                visaAmount,
                companyName,
                billingEmail,
                phoneNumber,
                billingAddress,
                destinationName,
                category,
                productId,
                travelDate,
                applicants,
                billingAddressLine1,
                billingAddressLine2,
                billingCity,
                billingState,
                billingPincode,
                productBreakup,
            } = input;
            const total = totalTravellers(travellers);

            const surchargeData = await getSurcharge({
                userType: role,
                userId: id,
                accessKey: accessKeys.visa,
                amount: Number(totalPayNow.toFixed(2)),
                quantity: total,
            });

            const surcharge =
                surchargeData && 'surcharge' in surchargeData ? Number(surchargeData.surcharge) : 0;

            const applicantsList = applicants.map(a => ({
                dob: a.dob,
                last_name: a.lastName,
                first_name: a.firstName,
                passport_no: a.passportNo,
                contact_number: a.contactNumber ?? '',
                documents: a.documents ?? [],
            }));

            const billingStateTrimmed = billingState?.trim() ?? '';
            const stateTaxCode =
                GST_STATE_CODES[billingStateTrimmed] ??
                Object.entries(GST_STATE_CODES).find(
                    ([k]) => k.toLowerCase() === billingStateTrimmed.toLowerCase()
                )?.[1] ??
                '';

            dispatch(
                setPaymentData({
                    title: 'Bill Summary',
                    billSummary: [
                        { key: 'Service Name', value: 'Visa Service' },
                        { key: 'Visa name', value: visa.name },
                        { key: 'Traveller', value: String(total) },
                        { key: 'Amount', value: formatNumberWithLocalString(totalPayNow) },
                    ],
                    paymentSummary: [
                        {
                            key: 'Platform fee (inclusive of GST)',
                            value: `₹ ${formatNumberWithLocalString(surcharge)}`,
                        },
                        ...selectedAddOns.map(a => ({
                            key: a.label,
                            value: `₹ ${formatNumberWithLocalString(a.flat ? a.price : a.price * total)}`,
                        })),
                    ],
                    totalAmount: totalPayNow + surcharge,
                    payload: {
                        accessKey: 'visa_api',
                        visaId: visa.id,
                        productId: visa.productId,
                        amount: String(totalPayNow.toFixed(2)),
                        totalAmount: Number((totalPayNow + surcharge).toFixed(2)),
                        travellers,
                        addOns: selectedAddOns.map(a => a.key),
                        companyName,
                        billingEmail,
                        phoneNumber,
                        billingAddress,
                        destination_name: destinationName,
                        visa_type: visa.visaType,
                        visa_name: visa.name,
                        category,
                        // ── vendor order-creation fields (first attempt only) ──
                        product_id: productId,
                        visa_amount: String(visaAmount.toFixed(2)),
                        applicants: applicantsList,
                        travel_date: travelDate,
                        customer_email: billingEmail || user?.email || '',
                        customer_first_name: applicants[0]?.firstName ?? '',
                        customer_last_name: applicants[0]?.lastName ?? '',
                        customer_mobile: phoneNumber || user?.mobileNo || '',
                        customer_billing_address_line_1: billingAddressLine1 ?? '',
                        customer_billing_address_line_2: billingAddressLine2 ?? '',
                        customer_billing_pincode: billingPincode ?? '',
                        customer_billing_state: billingStateTrimmed,
                        customer_billing_state_tax_code: stateTaxCode,
                        customer_billing_country: 'India',
                        customer_billing_city: billingCity ?? '',
                        group_name: 'W1',
                        adult: travellers.adults,
                        child: travellers.children,
                        infant: travellers.infants,
                        residency: 103,
                        nationality: 103,
                        unique_identifier: String(Date.now()),
                        partner: 'Peko',
                        base_currency: 'INR',
                        product_breakup: productBreakup,
                    },
                    url: 'travel/visa/payment/wallet',
                    earningCashbackAmount: 0,
                })
            );
            // Feeds the generic checkout mechanism in payments/hooks/usePaymentApi.ts, which fires
            // visa_checkout (add_ons/pay_now_amount here, plus mode/coupon_code_used/total_amount
            // from that hook) and later seeds visa_payment_result on the payments success page.
            // moengage_prefix is used because billSummary above keys this as 'Service Name'
            // (capital N), which doesn't match what that hook looks up ('Service name').
            sessionStorage.setItem(
                'service_details',
                JSON.stringify({
                    serviceDetails: {
                        moengage_prefix: 'visa',
                        add_ons: selectedAddOns.map(a => a.label).join(', '),
                        pay_now_amount: totalPayNow,
                    },
                })
            );
            navigate(paths.dashboard.payments);
        },
        [dispatch, navigate, role, id, user]
    );

    return { initiatePayment };
};

// ─── useTrackVisaApplication ──────────────────────────────────────────────────

export type TrackError = 'NOT_FOUND' | 'FORBIDDEN' | 'ERROR' | null;

export const useTrackVisaApplication = (orderNumber: string) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [orderData, setOrderData] = useState<VisaOrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<TrackError>(null);

    const fetchStatus = useCallback(async () => {
        if (!orderNumber) return;
        setIsLoading(true);
        setError(null);
        try {
            const resp = await getOrderStatus({
                userType: role,
                userId: id,
                order_number: orderNumber,
            });
            if (resp) setOrderData(resp);
            else setError('ERROR');
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) setError('NOT_FOUND');
            else if (status === 403) setError('FORBIDDEN');
            else setError('ERROR');
        } finally {
            setIsLoading(false);
        }
    }, [role, id, orderNumber]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { orderData, isLoading, error, refetch: fetchStatus };
};
