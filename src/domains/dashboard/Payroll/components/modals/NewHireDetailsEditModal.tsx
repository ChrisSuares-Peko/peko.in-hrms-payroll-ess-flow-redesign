import { Col, Form, Row, TimePicker } from 'antd';
import dayjs from 'dayjs';
import { Field, FieldProps } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { updateNewHireDetails } from '../../api/employeeApi';
import useGeneralApi from '../../hooks/employeeHooks/useGetCountry';
import { useGetDepartmentList } from '../../hooks/employeeHooks/useGetDepartment';

// New Hire's timeSchedule is stored 24-hour ("09:00 - 18:00"), from resolveTimeSchedule
// on the backend — unlike the regular employee drawer's 12-hour "h:mm A" convention.
const parseTimeSchedule = (schedule?: string): [dayjs.Dayjs, dayjs.Dayjs] | undefined => {
    if (!schedule) return undefined;
    const [start, end] = schedule.split(' - ');
    const startDayjs = dayjs(start, 'HH:mm');
    const endDayjs = dayjs(end, 'HH:mm');
    return startDayjs.isValid() && endDayjs.isValid() ? [startDayjs, endDayjs] : undefined;
};

const genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
];

const contractTypeOptions = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
];

type Props = {
    open: boolean;
    onClose: () => void;
    employeeId: string;
    personalInformation: Record<string, any>;
    employeeInformation: Record<string, any>;
    onSuccess: () => void;
};

