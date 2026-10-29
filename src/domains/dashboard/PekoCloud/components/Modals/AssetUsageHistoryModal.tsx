import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useUsageHistoryCreate from '../../hooks/assetHooks/useCreateUsageApi';
import { useUpdateUsageHistory } from '../../hooks/assetHooks/useUpdateUsageApi';
import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import { assetUsageSchema } from '../../schema';
import { usageHistoryReturnStatus } from '../../utils/enumValues';

interface AssetModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    assetId: number;
}

const AssetUsageHistoryModal = ({
    open,
    handleCancel,
    reloadTable,
    selectedRecordData,
    assetId,
}: AssetModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleUsageHistoryCreation, submitLoading: creationLoading } =
        useUsageHistoryCreate(handleCancel);
    const { updateAssetUsageData, submitLoading: updationLoading } =
        useUpdateUsageHistory(handleCancel);
    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateAssetUsageData(
                { ...values },
                selectedRecordData?.id,
                assetId,
                selectedRecordData?.empId
            );
        } else {
            await handleUsageHistoryCreation(values, assetId);
        }
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Asset' : 'Assign Asset'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                cloudEmployeeId: selectedRecordData?.empId ?? '',
                assignDate: selectedRecordData?.assignDate ?? '',
                returnDate: selectedRecordData?.returnDate ?? '',
                returnStatus: selectedRecordData?.returnStatus ?? '',
                remarks: selectedRecordData?.remarks ?? '',
            }}
            validationSchema={assetUsageSchema}
            reinitialise
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInputWithSearch
                        name="cloudEmployeeId"
                        options={generateEmployeesDropdown(data) || []}
                        placeholder="Select employee"
                        label="Employee name"
                        isRequired
                        // handleChange={eid => {
                        //     const employeeData = generateEmployeesDropdown(data).find(
                        //         emp => emp.value === eid
                        //     );

                        // }}
                    />

                    <DatePickerInput
                        name="assignDate"
                        label="Assign Date"
                        placeholder="Select assign date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                    />
                    <DatePickerInput
                        name="returnDate"
                        label="Return Date"
                        placeholder="Select return date"
                        classes="w-full"
                        needConfirm={false}
                        minDate={dayjs(values?.assignDate)}
                    />
                    <SelectInput
                        name="returnStatus"
                        label="Return Status"
                        placeholder="Select return status"
                        options={usageHistoryReturnStatus}
                    />
                    <TextInput
                        name="remarks"
                        type="text"
                        placeholder="Enter Remarks"
                        label="Remarks"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default AssetUsageHistoryModal;
