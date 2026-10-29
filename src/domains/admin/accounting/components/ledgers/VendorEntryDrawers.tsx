import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Flex, Form, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { formatInr } from '../../utils/commission';

export type VendorSlipFormValues = {
    slipBase64: string;
    slipName: string;
    slipFormat: string;
    changeReason?: string;
};

export type VendorDepositFormValues = VendorSlipFormValues & {
    amount: string;
    depositDate: string;
    reference: string;
    mode: string;
    note: string;
};

export type GstTreatment = 'INCLUSIVE' | 'EXCLUSIVE';

export const GST_TREATMENT_OPTIONS = [
    { value: 'INCLUSIVE', label: 'Inclusive of GST' },
    { value: 'EXCLUSIVE', label: 'Exclusive of GST' },
];

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const gstBreakdown = (amount: number, treatment: GstTreatment, rate: number) => {
    const factor = rate / 100;
    if (treatment === 'EXCLUSIVE') {
        const taxable = round2(amount);
        const gst = round2(taxable * factor);
        return { taxable, gst, total: round2(taxable + gst) };
    }
    const total = round2(amount);
    const taxable = round2(total / (1 + factor));
    return { taxable, gst: round2(total - taxable), total };
};

export type VendorLedgerEntryFormValues = VendorSlipFormValues & {
    amount: string;
    gstTreatment: GstTreatment;
    issueDate: string;
    reason: string;
    againstCorporateTxnId: string;
};

export const SLIP_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

export const SLIP_MAX_KB = 5 * 1024;

const slipRules = {
    slipBase64: Yup.string(),
    slipName: Yup.string(),
    slipFormat: Yup.string(),
};

export const SAVE_CHANGES = 'Save changes';

const changeReasonRule = Yup.string()
    .trim()
    .min(3, 'Give a short reason')
    .max(200, 'Reason can be at most 200 characters')
    .required('Reason is required');

export const withChangeReason = (schema: Yup.AnyObjectSchema, editing?: boolean) =>
    editing ? schema.shape({ changeReason: changeReasonRule }) : schema;

export const ChangeReasonField = () => (
    <TextAreaInput
        name="changeReason"
        label="Reason for the change"
        placeholder="Why is this entry being changed?"
        maxLength={200}
        isRequired
    />
);

export const SlipField = ({ label, current }: { label: string; current?: string | null }) => (
    <FileUploadInput
        name="slipBase64"
        format="slipFormat"
        fileNameField="slipName"
        label={label}
        subLabel={
            current
                ? `Attached: ${current}. Upload a PDF, JPG or PNG up to 5 MB to replace it.`
                : 'PDF, JPG or PNG up to 5 MB'
        }
        allowedFileTypes={[...SLIP_FILE_TYPES]}
        maxFileSize={SLIP_MAX_KB}
        showFileName
        allowFileDelete
        showNotification
    />
);

export type VendorOpeningBalanceFormValues = VendorSlipFormValues & {
    amount: string;
    asOfDate: string;
    note: string;
};

export type VoidFormValues = { reason: string };

export const DEPOSIT_MODE_OPTIONS = [
    { value: 'NEFT', label: 'NEFT' },
    { value: 'RTGS', label: 'RTGS' },
    { value: 'IMPS', label: 'IMPS' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'OTHER', label: 'Other' },
];

const amountRule = Yup.number()
    .typeError('Enter a valid amount')
    .moreThan(0, 'Amount must be greater than zero')
    .required('Amount is required');

export const vendorDepositSchema = Yup.object({
    amount: amountRule,
    depositDate: Yup.string().required('Date is required'),
    reference: Yup.string()
        .trim()
        .max(40, 'Reference can be at most 40 characters')
        .required('Reference is required'),
    mode: Yup.string().required('Mode is required'),
    note: Yup.string().trim().max(200, 'Note can be at most 200 characters'),
    ...slipRules,
});

export const vendorLedgerEntrySchema = Yup.object({
    amount: amountRule,
    gstTreatment: Yup.string()
        .oneOf(['INCLUSIVE', 'EXCLUSIVE'])
        .required('Say whether the amount includes GST'),
    issueDate: Yup.string().required('Issue date is required'),
    reason: Yup.string().trim().max(200, 'Reason can be at most 200 characters'),
    againstCorporateTxnId: Yup.string()
        .trim()
        .max(60, 'Order reference can be at most 60 characters'),
    ...slipRules,
});

