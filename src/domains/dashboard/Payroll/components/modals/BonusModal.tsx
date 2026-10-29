import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import useBonusCreate from '../../hooks/employeeSalaryHooks/bonusHooks/useAddBonusApi';
import { useUpdateBonus } from '../../hooks/employeeSalaryHooks/bonusHooks/useUpdateBonusApi';
import { payrollBonusSchema } from '../../schema/EmployeeSalary';
import { bonusTable } from '../../types/salaryProfileTypes/bonustypes';

interface BonusModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: bonusTable | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    year: number;
    month: number;
}

const BonusModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    year,
    month,
}: BonusModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleBonusCreation,isAdding } = useBonusCreate(handleCancel);
    const { updateBonusById ,isUpdating} = useUpdateBonus(handleCancel);
    // const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month');
    const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month');

    // const minDate =
    //     dayjs().month() + 1 === month && dayjs().year() === year ? dayjs(new Date()) : startOfMonth;

    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateBonusById(values, selectedRecordData.id);
        } else {
            await handleBonusCreation(values);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Bonus' : 'Add Bonus'}
            open={open}
            isLoading={selectedRecordData?isUpdating:isAdding}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                employeeId: selectedRecordData?.employeeId || employeeIdFromProfile || '',
                bonusDate: selectedRecordData?.effectiveMonth,
                bonusAmount: selectedRecordData?.bonusAmount,
                id: selectedRecordData?.id,
            }}
            validationSchema={payrollBonusSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => {
                // const selectedEmployee = data?.find(
                //     emp => emp.id === values.employeeId
                // );

                // const joiningDate = selectedEmployee?.employeeInformation?.dateOfJoin
                //     ? dayjs(selectedEmployee.employeeInformation.dateOfJoin)
                //     : null;

                const minDate =dayjs().subtract(1,"month").set("day",0)
                return (
                    <Form layout="vertical">
                        {!selectedRecordData && !employeeIdFromProfile ? (
                            <SelectInput
                                name="employeeId"
                                options={generateEmployeesDropdown(data) || []}
                                placeholder="Select employee"
                                label="Employee name"
                                isRequired
                            />
                        ) : (
                            ''
                        )}

                        <DatePickerInput
                            label="Effective Month"
                            placeholder="Select effective month"
                            isRequired
                            name="bonusDate"
                            classes="w-full"
                            needConfirm={false}
                            minDate={minDate}
                            maxDate={endOfMonth}
                        />

                        <TextInput
                            name="bonusAmount"
                            type="text"
                            label="Bonus Amount"
                            placeholder="Enter bonus amount"
                            isRequired
                            allowTwoDecimalsOnly
                            maxLength={6}
                        />
                    </Form>
                );
            }}
        </CustomModalWithForm>
    );
};
export default BonusModal;
