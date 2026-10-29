import { useCallback, useEffect, useRef, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getApplicationDetail, submitApplication, uploadDocument } from '../api';
import {
    setLoading,
    setError,
    updateApplicationData,
    setSubmittedApplication,
} from '../slices/incorporationSlice';
import { ApplicationPayload, DocumentUpload, EntityType } from '../types';
import {
    buildWordDocHtml,
    generateMoaContent,
    generateAoaContent,
    generateLlpAgreementContent,
} from '../utils/moaAoaTemplate';

const toBase64Utf8 = (str: string): string => {
    const bytes = new TextEncoder().encode(str);
    return btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
};

const collectDocuments = (
    payload: ApplicationPayload
): Array<DocumentUpload & { fieldKey: string }> => {
    const docs: Array<DocumentUpload & { fieldKey: string }> = [];
    const nestedDocs = payload.documents?.documents || [];
    nestedDocs.forEach(doc => docs.push({ ...doc, fieldKey: doc.docType }));

    const knownNonDocFields = new Set([
        'userId',
        'userType',
        'applicantDetails',
        'entityType',
        'proposedNames',
        'registeredOffice',
        'directors',
        'capital',
        'businessActivity',
        'moaAoa',
        'llpAgreement',
        'memorandum',
        'documents',
        // 'selectedServices',
    ]);
    Object.entries(payload).forEach(([key, value]) => {
        if (
            !knownNonDocFields.has(key) &&
            value &&
            typeof value === 'object' &&
            'docType' in value
        ) {
            docs.push({ ...(value as DocumentUpload), fieldKey: key });
        }
    });

    if (payload.entityType !== EntityType.LLP) {
        // Standard MOA — auto-generate and upload as a Word (.doc) file. We
        // regenerate on every submit so any form edits (proposed name, directors,
        // business activity, etc.) are reflected in the agreement sent to vendor.
        // appendDocumentToApplication on the backend replaces by docType so our
        // DB only ever references the latest version, and the PDF embeds the
        // latest vendorFileRefUrl.
        if (payload.moaAoa?.moaType === 'standard') {
            docs.push({
                docType: 'moa_draft',
                fileName: 'MOA_Draft.doc',
                fileBase64: toBase64Utf8(
                    buildWordDocHtml(generateMoaContent(payload), 'MOA')
                ),
                mimeType: 'application/msword',
                fieldKey: 'moa_draft',
            });
        }
        // Custom MOA — user-uploaded file (already base64 from MoaAoa.tsx)
        if (payload.moaAoa?.moaType === 'custom' && payload.moaAoa.moaDocument) {
            docs.push({ ...payload.moaAoa.moaDocument, fieldKey: 'moa_custom' });
        }

        // Standard AOA — auto-generate and upload as a Word (.doc) file
        if (payload.moaAoa?.aoaType === 'standard') {
            docs.push({
                docType: 'aoa_draft',
                fileName: 'AOA_Draft.doc',
                fileBase64: toBase64Utf8(
                    buildWordDocHtml(generateAoaContent(payload), 'AOA')
                ),
                mimeType: 'application/msword',
                fieldKey: 'aoa_draft',
            });
        }
        // Custom AOA — user-uploaded file (already base64 from MoaAoa.tsx)
        if (payload.moaAoa?.aoaType === 'customized' && payload.moaAoa.aoaDocument) {
            docs.push({ ...payload.moaAoa.aoaDocument, fieldKey: 'aoa_custom' });
        }
    }

    // Standard LLP Agreement — auto-generate and upload as a Word (.doc) file
    if (payload.entityType === EntityType.LLP && payload.llpAgreement?.agreementType === 'standard') {
        docs.push({
            docType: 'llp_agreement_draft',
            fileName: 'LLP_Agreement_Draft.doc',
            fileBase64: toBase64Utf8(
                buildWordDocHtml(generateLlpAgreementContent(payload), 'LLP Agreement')
            ),
            mimeType: 'application/msword',
            fieldKey: 'llp_agreement_draft',
        });
    }
    // LLP custom agreement — user-uploaded file (already base64 from LlpAgreement.tsx)
    if (
        payload.entityType === EntityType.LLP &&
        payload.llpAgreement?.agreementType === 'custom' &&
        payload.llpAgreement.customAgreementDocument
    ) {
        docs.push({
            ...payload.llpAgreement.customAgreementDocument,
            fieldKey: 'llp_agreement_custom',
        });
    }

    // Only upload docs that actually have base64 bytes. Docs returned from the
    // backend on an existing PENDING application carry vendorUrl/vendorFileRefUrl
    // but no base64 — those are already on the vendor and must not be re-uploaded.
    return docs.filter(d => d.fileBase64);
};

const buildSubmissionPayload = (payload: ApplicationPayload) => ({
    entityType: payload.entityType,
    applicantDetails: payload.applicantDetails,
    proposedNames: payload.proposedNames,
    registeredOffice: payload.registeredOffice,
    directors: payload.directors || [],
    additionalShareholders: payload.additionalShareholders || [],
    nominee: payload.entityType === EntityType.OPC ? payload.nominee : undefined,
    capital: payload.capital,
    businessActivity: payload.businessActivity,
    moaAoa:
        payload.entityType !== EntityType.LLP && payload.moaAoa
            ? {
                  moaType: payload.moaAoa.moaType,
                  aoaType: payload.moaAoa.aoaType,
                  confirmed: payload.moaAoa.confirmed,
              }
            : undefined,
    llpAgreement:
        payload.entityType === EntityType.LLP && payload.llpAgreement
            ? {
                  agreementType: payload.llpAgreement.agreementType,
                  partnerRights: payload.llpAgreement.partnerRights,
                  partnerDuties: payload.llpAgreement.partnerDuties,
                  meetingQuorum: payload.llpAgreement.meetingQuorum,
                  votingThreshold: payload.llpAgreement.votingThreshold,
                  disputeResolution: payload.llpAgreement.disputeResolution,
                  confirmed: payload.llpAgreement.confirmed,
              }
            : undefined,
    // selectedServices: payload.selectedServices || [],
});

