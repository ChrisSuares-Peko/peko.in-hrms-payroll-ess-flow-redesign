import React from 'react';

import { Button, Drawer, Flex, Form, Radio, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { Field, FieldProps, Formik } from 'formik';
import moment from 'moment';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';

import { useGetDepartmentList } from '../../../hooks/employeeHooks/useGetDepartment';
import GetEmployeeDetails from '../../../hooks/employeeHooks/useReportingStaffApi';
import { useUpdateEmployeeApiNew } from '../../../hooks/employeeHooks/useUpdateEmployeeApiNew';
import { editEmployeeSchema } from '../../../schema/employeeProfile';
import {
    contractTypeOptions,
    probationPeriodOptions,
} from '../../../utils/employeeDetails/utils';
// import { formatEmploymentType } from '../../../utils/general/formatter';
import SelectInput from '../../EmployeeProfile/SelectInput';

type Props = {
    open: boolean;
    isLoading: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    initialValues: {
        id: string;
        joinDate: string;
        department: string;
        workingDays?: number;
        workingHours: number;
        contractType: string;
        taxRegime?: string;
        reportingStaff: string;
        employeeId: string;
        designation: string;
        timeSchedule: string | undefined;
        probationPeriod: string | number;
        employeeStatus: string;
        workEmailId: string;
    };
    officialEmail: string;
};

const EmployeeInformationsDrawer = ({
    handleCancel,
    open,
    initialValues,
    setRefState,
    officialEmail,
    isLoading,
}: Props) => {
    const { tableData } = useGetDepartmentList();
    const { data } = GetEmployeeDetails('');

    const { updateEmployeePersonalDetails, employeeLoading } = useUpdateEmployeeApiNew();

    const timeRange = initialValues?.timeSchedule || '';

    const parseSchedule = (schedule: any) => {
        if (!schedule) return [null, null];

        const times = schedule.split(' - ');
        if (times.length === 2) {
            const [startTime, endTime] = times;
            const startMoment = moment(startTime, 'h:mm A');
            const endMoment = moment(endTime, 'h:mm A');

            if (startMoment.isValid() && endMoment.isValid()) {
                return [startMoment, endMoment];
            }
        } else {
            console.error('Schedule does not follow expected format:', schedule);
        }
        return [null, null];
    };
    const [initialStart, initialEnd] = parseSchedule(timeRange);

    const initialStartDayjs = initialStart ? dayjs(initialStart.format()) : undefined;
    const initialEndDayjs = initialEnd ? dayjs(initialEnd.format()) : undefined;
    function formatTimeRange(timeR: any) {
        const times = timeRange.split(' - ');
        const formattedTimes = times.map(time => {
            // Trim any extra whitespace and find if it contains minutes or just hours
            time = time.trim();
            const parts = time.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/i);

            if (!parts) return ''; // Return empty string if the time is not valid

            const hours = parts[1];
            const minutes = parts[2] || '00';
            let period = parts[3] || ''; // Defaults to empty if AM/PM isn't defined

            // Ensures the period is in upper case
            period = period.toUpperCase();

            return `${hours}:${minutes} ${period}`;
        });

        return formattedTimes.join(' - ');
    }

    return (
        <Formik
            initialValues={{
                dateOfJoin: initialValues?.joinDate ?? '',
                department: initialValues?.department ?? '',
                workingHours: initialValues?.workingHours ?? '',
                workingDays: initialValues?.workingDays ?? '',
                employeeStatus: initialValues?.employeeStatus ?? '',
                contractType: initialValues?.contractType ?? '',
                taxRegime: initialValues?.taxRegime ?? '',
                reportingStaff: initialValues?.reportingStaff ?? null,
                employeeId: initialValues?.employeeId ?? '',
                designation: initialValues?.designation ?? '',
                timeSchedule: formatTimeRange(initialValues?.timeSchedule) ?? '',
                probationPeriod: initialValues?.probationPeriod ?? 0,
                workEmailId: initialValues?.workEmailId ?? '',
            }}
            onSubmit={async values => {
                const payload = {
                    id: initialValues.id,
                    employeeBasicInformation: {
                        employeeInformation: values,
                    },
                };
                // @ts-ignore
                const res = await updateEmployeePersonalDetails(payload);
                if (res) setRefState(new Date().valueOf());
                handleCancel();
            }}
            validationSchema={editEmployeeSchema}
            enableReinitialize
        >
            {({ handleSubmit, resetForm, setFieldValue, values }) => (
                <Drawer
                    title="Employee Information"
                    open={open}
                    onClose={() => {
                        handleCancel();
                        resetForm();
                    }}
                    closeIcon={null}
                    destroyOnClose
                    width={470}
                    styles={{
                        body: { paddingInline: 20, paddingBlock: 16 },
                        header: { paddingInline: 20 },
                    }}
                    zIndex={20}
                >
                    <Form onFinish={handleSubmit} layout="vertical">
                        <DatePickerInput
                            name="dateOfJoin"
                            label="Join Date"
                            placeholder="Select Join Date"
                            classes="rounded-sm w-full"
                            needConfirm={false}
                            isRequired
                        />
                        <SelectInput
                            name="department"
                            label="Department"
                            placeholder="Select Department"
                            classes="rounded-sm"
                            options={tableData ?? []}
                            allowClear
                        />

                        <SelectInputWithSearch
                            name="contractType"
                            label="Contract Type"
                            placeholder="Enter Contract Type"
                            classes="rounded-sm"
                            options={contractTypeOptions}
                            isRequired
                        />
                        <Field name="taxRegime">
                            {({ field }: FieldProps) => (
                                <Form.Item
                                    label={
                                        <Typography.Text className="font-medium">
                                            Tax Regime
                                        </Typography.Text>
                                    }
                                >
                                    <Radio.Group
                                        value={field.value}
                                        onChange={e => setFieldValue('taxRegime', e.target.value)}
                                        className="flex gap-6"
                                    >
                                        <Radio value="New Tax Regime">New Tax Regime</Radio>
                                        <Radio value="Old Tax Regime">Old Tax Regime</Radio>
                                    </Radio.Group>
                                </Form.Item>
                            )}
                        </Field>
                        <SelectInput
                            name="reportingStaff"
                            label="Reporting Staff"
                            placeholder="Enter Reporting Staff"
                            classes="rounded-sm"
                            options={data?.filter(dataa => dataa?.value !== initialValues.id) ?? []}
                            allowClear
                            onChange={value => setFieldValue('reportingStaff', value || null)}
                        />
                        <TextInput
                            name="employeeId"
                            label="Employee ID"
                            type="text"
                            placeholder="Enter Employee ID"
                            classes="rounded-sm"
                            allowAlphabetsNumberAndSpecialCharacters={['_']}
                            isRequired
                        />
                        <TextInput
                            name="designation"
                            label="Designation"
                            type="text"
                            placeholder="Enter Designation"
                            classes="rounded-sm"
                            allowAlphabetsAndSpaceOnly
                            isRequired
                        />
                        <TextInput
                            name="workEmailId"
                            label="Work Email ID"
                            type="text"
                            placeholder="Enter Work Email ID"
                            classes="rounded-sm"
                            allowEmailsOnly
                            isDisabled={Boolean(initialValues?.workEmailId)}
                            formItemClass={initialValues?.workEmailId ? '!mb-1' : undefined}
                        />
                        {initialValues?.workEmailId && (
                            <div className="!mb-6">
                                <Typography.Text type="secondary" className="text-sm !block">
                                    To change the work email after an ESS invite has been sent, use
                                    &ldquo;Share ESS Invite&rdquo; instead.
                                </Typography.Text>
                            </div>
                        )}
                        {/* The status follows the joining date and probation; Confirm / Extend are on the profile header. */}
                        <SelectInput
                            label="Probation Period"
                            name="probationPeriod"
                            placeholder="Probation Period"
                            classes="rounded-sm"
                            options={probationPeriodOptions}
                            isRequired
                        />
                        <Field name="timeSchedule">
                            {({ field, form: { touched, errors } }: FieldProps) => (
                                <Form.Item
                                    name="timeSchedule"
                                    validateStatus={
                                        touched.timeSchedule && errors.timeSchedule ? 'error' : ''
                                    }
                                    help={
                                        touched.timeSchedule && errors.timeSchedule
                                            ? (errors.timeSchedule as React.ReactNode)
                                            : undefined
                                    }
                                    required
                                    label="Time Schedule"
                                >
                                    <TimePicker.RangePicker
                                        format="h:mm A"
                                        use12Hours
                                        minuteStep={30}
                                        className="w-full"
                                        placeholder={['Start Time', 'End Time']}
                                        defaultValue={
                                            initialStartDayjs && initialEndDayjs
                                                ? [initialStartDayjs, initialEndDayjs]
                                                : undefined
                                        }
                                        onChange={range => {
                                            if (range) {
                                                const [start, end] = range;
                                                const formattedRange = `${start?.format('h:mm A')} - ${end?.format('h:mm A')}`;
                                                setFieldValue('timeSchedule', formattedRange);
                                                // Calculate and set working hours based on start and end times
                                                const duration = moment.duration(end?.diff(start));
                                                const hours = duration.asHours();
                                                setFieldValue('workingHours', hours);
                                            } else {
                                                // Handle the case where no time is selected
                                                setFieldValue('timeSchedule', '');
                                            }
                                        }}
                                    />
                                </Form.Item>
                            )}
                        </Field>
                        <Flex className="w-full " justify="flex-end" gap={10} key="">
                            <Button
                                loading={employeeLoading}
                                key="submit"
                                type="primary"
                                danger
                                onClick={() => {
                                    handleSubmit();
                                }}
                                className="px-5"
                            >
                                Submit
                            </Button>
                            <Button
                                key="back"
                                onClick={() => {
                                    handleCancel();
                                    resetForm();
                                }}
                                className="px-5"
                            >
                                Cancel
                            </Button>
                        </Flex>
                    </Form>
                </Drawer>
            )}
        </Formik>
    );
};

export default EmployeeInformationsDrawer;
