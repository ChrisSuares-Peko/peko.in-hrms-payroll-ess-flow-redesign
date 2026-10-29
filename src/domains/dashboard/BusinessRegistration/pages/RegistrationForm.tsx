import { useEffect, useRef, useState } from 'react';

import { Button, Form as AntForm, Spin, Typography } from 'antd';
import { Formik, Form, FormikProps, FormikTouched } from 'formik';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { showToast } from '@src/slices/apiSlice';
import { accessKeys } from '@utils/accessKeys';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';
import {
    ApplicationDocument,
    getApplicationDetail,
    saveDraftApplication,
    sendApplicationToVendor,
    startVendorPaymentPhase,
    submitApplication,
    syncApplicationDocuments,
    uploadApplicationDocument,
} from '../api';
import DigitalSignatureCard from '../components/DigitalSignatureCard';
import RelationshipManagerCard from '../components/RelationshipManagerCard';
import StepProgress from '../components/StepProgress';
import Contribution from '../components/steps/llp/Contribution';
import DirectorNomineeKYC from '../components/steps/opc/DirectorNomineeKYC';
import Shareholding from '../components/steps/opc/Shareholding';
import CapitalContribution from '../components/steps/partnership/CapitalContribution';
import PartnersKYC from '../components/steps/partnership/PartnersKYC';
import DirectorsKYC from '../components/steps/privateLimited/DirectorsKYC';
import BasicInformation from '../components/steps/proprietorship/BasicInformation';
import DocumentsStep from '../components/steps/proprietorship/DocumentsStep';
import AddressDetails from '../components/steps/proprietorship/gst/AddressDetails';
import ApplicantDetails from '../components/steps/proprietorship/gst/ApplicantDetails';
import GstInformation from '../components/steps/proprietorship/gst/GstInformation';
import RegistrationFiling from '../components/steps/proprietorship/RegistrationFiling';
import { DocumentUploadContext, UploadDocFn } from '../context/documentUpload';
import { DraftSaveContext } from '../context/draftSave';
import { buildTouched, getStepSchemas, scrollToFirstError } from '../schema';
import {
    clearCurrentApplication,
    setSubmittedApplication,
    updateApplicationData,
} from '../slices/businessRegistrationSlice';
import { EntityType } from '../types';
import {
    buildRegisterPath,
    HERO_SUBTITLE,
    HERO_TITLE,
    parseCatalogAbout,
    STEPS_BY_ENTITY,
} from '../utils/data';
import { isUploadedFile, stripFileContents } from '../utils/draft';
import { EMPTY_PARTNER } from '../utils/partnership';
import { EMPTY_PERSON } from '../utils/person';
import { isPreviewEntity } from '../utils/preview';
import { docNidForPath, getAllDocNames, personDocNid } from '../utils/proprietorDocuments';
import { restoreDocuments } from '../utils/restoreDocuments';
import { friendlyVendorError } from '../utils/vendorErrors';

const { Title, Paragraph } = Typography;

const ENTITY_TYPES = new Set<string>(Object.values(EntityType));

// Entities filed with the vendor (IndiaFilings create-chain). Must mirror the
// BE VENDOR_ENTITY_SET so every entity gets the same vendor flow (on-the-go doc
// upload, doc→vendor sync, payment phase, SmartForm 2 / GST form).
const VENDOR_ENTITIES = new Set<EntityType>([
    EntityType.OPC,
    EntityType.PRIVATE_LIMITED,
    EntityType.PROPRIETORSHIP,
    EntityType.LLP,
    EntityType.PARTNERSHIP,
]);

const getPath = (obj: unknown, path: string) =>
    path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);

// personKey mirrors the backend chain identity (PAN or passport number
// uppercase, else role:index) so each document is uploaded against the right
// vendor person.
type IdPerson = { pan?: string; passportNumber?: string };
const personIdOf = (p?: IdPerson) => p?.pan || p?.passportNumber;

const resolvePersonKey = (values: Record<string, unknown>, fieldPath: string): string | null => {
    const arrayMatch = fieldPath.match(/^documents\.(directors|partners)\.(\d+)\./);
    if (arrayMatch) {
        const [, field, idx] = arrayMatch;
        const person = (values[field] as IdPerson[] | undefined)?.[Number(idx)];
        const id = personIdOf(person);
        return id ? String(id).toUpperCase() : `director:${idx}`;
    }
    if (fieldPath.includes('.director.')) {
        const id = personIdOf(values.director as IdPerson | undefined);
        return id ? String(id).toUpperCase() : 'director:0';
    }
    return null; // office/business-level documents
};

