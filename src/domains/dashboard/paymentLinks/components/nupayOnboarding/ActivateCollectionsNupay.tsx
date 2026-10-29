import { useEffect, useState } from 'react';

import { Card, Flex, Typography } from 'antd';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getEntityOnboardingFields } from './entityDocuments';
import { MIQ_SECTIONS } from './miqFields';
import NupayAddressStep from './NupayAddressStep';
import NupayBankStep from './NupayBankStep';
import NupayBasicInfoStep from './NupayBasicInfoStep';
import NupayBusinessDetailsStep from './NupayBusinessDetailsStep';
import NupayDocumentsStep from './NupayDocumentsStep';
import NupayOnboardingStepIndicator, { NupayOnboardingStep } from './NupayOnboardingStepIndicator';
import { NupayDocRef, submitNupayOnboarding, uploadNupayOnboardingDoc } from '../../api';
import { ActivatePaymentCollectionsProps, NupayOnboardingFormState } from '../../types/activateCollectionsTypes';

// Per-document size caps: IDs/proofs are small (5MB); other docs allow up to 20MB.
const SMALL_DOC_MAX_MB = 5;
const DEFAULT_DOC_MAX_MB = 20;
// NuPay accepts all documents in one request, so the combined size is capped at 100MB.
const MAX_TOTAL_DOC_SIZE_MB = 100;
const MAX_TOTAL_DOC_SIZE_BYTES = MAX_TOTAL_DOC_SIZE_MB * 1024 * 1024;
const SMALL_DOC_FIELDS = new Set([
    'signatory_authority',
    'pan_card', 'proprietor_pan', 'partnership_firm_pan_card', 'authorised_signatory_pan', 'company_pan', 'ubo_pan',
    'ubo_aadhar',
    'cancelled_cheque',
    'address_proof', 'proprietor_address', 'registered_office_address_proof', 'principal_business_address_proof',
    'authorised_signatory_address_proof', 'registered_office', 'business_address', 'authorised_signatory_address',
    'board_resolution_or_poa', 'poa_or_authorisation_letter',
    'partnership_registration_certificate',
]);

// Text fields the backend expects in snake_case, mapped from wizard state.
const IDENTITY_FIELD_MAP: Record<string, keyof NupayOnboardingFormState> = {
    merchant_name: 'merchantName',
    contact_number: 'contactNumber',
    official_email: 'officialEmail',
    website_url: 'websiteUrl',
    city: 'city',
    state: 'state',
    pincode: 'pincode',
    business_address: 'businessAddress',
};

// Draft is saved per user so entered data survives a refresh or logout.
const draftKey = (userId: string | number) => `nupay_onboarding_draft_${userId}`;
// Calendar fields — saved as ISO, revived into dayjs on restore.
const DATE_FIELDS = MIQ_SECTIONS.flatMap(s => s.fields)
    .filter(f => f.type === 'date')
    .map(f => f.name);