export const vendorOpeningBalanceSchema = Yup.object({
    amount: Yup.number().typeError('Enter a valid amount').required('Opening balance is required'),
    asOfDate: Yup.string().required('As of date is required'),
    note: Yup.string().trim().max(200, 'Note can be at most 200 characters'),
    ...slipRules,
});

export const voidEntrySchema = Yup.object({
    reason: Yup.string()
        .trim()
        .min(3, 'Give a short reason')
        .max(200, 'Reason can be at most 200 characters')
        .required('Reason is required'),
});

export type EditModeProps = {
    editing?: boolean;
    currentDocument?: string | null;
};

type DrawerProps<T> = {
    open: boolean;
    title: string;
    initialValues: T;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: T) => void;
};

export type EditableDrawerProps<T> = DrawerProps<T> & EditModeProps;

export const VendorDepositDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    editing,
    currentDocument,
    onCancel,
    onSubmit,
}: EditableDrawerProps<VendorDepositFormValues>) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={withChangeReason(vendorDepositSchema, editing)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as VendorDepositFormValues)}
        firstBtnTxt={editing ? SAVE_CHANGES : 'Save'}
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <TextInput
                name="amount"
                label="Amount (₹)"
                placeholder="0.00"
                type="text"
                allowDecimalsOnly
                isRequired
            />
            <DatePickerInput
                name="depositDate"
                label="Deposit date"
                placeholder="Select date"
                maxDate={dayjs()}
                needConfirm={false}
                isRequired
            />
            <TextInput
                name="reference"
                label="Reference"
                placeholder="Bank / UTR reference"
                type="text"
                maxLength={40}
                isRequired
            />
            <SelectInput
                name="mode"
                label="Mode"
                placeholder="Select mode"
                options={DEPOSIT_MODE_OPTIONS}
                isRequired
            />
            <TextAreaInput name="note" label="Note" placeholder="Optional" maxLength={200} />
            <SlipField label="Deposit slip (optional)" current={currentDocument} />
            {editing && <ChangeReasonField />}
        </Form>
    </CustomModalWithForm>
);

export type VendorEntryDrawerProps = EditableDrawerProps<VendorLedgerEntryFormValues> & {
    gstRate?: number | null;
};

type LedgerEntryDrawerProps = VendorEntryDrawerProps & {
    documentLabel: string;
};

const GstBreakdown = ({ rate }: { rate?: number | null }) => {
    const { values } = useFormikContext<VendorLedgerEntryFormValues>();
    const amount = Number(values.amount);
    if (!rate || !(amount > 0)) return null;
    const parts = gstBreakdown(amount, values.gstTreatment, rate);
    return (
        <Typography.Paragraph className="!-mt-2 !mb-4 text-[13px] text-textBody">
            Taxable {formatInr(parts.taxable)} + GST ({rate}%) {formatInr(parts.gst)} ={' '}
            {formatInr(parts.total)} on the ledger.
        </Typography.Paragraph>
    );
};

export const VendorLedgerEntryDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    editing,
    currentDocument,
    gstRate,
    onCancel,
    onSubmit,
    documentLabel,
}: LedgerEntryDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={withChangeReason(vendorLedgerEntrySchema, editing)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as VendorLedgerEntryFormValues)}
        firstBtnTxt={editing ? SAVE_CHANGES : 'Save'}
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <TextInput
                name="amount"
                label="Amount (₹)"
                placeholder="0.00"
                type="text"
                allowDecimalsOnly
                isRequired
            />
            <RadioGroupInput
                name="gstTreatment"
                label="Amount entered is"
                options={GST_TREATMENT_OPTIONS}
                isRequired
            />
            <GstBreakdown rate={gstRate} />
            <DatePickerInput
                name="issueDate"
                label="Issue date"
                placeholder="Select date"
                maxDate={dayjs()}
                needConfirm={false}
                isRequired
            />
            <TextInput
                name="againstCorporateTxnId"
                label="Against order"
                placeholder="Transaction ID, optional"
                type="text"
                maxLength={60}
            />
            <TextAreaInput name="reason" label="Reason" placeholder="Optional" maxLength={200} />
            <SlipField label={documentLabel} current={currentDocument} />
            {editing && <ChangeReasonField />}
        </Form>
    </CustomModalWithForm>
);

