import { useEffect } from 'react';

import { CheckCircleFilled, DownloadOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Radio, Skeleton, Tooltip, Typography } from 'antd';
import { Formik, useFormikContext } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import useIndianStates from '@hooks/useIndianStates';

import AgreementDraftAutoSave, { agreementValuesOnly } from './AgreementDraftAutoSave';
import EsignStatusCard from './EsignStatusCard';
import { CorporateAgreementValues } from '../../../api/admin/kybStatusApi';
import { ESIGN_STATUS } from '../../../hooks/admin/useCorporateAgreement';
import { AGREEMENT_MAX, corporateAgreementSchema } from '../../../schema/corporateAgreementSchema';
import { blockerReasons } from '../../../utils/helpers';
import {
    ADDRESS_PROOF_DOCUMENT,
    AGREEMENT_FIELD_SECTIONS,
    AGREEMENT_LABELS as L,
    AGREEMENT_SIGN_METHOD,
    CORPORATE_AGREEMENT_DOCUMENT,
    KYB_AGREEMENT,
} from '../../../utils/kybData';
import { DocumentSaveState, KybFileValue } from '../../../utils/types';
import DocumentUploadField from '../../common/FileUploadInput';

const { Text } = Typography;

/**
 * Formik reads validationSchema when it validates, and nothing re-validates when the schema prop changes.
 * The stored address proof arrives from its own fetch after this form has mounted and validated, so
 * without this the CTA stays blocked on a document that is already on the server.
 */
const RevalidateOnStoredProof = ({ storedFileName }: { storedFileName?: string }) => {
    const { validateForm } = useFormikContext();

    useEffect(() => {
        validateForm();
    }, [storedFileName, validateForm]);

    return null;
};

export type SignMethod = (typeof AGREEMENT_SIGN_METHOD)[keyof typeof AGREEMENT_SIGN_METHOD];

type AgreementFormValues = CorporateAgreementValues & { addressProof: KybFileValue | null };

const SIGNED_COPY_FIELD = 'doc_corporate-agreement';

interface SignedCopyFieldProps {
    saveState?: DocumentSaveState;
    savedFileName?: string;
    onSelected?: (file: KybFileValue) => void;
    onRemoved?: () => void;
}

const SignedCopyField = ({
    saveState,
    savedFileName,
    onSelected,
    onRemoved,
}: SignedCopyFieldProps) => {
    const { values } = useFormikContext<Record<string, KybFileValue | null>>();
    const staged = values[SIGNED_COPY_FIELD];

    return (
        <DocumentUploadField
            name={SIGNED_COPY_FIELD}
            label={KYB_AGREEMENT.signedCopyLabel}
            subLabel={KYB_AGREEMENT.signedCopyHint}
            hint={CORPORATE_AGREEMENT_DOCUMENT.hint}
            isRequired
            maxFileSize={CORPORATE_AGREEMENT_DOCUMENT.maxSizeKb}
            allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
            saveState={staged || savedFileName ? saveState : undefined}
            savedFileName={savedFileName}
            onFileReady={onSelected}
            onRemove={() => {
                if (savedFileName) onRemoved?.();
            }}
            onRetry={() => {
                if (staged) onSelected?.(staged);
            }}
        />
    );
};

export interface CorporateAgreementPanel {
    agreement: CorporateAgreementValues;
    signMethod: string;
    chooseSignMethod: (method: SignMethod) => void;
    sendForEsign: (values: CorporateAgreementValues) => void | Promise<void>;
    saveDraft?: (values: CorporateAgreementValues) => void;
    isLoading?: boolean;
    esignSigned?: boolean;
    esignQueued?: boolean;
    esignStatus?: string | null;
    esignSigningLink?: string | null;
    esignSentAt?: string | null;
    esignFailureReason?: string | null;
    signedCopySaveState?: DocumentSaveState;
    signedCopyFileName?: string;
    onSignedCopySelected?: (file: KybFileValue) => void;
    onSignedCopyRemoved?: () => void;
    templateAvailable?: boolean;
    downloadTemplate: () => void;
    downloadLoading?: boolean;
    sendLoading?: boolean;
    addressProofSaveState?: DocumentSaveState;
    addressProofFileName?: string;
    onAddressProofSelected?: (file: KybFileValue) => void;
    onAddressProofRemoved?: () => void;
}