const NewHireDetailsEditModal = ({
    open,
    onClose,
    employeeId,
    personalInformation,
    employeeInformation,
    onSuccess,
}: Props) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { countriesList } = useGeneralApi();
    const { tableData: departmentOptions } = useGetDepartmentList();

    const nameParts = (personalInformation?.fullName ?? '').trim().split(/\s+/);
    const initialValues = {
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' '),
        personalEmail: personalInformation?.email ?? '',
        mobileNo: personalInformation?.mobileNo ?? '',
        gender: personalInformation?.gender ?? '',
        dateOfBirth: personalInformation?.dateOfBirth ?? '',
        country: personalInformation?.country ?? undefined,
        department:
            employeeInformation?.department?.id ??
            employeeInformation?.department?._id ??
            (typeof employeeInformation?.department === 'string'
                ? employeeInformation.department
                : undefined),
        designation: employeeInformation?.designation ?? '',
        dateOfJoin: employeeInformation?.dateOfJoin ?? '',
        contractType: employeeInformation?.contractType ?? undefined,
        employeeIdNo: employeeInformation?.employeeId ?? '',
        timeSchedule: employeeInformation?.timeSchedule ?? '',
        workingHours: employeeInformation?.workingHours ?? 0,
    };

    const handleFormSubmit = async (values: typeof initialValues) => {
        const result = await updateNewHireDetails({
            id: employeeId,
            userId,
            userType,
            personalInformation: {
                ...personalInformation,
                fullName: `${values.firstName} ${values.lastName}`.trim(),
                gender: values.gender,
                dateOfBirth: values.dateOfBirth,
                mobileNo: values.mobileNo,
                email: values.personalEmail,
                country: values.country,
            },
            employeeInformation: {
                ...employeeInformation,
                department: values.department || undefined,
                designation: values.designation,
                dateOfJoin: values.dateOfJoin,
                contractType: values.contractType,
                employeeId: values.employeeIdNo,
                timeSchedule: values.timeSchedule,
                workingHours: values.workingHours,
            },
        });
        if (result.success) {
            dispatch(
                showToast({
                    description: 'New hire details updated successfully.',
                    variant: 'success',
                })
            );
            onSuccess();
            onClose();
        } else {
            dispatch(
                showToast({
                    description: result.errorMessage ?? 'Failed to update new hire details.',
                    variant: 'error',
                })
            );
        }
    };

    return (
        <CustomModalWithForm
            modalTitle="Edit New Hire Details"
            open={open}
            handleCancel={onClose}
            initialValues={initialValues}
            handleFormSubmit={handleFormSubmit}
            reinitialise
            width={520}
            firstBtnTxt="Save"
        >
            <Form layout="vertical">
                <TextInput
                    name="firstName"
                    label="First Name"
                    type="text"
                    placeholder="Enter first name"
                    classes="rounded-sm"
                    isRequired
                    maxLength={50}
                    allowAlphabetsAndSpaceOnly
                />
                <TextInput
                    name="lastName"
                    label="Last Name"
                    type="text"
                    placeholder="Enter last name"
                    classes="rounded-sm"
                    isRequired
                    maxLength={50}
                    allowAlphabetsAndSpaceOnly
                />
                <TextInput
                    name="personalEmail"
                    label="Personal Email"
                    type="text"
                    placeholder="Enter personal email"
                    classes="rounded-sm"
                    isRequired
                    maxLength={100}
                />
                <TextInput
                    name="mobileNo"
                    label="Mobile Number"
                    type="text"
                    placeholder="Enter mobile number"
                    classes="rounded-sm"
                    isRequired
                    allowNumbersOnly
                    maxLength={10}
                />
                <Row gutter={12}>
                    <Col span={12}>
                        <SelectInput
                            name="gender"
                            label="Gender"
                            placeholder="Select gender"
                            options={genderOptions}
                            isRequired
                        />
                    </Col>
                    <Col span={12}>
                        <DatePickerInput
                            name="dateOfBirth"
                            label="Date of Birth"
                            placeholder="Select date of birth"
                            classes="w-full"
                            needConfirm={false}
                            maxDate={dayjs().subtract(18, 'year')}
                            isRequired
                        />
                    </Col>
                </Row>
                <SelectInputWithSearch
                    name="country"
                    label="Country"
                    placeholder="Select country"
                    options={countriesList ?? []}
                    isRequired
                />
                <SelectInputWithSearch
                    name="department"
                    label="Department"
                    placeholder="Select department"
                    options={departmentOptions}
                />
                <TextInput
                    name="designation"
                    label="Job Title"
                    type="text"
                    placeholder="Enter job title"
                    classes="rounded-sm"
                    isRequired
                    maxLength={50}
                    allowAlphabetsAndSpaceOnly
                />
                <DatePickerInput
                    name="dateOfJoin"
                    label="Joining Date"
                    placeholder="Select date"
                    classes="w-full"
                    needConfirm={false}
                    isRequired
                />
                <Row gutter={12}>
                    <Col span={12}>
                        <SelectInput
                            name="contractType"
                            label="Job Type"
                            placeholder="Select job type"
                            options={contractTypeOptions}
                        />
                    </Col>
                    <Col span={12}>
                        <TextInput
                            name="employeeIdNo"
                            label="Employee ID"
                            type="text"
                            placeholder="Enter employee ID"
                            classes="rounded-sm"
                            maxLength={20}
                        />
                    </Col>
                </Row>
                <Field name="timeSchedule">
                    {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                        <Form.Item
                            label="Time Schedule"
                            validateStatus={
                                touched.timeSchedule && errors.timeSchedule ? 'error' : ''
                            }
                            help={
                                touched.timeSchedule && errors.timeSchedule
                                    ? (errors.timeSchedule as React.ReactNode)
                                    : undefined
                            }
                        >
                            <TimePicker.RangePicker
                                format="HH:mm"
                                minuteStep={30}
                                className="w-full"
                                placeholder={['Start Time', 'End Time']}
                                defaultValue={parseTimeSchedule(field.value)}
                                onChange={range => {
                                    if (range && range[0] && range[1]) {
                                        const [start, end] = range;
                                        setFieldValue(
                                            'timeSchedule',
                                            `${start.format('HH:mm')} - ${end.format('HH:mm')}`
                                        );
                                        setFieldValue(
                                            'workingHours',
                                            end.diff(start, 'minute') / 60
                                        );
                                    } else {
                                        setFieldValue('timeSchedule', '');
                                        setFieldValue('workingHours', 0);
                                    }
                                }}
                            />
                        </Form.Item>
                    )}
                </Field>
            </Form>
        </CustomModalWithForm>
    );
};

export default NewHireDetailsEditModal;
