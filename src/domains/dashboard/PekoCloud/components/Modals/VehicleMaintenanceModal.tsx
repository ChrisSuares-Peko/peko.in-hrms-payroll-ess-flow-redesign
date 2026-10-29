import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';
import { useLocation } from 'react-router-dom';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useMaintenanceCreate from '../../hooks/fleetHooks/useCreateMaintenanceApi';
import { useUpdateMaintenanceHistory } from '../../hooks/fleetHooks/useUpdateMaintenanceApi';
import { vehicleMaintenanceSchema } from '../../schema';

interface VehicleMaintenanceModalProps {
    open: boolean;
    handleCancel: () => void;
    selectedRecordData?: any | null;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VehicleMaintenanceModal = ({
    open,
    handleCancel,
    reloadTable,
    selectedRecordData,
}: VehicleMaintenanceModalProps) => {
    const location = useLocation();
    const { fleetId } = location.state;

    const { handleMaintenanceHistoryCreation, submitLoading: creationLoading } =
        useMaintenanceCreate(handleCancel);
    const { updateVehicleMaintenanceData, submitLoading: updationLoading } =
        useUpdateMaintenanceHistory(handleCancel);
    const handleFormSubmit = async (values: any) => {
        if (selectedRecordData) {
            await updateVehicleMaintenanceData({ ...values }, selectedRecordData?.id);
        } else {
            await handleMaintenanceHistoryCreation(values, fleetId);
        }
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle="Maintenance Details"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                repairCategory: selectedRecordData?.repairCategory ?? '',
                serviceType: selectedRecordData?.serviceType ?? '',
                date: selectedRecordData?.dateAndTime ?? '',
                receivedDate: selectedRecordData?.dateReceived ?? '',
                amount: selectedRecordData?.amount ?? '',
            }}
            reinitialise
            validationSchema={vehicleMaintenanceSchema}
            isLoading={creationLoading || updationLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="repairCategory"
                        type="text"
                        label="Repair Category"
                        placeholder="Enter repair category"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={20}
                    />
                    <TextInput
                        name="serviceType"
                        type="text"
                        label="Service Type"
                        placeholder="Enter service type"
                        isRequired
                        allowAlphabetsAndSpaceOnly
                        maxLength={20}
                    />
                    <DatePickerInput
                        name="date"
                        label="Assign Date"
                        placeholder="Select assign date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                    />
                    <DatePickerInput
                        name="receivedDate"
                        label="Received Date"
                        placeholder="Select received date"
                        classes="w-full"
                        needConfirm={false}
                        minDate={dayjs(values?.issueDate)}
                    />

                    <TextInput
                        name="amount"
                        type="text"
                        label="Amount"
                        placeholder="Enter amount"
                        isRequired
                        allowDecimalsOnly
                        maxLength={20}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default VehicleMaintenanceModal;