interface CorporateAgreementSectionProps {
    signMethod: SignMethod;
    onSignMethodChange: (method: SignMethod) => void;
    initialValues: CorporateAgreementValues;
    onSendForEsign: (values: CorporateAgreementValues) => void | Promise<void>;
    onSaveDraft?: (values: CorporateAgreementValues) => void;
    draftReady?: boolean;
    signedCopySaveState?: DocumentSaveState;
    signedCopyFileName?: string;
    onSignedCopySelected?: (file: KybFileValue) => void;
    onSignedCopyRemoved?: () => void;
    addressProofSaveState?: DocumentSaveState;
    addressProofFileName?: string;
    onAddressProofSelected?: (file: KybFileValue) => void;
    onAddressProofRemoved?: () => void;
    esignStatus?: string | null;
    esignSigningLink?: string | null;
    esignSentAt?: string | null;
    esignFailureReason?: string | null;
    sendLoading?: boolean;
    templateAvailable?: boolean;
    downloadLoading?: boolean;
    onDownloadTemplate: () => void;
}

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3">
        <Text className="text-sm font-medium text-textHeadings sm:text-base">{title}</Text>
        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">{children}</div>
    </div>
);

const CorporateAgreementSection = ({
    signMethod,
    onSignMethodChange,
    initialValues,
    onSendForEsign,
    onSaveDraft,
    draftReady = true,
    signedCopySaveState,
    signedCopyFileName,
    onSignedCopySelected,
    onSignedCopyRemoved,
    addressProofSaveState,
    addressProofFileName,
    onAddressProofSelected,
    onAddressProofRemoved,
    esignStatus,
    esignSigningLink,
    esignSentAt,
    esignFailureReason,
    sendLoading,
    templateAvailable = true,
    downloadLoading,
    onDownloadTemplate,
}: CorporateAgreementSectionProps) => {
    const esignQueued = !!esignStatus && esignStatus !== ESIGN_STATUS.FAILED;
    const { stateOptions } = useIndianStates();

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-borderGray bg-white p-4 sm:gap-6 sm:rounded-3xl sm:p-6 xl:p-9">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                    <Text className="text-base font-medium text-textHeadings sm:text-lg">
                        {KYB_AGREEMENT.sectionTitle}
                    </Text>
                    <Text className="text-xs text-textBody sm:text-sm">
                        {KYB_AGREEMENT.sectionSubtitle}
                    </Text>
                </div>
                <span className="flex w-fit items-center gap-1.5 rounded-full bg-savingsTagLightBg px-2.5 py-1 text-[11px] text-savingsTagLightText">
                    <CheckCircleFilled />
                    {KYB_AGREEMENT.savedChip}
                </span>
            </div>

            <Radio.Group
                value={signMethod}
                onChange={event => onSignMethodChange(event.target.value)}
                className="flex flex-col gap-2 sm:flex-row sm:gap-8"
            >
                <Radio value={AGREEMENT_SIGN_METHOD.E_SIGN}>
                    <span className="text-sm text-textHeadings">{KYB_AGREEMENT.methodESign}</span>
                </Radio>
                <Radio value={AGREEMENT_SIGN_METHOD.UPLOAD}>
                    <span className="text-sm text-textHeadings">{KYB_AGREEMENT.methodUpload}</span>
                </Radio>
            </Radio.Group>

            {signMethod === AGREEMENT_SIGN_METHOD.UPLOAD && (
                <div className="flex flex-col gap-4">
                    <Text className="text-xs text-textBody sm:text-sm">
                        {KYB_AGREEMENT.uploadInstructions}
                    </Text>

                    {!templateAvailable && (
                        <Alert
                            type="warning"
                            showIcon
                            message={KYB_AGREEMENT.templateUnavailable}
                        />
                    )}

                    <Button
                        icon={<DownloadOutlined />}
                        onClick={onDownloadTemplate}
                        loading={downloadLoading}
                        disabled={!templateAvailable}
                        className="!h-11 w-fit font-medium"
                    >
                        {KYB_AGREEMENT.downloadLabel}
                    </Button>

                    <SignedCopyField
                        saveState={signedCopySaveState}
                        savedFileName={signedCopyFileName}
                        onSelected={onSignedCopySelected}
                        onRemoved={onSignedCopyRemoved}
                    />
                </div>
            )}

            {signMethod === AGREEMENT_SIGN_METHOD.E_SIGN && !!esignStatus && (
                <EsignStatusCard
                    status={esignStatus}
                    signingLink={esignSigningLink}
                    sentAt={esignSentAt}
                    failureReason={esignFailureReason}
                />
            )}

            {signMethod === AGREEMENT_SIGN_METHOD.E_SIGN && !esignQueued && !draftReady && (
                <Skeleton active paragraph={{ rows: 8 }} />
            )}

            {!esignQueued && draftReady && (
                <div className={signMethod === AGREEMENT_SIGN_METHOD.E_SIGN ? undefined : 'hidden'}>
                    <Formik<AgreementFormValues>
                        enableReinitialize
                        initialValues={{ ...initialValues, addressProof: null }}
                        validationSchema={corporateAgreementSchema(!!addressProofFileName)}
                        validateOnMount
                        onSubmit={values => {
                            if (typeof Moengage?.track_event === 'function') {
                                Moengage.track_event('e_signature_initiated', {
                                    name: values.entityName,
                                    address: values.regAddress,
                                    city: values.regCity,
                                    state: values.regState,
                                    pan_account_no: values.panNumber,
                                    gst_no: values.gstNumber,
                                });
                            }
                            onSendForEsign(agreementValuesOnly(values));
                        }}
                    >
                        {({ submitForm, isValid, values, setFieldValue, errors }) => (
                            <Form layout="vertical" className="flex flex-col gap-5">
                                <RevalidateOnStoredProof storedFileName={addressProofFileName} />
                                {onSaveDraft && (
                                    <AgreementDraftAutoSave
                                        onSaveDraft={onSaveDraft}
                                        ready={draftReady}
                                    />
                                )}
                                <div className="flex flex-col gap-1">
                                    <Text className="text-sm font-medium text-textHeadings sm:text-base">
                                        {KYB_AGREEMENT.detailsTitle}
                                    </Text>
                                    <Text className="text-xs text-textBody sm:text-sm">
                                        {KYB_AGREEMENT.detailsSubtitle}
                                    </Text>
                                </div>

                                <Group title={KYB_AGREEMENT.groups.entity}>
                                    <TextInput
                                        name="entityName"
                                        maxLength={AGREEMENT_MAX.entityName}
                                        type="text"
                                        label={L.entityName}
                                        placeholder={L.entityName}
                                        isRequired
                                    />
                                </Group>

                                <Group title={KYB_AGREEMENT.groups.registered}>
                                    <TextInput
                                        name="regAddress"
                                        maxLength={AGREEMENT_MAX.address}
                                        type="text"
                                        label={L.regAddress}
                                        placeholder="Building, street, area"
                                        isRequired
                                    />
                                    <TextInput
                                        name="regCity"
                                        maxLength={AGREEMENT_MAX.city}
                                        type="text"
                                        label={L.regCity}
                                        placeholder={L.regCity}
                                        isRequired
                                    />
                                    <SelectInput
                                        name="regState"
                                        label={L.regState}
                                        placeholder={L.regState}
                                        options={stateOptions}
                                        showSearch
                                        isRequired
                                    />
                                    <TextInput
                                        name="regPinCode"
                                        type="text"
                                        label={L.regPinCode}
                                        placeholder={L.regPinCode}
                                        allowNumbersOnly
                                        maxLength={AGREEMENT_MAX.pinCode}
                                        isRequired
                                    />
                                    <TextInput
                                        name="regTelephone"
                                        maxLength={AGREEMENT_MAX.telephone}
                                        type="text"
                                        label={L.regTelephone}
                                        placeholder={L.regTelephone}
                                        isRequired
                                    />
                                    <TextInput
                                        name="regEmail"
                                        maxLength={AGREEMENT_MAX.email}
                                        type="text"
                                        label={L.regEmail}
                                        placeholder={L.regEmail}
                                        allowEmailsOnly
                                        isRequired
                                    />
                                </Group>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <Text className="text-sm font-medium text-textHeadings sm:text-base">
                                            {KYB_AGREEMENT.groups.billing}
                                        </Text>
                                        <CheckboxInput name="billSameAsRegistered">
                                            <span className="text-xs text-textBody sm:text-sm">
                                                {KYB_AGREEMENT.sameAsRegistered}
                                            </span>
                                        </CheckboxInput>
                                    </div>
                                    {!values.billSameAsRegistered && (
                                        <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                                            <TextInput
                                                name="billAddress"
                                                maxLength={AGREEMENT_MAX.address}
                                                type="text"
                                                label={L.billAddress}
                                                placeholder="Building, street, area"
                                                isRequired
                                            />
                                            <TextInput
                                                name="billCity"
                                                maxLength={AGREEMENT_MAX.city}
                                                type="text"
                                                label={L.billCity}
                                                placeholder={L.billCity}
                                                isRequired
                                            />
                                            <SelectInput
                                                name="billState"
                                                label={L.billState}
                                                placeholder={L.billState}
                                                options={stateOptions}
                                                showSearch
                                                isRequired
                                            />
                                            <TextInput
                                                name="billPinCode"
                                                type="text"
                                                label={L.billPinCode}
                                                placeholder={L.billPinCode}
                                                allowNumbersOnly
                                                maxLength={AGREEMENT_MAX.pinCode}
                                                isRequired
                                            />
                                        </div>
                                    )}
                                </div>

                                <Group title={KYB_AGREEMENT.groups.registration}>
                                    <TextInput
                                        name="gstNumber"
                                        type="text"
                                        label={L.gstNumber}
                                        placeholder={L.gstNumber}
                                        convertToUppercase
                                        maxLength={AGREEMENT_MAX.gstNumber}
                                        isRequired
                                    />
                                    <TextInput
                                        name="panNumber"
                                        type="text"
                                        label={L.panNumber}
                                        placeholder="PAN"
                                        convertToUppercase
                                        maxLength={AGREEMENT_MAX.panNumber}
                                        isRequired
                                    />
                                    <TextInput
                                        name="cinLlpNumber"
                                        type="text"
                                        label={L.cinLlpNumber}
                                        placeholder={KYB_AGREEMENT.ifApplicable}
                                        convertToUppercase
                                        maxLength={AGREEMENT_MAX.cinLlpNumber}
                                    />
                                    <TextInput
                                        name="tanNumber"
                                        type="text"
                                        label={L.tanNumber}
                                        placeholder={KYB_AGREEMENT.ifApplicable}
                                        convertToUppercase
                                        maxLength={AGREEMENT_MAX.tanNumber}
                                    />
                                </Group>

                                <div className="flex flex-col gap-2 rounded-2xl border border-borderGray p-4 sm:rounded-3xl sm:p-6">
                                    {!values.addressProofSameAsGst && (
                                        <DocumentUploadField
                                            name="addressProof"
                                            label={L.addressProof}
                                            subLabel={KYB_AGREEMENT.addressProofHint}
                                            subLabelNote={KYB_AGREEMENT.addressProofExamples}
                                            hint={ADDRESS_PROOF_DOCUMENT.hint}
                                            isRequired
                                            maxFileSize={ADDRESS_PROOF_DOCUMENT.maxSizeKb}
                                            allowedFileTypes={[
                                                'image/jpeg',
                                                'image/png',
                                                'application/pdf',
                                            ]}
                                            saveState={addressProofSaveState}
                                            savedFileName={addressProofFileName}
                                            onFileReady={onAddressProofSelected}
                                            onRemove={() => {
                                                // Nothing to delete server-side unless it actually saved;
                                                // asking anyway surfaces a removal failure that never happened.
                                                if (addressProofFileName) onAddressProofRemoved?.();
                                            }}
                                            onRetry={() => {
                                                const file = values.addressProof;
                                                if (file) onAddressProofSelected?.(file);
                                            }}
                                        />
                                    )}
                                    <div className="flex flex-col gap-0 [&_.ant-form-item-control-input]:min-h-0">
                                        <CheckboxInput name="addressProofSameAsGst">
                                            <span className="text-xs text-textBody sm:text-sm">
                                                {KYB_AGREEMENT.sameAsGstAddress}
                                            </span>
                                        </CheckboxInput>
                                        <Text className="pl-6 text-[10px] leading-snug text-textGreyLight sm:text-xs">
                                            {KYB_AGREEMENT.sameAsGstAddressNote}
                                        </Text>
                                    </div>
                                </div>

                                <Group title={KYB_AGREEMENT.groups.bank}>
                                    <TextInput
                                        name="bankName"
                                        maxLength={AGREEMENT_MAX.bankName}
                                        type="text"
                                        label={L.bankName}
                                        placeholder={L.bankName}
                                        isRequired
                                    />
                                    <TextInput
                                        name="bankBranch"
                                        maxLength={AGREEMENT_MAX.bankBranch}
                                        type="text"
                                        label={L.bankBranch}
                                        placeholder={L.bankBranch}
                                        isRequired
                                    />
                                    <TextInput
                                        name="bankAccountNumber"
                                        type="text"
                                        label={L.bankAccountNumber}
                                        placeholder={L.bankAccountNumber}
                                        allowNumbersOnly
                                        maxLength={AGREEMENT_MAX.bankAccountNumber}
                                        isRequired
                                    />
                                    <TextInput
                                        name="bankIfsc"
                                        type="text"
                                        label={L.bankIfsc}
                                        placeholder={L.bankIfsc}
                                        convertToUppercase
                                        maxLength={AGREEMENT_MAX.bankIfsc}
                                        isRequired
                                    />
                                    <TextInput
                                        name="bankCity"
                                        maxLength={AGREEMENT_MAX.city}
                                        type="text"
                                        label={L.bankCity}
                                        placeholder={L.bankCity}
                                        isRequired
                                    />
                                </Group>

                                <Group title={KYB_AGREEMENT.groups.official}>
                                    <TextInput
                                        name="officialContactName"
                                        maxLength={AGREEMENT_MAX.contactName}
                                        type="text"
                                        label={L.officialContactName}
                                        placeholder={L.officialContactName}
                                        isRequired
                                    />
                                    <TextInput
                                        name="officialContactMobile"
                                        type="text"
                                        label={L.officialContactMobile}
                                        placeholder={L.officialContactMobile}
                                        allowNumbersOnly
                                        maxLength={AGREEMENT_MAX.mobile}
                                        isRequired
                                    />
                                    <TextInput
                                        name="officialContactEmail"
                                        maxLength={AGREEMENT_MAX.email}
                                        type="text"
                                        label={L.officialContactEmail}
                                        placeholder={L.officialContactEmail}
                                        allowEmailsOnly
                                        isRequired
                                    />
                                </Group>

                                <Group title={KYB_AGREEMENT.groups.salesperson}>
                                    <TextInput
                                        name="salespersonName"
                                        maxLength={AGREEMENT_MAX.contactName}
                                        type="text"
                                        label={L.salespersonName}
                                        placeholder={L.salespersonName}
                                        isRequired
                                    />
                                    <TextInput
                                        name="salespersonMobile"
                                        type="text"
                                        label={L.salespersonMobile}
                                        placeholder={L.salespersonMobile}
                                        allowNumbersOnly
                                        maxLength={AGREEMENT_MAX.mobile}
                                        isRequired
                                    />
                                    <TextInput
                                        name="salespersonEmail"
                                        maxLength={AGREEMENT_MAX.email}
                                        type="text"
                                        label={L.salespersonEmail}
                                        placeholder={L.salespersonEmail}
                                        allowEmailsOnly
                                        isRequired
                                    />
                                </Group>

                                <Group title={KYB_AGREEMENT.groups.signatory}>
                                    <TextInput
                                        name="signatoryName"
                                        maxLength={AGREEMENT_MAX.contactName}
                                        type="text"
                                        label={L.signatoryName}
                                        placeholder={L.signatoryName}
                                        isRequired
                                    />
                                    <TextInput
                                        name="signatoryContact"
                                        type="text"
                                        label={L.signatoryContact}
                                        placeholder={L.signatoryContact}
                                        allowNumbersOnly
                                        maxLength={AGREEMENT_MAX.mobile}
                                        isRequired
                                    />
                                    <TextInput
                                        name="signatoryEmail"
                                        maxLength={AGREEMENT_MAX.email}
                                        type="text"
                                        label={L.signatoryEmail}
                                        placeholder={L.signatoryEmail}
                                        allowEmailsOnly
                                        isRequired
                                    />
                                </Group>

                                <div className="flex flex-col gap-2">
                                    <Text className="text-sm text-textHeadings">
                                        {KYB_AGREEMENT.pepQuestion}
                                    </Text>
                                    <Radio.Group
                                        value={values.signatoryIsPep}
                                        onChange={event =>
                                            setFieldValue('signatoryIsPep', event.target.value)
                                        }
                                        className="flex gap-6"
                                    >
                                        <Radio value>Yes</Radio>
                                        <Radio value={false}>No</Radio>
                                    </Radio.Group>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Text className="text-xs text-textBody sm:text-sm">
                                        {KYB_AGREEMENT.esignNote}
                                    </Text>
                                    <Tooltip
                                        title={
                                            isValid ? undefined : (
                                                <div className="flex flex-col gap-1">
                                                    <span>{KYB_AGREEMENT.esignBlockedTitle}</span>
                                                    <ul className="m-0 list-disc pl-4">
                                                        {blockerReasons(errors, {
                                                            sectionFor: field =>
                                                                AGREEMENT_FIELD_SECTIONS[field],
                                                        }).map(reason => (
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
                                        <span className="w-fit cursor-help">
                                            <Button
                                                type="primary"
                                                onClick={submitForm}
                                                loading={sendLoading}
                                                disabled={!isValid}
                                                style={
                                                    isValid ? undefined : { pointerEvents: 'none' }
                                                }
                                                className="!h-11 w-fit font-medium"
                                            >
                                                {KYB_AGREEMENT.esignCta}
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    {!isValid && (
                                        <Text className="text-[11px] text-textGreyLight">
                                            {KYB_AGREEMENT.esignIncomplete}
                                        </Text>
                                    )}
                                </div>
                            </Form>
                        )}
                    </Formik>
                </div>
            )}
        </div>
    );
};

export default CorporateAgreementSection;
