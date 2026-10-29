import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import {
    CorporateAgreementValues,
    downloadAgreementTemplate,
    getCorporateAgreement,
    initiateKyb,
    saveCorporateAgreement,
    sendAgreementForEsign,
    setAgreementSignMethod,
    uploadKybDocuments,
} from '../../api/admin/kybStatusApi';
import { setKybStage } from '../../slices/corporateCardsSlice';
import { AGREEMENT_SIGN_METHOD, KYB_AGREEMENT } from '../../utils/kybData';
import { KybFileValue } from '../../utils/types';

export const EMPTY_AGREEMENT: CorporateAgreementValues = {
    entityName: '',
    regAddress: '',
    regCity: '',
    regState: '',
    regPinCode: '',
    regTelephone: '',
    regEmail: '',
    billSameAsRegistered: false,
    billAddress: '',
    billCity: '',
    billState: '',
    billPinCode: '',
    gstNumber: '',
    panNumber: '',
    cinLlpNumber: '',
    tanNumber: '',
    addressProofSameAsGst: false,
    bankName: '',
    bankBranch: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankCity: '',
    officialContactName: '',
    officialContactMobile: '',
    officialContactEmail: '',
    salespersonName: '',
    salespersonMobile: '',
    salespersonEmail: '',
    signatoryName: '',
    signatoryContact: '',
    signatoryEmail: '',
    signatoryIsPep: false,
};

/**
 * Drops the keys the server sent as null so EMPTY_AGREEMENT's own defaults survive the spread.
 *
 * Every agreement column is nullable with no default, and the server serialises a blank one as null. Spread
 * straight over the defaults, that turns `''` into null, and a null fails Yup's string type check before any
 * rule runs — disabling the submit over a field the user was never required to fill.
 */
const definedOnly = <T extends object>(source: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(source).filter(([, value]) => value !== null && value !== undefined)
    ) as Partial<T>;

type SignMethod = (typeof AGREEMENT_SIGN_METHOD)[keyof typeof AGREEMENT_SIGN_METHOD];

export const ESIGN_POLL_MS = 15000;

export const ESIGN_STATUS = {
    PENDING_DISPATCH: 'PENDING_DISPATCH',
    SENT: 'SENT',
    SIGNED: 'SIGNED',
    FAILED: 'FAILED',
} as const;

