import React, { useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import dayjs from 'dayjs';
import * as Yup from 'yup';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useUsageHistoryCreate from '../../hooks/assetHooks/useCreateUsageApi';
import { useGetAssets } from '../../hooks/assetHooks/useGetAssetsApi';
import { useAssetUsageDetails } from '../../hooks/assetHooks/useGetAssetUserDetailsApi';
import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import { LatestAssetUsageResponse } from '../../types/assets/index';
import { usageHistoryReturnStatus } from '../../utils/enumValues';

interface AssignAssetModalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    reloadInfo?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AssignAssetModal = ({
    open,
    handleCancel,
    reloadTable,
    reloadInfo,
}: AssignAssetModalProps) => {
    // const isPurchasedPayroll = useServiceAccess(accessKeys.payroll);
    const isPurchasedPayroll = false;
    const {
        data: employeeData,
        payrollEmployees,
        generateEmployeesDropdown,
    } = useGetEmployee(isPurchasedPayroll);
    const { assetsData, generateAssetDropdown } = useGetAssets();
    const { getUsageData } = useAssetUsageDetails();
    const { handleUsageHistoryCreation, submitLoading } = useUsageHistoryCreate(handleCancel);
    const [usageData, setUsageData] = useState<LatestAssetUsageResponse | null>(null);
    const [showPayrollEmployees, setShowPayrollEmployees] = useState(false);

    const handleCheckboxChange = (e: CheckboxChangeEvent) => {
        setShowPayrollEmployees(e.target.checked);
    };
    const handleGetUsageData = async (assetId: string) => {
        const data = await getUsageData(assetId);
        setUsageData(data);
    };

    const handleFormSubmit = async (values: any) => {
        const employeeDetails = payrollEmployees.find(item => item.id === values.newEmployeeId);
        await handleUsageHistoryCreation(
            { ...values, employeeDetails },
            values.assetId,
            usageData?.id
        );
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
        if (reloadInfo) reloadInfo(p => !p);
    };

    // Define the validation schema with conditional validation
    const validationSchema = Yup.object().shape({
        assetId: Yup.string().required('Please select the asset'),
        newEmployeeId: Yup.string().required('Please select an employee'),
        newAssignDate: Yup.string().required('Please select the assign date'),
        existReturnDate: Yup.date().when('assetId', {
            is: (value: string) => !!usageData?.cloud_employee?.id,
            then: schema => schema.required('Please select return date'),
            otherwise: schema => schema,
        }),
        existReturnStatus: Yup.string().when('assetId', {
            is: (value: string) => !!usageData?.cloud_employee?.id,
            then: schema => schema.required('Please select return status'),
            otherwise: schema => schema,
        }),
        existRemarks: Yup.string().when('assetId', {
            is: (value: string) => !!usageData?.cloud_employee?.id,
            then: schema => schema.max(50, 'Remarks cannot be longer than 50 characters'),
            otherwise: schema => schema,
        }),
    });

    // Determine initial values based on usageData
    const initialValues = {
        existReturnDate: '',
        existReturnStatus: '',
        existRemarks: '',
        assetId: '',
        newEmployeeId: '',
        newAssignDate: '',
    };

    return (
        <CustomModalWithForm
            modalTitle="Assign Asset"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={initialValues}
            validationSchema={validationSchema}
            reinitialise
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInputWithSearch
                        name="assetId"
                        options={generateAssetDropdown(assetsData) || []}
                        placeholder="Select Asset"
                        label="Asset"
                        isRequired
                        handleChange={async e => {
                            await handleGetUsageData(e);
                            setFieldValue('assetId', e);
                        }}
                    />
                    {usageData && usageData.cloud_employee?.id && (
                        <>
                            <Flex className="mb-3">
                                <Typography.Text className="text-[#008242]">
                                    {`This asset is now used by ${usageData.cloud_employee?.employeeName} from ${usageData.assignDate.split('T')[0]}`}
                                </Typography.Text>
                            </Flex>

                            <DatePickerInput
                                name="existReturnDate"
                                label="Returned Date"
                                placeholder="Select return date"
                                classes="w-full"
                                needConfirm={false}
                                isRequired={!!usageData?.cloud_employee?.id}
                                minDate={dayjs(usageData.assignDate)}
                            />
                            <SelectInput
                                name="existReturnStatus"
                                label="Returned Status"
                                placeholder="Select return status"
                                isRequired
                                options={usageHistoryReturnStatus}
                            />
                            <TextInput
                                name="existRemarks"
                                type="text"
                                placeholder="Enter Remarks"
                                label="Remarks"
                                allowAlphabetsAndSpaceOnly
                                maxLength={50}
                            />
                        </>
                    )}

                    <>
                        <Flex vertical>
                            {isPurchasedPayroll && (
                                <CheckboxInput
                                    name="payrollEmployees"
                                    disabled={false}
                                    onChange={handleCheckboxChange}
                                    children="Select Employees from Payroll"
                                />
                            )}

                            {/* Dropdown to show either payroll or normal employee list */}
                            <SelectInputWithSearch
                                name="newEmployeeId"
                                options={
                                    generateEmployeesDropdown(
                                        showPayrollEmployees ? payrollEmployees : employeeData, // Choose list based on checkbox
                                        usageData?.cloud_employee
                                    ) || []
                                }
                                placeholder="Select employee"
                                label="New User"
                                isRequired
                            />
                        </Flex>
                        <DatePickerInput
                            name="newAssignDate"
                            label="New User Assigning Date"
                            placeholder="Select assign date"
                            classes="w-full"
                            needConfirm={false}
                            isRequired
                            minDate={
                                usageData?.assignDate ? dayjs(usageData?.assignDate) : undefined
                            }
                        />
                    </>
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default AssignAssetModal;
