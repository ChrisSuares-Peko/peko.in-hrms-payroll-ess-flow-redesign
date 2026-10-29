import React from 'react';

import { Button, Form, Modal, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';

import { ApplyLeaveBody } from '../../api/leaves';
import { useLeaveTypes } from '../../hooks/useLeaveTypes';
import { noSurroundingSpaces } from '../../schema';

const { Text } = Typography;

interface ApplyForLeaveModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (body: ApplyLeaveBody) => Promise<boolean>;
}

type DayType = 'FULL' | 'FIRST_HALF' | 'SECOND_HALF';

// Half-day leave is only offered for Annual and Sick leave
const HALF_DAY_LABELS = ['Annual Leave', 'Sick Leave'];

const dayTypeOptions = [
    { label: 'Full Day', value: 'FULL' },
    { label: 'First Half', value: 'FIRST_HALF' },
    { label: 'Second Half', value: 'SECOND_HALF' },
];

interface ApplyLeaveFormValues {
    leaveType: string;
    dayType: DayType;
    startDate: string;
    endDate: string;
    reason: string;
}

const validationSchema = Yup.object({
    leaveType: Yup.string().required('Please select your leave type'),
    startDate: Yup.string().required('Please select your start date'),
    endDate: Yup.string()
        .required('Please select your end date')
        .test('after-start', 'End date cannot be before start date', (value, ctx) => {
            const { startDate } = ctx.parent;
            return !value || !startDate || !dayjs(value).isBefore(dayjs(startDate), 'day');
        }),
    reason: noSurroundingSpaces('Reason')
        .test('min-length', 'Reason must be at least 3 characters', v => !v || v.length >= 3)
        .max(300, 'Reason must be at most 300 characters'),
});

const initialValues: ApplyLeaveFormValues = {
    leaveType: '',
    dayType: 'FULL',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    reason: '',
};

const ApplyForLeaveModal: React.FC<ApplyForLeaveModalProps> = ({ open, onClose, onSubmit }) => {
    const { leaveTypes } = useLeaveTypes();

    const isHalfDayEligibleType = (leaveType: string) => {
        const label = leaveTypes.find(t => t.value === leaveType)?.label;
        return !!label && HALF_DAY_LABELS.includes(label);
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width={560}
            styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={async (values, { resetForm }) => {
                    const isHalfDay =
                        isHalfDayEligibleType(values.leaveType) &&
                        values.startDate === values.endDate &&
                        values.dayType !== 'FULL';
                    const start = values.startDate;
                    const end = isHalfDay ? values.startDate : values.endDate;
                    const fullDays = dayjs(end).diff(dayjs(start), 'day') + 1;
                    let leaveCount = 0.5;
                    if (!isHalfDay) leaveCount = fullDays > 0 ? fullDays : 1;
                    const isUnpaidLeave = values.leaveType === 'UNPAID';
                    const ok = await onSubmit({
                        start,
                        end,
                        leaveCount,
                        typeOfLeave: isUnpaidLeave ? undefined : values.leaveType,
                        isUnpaidLeave,
                        halfDaySelection: isHalfDay
                            ? (values.dayType as 'FIRST_HALF' | 'SECOND_HALF')
                            : undefined,
                        notes: values.reason || undefined,
                    });
                    if (ok) {
                        resetForm();
                        onClose();
                    }
                }}
            >
                {({ isSubmitting, values, handleSubmit }) => {
                    const isHalfDayEligible = isHalfDayEligibleType(values.leaveType);
                    const isSingleDay =
                        Boolean(values.startDate) && values.startDate === values.endDate;
                    return (
                        <Form onFinish={handleSubmit} layout="vertical">
                            <div className="flex flex-col gap-4 [&_.ant-form-item]:!mb-0">
                                <div className="flex flex-col gap-1">
                                    <Text className="text-valueText font-bold text-lg">
                                        Apply for Leave
                                    </Text>
                                    <Text className="text-titleText text-sm">
                                        Submit your leave request below
                                    </Text>
                                </div>

                                <SelectInput
                                    name="leaveType"
                                    label="Leave Type"
                                    placeholder="Select leave type"
                                    options={leaveTypes}
                                    isRequired
                                />

                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <DatePickerInput
                                            name="startDate"
                                            label="Start Date"
                                            placeholder="Select Date"
                                            isRequired
                                            classes="w-full"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <DatePickerInput
                                            name="endDate"
                                            label="End Date"
                                            placeholder="Select Date"
                                            isRequired
                                            classes="w-full"
                                            minDate={
                                                values.startDate
                                                    ? dayjs(values.startDate)
                                                    : undefined
                                            }
                                        />
                                    </div>
                                </div>

                                {isHalfDayEligible && isSingleDay && (
                                    <SelectInput
                                        name="dayType"
                                        label="Day Type"
                                        placeholder="Select day type"
                                        options={dayTypeOptions}
                                    />
                                )}

                                <TextAreaInput
                                    name="reason"
                                    label="Reason (optional)"
                                    placeholder="Briefly describe the reason for your leave"
                                    maxLength={300}
                                />

                                <div className="flex gap-3">
                                    <Button
                                        onClick={onClose}
                                        className="flex-1 h-12 rounded-lg font-medium"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        danger
                                        htmlType="submit"
                                        loading={isSubmitting}
                                        className="flex-1 h-12 rounded-lg font-medium text-brandColor border-brandColor"
                                    >
                                        Submit Request
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    );
                }}
            </Formik>
        </Modal>
    );
};

export default ApplyForLeaveModal;
