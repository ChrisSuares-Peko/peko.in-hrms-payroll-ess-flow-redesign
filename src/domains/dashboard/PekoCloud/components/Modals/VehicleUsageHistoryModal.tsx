import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import useVehicleUsageHistoryCreate from '../../hooks/fleetHooks/useCreateVehicleUsageApi';
import { useUpdateVehicleUsageHistory } from '../../hooks/fleetHooks/useUpdateVehicleUsageApi';
import { fleetUsageSchema } from '../../schema';
import { usageHistoryReturnStatus } from '../../utils/enumValues';

interface VehicleUsageHistoryModalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedRecordData: any;
    cloudFleetId: number;
}

const VehicleUsageHistoryModal = ({
    open,
    handleCancel,
    reloadTable,
    selectedRecordData,
    cloudFleetId,
}: VehicleUsageHistoryModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleVehicleUsageHistoryCreation, submitLoading: creationLoading } =
        useVehicleUsageHistoryCreate(handleCancel);
    const { updateVehicleUsageData, submitLoading: updationLoading } =
        useUpdateVehicleUsageHistory(handleCancel);
    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateVehicleUsageData(
                { ...values },
                selectedRecordData?.id,
                cloudFleetId,
                selectedRecordData?.empId
            );
        } else {
            await handleVehicleUsageHistoryCreation(values, cloudFleetId);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle="Assign Vehicle"
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
            validationSchema={fleetUsageSchema}
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
                        minDate={dayjs(values.assignDate)}
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
export default VehicleUsageHistoryModal;
