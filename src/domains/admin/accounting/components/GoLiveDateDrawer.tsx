import { Alert, Form, Typography } from 'antd';
import dayjs from 'dayjs';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

export type GoLiveDateFormValues = {
    date: string;
    reason: string;
};

export const goLiveDateSchema = Yup.object({
    date: Yup.string().required('Go live date is required'),
    reason: Yup.string().trim().max(500, 'Reason can be at most 500 characters'),
});

type GoLiveDateDrawerProps = {
    open: boolean;
    configured: boolean;
    initialValues: GoLiveDateFormValues;
    isLoading?: boolean;
    onCancel: () => void;
    onSubmit: (values: GoLiveDateFormValues) => void;
};

const GoLiveDateDrawer = ({
    open,
    configured,
    initialValues,
    isLoading,
    onCancel,
    onSubmit,
}: GoLiveDateDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={configured ? 'Change accounting go live date' : 'Set accounting go live date'}
        initialValues={initialValues}
        validationSchema={goLiveDateSchema}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as GoLiveDateFormValues)}
        firstBtnTxt="Save"
        isLoading={isLoading}
        reinitialise
    >
        <Form layout="vertical">
            <Typography.Paragraph className="!mb-4 text-[13px] text-textBody">
                The first day this portal accounts for. Orders, journals, deposits, payouts and
                settlements dated before it are left out of every list, KPI, balance and statement.
            </Typography.Paragraph>
            {configured && (
                <Alert
                    type="warning"
                    showIcon
                    className="!mb-4"
                    message="This moves every balance in the portal"
                    description="Ledger balances, dashboard figures and statements are all recomputed from the new date, and the cached snapshots are dropped."
                />
            )}
            <DatePickerInput
                name="date"
                label="Go live date"
                placeholder="Select date"
                maxDate={dayjs()}
                needConfirm={false}
                isRequired
            />
            <TextAreaInput
                name="reason"
                label="Reason"
                placeholder="Why this date"
                maxLength={500}
            />
        </Form>
    </CustomModalWithForm>
);

export default GoLiveDateDrawer;
