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
import useIncentivesCreate from '../../hooks/employeeSalaryHooks/incentivesHooks/useAddIncentiveApi';
import { useUpdateIncentive } from '../../hooks/employeeSalaryHooks/incentivesHooks/useUpdateIncentiveApi';
import { payrollBonusAndIncentiveSchema } from '../../schema/EmployeeSalary';
import { bonusTable } from '../../types/salaryProfileTypes/bonustypes';
import { incentiveTable } from '../../types/salaryProfileTypes/incentiveTypes';

// The Bonus & Incentives consolidation: one Type dropdown selecting either a Bonus
// sub-category (persisted with a `type` field on the Bonus entity) or "Incentive"
// (persisted on the separate Incentives entity, which has no such categorization) —
// merging the FORM/UI, not the backend entities, to avoid a data migration.
const TYPE_OPTIONS = [
    { label: 'Bonus', value: 'BONUS' },
    { label: 'Joining/Referral Bonus', value: 'JOINING_REFERRAL_BONUS' },
    { label: 'Commission', value: 'COMMISSION' },
    { label: 'Leave Encashment', value: 'LEAVE_ENCASHMENT' },
    { label: 'Spot Award', value: 'SPOT_AWARD' },
    { label: 'Incentive', value: 'INCENTIVE' },
];

type ExtraBenefitRecord = (bonusTable & { entityType: 'BONUS'; type?: string }) | (incentiveTable & { entityType: 'INCENTIVE' });

interface BonusAndIncentiveModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: ExtraBenefitRecord | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    employeeIdFromProfile?: string;
    year: number;
    month: number;
}

const BonusAndIncentiveModal = ({
    open,
    handleCancel,
    selectedRecordData,
    reloadTable,
    employeeIdFromProfile,
    year,
    month,
}: BonusAndIncentiveModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleBonusCreation, isAdding: isAddingBonus } = useBonusCreate(handleCancel);
    const { updateBonusById, isUpdating: isUpdatingBonus } = useUpdateBonus(handleCancel);
    const { handleIncentivesCreation, isAdding: isAddingIncentive } = useIncentivesCreate();
    const { updateIncentiveId, isUpdating: isUpdatingIncentive } = useUpdateIncentive();

    const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month');
    const minDate = dayjs().subtract(1, 'month').set('day', 0);

    const isEditingIncentive = selectedRecordData?.entityType === 'INCENTIVE';
    const isEditingBonus = selectedRecordData?.entityType === 'BONUS';

    const handleFormSubmit = async (values: any) => {
        if (values.type === 'INCENTIVE') {
            const payload = { employeeId: values.employeeId, incentiveDate: values.incentiveDate, amount: values.amount, details: values.details };
            if (isEditingIncentive) {
                await updateIncentiveId({ id: selectedRecordData.id, ...payload } as any);
            } else {
                await handleIncentivesCreation(payload as any);
            }
        } else {
            const payload = { employeeId: values.employeeId, bonusDate: values.bonusDate, bonusAmount: values.bonusAmount, type: values.type };
            if (isEditingBonus) {
                await updateBonusById(payload as any, selectedRecordData.id);
            } else {
                await handleBonusCreation(payload as any);
            }
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    let isLoading = isAddingBonus || isAddingIncentive;
    if (isEditingIncentive) {
        isLoading = isUpdatingIncentive;
    } else if (isEditingBonus) {
        isLoading = isUpdatingBonus;
    }

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Bonus / Incentive' : 'Add Bonus / Incentive'}
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                employeeId: employeeIdFromProfile || '',
                type: isEditingIncentive ? 'INCENTIVE' : selectedRecordData?.type || (isEditingBonus ? 'BONUS' : ''),
                bonusDate: isEditingBonus ? selectedRecordData?.effectiveMonth : '',
                bonusAmount: isEditingBonus ? selectedRecordData?.bonusAmount : '',
                incentiveDate: isEditingIncentive ? selectedRecordData?.effectiveMonth : '',
                amount: isEditingIncentive ? selectedRecordData?.incentiveAmount : '',
                details: isEditingIncentive ? selectedRecordData?.details : '',
                id: selectedRecordData?.id,
            }}
            validationSchema={payrollBonusAndIncentiveSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => {
                const isIncentive = values.type === 'INCENTIVE';
                return (
                    <Form layout="vertical">
                        {!selectedRecordData && !employeeIdFromProfile && (
                            <SelectInput
                                name="employeeId"
                                options={generateEmployeesDropdown(data) || []}
                                placeholder="Select employee"
                                label="Employee name"
                                isRequired
                            />
                        )}

                        <SelectInput
                            name="type"
                            options={TYPE_OPTIONS}
                            placeholder="Select type"
                            label="Type"
                            isRequired
                            isDisabled={!!selectedRecordData}
                            handleChange={(value: string) => setFieldValue('type', value)}
                        />

                        {isIncentive ? (
                            <>
                                <DatePickerInput
                                    name="incentiveDate"
                                    label="Effective Month"
                                    placeholder="Select effective month"
                                    classes="w-full"
                                    needConfirm={false}
                                    isRequired
                                    minDate={minDate}
                                    maxDate={endOfMonth}
                                />
                                <TextInput
                                    name="amount"
                                    type="text"
                                    label="Incentives Amount"
                                    placeholder="Enter incentives amount"
                                    isRequired
                                    allowTwoDecimalsOnly
                                    maxLength={6}
                                />
                                <TextInput
                                    name="details"
                                    type="text"
                                    label="Details"
                                    placeholder="Enter details"
                                    isRequired
                                    maxLength={50}
                                    allowAlphabetsSpaceAndNumbersOnly
                                />
                            </>
                        ) : (
                            <>
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
                                    label="Amount"
                                    placeholder="Enter amount"
                                    isRequired
                                    allowTwoDecimalsOnly
                                    maxLength={6}
                                />
                            </>
                        )}
                    </Form>
                );
            }}
        </CustomModalWithForm>
    );
};

export default BonusAndIncentiveModal;
