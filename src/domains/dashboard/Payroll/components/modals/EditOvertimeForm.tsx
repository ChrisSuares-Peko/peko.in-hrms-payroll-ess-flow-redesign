import React, { useEffect } from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';
import { Formik, type FormikProps, useFormikContext } from 'formik';

import DatePickerInput from '@src/components/atomic/inputs/DatePickerInput';
import TextAreaInput from '@src/components/atomic/inputs/TextAreaInput';
import TextInput from '@src/components/atomic/inputs/TextInput';

import GetOvertimeAmount from '../../hooks/employeeSalaryHooks/overtimeHooks/useCalculateOvertimeApi';
import { editOvertimeSchema } from '../../schema/overtimeSchema';

export type EditOvertimeFormValues = {
    overTimeDate: string;
    extraHours: string;
    overTimeRate: string;
    totalWorkingHours: string;
    hourlyRate: string;
    overTimeAmount: string;
    notes: string;
};

interface CalculatorProps {
    employeeId: string;
}

const OvertimeCalculator = ({ employeeId }: CalculatorProps) => {
    const { values, setFieldValue } = useFormikContext<EditOvertimeFormValues>();
    const { getOvertimeDetails } = GetOvertimeAmount();

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!employeeId || !values.extraHours || !values.overTimeRate) return;
            const result = await getOvertimeDetails(employeeId, Number(values.extraHours), Number(values.overTimeRate));
            if (result) {
                setFieldValue('overTimeAmount', String(result.overtimeAmount));
                setFieldValue('hourlyRate', String(result.hourlyRate));
                setFieldValue('totalWorkingHours', String(result.totalWorkingHours));
            }
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [values.extraHours, values.overTimeRate, employeeId, getOvertimeDetails, setFieldValue]);

    return null;
};

interface Props {
    employeeId: string;
    initialValues: EditOvertimeFormValues;
    formikRef: React.RefObject<FormikProps<EditOvertimeFormValues>>;
    onSubmit: (values: EditOvertimeFormValues) => void;
}

const EditOvertimeForm = ({ employeeId, initialValues, formikRef, onSubmit }: Props) => (
    <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        enableReinitialize
        validationSchema={editOvertimeSchema}
        onSubmit={onSubmit}
    >
        {({ values, setFieldTouched }) => (
            <Form layout="vertical" onFinish={() => {}}>
                <OvertimeCalculator employeeId={employeeId} />

                <DatePickerInput
                    name="overTimeDate"
                    label="Date"
                    placeholder="Select date"
                    isRequired
                    classes="w-full"
                    needConfirm={false}
                    maxDate={dayjs()}
                />
                <div className="flex gap-3">
                    <TextInput name="extraHours" label="Extra Hours" type="text" placeholder="e.g. 2" suffix="hrs" isRequired allowTwoDecimalsOnly maxLength={3} formItemClass="flex-1" />
                    <TextInput name="overTimeRate" label="OT Rate" type="text" placeholder="e.g. 1.5" addonBefore="×" isRequired allowTwoDecimalsOnly maxLength={3} formItemClass="flex-1" />
                </div>
                <TextInput
                    name="totalWorkingHours"
                    label="Total Working Hours"
                    type="text"
                    placeholder="e.g. 8"
                    suffix="hrs"
                    isRequired
                    allowTwoDecimalsOnly
                    maxLength={3}
                    handleChange={() => setFieldTouched('totalWorkingHours', true, false)}
                />

                {values.hourlyRate && values.overTimeAmount && (
                    <>
                        <TextInput name="hourlyRate" type="text" label="Hourly Rate (₹)" isDisabled isRequired />
                        <TextInput name="overTimeAmount" type="text" label="Overtime Amount (₹)" isDisabled isRequired allowTwoDecimalsOnly />
                    </>
                )}

                <TextAreaInput name="notes" label="Notes" placeholder="Add a note..." minRows={3} />
            </Form>
        )}
    </Formik>
);

export default EditOvertimeForm;
