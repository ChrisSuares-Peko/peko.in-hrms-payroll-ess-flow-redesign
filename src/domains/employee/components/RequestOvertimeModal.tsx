import { Button, Form, Modal } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';

interface RequestOvertimeBody {
    date: string;
    hours: number;
    notes?: string;
}

interface RequestOvertimeModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (body: RequestOvertimeBody) => Promise<boolean>;
    dateOfJoin?: string;
}

interface OvertimeFormValues {
    date: string;
    hours: string;
    notes: string;
}

// Overtime is for work already done — block future dates.
const maxDate = dayjs();

const buildValidationSchema = (dateOfJoin?: string) =>
    Yup.object({
        date: Yup.string()
            .required('Please select the date')
            .test(
                'after-join',
                'Overtime date cannot be before your joining date',
                value => !dateOfJoin || !value || !dayjs(value).isBefore(dayjs(dateOfJoin), 'day')
            ),
        hours: Yup.number()
            .typeError('Please enter a valid number')
            .positive('Hours must be greater than 0')
            .max(24, 'Hours cannot exceed 24')
            .required('Please enter the number of hours'),
        notes: Yup.string()
            .test('min-length', 'Notes must be at least 3 characters', v => !v || v.length >= 3)
            .max(500, 'Notes must be at most 500 characters'),
    });

const RequestOvertimeModal = ({
    open,
    onClose,
    onSubmit,
    dateOfJoin,
}: RequestOvertimeModalProps) => {
    const minDate = dateOfJoin ? dayjs(dateOfJoin) : undefined;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={440}
            centered
            styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
        >
            <Formik<OvertimeFormValues>
                initialValues={{ date: dayjs().format('YYYY-MM-DD'), hours: '', notes: '' }}
                validationSchema={buildValidationSchema(dateOfJoin)}
                onSubmit={async (values, { resetForm }) => {
                    const ok = await onSubmit({
                        hours: Number(values.hours),
                        date: values.date,
                        notes: values.notes || undefined,
                    });
                    if (ok) {
                        resetForm();
                        onClose();
                    }
                }}
            >
                {({ isSubmitting, handleSubmit }) => (
                    <Form
                        onFinish={handleSubmit}
                        layout="vertical"
                        className="flex flex-col gap-4 [&_.ant-form-item]:!mb-0"
                    >
                        <div className="flex-1">
                            <span className="block text-valueText font-semibold text-base leading-tight">
                                Request Overtime
                            </span>
                            <span className="text-titleText text-xs">
                                Submit a new overtime request
                            </span>
                        </div>

                        <DatePickerInput
                            name="date"
                            label="Date"
                            placeholder="Select date"
                            isRequired
                            minDate={minDate}
                            maxDate={maxDate}
                            classes="w-full"
                        />
                        <TextInput
                            name="hours"
                            label="Hours"
                            placeholder="e.g. 2.5"
                            type="text"
                            allowTwoDecimalsOnly
                            isRequired
                        />
                        <TextAreaInput
                            name="notes"
                            label="Notes (optional)"
                            placeholder="Reason for overtime..."
                        />

                        <div className="flex gap-3">
                            <Button
                                onClick={onClose}
                                className="flex-1 h-11 rounded-lg font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                danger
                                htmlType="submit"
                                loading={isSubmitting}
                                className="flex-1 h-11 rounded-lg font-medium text-brandColor border-brandColor"
                            >
                                Submit Request
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default RequestOvertimeModal;
