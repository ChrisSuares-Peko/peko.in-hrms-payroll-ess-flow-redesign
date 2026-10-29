import { Form } from 'antd';
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
    withChangeReason,
} from './VendorEntryDrawers';

export type PaymentGatewaySettlementFormValues = {
    amount: string;
    entryDate: string;
    reference: string;
    mode: string;
    note: string;
    slipBase64: string;
    slipName: string;
    slipFormat: string;
    changeReason?: string;
};

export type PaymentGatewayFeeFormValues = {
    amount: string;
    entryDate: string;
    reference: string;
    mode: string;
    note: string;
    slipBase64: string;
    slipName: string;
    slipFormat: string;
    changeReason?: string;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const settlementFee = (expected: string, received: string) =>
    round2(Math.max((Number(expected) || 0) - (Number(received) || 0), 0));

export const paymentGatewaySettlementSchema = Yup.object({
    amount: Yup.number()
        .typeError('Enter a valid amount')
        .moreThan(0, 'Amount received must be greater than zero')
        .required('Amount received is required'),
    entryDate: Yup.string().required('Date is required'),
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

export const paymentGatewayFeeSchema = Yup.object({
    amount: Yup.number()
        .typeError('Enter a valid amount')
        .moreThan(0, 'Fee amount must be greater than zero')
        .required('Fee amount is required'),
    entryDate: Yup.string().required('Date is required'),
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

const SettlementFields = ({ editing, currentDocument }: EditModeProps) => (
    <>
        <TextInput
            name="amount"
            label="Amount received (₹)"
            placeholder="0.00"
            type="text"
            allowDecimalsOnly
            isRequired
        />
        <DatePickerInput
            name="entryDate"
            label="Settlement date"
            placeholder="Select date"
            maxDate={dayjs()}
            needConfirm={false}
            isRequired
        />
        <TextInput
            name="reference"
            label="Reference"
            placeholder="Settlement / UTR reference"
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
        <SlipField label="Settlement statement (optional)" current={currentDocument} />
        {editing && <ChangeReasonField />}
    </>
);

const FeeFields = ({ editing, currentDocument }: EditModeProps) => (
    <>
        <TextInput
            name="amount"
            label="Fees charged (₹)"
            placeholder="0.00"
            type="text"
            allowDecimalsOnly
            isRequired
        />
        <DatePickerInput
            name="entryDate"
            label="Fee date"
            placeholder="Select date"
            maxDate={dayjs()}
            needConfirm={false}
            isRequired
        />
        <TextInput
            name="reference"
            label="Reference"
            placeholder="Fee / UTR reference"
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
        <SlipField label="Fee statement (optional)" current={currentDocument} />
        {editing && <ChangeReasonField />}
    </>
);

type PaymentGatewaySettlementDrawerProps = EditModeProps & {
    open: boolean;
    title: string;
    initialValues: PaymentGatewaySettlementFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: PaymentGatewaySettlementFormValues) => void;
};

export const PaymentGatewaySettlementDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    editing,
    currentDocument,
    onCancel,
    onSubmit,
}: PaymentGatewaySettlementDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={withChangeReason(paymentGatewaySettlementSchema, editing)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as PaymentGatewaySettlementFormValues)}
        firstBtnTxt={editing ? SAVE_CHANGES : 'Save receipt'}
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <SettlementFields editing={editing} currentDocument={currentDocument} />
        </Form>
    </CustomModalWithForm>
);

type PaymentGatewayFeeDrawerProps = EditModeProps & {
    open: boolean;
    title: string;
    initialValues: PaymentGatewayFeeFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: PaymentGatewayFeeFormValues) => void;
};

export const PaymentGatewayFeeDrawer = ({
    open,
    title,
    initialValues,
    isLoading,
    editing,
    currentDocument,
    onCancel,
    onSubmit,
}: PaymentGatewayFeeDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={withChangeReason(paymentGatewayFeeSchema, editing)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as PaymentGatewayFeeFormValues)}
        firstBtnTxt={editing ? SAVE_CHANGES : 'Save fee'}
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <FeeFields editing={editing} currentDocument={currentDocument} />
        </Form>
    </CustomModalWithForm>
);

export default PaymentGatewaySettlementDrawer;
