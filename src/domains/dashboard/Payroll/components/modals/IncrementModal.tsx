import { useEffect } from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';
import { debounce } from 'lodash';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import useIncrementCreate from '../../hooks/employeeSalaryHooks/incrementHooks/useAddIncrementApi';
import { useGetBasicSalaryIncrementApi } from '../../hooks/employeeSalaryHooks/incrementHooks/useGetbasicSalaryIncrement';
import GetIncrementAmount from '../../hooks/employeeSalaryHooks/incrementHooks/useGetIncrementAmountApi';
import { useUpdateIncrement } from '../../hooks/employeeSalaryHooks/incrementHooks/useUpdateIncrementApi';
import { payrollIncrementSchema } from '../../schema/EmployeeSalary';
import { incrementTable } from '../../types/salaryProfileTypes/incrementTypes';

type IncrementModalProps = {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: incrementTable | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    year: number;
    month: number;
};

const IncrementModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    year,
    month,
}: IncrementModalProps) => {
    const { getBasicSalarytIncrementData, basicSalary: salary } = useGetBasicSalaryIncrementApi();

    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleIncrementCreation } = useIncrementCreate(handleCancel);
    const { updateIncrementId } = useUpdateIncrement(handleCancel);
    const { getIncrementDetails } = GetIncrementAmount();
    const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month');
    const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month');

    const minDate =
        dayjs().month() + 1 === month && dayjs().year() === year ? dayjs(new Date()) : startOfMonth;

    useEffect(() => {
        if (employeeIdFromProfile) {
            getBasicSalarytIncrementData(month, year, employeeIdFromProfile);
        }
    }, [employeeIdFromProfile, getBasicSalarytIncrementData, month, year]);

    const debouncedGetIncrementDetails = debounce(
        async (
            employeeId,
            incrementAmount,
            incrementPercentage,
            type,
            setFieldValue,
            basicSalaries
        ) => {
            if (type === 'percentage') {
                const incrementAmountdata = await getIncrementDetails(
                    employeeId,
                    type,
                    incrementPercentage,
                    basicSalaries
                );
                if (incrementAmountdata) {
                    setFieldValue('incrementAmount', incrementAmountdata.incrementAmount);
                    setFieldValue('newBasicSalary', incrementAmountdata.newBasicSalary);
                }
            }
            if (type === 'flat') {
                const incrementAmountdata = await getIncrementDetails(
                    employeeId,
                    type,
                    incrementAmount,
                    basicSalaries
                );
                if (incrementAmountdata) {
                    setFieldValue('incrementPercentage', incrementAmountdata.incrementPercentage);
                    setFieldValue('newBasicSalary', incrementAmountdata.newBasicSalary);
                }
            }
        },
        300
    );

    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateIncrementId(values, selectedRecordData);
        } else {
            await handleIncrementCreation(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    const incrementType = [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Flat', value: 'flat' },
    ];

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Increment' : 'Add Increment'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                employeeId: selectedRecordData?.employeeId || employeeIdFromProfile || '',
                basicSalary: selectedRecordData ? selectedRecordData.previousBasicSalary : salary,
                incrementType: selectedRecordData?.incrementType,
                incrementPercentage: selectedRecordData?.incrementPercentage,
                incrementAmount: selectedRecordData?.incrementAmount,
                newBasicSalary: selectedRecordData?.newBasicSalary,
                effectiveDate: selectedRecordData?.effectiveDate,
                id: selectedRecordData?.id,
            }}
            validationSchema={payrollIncrementSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    {!selectedRecordData && !employeeIdFromProfile ? (
                        <SelectInput
                            name="employeeId"
                            options={generateEmployeesDropdown(data) || []}
                            placeholder="Select employee"
                            label="Employee name"
                            isRequired
                            handleChange={eid => {
                                debouncedGetIncrementDetails(
                                    eid,
                                    values.type,
                                    values.incrementAmount,
                                    values.incrementPercentage,
                                    setFieldValue,
                                    salary
                                );
                            }}
                        />
                    ) : (
                        ''
                    )}
                    <TextInput
                        name="basicSalary"
                        type="text"
                        label="Current Basic Salary"
                        isRequired
                        allowNumbersOnly
                        isDisabled
                    />
                    <SelectInput
                        name="incrementType"
                        options={incrementType || []}
                        placeholder="Select increment type"
                        label="Select Increment Type"
                        isRequired
                    />

                    <TextInput
                        name="incrementPercentage"
                        type="text"
                        label="Increment Percentage"
                        placeholder="Enter increment percentage"
                        isRequired={values.type === 'percentage'}
                        allowNumbersOnly
                        maxLength={3}
                        isDisabled={!(values.incrementType === 'percentage')}
                        handleChange={async incrementPercentage => {
                            debouncedGetIncrementDetails(
                                employeeIdFromProfile || values.employeeId,
                                values.incrementAmount,
                                incrementPercentage,
                                values.incrementType,
                                setFieldValue,
                                selectedRecordData ? selectedRecordData.previousBasicSalary : salary
                            );
                        }}
                    />
                    <TextInput
                        name="incrementAmount"
                        type="text"
                        label="Increment Amount"
                        placeholder="Enter increment amount"
                        isRequired={values.type === 'flat'}
                        allowNumbersOnly
                        isDisabled={!(values.incrementType === 'flat')}
                        handleChange={async incrementAmount => {
                            debouncedGetIncrementDetails(
                                employeeIdFromProfile || values.employeeId,
                                incrementAmount,
                                values.incrementPercentage,
                                values.incrementType,
                                setFieldValue,
                                selectedRecordData ? selectedRecordData.previousBasicSalary : salary
                            );
                        }}
                    />
                    <TextInput
                        name="newBasicSalary"
                        type="text"
                        label="New Basic Salary"
                        allowNumbersOnly
                        isDisabled
                    />
                    <DatePickerInput
                        label="Effective Date"
                        placeholder="Select effective date"
                        isRequired
                        name="effectiveDate"
                        classes="w-full"
                        minDate={minDate}
                        maxDate={endOfMonth}
                        needConfirm={false}
                    />
                    <FileUploadInput
                        label="Upload File (If any)"
                        name="attachment"
                        format="attachmentFormat"
                        showNotification
                        showFileName
                        allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default IncrementModal;
