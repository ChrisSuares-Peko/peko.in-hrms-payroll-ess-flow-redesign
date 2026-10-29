import { Collapse, Flex, Form, TimePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { Field, FieldProps } from 'formik';
import moment from 'moment';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import CustomModalWithForm from './CustomModalWithForm';
import useEpfApplicabilityApi from '../../hooks/complianceSettings/useEpfApplicabilityApi';
import { useGetComplianceSettingsApi } from '../../hooks/complianceSettings/useGetComplianceSettingsApi';
import { useBulkValidateApi } from '../../hooks/employeeHooks/useBulkValidateApi';
import useReportingStaffApi from '../../hooks/employeeHooks/useReportingStaffApi';
import { useGetSalaryComponent } from '../../hooks/OrganizationSettings/useGetCurrentSalaryCompApi';
import { useGetAllDeductions } from '../../hooks/OrganizationSettings/useGetDeductionComponentApi';
import { bulkUploadSchema } from '../../schema/bulkUploadSchema';
import { updateEmployeeDetails } from '../../slices/jsonSlice';
import { calculateCtcBreakdown } from '../../utils/ctcCalculator/calculateCtcBreakdown';
import {
    resolveEpfApplicableForJoiners,
    resolveEpfPolicyFromComplianceSettings,
    resolveShowPfInEarningsFromComplianceSettings,
} from '../../utils/ctcCalculator/calculateEmployerPf';
import { mapDeductionComponentsToDeductions, mapSalaryComponentsToEarnings } from '../../utils/ctcCalculator/mapOrgComponentsToCtcModel';
import { DEFAULT_PROBATION_MONTHS, probationPeriodOptions, stateOptions } from '../../utils/employeeDetails/utils';
import CtcBreakdownCard from '../ctcCalculator/CtcBreakdownCard';
import DatePickerInput from '../EmployeeProfile/DatePickerInput';
import SelectInput from '../EmployeeProfile/SelectInput';

const { Text } = Typography;

type InitialStateDataType = {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    mobileNo: string;
    email: string;
    state: string | null;
    addressLine1: string;
    addressLine2: string;
    pinCode: string;
    emergencyContactNumber: string | null;
    emergencyContactName: string | null;
    emergencyContactRelation: string | null;
    employeeId: string;
    department: string;
    workingHours: number;
    dateOfJoin: string;
    designation: string;
    workEmailId: string;
    workingDays: string;
    contractType: string;
    reportingStaff: string | null;
    timeSchedule: string;
    employeeStatus: string;
    probationPeriod: string | number | null;
    validated: boolean;
    errors: string[];
    corporateUser?: string;
    pan?: string | null;
    taxRegime?: string | null;
    uan?: string | null;
    esiNumber?: string | null;
    workState?: string | null;
    annualCTC?: number | string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    bankName?: string | null;
    ifscCode?: string | null;
};

const TAX_REGIME_OPTIONS = [
    { value: 'New', label: 'New' },
    { value: 'Old', label: 'Old' },
];
type EmployeeModalProps = {
    open: boolean;
    handleCancel: () => void;
    employeeData: InitialStateDataType | undefined;
    employeeIndex: number | undefined;
    // Rows in this upload — they all join together, so EPF may become mandatory (20+) for
    // the whole batch even when it's switched off today.
    batchSize?: number;
};

const fmtRupees = (amount: number) => `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount))}`;

const EmployeeModal = ({ open, handleCancel, employeeData, employeeIndex, batchSize = 1 }: EmployeeModalProps) => {
    console.log('Employee Data in Modal:', employeeData); // Debugging log to check the data being passed to the modal
    // const [empStatus, setEmpStatus] = useState<string>('');
    const timeRange = employeeData?.timeSchedule;

    // Salary breakdown preview — same engine/data source as the Dashboard CTC Calculator
    // and Add Employee (useGetSalaryComponent/useGetAllDeductions with includePf, plus
    // resolveEpfPolicyFromComplianceSettings) so this row is never a second, diverging
    // calculation path.
    const { data: salaryComponents } = useGetSalaryComponent();
    const { data: deductionComponents } = useGetAllDeductions(1, 100, '', false, true);
    const { complianceData } = useGetComplianceSettingsApi();
    const epfPolicy = resolveEpfPolicyFromComplianceSettings(complianceData);
    const { applicability: epfApplicability } = useEpfApplicabilityApi();
    const epfApplicable = resolveEpfApplicableForJoiners(complianceData, epfApplicability, batchSize);
    const showPfInEarnings = resolveShowPfInEarningsFromComplianceSettings(complianceData, epfApplicable);
    const earnings = mapSalaryComponentsToEarnings(salaryComponents);
    const deductions = mapDeductionComponentsToDeductions(deductionComponents);

    const parseSchedule = (schedule: any) => {
        if (!schedule) return [null, null]; // Handle the case where no schedule is provided

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
        return [null, null]; // Return nulls for any parsing failures
    };

    const [initialStart, initialEnd] = parseSchedule(timeRange);
    const initialStartDayjs = initialStart ? dayjs(initialStart.format()) : undefined;
    const initialEndDayjs = initialEnd ? dayjs(initialEnd.format()) : undefined;
    const { bulkValidate, isLoading } = useBulkValidateApi();
   

    // const [searchText, setSearchText] = useState<string>('');

    const { data } = useReportingStaffApi('');

    const transformedData = data.map(item => ({
        ...item,
        value: item.label,
    }));

    const dispatch = useAppDispatch();
    const handleUpdateEmployee = (values: any) => {
        dispatch(updateEmployeeDetails({ index: employeeIndex!, data: values }));
        // handleCancel();
    };
    const jobTypeOptions = [
        { key: 1, id: 1, value: 'PART_TIME', label: 'Part Time' },
        { key: 2, id: 2, value: 'FULL_TIME', label: 'Full Time' },
    ];

    const allEmployees = useAppSelector(state => state.reducer.BulkUpload);

    return (
        <CustomModalWithForm
            modalTitle="Edit Employee Details"
            open={open}
            handleCancel={handleCancel}
            isLoading={isLoading}
            handleFormSubmit={async values => {
                const submissionValues = { ...values };
                dispatch(updateEmployeeDetails({ index: employeeIndex!, data: submissionValues }));

                if (!submissionValues.reportingStaff) {
                    delete submissionValues.reportingStaff;
                }
                if (!submissionValues.emergencyContactName) {
                    delete submissionValues.emergencyContactName;
                }
                if (!submissionValues.emergencyContactRelation) {
                    delete submissionValues.emergencyContactRelation;
                }
                if (!submissionValues.emergencyContactNumber) {
                    delete submissionValues.emergencyContactNumber;
                }

                handleUpdateEmployee(submissionValues);
                const allEmployeesData = [...allEmployees];

                if (employeeIndex !== undefined) {
                    allEmployeesData.splice(employeeIndex, 1, submissionValues);
                }
                const payload = {
                    jsonData: allEmployeesData,
                };

                await bulkValidate(payload); // Assuming bulkValidate takes an array of objects
                handleCancel();
            }}
            initialValues={{
                fullName: employeeData?.fullName || '',
                dateOfBirth: employeeData?.dateOfBirth || '',
                gender: employeeData?.gender || '',
                mobileNo: employeeData?.mobileNo || '',
                email: employeeData?.email || '', // Initial value for email field
                emergencyContactNumber: employeeData?.emergencyContactNumber || null, // Initial value for emergency contact number
                emergencyContactName: employeeData?.emergencyContactName || null, // Initial value for emergency contact Name
                emergencyContactRelation: employeeData?.emergencyContactRelation || null,
                state: employeeData?.state || null,
                addressLine1: employeeData?.addressLine1 || '',
                addressLine2: employeeData?.addressLine2 || '',
                dateOfJoin: employeeData?.dateOfJoin
                    ? moment(employeeData?.dateOfJoin).format('YYYY-MM-DD')
                    : dayjs().format('YYYY-MM-DD'),
                designation: employeeData?.designation || '',
                employeeId: employeeData?.employeeId || '',
                reportingStaff: employeeData?.reportingStaff || null,
                department: employeeData?.department || '',
                workingHours: employeeData?.workingHours || 0,
                employeeStatus: employeeData?.employeeStatus || '',
                timeSchedule: employeeData?.timeSchedule || undefined,
                contractType: employeeData?.contractType || '',
                workEmailId: employeeData?.workEmailId || '',
                workingDays: employeeData?.workingDays || '',
                pinCode: employeeData?.pinCode || '',
                // The sheet value can arrive as text; blank means the default 3 months, as on upload.
                probationPeriod:
                    employeeData?.probationPeriod === null ||
                    employeeData?.probationPeriod === undefined ||
                    employeeData?.probationPeriod === ''
                        ? DEFAULT_PROBATION_MONTHS
                        : Number(employeeData.probationPeriod),
                pan: employeeData?.pan || '',
                taxRegime: employeeData?.taxRegime || '',
                uan: employeeData?.uan || '',
                esiNumber: employeeData?.esiNumber || '',
                workState: employeeData?.workState || '',
                annualCTC: employeeData?.annualCTC ?? '',
                accountHolderName: employeeData?.accountHolderName || '',
                accountNumber: employeeData?.accountNumber || '',
                bankName: employeeData?.bankName || '',
                ifscCode: employeeData?.ifscCode || '',
            }}
            validationSchema={bulkUploadSchema}
        >
            {({ handleSubmit, values }) => (
                <Form layout="vertical">
                    <TextInput
                        label="Full name"
                        isRequired
                        name="fullName"
                        placeholder={undefined}
                        type="text"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />
                    <DatePickerInput
                        label="Date of birth"
                        isRequired
                        name="dateOfBirth"
                        placeholder="Select Date"
                        classes=" rounded-sm w-full"
                        maxDate={dayjs().subtract(18, 'year')}
                        value={
                            employeeData?.dateOfBirth ? dayjs(employeeData.dateOfBirth) : undefined
                        } // Set initial value here
                    />

                    <TextInput
                        label="Mobile number"
                        name="mobileNo"
                        allowNumbersOnly
                        maxLength={10}
                        placeholder="Enter mobile number"
                        type="text"
                        isRequired
                    />

                    <TextInput
                        label="Personal Email"
                        name="email"
                        type="text"
                        placeholder="Enter personal email ID"
                        isRequired
                        allowEmailsOnly
                        maxLength={50}
                    />

                    <SelectInput
                        isRequired
                        label="Gender"
                        name="gender"
                        placeholder="Enter gender"
                        classes=" rounded-sm "
                        options={[
                            { value: 'MALE', label: 'Male' },
                            { value: 'FEMALE', label: 'Female' },
                        ]}
                    />
                    <TextInput
                        label="Address Line 1"
                        name="addressLine1"
                        type="text"
                        placeholder="Enter Address Line 1"
                        maxLength={50}
                        allowAlphabetsNumberAndSpecialCharacters={[
                            ' ',
                            '.',
                            ',',
                            '/',
                            ')',
                            '(',
                            '@',
                            '-',
                            '_',
                        ]}
                        isRequired
                    />

                    <TextInput
                        label="Address Line 2"
                        name="addressLine2"
                        type="text"
                        placeholder="Enter Address Line 2"
                        maxLength={50}
                        allowAlphabetsNumberAndSpecialCharacters={[
                            ' ',
                            '.',
                            ',',
                            '/',
                            ')',
                            '(',
                            '@',
                            '-',
                            '_',
                        ]}
                        isRequired
                    />

                    <TextInput
                        label="Emergency Contact Number"
                        name="emergencyContactNumber"
                        type="text"
                        placeholder="Enter emergency contact number"
                        maxLength={10}
                        allowNumbersOnly
                    />
                    <TextInput
                        label="Emergency Contact Name"
                        name="emergencyContactName"
                        type="text"
                        placeholder="Enter emergency contact name"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />
                    <TextInput
                        label="Emergency Contact Relation"
                        name="emergencyContactRelation"
                        type="text"
                        placeholder="Enter emergency contact name"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />

                    <SelectInputWithSearch
                        isRequired
                        label="State"
                        name="state"
                        options={stateOptions ?? []}
                        placeholder="State"
                        classes="rounded-sm"
                        // onSearch={setSearchText}
                    />
                    <TextInput
                        label="Pin Code"
                        isRequired
                        name="pinCode"
                        placeholder="Pin Code"
                        type="text"
                        maxLength={6}
                        minLength={6}
                        allowNumbersOnly
                    />

                    <DatePickerInput
                        label="Join Date"
                        isRequired
                        name="dateOfJoin"
                        placeholder="Select Date"
                        classes=" rounded-sm w-full"
                        maxDate={dayjs(new Date())}
                    />
                    <TextInput
                        label="Employee ID"
                        isRequired
                        name="employeeId"
                        placeholder="Employee ID"
                        type="text"
                        maxLength={12}
                    />
                    <TextInput
                        isRequired
                        label="Department"
                        name="department"
                        type="text"
                        maxLength={40}
                        placeholder="Select department"
                        allowAlphabetsSpaceAndNumbersOnly
                    />
                    <SelectInput
                        isRequired
                        label="Job Type"
                        name="contractType"
                        placeholder="Job Type"
                        classes=" rounded-sm "
                        options={jobTypeOptions}
                    />
                    <SelectInput
                        label="Probation Period"
                        name="probationPeriod"
                        placeholder="Probation Period"
                        classes="rounded-sm"
                        options={probationPeriodOptions}
                        isRequired
                    />

                    <SelectInput
                        label="Reporting Staff"
                        name="reportingStaff"
                        placeholder="Select Reporting Staff"
                        options={transformedData}
                        allowClear
                    />

                    <Flex vertical gap={8}>
                        <Field name="timeSchedule">
                            {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                                <Form.Item
                                    name="timeSchedule"
                                    validateStatus={
                                        touched.timeSchedule && errors.timeSchedule ? 'error' : ''
                                    }
                                    help={
                                        touched.schedule && errors.timeSchedule
                                            ? (errors.schedule as React.ReactNode)
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
                    </Flex>
                    <TextInput
                        label="Work Email"
                        name="workEmailId"
                        placeholder="Work Email"
                        classes=" rounded-sm "
                        type="email"
                        allowEmailsOnly
                        maxLength={50}
                    />

                    <TextInput
                        isRequired
                        label="Designation"
                        name="designation"
                        placeholder="Designation"
                        classes=" rounded-sm "
                        type="string"
                        maxLength={30}
                    />
                    <TextInput
                        isRequired
                        label="Working Days"
                        name="workingDays"
                        placeholder="Working Days"
                        classes=" rounded-sm "
                        type='text'
                        allowNumbersOnly
                        maxLength={2}
                    />
                    <TextInput
                        isRequired
                        label="Working Hours"
                        name="workingHours"
                        placeholder="Working Hours"
                        classes=" rounded-sm "
                        isDisabled
                        type="string"
                        allowNumbersOnly
                        maxLength={2}
                    />
                    <TextInput
                        isRequired
                        label="Annual CTC"
                        name="annualCTC"
                        placeholder="Enter Annual CTC"
                        classes=" rounded-sm "
                        type="text"
                        allowNumbersOnly
                        maxLength={9}
                    />
                    <TextInput
                        isRequired
                        label="PAN"
                        name="pan"
                        placeholder="ABCDE1234F"
                        classes=" rounded-sm "
                        type="text"
                        convertToUppercase
                        maxLength={10}
                    />
                    <SelectInput
                        label="Tax Regime"
                        name="taxRegime"
                        placeholder="Blank defaults to New"
                        classes=" rounded-sm "
                        options={TAX_REGIME_OPTIONS}
                        allowClear
                    />
                    <TextInput
                        label="UAN"
                        name="uan"
                        placeholder="Enter UAN"
                        classes=" rounded-sm "
                        type="text"
                        allowNumbersOnly
                        maxLength={12}
                    />
                    <TextInput
                        label="ESI Number"
                        name="esiNumber"
                        placeholder="10 digit ESI number"
                        classes=" rounded-sm "
                        type="text"
                        allowNumbersOnly
                        maxLength={10}
                    />
                    <SelectInputWithSearch
                        label="Work State"
                        name="workState"
                        options={stateOptions ?? []}
                        placeholder="Blank uses the org's work state (Compliance Settings)"
                        classes="rounded-sm"
                    />
                    <TextInput
                        label="Account Holder Name"
                        name="accountHolderName"
                        placeholder="Enter account holder name"
                        classes=" rounded-sm "
                        type="text"
                        allowAlphabetsAndSpaceOnly
                        maxLength={100}
                    />
                    <TextInput
                        label="Account Number"
                        name="accountNumber"
                        placeholder="Enter account number"
                        classes=" rounded-sm "
                        type="text"
                        allowNumbersOnly
                        maxLength={18}
                    />
                    <TextInput
                        label="Bank Name"
                        name="bankName"
                        placeholder="Enter bank name"
                        classes=" rounded-sm "
                        type="text"
                        maxLength={50}
                    />
                    <TextInput
                        label="IFSC Code"
                        name="ifscCode"
                        placeholder="Enter IFSC code"
                        classes=" rounded-sm "
                        type="text"
                        convertToUppercase
                        maxLength={11}
                    />
                    {(() => {
                        const breakdown = calculateCtcBreakdown({
                            annualCTC: Number(values.annualCTC) || 0,
                            epfPolicy,
                            epfApplicable,
                            showPfInEarnings,
                            earnings,
                            deductions,
                        });
                        return (
                            <Collapse
                                bordered={false}
                                className="mb-4"
                                style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10 }}
                                items={[
                                    {
                                        key: 'salary-breakdown',
                                        label: (
                                            <Flex vertical gap={2}>
                                                <Text className="text-xs font-semibold">Salary breakdown</Text>
                                                <Text className="text-xs" style={{ color: '#535862' }}>
                                                    Monthly CTC {fmtRupees(breakdown.monthlyCTC)} · Net Take-Home{' '}
                                                    {fmtRupees(breakdown.netTakeHome)}
                                                </Text>
                                            </Flex>
                                        ),
                                        children: (
                                            <Flex vertical gap={12}>
                                                <Text className="text-xs" style={{ color: '#535862' }}>
                                                    Calculated automatically — you can restructure it later on the
                                                    employee&apos;s profile.
                                                </Text>
                                                <CtcBreakdownCard breakdown={breakdown} hideNote />
                                            </Flex>
                                        ),
                                    },
                                ]}
                            />
                        );
                    })()}
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default EmployeeModal;