// Collect the KYC documents (with base64) to push one-per-request after submit.
const collectDocuments = (values: Record<string, unknown>): ApplicationDocument[] => {
    const docs = getAllDocNames(values).flatMap(fieldPath => {
        const file = getPath(values, fieldPath);
        if (!isUploadedFile(file)) return [];
        const documentNid =
            docNidForPath(fieldPath) ?? personDocNid(fieldPath.split('.').pop() ?? '');
        return [
            {
                docType: fieldPath.replace(/^documents\./, '').replace(/\./g, '_'),
                personKey: resolvePersonKey(values, fieldPath),
                fileName: file.name,
                fileString: file.base64,
                ...(documentNid != null ? { documentNid } : {}),
            },
        ];
    });
    return docs;
};

// Payment is always the 2nd step: step 1 (Basic Information) → payment → the
// remaining steps resume here via the ?step= query param. Steps 2+ show the RM sidebar.
const RegistrationForm = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { currentApplication } = useAppSelector(state => state.reducer.businessRegistration);
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    // The URL is the source of truth: entityType from the path param (so a reload
    // can never fall back to the wrong entity), applicationId + step from query.
    const { entityType: entityTypeParam } = useParams<{ entityType?: string }>();
    const entityType = ENTITY_TYPES.has(entityTypeParam ?? '')
        ? (entityTypeParam as EntityType)
        : undefined;
    const steps = (entityType && STEPS_BY_ENTITY[entityType]) || [];
    // Preview entity: walk the whole form freely — no step validation, no draft
    // or document API, and payment is a dummy that just advances the step.
    const isPreview = isPreviewEntity(entityType);

    // Post-payment the central payment hook redirects here with ?status=success.
    const paidReturn = searchParams.get('status') === 'success';
    const urlApplicationId = searchParams.get('applicationId') || undefined;

    // A stored draft belongs to THIS form only when it's the same entity (or the
    // application named in the URL). A leftover draft from a different entity
    // (e.g. a Private Limited draft) must NOT seed an OPC form — otherwise its
    // directors/capital/documents/applicationId leak across entity types.
    const draftMatchesRoute =
        !(currentApplication?.entityType as string | undefined) ||
        (currentApplication?.entityType as string | undefined) === entityType ||
        (currentApplication?.applicationId as string | undefined) === urlApplicationId;
    const routeApplication = draftMatchesRoute ? currentApplication : {};
    // NB: searchParams.get returns null when the param is absent, and
    // Number(null) === 0 — so only trust `step` when it's actually present,
    // otherwise a post-payment return (no step param) resolves to step 0 instead
    // of advancing to step 1.
    const stepRaw = searchParams.get('step');
    const stepParam = stepRaw !== null && stepRaw !== '' ? Number(stepRaw) : NaN;
    const fallbackStep = paidReturn ? 1 : 0;
    const startStep = Number.isInteger(stepParam) && stepParam >= 0 ? stepParam : fallbackStep;
    const [currentStep, setCurrentStep] = useState(startStep);
    const [hydrating, setHydrating] = useState(
        Boolean(urlApplicationId) && !currentApplication?.applicationId
    );
    const hydrateAttempted = useRef(false);
    const [submitting, setSubmitting] = useState(false);

    // No valid entity in the URL → nothing to render; send the user back to pick
    // a structure instead of silently defaulting to one.
    useEffect(() => {
        if (!entityType) {
            navigate(`${paths.businessRegistration.index}/${paths.businessRegistration.form}`, {
                replace: true,
            });
        }
    }, [entityType, navigate]);

    // Wipe a leftover draft from a different entity so its applicationId/data
    // can't leak into this entity's saves or merges (routeApplication guards the
    // initial render; this keeps the store itself clean).
    useEffect(() => {
        if (!draftMatchesRoute) dispatch(clearCurrentApplication());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [draftMatchesRoute]);

    // Reload recovery: the URL carries an applicationId but Redux was wiped —
    // rehydrate the draft (incl. entityType + saved data) from the server.
    useEffect(() => {
        if (hydrateAttempted.current) return;
        if (!urlApplicationId || currentApplication?.applicationId === urlApplicationId) {
            setHydrating(false);
            return;
        }
        hydrateAttempted.current = true;
        setHydrating(true);
        // Detail (not list) so uploaded documents come back — restoreDocuments
        // re-attaches them so a reload/resume keeps their upload state.
        getApplicationDetail({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId: urlApplicationId,
        })
            .then(app => {
                if (app && app.applicationId) {
                    dispatch(
                        updateApplicationData({
                            ...restoreDocuments(
                                { ...(app.applicationData ?? {}), entityType: app.entityType },
                                app.documents,
                                VENDOR_ENTITIES.has(app.entityType as EntityType)
                            ),
                            entityType: app.entityType as EntityType,
                            applicationId: app.applicationId,
                            paymentCompleted: app.paymentStatus === 'COMPLETED',
                        })
                    );
                }
            })
            .finally(() => setHydrating(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set while jumping to the payment page. Creating the draft's applicationId
    // there dispatches an update that fires the URL-sync effect below; its
    // setSearchParams(replace) runs in the same tick as navigate('/payment') and
    // cancels it — so the FIRST proceed (new applicationId) appeared to do
    // nothing while the second (unchanged applicationId) worked. Guarding the
    // sync during that jump lets the navigate win.
    const leavingForPayment = useRef(false);
    // Keep the URL query in sync with the live applicationId + step so a reload
    // at any point resumes the same draft and step (replace: no history spam).
    useEffect(() => {
        if (leavingForPayment.current) return;
        const appId = currentApplication?.applicationId as string | undefined;
        const next = new URLSearchParams(searchParams);
        let changed = false;
        if (appId && next.get('applicationId') !== appId) {
            next.set('applicationId', appId);
            changed = true;
        }
        if (next.get('step') !== String(currentStep)) {
            next.set('step', String(currentStep));
            changed = true;
        }
        if (changed) setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentApplication?.applicationId, currentStep]);
    const isLast = currentStep === steps.length - 1;
    const hasSidebar = currentStep > 0;
    // The Documents step uploads its files on Next (not at final submit) so an
    // upload error blocks moving to the final page. -1 for entities without one.
    const documentsStepIndex = steps.indexOf('Documents');

    const formikRef = useRef<FormikProps<Record<string, unknown>>>(null);
    const validationSchemas = getStepSchemas(entityType);

    // Validate the current step's schema; on errors, reveal them and block Next.
    const validateCurrentStep = async () => {
        const formik = formikRef.current;
        if (isPreview) return true;
        if (!formik || !validationSchemas[currentStep]) return true;
        const errors = await formik.validateForm();
        if (!Object.keys(errors).length) return true;
        formik.setErrors(errors);
        formik.setTouched(
            buildTouched(formik.values, errors) as FormikTouched<Record<string, unknown>>,
            false
        );
        // Signals collapsed person cards with errors to expand (see
        // CollapsiblePersonCard) before the scroll below looks for them.
        formik.setStatus({
            ...(formik.status || {}),
            validationAttempt: ((formik.status?.validationAttempt as number) || 0) + 1,
        });
        scrollToFirstError();
        return false;
    };

    // Once paid, step 0 stays editable but can never lead back to payment.
    const paymentCompleted = Boolean(currentApplication?.paymentCompleted) || paidReturn;
    const paymentPhaseTriggered = useRef(false);
    useEffect(() => {
        if (!paidReturn) return;
        if (!currentApplication?.paymentCompleted) {
            dispatch(updateApplicationData({ paymentCompleted: true }));
        }
        // Payments go through Cashfree (a separate service that can't start the
        // vendor chain), so start the payment-phase steps here — once — the
        // moment we land back from the gateway. The backend runs it in the
        // background and is idempotent, so a repeat on reload is harmless.
        const appId = (currentApplication?.applicationId as string | undefined) || urlApplicationId;
        if (
            !paymentPhaseTriggered.current &&
            appId &&
            entityType &&
            VENDOR_ENTITIES.has(entityType)
        ) {
            paymentPhaseTriggered.current = true;
            startVendorPaymentPhase({
                userId: Number(userId),
                userType: userType ?? '',
                applicationId: appId,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paidReturn, currentApplication?.applicationId]);

    const initialValues = {
        primaryContact: { fullName: '', email: '', mobile: '' },
        proposedNames: { first: '', second: '', third: '', fourth: '' },
        stateOfIncorporation: '',
        // Proprietorship GST Registration smart-form fields (post-payment steps).
        gst: {},
        businessActivities: [],
        businessDescription: '',
        registeredOffice: '',
        registeredOfficeAddress: {
            line1: '',
            line2: '',
            pincode: '',
            area: '',
            city: '',
            district: '',
            state: '',
            latitude: '',
            longitude: '',
            landlordName: '',
            businessMobile: '',
            businessEmail: '',
        },
        numberOfDirectors: undefined,
        numberOfShareholders: undefined,
        director: { ...EMPTY_PERSON },
        directors: [{ ...EMPTY_PERSON }],
        nominee: { ...EMPTY_PERSON },
        authorizedCapital: undefined,
        paidUpCapital: undefined,
        faceValuePerShare: 10,
        shareholding: {},
        totalContribution: '',
        contribution: {},
        // Partnership needs a minimum of 2 partners — seed two blank cards so the
        // requirement is visible up front (a resumed draft overrides this below).
        partners: [{ ...EMPTY_PARTNER }, { ...EMPTY_PARTNER }],
        // routeApplication is currentApplication only when it belongs to this
        // route — a different-entity leftover is dropped so it can't prefill.
        ...routeApplication,
        // Route param is authoritative for the entity — never let a stale
        // Redux value override which form we're rendering.
        entityType,
    };

    // Submit sequence (one click): 1) persist the application (filenames only),
    // 2) upload each KYC document (base64, one per request — CI pattern),
    // 3) start the vendor create-chain for OPC / Private Limited, then track.
    const handleFinalSubmit = async (values: Record<string, unknown>) => {
        // Preview: nothing is filed yet — the tracking screen renders live vendor
        // data, so the walkthrough ends on this review step.
        if (isPreview) {
            dispatch(
                showToast({
                    description:
                        'Flow preview — filing is wired once the vendor confirms this flow.',
                    variant: 'success',
                })
            );
            return;
        }
        const merged: Record<string, unknown> = { ...currentApplication, ...values };
        delete merged.activitySearch; // transient NIC picker field
        const applicationData = stripFileContents(merged) as Record<string, unknown>;

        setSubmitting(true);
        const auth = { userId: Number(userId), userType: userType ?? '' };
        const result = await submitApplication({
            ...auth,
            applicationId: currentApplication?.applicationId as string | undefined,
            entityType: (entityType ?? '') as string,
            applicationData,
        });
        if (!result) {
            setSubmitting(false);
            dispatch(
                showToast({
                    description: 'Could not submit your application. Please try again.',
                    variant: 'error',
                })
            );
            return;
        }

        const applicationId = (result as { applicationId?: string }).applicationId ?? '';
        // People, shareholdings and documents were already pushed to the vendor at
        // each step (and blocked there on failure). Final submit files the last
        // (smart/GST) form synchronously — if the filing fails, surface it here and
        // DON'T mark the application submitted, so the user can fix and retry.
        if (applicationId && entityType && VENDOR_ENTITIES.has(entityType)) {
            const vendorResult = await sendApplicationToVendor({ ...auth, applicationId });
            const filed =
                vendorResult &&
                (vendorResult as { vendorStatus?: string }).vendorStatus !== 'FAILED';
            if (!filed) {
                setSubmitting(false);
                dispatch(
                    showToast({
                        description: friendlyVendorError(
                            ((vendorResult || undefined) as { error?: string } | undefined)?.error
                        ),
                        variant: 'error',
                    })
                );
                return;
            }
        }
        setSubmitting(false);

        dispatch(setSubmittedApplication(result));
        navigate(`${paths.businessRegistration.index}/${paths.businessRegistration.tracking}`, {
            state: result,
        });
    };

    // Step 0 → create/refresh the PENDING draft on the server (it computes the
    // authoritative pricing the payment debits against), then go to payment.
    const handleProceedToPayment = async (values: Record<string, unknown>) => {
        // Preview: payment is a dummy — no draft, no pricing, no gateway. Mark it
        // paid locally so the flow continues into the post-payment steps.
        if (isPreview) {
            dispatch(updateApplicationData({ paymentCompleted: true }));
            setCurrentStep(1);
            return;
        }
        const merged: Record<string, unknown> = { ...currentApplication, ...values };
        delete merged.activitySearch;
        const applicationData = {
            ...(stripFileContents(merged) as Record<string, unknown>),
            step: currentStep,
        };

        setSubmitting(true);
        const draft = await saveDraftApplication({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId: currentApplication?.applicationId as string | undefined,
            entityType: (entityType ?? '') as string,
            applicationData,
        });
        if (!draft) {
            setSubmitting(false);
            dispatch(
                showToast({
                    description: 'Could not save your application. Please try again.',
                    variant: 'error',
                })
            );
            return;
        }

        // One selectable option per catalog variant — GST split + Platform Fee
        // (surcharge, same source the BE debits against) computed per option. A
        // single variant keeps the page exactly as before.
        const variants = draft.variants?.length
            ? draft.variants
            : [
                  {
                      vendorCatalogId: '',
                      variantName: draft.serviceName || '',
                      price: Number(draft.totalAmount) || 0,
                      description: draft.description,
                      about: draft.about,
                  },
              ];

        const options = await Promise.all(
            variants.map(async v => {
                const subtotal = Number(v.price) || 0;
                const incorporationFee = Math.round(subtotal / 1.18);
                const gstAmount = subtotal - incorporationFee;
                const surchargeData = await getSurcharge({
                    userId: Number(userId),
                    userType: userType ?? '',
                    amount: subtotal,
                    accessKey: accessKeys.businessRegistration,
                });
                const surcharge = surchargeData ? parseFloat(surchargeData.surcharge) || 0 : 0;
                const gstPercent =
                    incorporationFee > 0 ? Math.round((gstAmount / incorporationFee) * 100) : 0;
                const lineItems = [{ label: 'Incorporation Fee', amount: incorporationFee }];
                if (gstAmount > 0)
                    lineItems.push({ label: `GST (${gstPercent}%)`, amount: gstAmount });
                if (surcharge > 0) lineItems.push({ label: 'Platform Fee', amount: surcharge });
                const includes = parseCatalogAbout(v.about);
                const description = v.description?.trim() || '';
                return {
                    vendorCatalogId: v.vendorCatalogId,
                    label: v.variantName,
                    price: subtotal,
                    totalAmount: subtotal + surcharge,
                    paymentSummary: lineItems.map(item => ({
                        key: item.label,
                        value: `₹ ${formatNumberWithLocalString(item.amount)}`,
                    })),
                    paymentNote:
                        includes.length || description ? { includes, description } : undefined,
                };
            })
        );
        setSubmitting(false);

        const selected = options[0];
        const hasChoice = options.length > 1;

        // Keep the draft in the store so a reload / post-payment return resumes it.
        leavingForPayment.current = true;
        dispatch(
            updateApplicationData({ applicationId: draft.applicationId, draftPricing: draft })
        );

        // Hand off to the shared payment page (one source of truth for payment UI);
        // "What's included" + notes ride along as paymentNote so they still show.
        dispatch(
            setPaymentData({
                billSummary: [
                    { key: 'Service', value: 'Business Registration' },
                    { key: 'Application ID', value: draft.applicationId },
                ],
                paymentSummary: selected.paymentSummary,
                totalAmount: selected.totalAmount,
                title: 'Business Registration',
                payload: {
                    accessKey: accessKeys.businessRegistration,
                    applicationId: draft.applicationId,
                    amount: selected.price,
                    payCashback: false,
                    catalogId: draft.catalogId ?? undefined,
                    ...(selected.vendorCatalogId
                        ? { vendorCatalogId: selected.vendorCatalogId }
                        : {}),
                },
                url: 'officeAndBusiness/business-registration/payment',
                successPath: buildRegisterPath(entityType ?? ''),
                // Cancel/Back on the shared page returns to step 0 with the draft.
                navigatePath: buildRegisterPath(entityType ?? '', {
                    applicationId: draft.applicationId,
                    step: 0,
                }),
                paymentNote: selected.paymentNote,
                variantOptions: hasChoice ? options : undefined,
                selectedVariantId: hasChoice ? selected.vendorCatalogId : undefined,
            })
        );
        navigate(paths.dashboard.payments);
    };

    // Persist progress server-side on every step (fire-and-forget, fail-soft).
    // vendorSync when leaving the KYC step pushes business + directors to the
    // vendor in the background (post-payment, OPC/PvtLtd only).
    const persistDraft = (values: Record<string, unknown>, vendorSync: boolean) => {
        if (isPreview) return;
        const merged: Record<string, unknown> = { ...currentApplication, ...values };
        delete merged.activitySearch;
        saveDraftApplication({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId: currentApplication?.applicationId as string | undefined,
            entityType: (entityType ?? '') as string,
            applicationData: {
                ...(stripFileContents(merged) as Record<string, unknown>),
                step: currentStep,
            },
            vendorSync: vendorSync && entityType ? VENDOR_ENTITIES.has(entityType) : false,
        });
    };

    // On-demand server save for the per-person "Save progress" buttons — awaits
    // the save and reports success/failure (unlike persistDraft, which is
    // fire-and-forget). No validation: a draft may be partially filled.
    const saveProgress = async (values: Record<string, unknown>): Promise<boolean> => {
        if (isPreview) {
            dispatch(updateApplicationData(values));
            dispatch(
                showToast({ description: 'Your progress has been saved.', variant: 'success' })
            );
            return true;
        }
        const merged: Record<string, unknown> = { ...currentApplication, ...values };
        delete merged.activitySearch;
        const draft = await saveDraftApplication({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId: currentApplication?.applicationId as string | undefined,
            entityType: (entityType ?? '') as string,
            applicationData: {
                ...(stripFileContents(merged) as Record<string, unknown>),
                step: currentStep,
            },
        });
        if (!draft) {
            dispatch(
                showToast({
                    description: 'Could not save your progress. Please try again.',
                    variant: 'error',
                })
            );
            return false;
        }
        // Capture a freshly-created draft id so later saves update the same row.
        if (draft.applicationId && draft.applicationId !== currentApplication?.applicationId) {
            dispatch(updateApplicationData({ applicationId: draft.applicationId }));
        }
        dispatch(showToast({ description: 'Your progress has been saved.', variant: 'success' }));
        return true;
    };

    // Upload every KYC/service document (base64, one request each) for the
    // application. uploadApplicationDocument resolves to `false` on failure, so
    // we count those and let the caller block navigation on any failure.
    const uploadDocuments = async (applicationId: string, source: Record<string, unknown>) => {
        const documents = collectDocuments(source);
        if (!documents.length) return { total: 0, failed: 0 };
        const auth = { userId: Number(userId), userType: userType ?? '' };
        const results = await Promise.all(
            documents.map(document =>
                uploadApplicationDocument({ ...auth, applicationId, document })
            )
        );
        return { total: documents.length, failed: results.filter(r => r === false).length };
    };

    // Synchronous per-step vendor sync (KYC → directors, Shareholding →
    // shareholders). Persists the draft AND pushes to the vendor in one call;
    // returns false (with a toast) so the caller blocks the step. Idempotent
    // server-side, so back-nav / resume re-runs never duplicate.
    const syncStepPhase = async (
        applicationId: string,
        syncPhase: 'directors' | 'shareholders',
        source: Record<string, unknown>
    ) => {
        const merged: Record<string, unknown> = { ...source, activitySearch: undefined };
        const draft = await saveDraftApplication({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId,
            entityType: (entityType ?? '') as string,
            applicationData: {
                ...(stripFileContents(merged) as Record<string, unknown>),
                step: currentStep,
            },
            syncPhase,
        });
        if (!draft) {
            dispatch(
                showToast({
                    description: 'Could not save your details. Please try again.',
                    variant: 'error',
                })
            );
            return false;
        }
        if (draft.sync && draft.sync.ok === false) {
            // Map the raw vendor error to a friendly, actionable line so the user
            // knows which detail to fix — without leaking raw vendor codes.
            dispatch(
                showToast({
                    description: friendlyVendorError(draft.sync.error),
                    variant: 'error',
                })
            );
            return false;
        }
        return true;
    };

    // On-the-go single-document upload (Documents step): push a file to the
    // vendor the moment it's picked. Reuses the sync endpoint with a one-item
    // list — its documents phase is granular, so only this file is uploaded.
    const uploadDocNow: UploadDocFn = async (fieldPath, file) => {
        // Preview: accept the file locally so the step shows it as uploaded.
        if (isPreview) return { ok: true };
        const appId = currentApplication?.applicationId as string | undefined;
        const isVendor = Boolean(entityType && VENDOR_ENTITIES.has(entityType));
        if (!appId || !isVendor) return { ok: false, skipped: true };
        const documentNid =
            docNidForPath(fieldPath) ?? personDocNid(fieldPath.split('.').pop() ?? '');
        const doc: ApplicationDocument = {
            docType: fieldPath.replace(/^documents\./, '').replace(/\./g, '_'),
            personKey: resolvePersonKey(formikRef.current?.values ?? {}, fieldPath),
            fileName: file.name,
            fileString: file.base64,
            ...(documentNid != null ? { documentNid } : {}),
        };
        const result = await syncApplicationDocuments({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId: appId,
            documents: [doc],
        });
        // No response (timeout / network) — not a vendor validation error.
        if (!result) return { ok: false, error: 'The upload didn’t complete — please try again.' };
        const err = (result as { error?: string }).error;
        return err ? { ok: false, error: friendlyVendorError(err) } : { ok: true };
    };
    // One upload at a time: parallel syncs write the same documents row + stage.
    const uploadQueue = useRef<Promise<unknown>>(Promise.resolve());
    const uploadDocOnTheGo: UploadDocFn = (fieldPath, file) => {
        const run = uploadQueue.current.then(() => uploadDocNow(fieldPath, file));
        uploadQueue.current = run.catch(() => undefined);
        return run;
    };

    // Documents step (vendor entities): batch-push any files not already sent
    // on the go; block on any failure. Already-uploaded files carry no base64
    // (dropped after their on-the-go / resume upload), so nothing is re-sent.
    const syncStepDocuments = async (applicationId: string, source: Record<string, unknown>) => {
        const documents = collectDocuments(source).filter(d => d.fileString);
        if (!documents.length) return true;
        const result = await syncApplicationDocuments({
            userId: Number(userId),
            userType: userType ?? '',
            applicationId,
            documents,
        });
        const errorMsg = !result ? 'document upload failed' : (result as { error?: string }).error;
        if (errorMsg) {
            dispatch(showToast({ description: friendlyVendorError(errorMsg), variant: 'error' }));
            return false;
        }
        return true;
    };

    const handlePrimary = async (values: Record<string, unknown>) => {
        if (!(await validateCurrentStep())) return;
        dispatch(updateApplicationData(values));
        if (currentStep === 0) {
            if (paymentCompleted) {
                // Already paid — edits are saved and the flow resumes; the paid
                // amount is frozen server-side, so no return to payment.
                persistDraft(values, false);
                setCurrentStep(1);
            } else {
                handleProceedToPayment(values);
            }
        } else if (!isLast) {
            const appId = currentApplication?.applicationId as string | undefined;
            const merged: Record<string, unknown> = { ...currentApplication, ...values };
            const isVendor = Boolean(entityType && VENDOR_ENTITIES.has(entityType));

            // Documents step — push the files now so an upload error blocks moving
            // on. Vendor entities upload straight to the vendor; others to our DB.
            if (currentStep === documentsStepIndex && appId && !isPreview) {
                setSubmitting(true);
                let ok = true;
                if (isVendor) {
                    ok = await syncStepDocuments(appId, merged);
                } else {
                    const { failed } = await uploadDocuments(appId, merged);
                    ok = failed === 0;
                    if (!ok) {
                        dispatch(
                            showToast({
                                description: `${failed} document${failed > 1 ? 's' : ''} could not be uploaded. Please retry before continuing.`,
                                variant: 'error',
                            })
                        );
                    }
                }
                setSubmitting(false);
                if (!ok) return;
                persistDraft(values, false);
                setCurrentStep(currentStep + 1);
                return;
            }

            // KYC (directors) / Shareholding steps — sync to the vendor and block
            // the step on failure (vendor entities only).
            let phase: 'directors' | 'shareholders' | null = null;
            if (isVendor && appId) {
                // Fire the directors sync only on an actual KYC step (proprietorship's
                // step 1 is Applicant Details, not a KYC step).
                if (currentStep === 1 && /kyc/i.test(String(steps[currentStep] ?? '')))
                    phase = 'directors';
                else if (steps[currentStep] === 'Shareholding') phase = 'shareholders';
            }
            if (phase && appId) {
                setSubmitting(true);
                const ok = await syncStepPhase(appId, phase, merged);
                setSubmitting(false);
                if (!ok) return;
                setCurrentStep(currentStep + 1);
                return;
            }

            // Any other step — just persist the draft and advance.
            persistDraft(values, false);
            setCurrentStep(currentStep + 1);
        } else {
            handleFinalSubmit(values);
        }
    };

    const handleBack = (values: Record<string, unknown>) => {
        if (currentStep === 0) {
            navigate(`${paths.businessRegistration.index}/${paths.businessRegistration.form}`);
        } else {
            dispatch(updateApplicationData(values));
            setCurrentStep(currentStep - 1);
        }
    };

    const renderStep = () => {
        if (currentStep === 0) return <BasicInformation />;
        // Proprietorship is the only entity with its post-payment steps built so far.
        if (entityType === EntityType.PROPRIETORSHIP) {
            if (currentStep === 1) return <ApplicantDetails />;
            if (currentStep === 2) return <AddressDetails />;
            if (currentStep === 3) return <GstInformation />;
            if (currentStep === 4) return <DocumentsStep />;
            if (currentStep === 5) return <RegistrationFiling />;
        }
        if (entityType === EntityType.PARTNERSHIP) {
            if (currentStep === 1) return <PartnersKYC />;
            if (currentStep === 2) return <CapitalContribution />;
            if (currentStep === 3) return <DocumentsStep />;
            if (currentStep === 4) return <RegistrationFiling />;
        }
        if (entityType === EntityType.OPC) {
            if (currentStep === 1) return <DirectorNomineeKYC />;
            if (currentStep === 2) return <Shareholding />;
            if (currentStep === 3) return <DocumentsStep />;
            if (currentStep === 4) return <RegistrationFiling />;
        }
        if (entityType === EntityType.LLP) {
            if (currentStep === 1) return <DirectorsKYC title="Designated Partners KYC" />;
            if (currentStep === 2) return <Contribution />;
            if (currentStep === 3) return <DocumentsStep />;
            if (currentStep === 4) return <RegistrationFiling />;
        }
        if (entityType === EntityType.PRIVATE_LIMITED) {
            if (currentStep === 1) return <DirectorsKYC />;
            if (currentStep === 2) return <Shareholding />;
            if (currentStep === 3) return <DocumentsStep />;
            if (currentStep === 4) return <RegistrationFiling />;
        }
        return (
            <div className="bg-white rounded-[30px] p-10 text-center shadow-[0px_1.5px_16.5px_0px_rgba(0,0,0,0.06)]">
                <Paragraph className="!mb-0 text-[#6a7282]">
                    {steps[currentStep]} — coming soon.
                </Paragraph>
            </div>
        );
    };

    let primaryLabel = 'Next';
    if (currentStep === 0)
        primaryLabel = paymentCompleted ? 'Save & Continue' : 'Proceed to payment';
    else if (isLast) primaryLabel = 'File Smart Form';

    // Steps with a confirmation checkbox keep the primary action disabled until
    // it's ticked (deed/agreement, and the final filing confirmation).
    const isPrimaryDisabled = (values: Record<string, unknown>) => {
        if (isLast) return !values.filingConfirmed;
        return false;
    };

    const renderFooter = (values: Record<string, unknown>) => (
        // antd buttons are white-space: nowrap, so this row can never compress below both
        // labels. At 320px "Proceed to payment" put it ~8px over; the tighter mobile padding
        // and gap buy that back. Unchanged from sm up.
        <div className="mt-8 flex items-center justify-between gap-3 sm:gap-4">
            <Button
                onClick={() => handleBack(values)}
                className="!h-[44px] !px-4 sm:!px-6 !text-[16px] !rounded-[8px] !border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5] transition-colors"
            >
                Back
            </Button>
            <Button
                type="primary"
                disabled={isPrimaryDisabled(values)}
                loading={submitting}
                onClick={() => handlePrimary(values)}
                className="!h-[44px] !px-4 sm:!px-6 !text-[16px] !font-medium !rounded-[8px] !bg-[#ff4f4f] hover:!bg-[#e64444] transition-colors"
            >
                {primaryLabel}
            </Button>
        </div>
    );

    // Redirecting (no entity) or restoring a draft after a reload — hold the
    // form until we have something real to render.
    if (!entityType || hydrating) {
        return (
            <div className="bg-white min-h-screen flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen px-2 py-3 sm:p-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-8">
                <div className="text-center">
                    <Title
                        level={2}
                        className="!text-[24px] sm:!text-[28px] !font-semibold !text-[#1e293b] !mb-1"
                    >
                        {HERO_TITLE}
                    </Title>
                    <Paragraph className="!mb-0 text-[15px] sm:text-[20px] text-[#6a7282]">
                        {HERO_SUBTITLE}
                    </Paragraph>
                </div>

                <StepProgress steps={steps} currentStep={currentStep} />

                <div className={hasSidebar ? 'w-full' : 'max-w-4xl mx-auto w-full'}>
                    <Formik
                        innerRef={formikRef}
                        initialValues={initialValues}
                        validationSchema={
                            isPreview ? undefined : (validationSchemas[currentStep] ?? undefined)
                        }
                        enableReinitialize
                        onSubmit={() => undefined}
                    >
                        {({ values }) => (
                            <Form>
                                <DraftSaveContext.Provider value={saveProgress}>
                                    <DocumentUploadContext.Provider value={uploadDocOnTheGo}>
                                        {/* items-start below belongs to the lg row layout only. On
                                            mobile the container is a column, so it sized each child to
                                            its own content in the cross axis instead of the container
                                            width — the sidebar has w-full and stayed put, the form
                                            column did not. */}
                                        {hasSidebar ? (
                                            <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
                                                <div className="flex-1 min-w-0">
                                                    <AntForm layout="vertical" component={false}>
                                                        {renderStep()}
                                                    </AntForm>
                                                    {renderFooter(values)}
                                                </div>
                                                <aside className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6">
                                                    <RelationshipManagerCard />
                                                    {/* Partnership and Proprietorship have no DSC step (handled by RM) — hide the card. */}
                                                    {entityType !== EntityType.PARTNERSHIP &&
                                                        entityType !==
                                                            EntityType.PROPRIETORSHIP && (
                                                            <DigitalSignatureCard />
                                                        )}
                                                </aside>
                                            </div>
                                        ) : (
                                            <>
                                                <AntForm layout="vertical" component={false}>
                                                    {renderStep()}
                                                </AntForm>
                                                {renderFooter(values)}
                                            </>
                                        )}
                                    </DocumentUploadContext.Provider>
                                </DraftSaveContext.Provider>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
    );
};

export default RegistrationForm;