const ActivateCollectionsNupay = ({
    onCancel,
    onActivated,
    refresh,
    title = 'Payment Links',
}: ActivatePaymentCollectionsProps) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    // Restore the saved draft so an interruption doesn't force re-entering the form.
    const [savedDraft] = useState<any>(() => {
        try {
            const raw = localStorage.getItem(draftKey(id));
            if (!raw) return null;
            const d = JSON.parse(raw);
            DATE_FIELDS.forEach(k => {
                if (d?.miqValues?.[k]) d.miqValues[k] = dayjs(d.miqValues[k]);
            });
            return d;
        } catch {
            return null;
        }
    });

    const [step, setStep] = useState<NupayOnboardingStep>(savedDraft?.step ?? 1);
    // Fresh form for a new applicant; only a saved draft (go back / logout / return) prefills.
    const [form, setForm] = useState<Partial<NupayOnboardingFormState>>(savedDraft?.form ?? {});
    const [miqValues, setMiqValues] = useState<Record<string, any>>(savedDraft?.miqValues ?? {});
    const [docRefs, setDocRefs] = useState<Record<string, NupayDocRef>>(savedDraft?.docRefs ?? {});
    const [docSizes, setDocSizes] = useState<Record<string, number>>(savedDraft?.docSizes ?? {});
    const [uploadingDocs, setUploadingDocs] = useState<Record<string, boolean>>({});
    const [docText, setDocText] = useState<Record<string, string>>(savedDraft?.docText ?? {});
    const [submitting, setSubmitting] = useState(false);

    // Save the draft whenever entered data changes.
    useEffect(() => {
        try {
            localStorage.setItem(draftKey(id), JSON.stringify({ step, form, miqValues, docText, docRefs, docSizes }));
        } catch {
            // storage unavailable/full — non-critical
        }
    }, [id, step, form, miqValues, docText, docRefs, docSizes]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(draftKey(id));
        } catch {
            // ignore
        }
    };

    // Combined size of all uploaded documents (kept within NuPay's 100MB per-request limit).
    const usedDocBytes = Object.values(docSizes).reduce((sum, sz) => sum + sz, 0);

    const merge = (values: Partial<NupayOnboardingFormState>) => setForm(prev => ({ ...prev, ...values }));

    // Upload each document as it's selected; submit later sends only the URL references.
    const handleFile = async (name: string, file: File | null) => {
        if (!file) {
            setDocRefs(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
            setDocSizes(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
            return;
        }
        const maxMb = SMALL_DOC_FIELDS.has(name) ? SMALL_DOC_MAX_MB : DEFAULT_DOC_MAX_MB;
        if (file.size > maxMb * 1024 * 1024) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: `${file.name} exceeds the ${maxMb}MB limit. Please upload a smaller file.`,
                })
            );
            return;
        }
        // Block if adding this file would push the combined size past NuPay's 100MB limit.
        const totalWithoutThis = usedDocBytes - (docSizes[name] || 0);
        if (totalWithoutThis + file.size > MAX_TOTAL_DOC_SIZE_BYTES) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: `Total documents can't exceed ${MAX_TOTAL_DOC_SIZE_MB}MB. Please remove some or use smaller files.`,
                })
            );
            return;
        }
        setUploadingDocs(prev => ({ ...prev, [name]: true }));
        try {
            const ref = await uploadNupayOnboardingDoc({ userId: id, userType: role, file });
            setDocRefs(prev => ({ ...prev, [name]: ref }));
            setDocSizes(prev => ({ ...prev, [name]: file.size }));
        } catch {
            // upload error surfaced by the global response interceptor toast
            setDocRefs(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        } finally {
            setUploadingDocs(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const validateDocuments = () => {
        if (Object.values(uploadingDocs).some(Boolean)) {
            dispatch(showToast({ variant: 'warning', description: 'Please wait for the documents to finish uploading.' }));
            return false;
        }
        const fields = getEntityOnboardingFields(form.entityType);
        const missing = fields.filter(f => {
            if (!f.required) return false;
            return f.type === 'file' ? !docRefs[f.name] : !docText[f.name]?.trim();
        });
        if (missing.length) {
            dispatch(showToast({ variant: 'error', description: `Please provide: ${missing.map(f => f.label).join(', ')}` }));
            return false;
        }
        if (usedDocBytes > MAX_TOTAL_DOC_SIZE_BYTES) {
            dispatch(showToast({ variant: 'error', description: `Total documents exceed ${MAX_TOTAL_DOC_SIZE_MB}MB. Please reduce and try again.` }));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateDocuments()) return;
        setSubmitting(true);

        const payload: Record<string, unknown> = { entityType: form.entityType || '' };
        Object.entries(IDENTITY_FIELD_MAP).forEach(([apiKey, stateKey]) => {
            const value = form[stateKey];
            if (value != null && String(value).trim()) payload[apiKey] = String(value).trim();
        });
        if (form.bankAccountNumber) payload.bank_account_number = String(form.bankAccountNumber).trim();
        if (form.ifscCode) payload.ifsc_code = String(form.ifscCode).trim();
        if (form.accountHolderName) payload.accountHolderName = String(form.accountHolderName).trim();
        Object.entries(miqValues).forEach(([k, v]) => {
            const val = dayjs.isDayjs(v) ? v.format('DD/MM/YYYY') : v;
            if (val != null && String(val).trim()) payload[k] = String(val).trim();
        });
        Object.entries(docText).forEach(([k, v]) => {
            if (v?.trim()) payload[k] = v.trim();
        });
        payload.documents = docRefs;

        try {
            await submitNupayOnboarding({ userId: id, userType: role, payload });
            clearDraft();
            dispatch(showToast({ variant: 'success', description: 'Onboarding submitted. Verification is in progress.' }));
            refresh();
            onActivated();
        } catch {
            // API/vendor errors are surfaced by the global response interceptor toast
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Flex align="center" justify="center" className="w-full px-3 py-4 sm:px-4 sm:py-6">
            <Card
                bordered={false}
                className="w-full max-w-[820px] rounded-[20px] !shadow-[0px_1.2px_12.4px_1.1px_rgba(0,0,0,0.06)]"
                styles={{ body: { padding: 'clamp(20px, 4vw, 32px) clamp(16px, 5vw, 36px)' } }}
            >
                <Flex vertical gap={20}>
                    <Flex vertical gap={2}>
                        <Typography.Title
                            level={3}
                            className="!mb-0 !text-[22px] !font-bold !leading-[1.3] !text-[#1F2A44]"
                        >
                            Activate {title === 'Payment Links' ? 'Payment Collections' : 'Payout'}
                        </Typography.Title>
                        <Typography.Text className="text-[13px] leading-[1.45] text-[#667085]">
                            Complete the steps below to start accepting payments
                        </Typography.Text>
                    </Flex>

                    <NupayOnboardingStepIndicator step={step} />

                    {step === 1 && (
                        <NupayBasicInfoStep
                            initialValues={form}
                            onCancel={onCancel}
                            onNext={values => {
                                merge(values);
                                setStep(2);
                            }}
                        />
                    )}

                    {step === 2 && (
                        <NupayBusinessDetailsStep
                            initialValues={miqValues}
                            onBack={() => setStep(1)}
                            onNext={values => {
                                setMiqValues(values);
                                setStep(3);
                            }}
                        />
                    )}

                    {step === 3 && (
                        <NupayAddressStep
                            initialValues={form}
                            onBack={() => setStep(2)}
                            onNext={values => {
                                merge(values);
                                setStep(4);
                            }}
                        />
                    )}

                    {step === 4 && (
                        <NupayBankStep
                            initialValues={form}
                            onBack={() => setStep(3)}
                            onNext={values => {
                                merge(values);
                                setStep(5);
                            }}
                        />
                    )}

                    {step === 5 && (
                        <NupayDocumentsStep
                            entityType={form.entityType || ''}
                            docRefs={docRefs}
                            uploading={uploadingDocs}
                            usedBytes={usedDocBytes}
                            maxTotalMb={MAX_TOTAL_DOC_SIZE_MB}
                            textValues={docText}
                            onFile={handleFile}
                            onText={(name, value) => setDocText(prev => ({ ...prev, [name]: value }))}
                            onBack={() => setStep(4)}
                            onSubmit={handleSubmit}
                            submitting={submitting}
                        />
                    )}
                </Flex>
            </Card>
        </Flex>
    );
};

export default ActivateCollectionsNupay;