export const VendorCreditNoteDrawer = (props: VendorEntryDrawerProps) => (
    <VendorLedgerEntryDrawer {...props} documentLabel="Credit note document (optional)" />
);

export const VendorCommissionDrawer = (props: VendorEntryDrawerProps) => (
    <VendorLedgerEntryDrawer {...props} documentLabel="Supporting document (optional)" />
);

export const VendorCostOfSalesDrawer = (props: VendorEntryDrawerProps) => (
    <VendorLedgerEntryDrawer {...props} documentLabel="Supporting document (optional)" />
);

export const VendorDebitNoteDrawer = (props: VendorEntryDrawerProps) => (
    <VendorLedgerEntryDrawer {...props} documentLabel="Debit note document (optional)" />
);

// Shared by vendors, gateways and partners. Only the amount's label differs, because what
// is carried in is a deposit for one and a debt running the other way for the others.
export const VendorOpeningBalanceDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    editing,
    currentDocument,
    amountLabel = 'Opening balance (₹)',
    onCancel,
    onSubmit,
}: EditableDrawerProps<VendorOpeningBalanceFormValues> & { amountLabel?: string }) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={withChangeReason(vendorOpeningBalanceSchema, editing)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as VendorOpeningBalanceFormValues)}
        firstBtnTxt={editing ? SAVE_CHANGES : 'Save'}
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <Typography.Paragraph className="!mb-4 text-[13px] text-textBody">
                The balance carried in from before this portal started recording. Everything
                recorded after this date is counted on top of it, so entries dated on or before it
                are refused.
            </Typography.Paragraph>
            <TextInput
                name="amount"
                label={amountLabel}
                placeholder="0.00"
                type="text"
                allowDecimalsOnly
                isRequired
            />
            <DatePickerInput
                name="asOfDate"
                label="As of date"
                placeholder="Select date"
                maxDate={dayjs()}
                needConfirm={false}
                isRequired
            />
            <TextAreaInput
                name="note"
                label="Note"
                placeholder="Where this figure came from"
                maxLength={200}
            />
            <SlipField label="Supporting document (optional)" current={currentDocument} />
            {editing && <ChangeReasonField />}
        </Form>
    </CustomModalWithForm>
);

export const VoidEntryDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
}: DrawerProps<VoidFormValues>) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={voidEntrySchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as VoidFormValues)}
        firstBtnTxt="Void entry"
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <TextAreaInput
                name="reason"
                label="Reason"
                placeholder="Why is this entry being voided?"
                maxLength={200}
                isRequired
            />
        </Form>
    </CustomModalWithForm>
);

export const DELETE_ENTRY_TEXT =
    'Deleting takes the entry out of every balance at once and marks it Deleted. It stays listed until you mark it removed from the books, and then it is gone from the portal. The audit trail keeps what it was and why. To keep it on the ledger and cancel it instead, reverse it.';

export const DeleteEntryModal = ({
    open,
    title,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
}: DrawerProps<VoidFormValues>) => (
    <Formik
        initialValues={initialValues}
        validationSchema={voidEntrySchema}
        enableReinitialize
        onSubmit={values => onSubmit(values)}
    >
        {formik => (
            <Modal
                open={open}
                centered
                width={480}
                closeIcon={null}
                maskClosable={false}
                onCancel={onCancel}
                title={
                    <Flex gap={10} align="center">
                        <ExclamationCircleFilled className="text-xl text-red-600" />
                        <span>{title}</span>
                    </Flex>
                }
                footer={
                    <Flex justify="flex-end" gap={10}>
                        <Button
                            type="primary"
                            danger
                            loading={isLoading}
                            onClick={() => formik.submitForm()}
                        >
                            Delete entry
                        </Button>
                        <Button onClick={onCancel}>Keep it</Button>
                    </Flex>
                }
            >
                <Form layout="vertical">
                    <Typography.Paragraph className="!mb-4 text-[13px] text-textBody">
                        {DELETE_ENTRY_TEXT}
                    </Typography.Paragraph>
                    <TextAreaInput
                        name="reason"
                        label="Reason"
                        placeholder="Why is this entry being deleted?"
                        maxLength={200}
                        isRequired
                    />
                </Form>
            </Modal>
        )}
    </Formik>
);