export const useCorporateAgreement = (onSubmitted: () => void, enabled = true) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { businessType } = useAppSelector(state => state.reducer.corporateCards);

    const [agreement, setAgreement] = useState<CorporateAgreementValues>(EMPTY_AGREEMENT);
    const [signMethod, setSignMethod] = useState<SignMethod>(AGREEMENT_SIGN_METHOD.E_SIGN);
    const [esignStatus, setEsignStatus] = useState<string | null>(null);
    const [esignSigningLink, setEsignSigningLink] = useState<string | null>(null);
    const [esignSentAt, setEsignSentAt] = useState<string | null>(null);
    const [esignFailureReason, setEsignFailureReason] = useState<string | null>(null);
    const [templateAvailable, setTemplateAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [sendLoading, setSendLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    const fetchAgreement = useCallback(async () => {
        if (!enabled) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const res = await getCorporateAgreement(role, id);
        if (res && res.data) {
            if (res.data.agreement) {
                setAgreement({ ...EMPTY_AGREEMENT, ...definedOnly(res.data.agreement) });
            }
            if (res.data.signMethod) setSignMethod(res.data.signMethod as SignMethod);
            setEsignStatus(res.data.esignStatus ?? null);
            setEsignSigningLink(res.data.esignSigningLink ?? null);
            setEsignSentAt(res.data.esignSentAt ?? null);
            setEsignFailureReason(res.data.esignFailureReason ?? null);
            setTemplateAvailable(res.data.templateAvailable !== false);
        }
        setIsLoading(false);
    }, [enabled, role, id]);

    useEffect(() => {
        fetchAgreement();
    }, [fetchAgreement]);

    const awaitingSignature =
        esignStatus === ESIGN_STATUS.PENDING_DISPATCH || esignStatus === ESIGN_STATUS.SENT;

    // The awaiting-signature card promises we are watching for the signature, so we have to actually
    // watch. Refreshed in place, without the loading flag, so the card never blinks.
    useEffect(() => {
        if (!enabled || !awaitingSignature) return undefined;

        const timer = setInterval(async () => {
            const res = await getCorporateAgreement(role, id);
            if (res && res.data) {
                setEsignStatus(res.data.esignStatus ?? null);
                setEsignSigningLink(res.data.esignSigningLink ?? null);
                setEsignFailureReason(res.data.esignFailureReason ?? null);
            }
        }, ESIGN_POLL_MS);

        return () => clearInterval(timer);
    }, [enabled, awaitingSignature, role, id]);

    /**
     * Switched optimistically so the branch swaps immediately, then put back if the save failed. The server
     * decides which evidence a submission needs, so a silently unsaved switch leaves this screen satisfied
     * while every submit is refused for the method the server still holds.
     */
    const chooseSignMethod = async (method: SignMethod) => {
        const previous = signMethod;
        setSignMethod(method);
        const res = await setAgreementSignMethod(role, id, method);
        if (!res) {
            setSignMethod(previous);
            dispatch(
                showToast({
                    variant: 'error',
                    description: KYB_AGREEMENT.signMethodSaveFailed,
                })
            );
        }
    };

    const sendForEsign = async (values: CorporateAgreementValues) => {
        setSendLoading(true);
        const res = await sendAgreementForEsign(role, id, values);
        setSendLoading(false);
        if (!res) return;
        setAgreement(values);
        setEsignStatus(res.data?.esignStatus ?? ESIGN_STATUS.SENT);
        setEsignSigningLink(res.data?.esignSigningLink ?? null);
        setEsignFailureReason(null);
        dispatch(showToast({ variant: 'success', description: KYB_AGREEMENT.esignQueued }));
    };

    const saveDraft = useCallback(
        async (values: CorporateAgreementValues) => {
            await saveCorporateAgreement(role, id, values);
        },
        [role, id]
    );

    const downloadTemplate = async () => {
        setDownloadLoading(true);
        const blob = await downloadAgreementTemplate(role, id);
        setDownloadLoading(false);
        if (!blob) {
            setTemplateAvailable(false);
            return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Peko-Corporate-Card-Agreement.docx';
        link.click();
        URL.revokeObjectURL(url);
    };

    const submitForVerification = async (
        signedCopy?: KybFileValue | null,
        signedCopyAlreadySaved = false
    ) => {
        setSubmitLoading(true);

        if (signMethod === AGREEMENT_SIGN_METHOD.UPLOAD && !signedCopyAlreadySaved) {
            if (!signedCopy) {
                setSubmitLoading(false);
                return;
            }
            const uploadRes = await uploadKybDocuments(role, id, [
                {
                    documentName: 'Corporate_Agreement',
                    fileBase: signedCopy.base64,
                    fileFormat: signedCopy.format,
                    fileName: signedCopy.name,
                },
            ]);
            if (!uploadRes) {
                setSubmitLoading(false);
                dispatch(
                    showToast({
                        variant: 'error',
                        description: 'Failed to upload the signed agreement. Please try again.',
                    })
                );
                return;
            }
        }

        const initiateRes = await initiateKyb(role, id, businessType ?? undefined);
        setSubmitLoading(false);
        if (!initiateRes) {
            dispatch(
                showToast({
                    variant: 'error',
                    description: 'Could not submit your KYB. Please try again.',
                })
            );
            return;
        }

        dispatch(setKybStage('submitted'));
        onSubmitted();
    };

    return {
        agreement,
        signMethod,
        chooseSignMethod,
        sendForEsign,
        saveDraft,
        esignStatus,
        esignSigningLink,
        esignSentAt,
        esignFailureReason,
        esignQueued: esignStatus !== null && esignStatus !== ESIGN_STATUS.FAILED,
        esignSigned: esignStatus === ESIGN_STATUS.SIGNED,
        templateAvailable,
        downloadTemplate,
        downloadLoading,
        submitForVerification,
        isLoading,
        sendLoading,
        submitLoading,
    };
};
