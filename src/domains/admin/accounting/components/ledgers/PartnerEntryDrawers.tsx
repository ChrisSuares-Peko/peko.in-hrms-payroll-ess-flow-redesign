import { Form, Typography } from 'antd';
import dayjs from 'dayjs';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import {
    ChangeReasonField,
    DEPOSIT_MODE_OPTIONS,
    EditModeProps,
    SAVE_CHANGES,
    SlipField,
    VendorLedgerEntryDrawer,
    VendorLedgerEntryFormValues,
    withChangeReason,
} from './VendorEntryDrawers';
import { formatInr } from '../../utils/commission';

export type PartnerPayoutFormValues = {
    amount: string;
    payoutDate: string;
    reference: string;
    mode: string;
    note: string;
    slipBase64: string;
    slipName: string;
    slipFormat: string;
    changeReason?: string;
};

export const partnerPayoutSchema = Yup.object({
    amount: Yup.number()
        .typeError('Enter a valid amount')
        .moreThan(0, 'Amount must be greater than zero')
        .required('Amount is required'),
    payoutDate: Yup.string().required('Payout date is required'),
    reference: Yup.string()
        .trim()
        .max(40, 'Reference can be at most 40 characters')
        .required('Reference is required'),
    mode: Yup.string().required('Mode is required'),
    note: Yup.string().trim().max(200, 'Note can be at most 200 characters'),
    slipBase64: Yup.string(),
    slipName: Yup.string(),
    slipFormat: Yup.string(),
});

type PartnerPayoutDrawerProps = EditModeProps & {
    open: boolean;
    title: string;
    initialValues: PartnerPayoutFormValues;
    suggestedAmount: number | null;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: PartnerPayoutFormValues) => void;
};

export const PartnerPayoutDrawer = ({
    open,
    title,
    initialValues,
    suggestedAmount,
    isLoading,
    editing,
    currentDocument,
    onCancel,
    onSubmit,
}: PartnerPayoutDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={withChangeReason(partnerPayoutSchema, editing)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as PartnerPayoutFormValues)}
        firstBtnTxt={editing ? SAVE_CHANGES : 'Save payout'}
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            {suggestedAmount === null ? null : (
                <Typography.Paragraph className="text-[13px] text-textBody">
                    The ledger makes this {formatInr(suggestedAmount)}. Change the amount if a
                    different sum was paid; both figures are kept on the record.
                </Typography.Paragraph>
            )}
            <TextInput
                name="amount"
                label="Amount (₹)"
                placeholder="0.00"
                type="text"
                allowDecimalsOnly
                isRequired
            />
            <DatePickerInput
                name="payoutDate"
                label="Payout date"
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
            <SlipField label="Payment slip (optional)" current={currentDocument} />
            {editing && <ChangeReasonField />}
        </Form>
    </CustomModalWithForm>
);

type PartnerDebitNoteDrawerProps = EditModeProps & {
    open: boolean;
    gstRate?: number | null;
    title: string;
    initialValues: VendorLedgerEntryFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: VendorLedgerEntryFormValues) => void;
};

// The same form a vendor credit note uses: an amount, a date, the order it is against and
// why. Only the wording differs, because a debit note runs the other way.
export const PartnerDebitNoteDrawer = (props: PartnerDebitNoteDrawerProps) => (
    <VendorLedgerEntryDrawer {...props} documentLabel="Debit note document (optional)" />
);

export default PartnerPayoutDrawer;