export const useIncorporationForm = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const { currentApplication, isLoading } = useAppSelector(
        state => state.reducer.incorporation
    );
    // When the form is opened from the landing page's "View Application" button
    // for a PENDING application, the caller passes { state: { step: 6 } } to
    // start the user on the Review & Submit step.
    const initialStep =
        typeof (location.state as { step?: number } | null)?.step === 'number'
            ? (location.state as { step: number }).step
            : 0;
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isHydrating, setIsHydrating] = useState(false);
    const submittedAppIdRef = useRef<string | null>(null);
    const hasHydratedRef = useRef(false);

    // Hydrate Redux from the backend when the form is opened via the landing
    // page's "View Application" button after a hard reload (Redux is empty but
    // the application exists on the server). Runs at most once per mount;
    // skipped entirely if Redux already has data or if no applicationId was
    // passed via location.state.
    useEffect(() => {
        const navState = location.state as
            | { step?: number; applicationId?: string }
            | null;
        const applicationId = navState?.applicationId;
        const reduxIsEmpty = !currentApplication?.entityType;

        if (
            !applicationId ||
            !reduxIsEmpty ||
            hasHydratedRef.current ||
            !userId ||
            !userType
        ) {
            return;
        }
        hasHydratedRef.current = true;
        setIsHydrating(true);

        getApplicationDetail({ userId: Number(userId), userType, applicationId })
            .then(data => {
                if (!data) {
                    dispatch(
                        showToast({
                            description: 'Application not found. Please start a new one.',
                            variant: 'error',
                        })
                    );
                    navigate(paths.companyIncorporation.index, { replace: true });
                    return;
                }
                // Backend stores documents as a flat JSON array; the form expects
                // a nested wrapper. Every other JSON column matches shape.
                const reshaped: Partial<ApplicationPayload> = {
                    ...data,
                    documents: { documents: (data.documents || []) as never[] },
                };
                dispatch(updateApplicationData(reshaped));
            })
            .catch(() => {
                dispatch(
                    showToast({
                        description: 'Could not load the application. Please try again.',
                        variant: 'error',
                    })
                );
                navigate(paths.companyIncorporation.index, { replace: true });
            })
            .finally(() => setIsHydrating(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStepChange = useCallback((step: number) => {
        setCurrentStep(step);
    }, []);

    const handleUpdateApplicationData = useCallback(
        (data: Partial<ApplicationPayload>) => {
            dispatch(updateApplicationData(data));
        },
        [dispatch]
    );

    const handleSubmit = useCallback(
        async (formValues?: Partial<ApplicationPayload>) => {
            if (!userId || !userType) {
                dispatch(
                    showToast({ description: 'User information not found', variant: 'error' })
                );
                return;
            }

            dispatch(setLoading(true));

            try {
                const payload: ApplicationPayload = {
                    userId,
                    userType,
                    ...currentApplication,
                    ...formValues,
                    // selectedServices,
                } as ApplicationPayload;

                let applicationId: string;

                if (submittedAppIdRef.current) {
                    applicationId = submittedAppIdRef.current;
                } else {
                    const response = await submitApplication({
                        userId,
                        userType,
                        body: buildSubmissionPayload(payload) as Record<string, unknown>,
                    });

                    if (!response.ok) {
                        const message =
                            response.validationError ?? 'Failed to submit application';
                        dispatch(showToast({ description: message, variant: 'error' }));
                        dispatch(setError(message));
                        return;
                    }

                    dispatch(setSubmittedApplication(response.data as any));
                    applicationId = (response.data as any).applicationId as string;
                    submittedAppIdRef.current = applicationId;
                }

                if (!applicationId) {
                    dispatch(
                        showToast({
                            description: 'Application submitted but no ID was returned. Please try again.',
                            variant: 'error',
                        })
                    );
                    dispatch(setError('No applicationId returned from server'));
                    dispatch(setLoading(false));
                    return;
                }

                const documents = collectDocuments(payload);
                const uploadResults = await Promise.all(
                    documents.map(doc =>
                        uploadDocument({
                            userId,
                            userType,
                            applicationId,
                            docType: doc.docType,
                            fileName: doc.fileName,
                            fileBase64: doc.fileBase64,
                            mimeType: doc.mimeType,
                        }).then(result => ({ doc, result }))
                    )
                );
                const failedUploads = uploadResults.filter(({ result }) => !result);
                if (failedUploads.length > 0) {
                    const names = failedUploads.map(({ doc }) => doc.fileName).join(', ');
                    dispatch(
                        showToast({
                            description: `Some documents failed to upload: ${names}`,
                            variant: 'error',
                        })
                    );
                    dispatch(setLoading(false));
                    return;
                }

                dispatch(setLoading(false));
                navigate(
                    `${paths.companyIncorporation.index}/${paths.companyIncorporation.payment}`
                );
            } catch {
                dispatch(
                    showToast({ description: 'An unexpected error occurred', variant: 'error' })
                );
                dispatch(setError('Unexpected error during submission'));
            } finally {
                dispatch(setLoading(false));
            }
        },
        [userId, userType, currentApplication, dispatch, navigate]
    );

    return {
        currentStep,
        handleStepChange,
        currentApplication,
        handleUpdateApplicationData,
        handleSubmit,
        isLoading,
        isHydrating,
    };
};
