import { CheckCircleFilled, InfoCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { Alert, Button, Skeleton, Tooltip, Typography } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';

import CorporateAgreementSection, {
    CorporateAgreementPanel,
    SignMethod,
} from './CorporateAgreementSection';
import { KybChecklistDocument } from '../../../api/admin/kybStatusApi';
import { DocumentStateMap, UploadedDocumentMap } from '../../../hooks/admin/useKybDocuments';
import {
    AGREEMENT_SIGN_METHOD,
    KYB_AGREEMENT,
    KYB_INTRO,
    KYB_UPLOAD,
    DEFAULT_MAX_SIZE_KB,
} from '../../../utils/kybData';
import { KybFileValue } from '../../../utils/types';
import DocumentUploadField from '../../common/FileUploadInput';

const { Title, Text } = Typography;

const AGREEMENT_FIELD = 'doc_corporate-agreement';

interface UploadDocumentsKybProps {
    documents: KybChecklistDocument[];
    onBack: () => void;
    onSubmit: (values: Record<string, KybFileValue | null>) => void | Promise<void>;
    submitLoading?: boolean;
    uploadedDocuments?: UploadedDocumentMap;
    documentStates?: DocumentStateMap;
    onDocumentSelected?: (doc: KybChecklistDocument, file: KybFileValue) => void;
    onDocumentRemoved?: (doc: KybChecklistDocument) => void;
    isDocumentSaved?: (doc: KybChecklistDocument) => boolean;
    restoring?: boolean;
    restoreFailed?: boolean;
    onRetryRestore?: () => void;
    agreement?: CorporateAgreementPanel;
}

type KybVerificationValues = Record<string, KybFileValue | null | boolean>;

const buildInitialValues = (
    documents: KybChecklistDocument[],
    withAgreement: boolean
): KybVerificationValues => ({
    ...Object.fromEntries(documents.map(d => [`doc_${d.key}`, null])),
    ...(withAgreement
        ? { [AGREEMENT_FIELD]: null, consentPrivacy: false /* , consentTerms: false */ }
        : {}),
});

const buildValidationSchema = (
    documents: KybChecklistDocument[],
    isDocumentSaved: (doc: KybChecklistDocument) => boolean
) =>
    Yup.object(
        Object.fromEntries(
            documents
                .filter(d => d.required && !isDocumentSaved(d))
                .map(d => [
                    `doc_${d.key}`,
                    Yup.mixed().nullable().required(`Please upload the ${d.label}.`),
                ])
        )
    );

const UploadDocumentsKyb = ({
    documents,
    onBack,
    onSubmit,
    submitLoading,
    uploadedDocuments = {},
    documentStates = {},
    onDocumentSelected,
    onDocumentRemoved,
    isDocumentSaved = () => false,
    restoring,
    restoreFailed,
    onRetryRestore,
    agreement,
}: UploadDocumentsKybProps) => {
    const isSaving = Object.values(documentStates).some(
        state => state === 'saving' || state === 'removing'
    );
    const anySaved = documents.some(doc => isDocumentSaved(doc));
    const anyFailed = documents.some(doc => documentStates[doc.documentName] === 'failed');

    return (
        <Formik<KybVerificationValues>
            enableReinitialize
            initialValues={buildInitialValues(documents, !!agreement)}
            validationSchema={buildValidationSchema(documents, isDocumentSaved)}
            onSubmit={values => onSubmit(values as Record<string, KybFileValue | null>)}
        >
            {({ handleSubmit, values }) => {
                const signedCopy = values[AGREEMENT_FIELD] as KybFileValue | null;
                const agreementReady = agreement
                    ? (agreement.signMethod === AGREEMENT_SIGN_METHOD.UPLOAD
                          ? !!agreement.signedCopyFileName || !!signedCopy
                          : !!agreement.esignSigned) && !!values.consentPrivacy
                    : // && !!values.consentTerms
                      true;

                /**
                 * Removing a saved document takes it off the server, so a resubmission must not go through
                 * on the strength of what was uploaded last time. Counts a freshly staged file too, since
                 * that is saved before the submit lands.
                 */
                const missingRequiredDocuments = documents.filter(
                    doc => doc.required && !isDocumentSaved(doc) && !values[`doc_${doc.key}`]
                );

                /**
                 * Every business type carries required documents, so an empty checklist means it has not
                 * arrived — never that nothing is needed. Submitting on an empty list would send a KYB with
                 * no documents at all, and the server does not check them either. Same while the saved
                 * documents are still being restored: what is already on file is not yet known.
                 */
                const checklistUnavailable = documents.length === 0;
                const documentsUnknown = checklistUnavailable || !!restoring;

                const canSubmit =
                    !isSaving &&
                    !documentsUnknown &&
                    agreementReady &&
                    missingRequiredDocuments.length === 0;

                const submitBlockers = documentsUnknown
                    ? [restoring ? KYB_UPLOAD.checklistPending : KYB_INTRO.checklistUnavailable]
                    : [
                          ...missingRequiredDocuments.map(doc => `Upload the ${doc.label}.`),
                          ...(agreementReady ? [] : [KYB_AGREEMENT.submitBlocked]),
                      ];

                return (
                    <div className="mx-auto flex w-full max-w-[62rem] flex-col gap-5 pb-4 pt-1 sm:gap-8 xl:pb-8 xl:pt-2">
                        <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
                            <span className="rounded-full bg-bgLightPink px-3 py-1 text-xs text-textLightRed sm:px-4 sm:py-1.5 sm:text-sm">
                                {KYB_UPLOAD.badge}
                            </span>
                            <Title
                                level={3}
                                className="!mb-0 !text-xl !text-textHeadings sm:!text-2xl"
                            >
                                {KYB_UPLOAD.title}
                            </Title>
                            <Text className="text-sm text-textBody sm:px-16 sm:text-base">
                                {KYB_UPLOAD.description}
                            </Text>
                        </div>

                        <div className="flex flex-col gap-4 rounded-2xl border border-borderGray bg-white p-4 sm:rounded-3xl sm:p-6 xl:p-9">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex flex-col gap-1">
                                    <Text className="text-base font-medium text-textHeadings sm:text-lg">
                                        {KYB_UPLOAD.sectionTitle}
                                    </Text>
                                    <Text className="text-xs text-textBody sm:text-sm">
                                        {KYB_UPLOAD.sectionSubtitle}
                                    </Text>
                                </div>
                                {anySaved && !anyFailed && (
                                    <span className="flex w-fit items-center gap-1.5 rounded-full bg-savingsTagLightBg px-2.5 py-1 text-[11px] text-savingsTagLightText">
                                        <CheckCircleFilled />
                                        {KYB_UPLOAD.savedChip}
                                    </span>
                                )}
                            </div>

                            {restoreFailed && (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message={KYB_UPLOAD.restoreFailed}
                                    action={
                                        <Button size="small" danger onClick={onRetryRestore}>
                                            {KYB_UPLOAD.retryLabel}
                                        </Button>
                                    }
                                />
                            )}

                            <div className="flex flex-col gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 sm:px-4 sm:py-3">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                                    <InfoCircleOutlined />
                                    {KYB_INTRO.infoNotesLabel}
                                </span>
                                {KYB_INTRO.infoNotesTop.map(note => (
                                    <div key={note} className="flex items-start gap-2">
                                        <span
                                            aria-hidden
                                            className="mt-[3px] shrink-0 text-[10px] leading-none text-amber-700"
                                        >
                                            &bull;
                                        </span>
                                        <Text className="text-xs text-amber-700">{note}</Text>
                                    </div>
                                ))}
                            </div>

                            {restoring ? (
                                <Skeleton active paragraph={{ rows: 6 }} />
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                                    {documents.map(doc => (
                                        <DocumentUploadField
                                            key={doc.key}
                                            name={`doc_${doc.key}`}
                                            label={doc.label}
                                            subLabel={doc.uploadLabel}
                                            hint={doc.hint}
                                            isRequired={doc.required}
                                            maxFileSize={doc.maxSizeKb ?? DEFAULT_MAX_SIZE_KB}
                                            allowedFileTypes={[
                                                'image/jpeg',
                                                'image/png',
                                                'application/pdf',
                                            ]}
                                            saveState={
                                                values[`doc_${doc.key}`] ||
                                                uploadedDocuments[doc.documentName]
                                                    ? documentStates[doc.documentName]
                                                    : undefined
                                            }
                                            savedFileName={
                                                uploadedDocuments[doc.documentName]
                                                    ? (uploadedDocuments[doc.documentName]
                                                          .fileName ?? KYB_UPLOAD.savedFallbackName)
                                                    : undefined
                                            }
                                            onFileReady={file => onDocumentSelected?.(doc, file)}
                                            onRemove={() => {
                                                if (uploadedDocuments[doc.documentName])
                                                    onDocumentRemoved?.(doc);
                                            }}
                                            onRetry={() => {
                                                const file = values[
                                                    `doc_${doc.key}`
                                                ] as KybFileValue | null;
                                                if (file) onDocumentSelected?.(doc, file);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {agreement && (
                            <CorporateAgreementSection
                                signMethod={agreement.signMethod as SignMethod}
                                onSignMethodChange={agreement.chooseSignMethod}
                                initialValues={agreement.agreement}
                                onSendForEsign={agreement.sendForEsign}
                                onSaveDraft={agreement.saveDraft}
                                draftReady={!agreement.isLoading}
                                signedCopySaveState={agreement.signedCopySaveState}
                                signedCopyFileName={agreement.signedCopyFileName}
                                onSignedCopySelected={agreement.onSignedCopySelected}
                                onSignedCopyRemoved={agreement.onSignedCopyRemoved}
                                addressProofSaveState={agreement.addressProofSaveState}
                                addressProofFileName={agreement.addressProofFileName}
                                onAddressProofSelected={agreement.onAddressProofSelected}
                                onAddressProofRemoved={agreement.onAddressProofRemoved}
                                esignStatus={agreement.esignStatus}
                                esignSigningLink={agreement.esignSigningLink}
                                esignSentAt={agreement.esignSentAt}
                                esignFailureReason={agreement.esignFailureReason}
                                sendLoading={agreement.sendLoading}
                                templateAvailable={agreement.templateAvailable}
                                downloadLoading={agreement.downloadLoading}
                                onDownloadTemplate={agreement.downloadTemplate}
                            />
                        )}

                        {agreement && (
                            <div className="flex flex-col gap-2">
                                <CheckboxInput name="consentPrivacy">
                                    <span className="text-xs text-textBody sm:text-sm">
                                        {KYB_AGREEMENT.consentPrivacy}
                                    </span>
                                </CheckboxInput>
                                {/* <CheckboxInput name="consentTerms">
                                    <span className="text-xs text-textBody sm:text-sm">
                                        {KYB_AGREEMENT.consentTerms}{' '}
                                        <a
                                            href={KYB_AGREEMENT.consentTermsUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="!text-textBody !underline hover:!text-textBody hover:!underline"
                                            onClick={event => event.stopPropagation()}
                                        >
                                            {KYB_AGREEMENT.consentTermsLink}
                                        </a>
                                    </span>
                                </CheckboxInput> */}
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                <Button
                                    danger
                                    onClick={onBack}
                                    className="!h-11 !px-8 font-medium sm:!h-12"
                                >
                                    {KYB_UPLOAD.backLabel}
                                </Button>
                                <Tooltip
                                    title={
                                        canSubmit || isSaving ? undefined : (
                                            <div className="flex flex-col gap-1">
                                                <span>{KYB_AGREEMENT.esignBlockedTitle}</span>
                                                <ul className="m-0 list-disc pl-4">
                                                    {submitBlockers.map(reason => (
                                                        <li key={reason}>{reason}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )
                                    }
                                >
                                    {/* A browser fires no mouse events on a disabled control, so the
                                        hover has to reach the wrapper instead: pointer-events:none on the
                                        button lets it through. Without it the tooltip never opens. */}
                                    <span className={canSubmit ? undefined : 'cursor-help'}>
                                        <Button
                                            type="primary"
                                            loading={submitLoading}
                                            disabled={!canSubmit}
                                            onClick={() => {
                                                if (typeof Moengage?.track_event === 'function') {
                                                    Moengage.track_event('verification_initiated', {
                                                        esign_status:
                                                            agreement?.esignStatus === 'SIGNED'
                                                                ? 'successful'
                                                                : 'pending',
                                                    });
                                                }
                                                handleSubmit();
                                            }}
                                            style={
                                                canSubmit ? undefined : { pointerEvents: 'none' }
                                            }
                                            className="!h-11 !w-full !px-8 font-medium sm:!h-12"
                                        >
                                            {KYB_UPLOAD.submitLabel}
                                        </Button>
                                    </span>
                                </Tooltip>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <Text className="text-center text-[11px] text-textGreyLight">
                                    {isSaving ? KYB_UPLOAD.uploadingNote : KYB_UPLOAD.submitHint}
                                </Text>
                                <span className="flex items-center justify-center gap-1.5 text-[11px] text-textGreyLight">
                                    <SafetyOutlined />
                                    {KYB_UPLOAD.securityNote}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            }}
        </Formik>
    );
};

export default UploadDocumentsKyb;
