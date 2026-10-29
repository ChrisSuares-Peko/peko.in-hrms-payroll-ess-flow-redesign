import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import useVehicleCreate from '../../hooks/fleetHooks/useCreateVehicleApi';
import { vehicleSchema } from '../../schema';
import { assetTypes, vehicleStatus, vehicleTypes } from '../../utils/enumValues';

interface VehicleModalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedRecordData?: any | null;
    reloadInfo?: React.Dispatch<React.SetStateAction<boolean>>;
}

const VehicleModal = ({
    open,
    handleCancel,
    reloadTable,
    selectedRecordData,
    reloadInfo,
}: VehicleModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleVehicleCreation, submitLoading } = useVehicleCreate(handleCancel);
    const handleFormSubmit = async (values: any) => {
        await handleVehicleCreation({
            ...values,
            dateOfRenewal: values.dateOfRenewal || null,
        }).then(res => {
            if (res) {
                handleCancel();
            }
        });

        // handleCancel(); it leads to close modal without success operation
        if (reloadTable) reloadTable(p => !p);
        if (reloadInfo) reloadInfo(p => !p);
    };

    const excludedStatuses = ['Maintenance', 'Retired', 'Unavailable'];

    return (
        <CustomModalWithForm
            modalTitle="Add Vehicle"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                vehicleName: '',
                vehicleType: '',
                vehicleNumber: '',
                purchasedDate: '',
                amount: '',
                status: '',
            }}
            reinitialise
            validationSchema={vehicleSchema}
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="vehicleName"
                        type="text"
                        placeholder="Enter vehicle name"
                        label="Vehicle Name"
                        isRequired
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    />
                    <CustomSelectSearch
                        name="vehicleType"
                        placeholder="Select vehicle type"
                        label="Vehicle Type"
                        isRequired
                        options={vehicleTypes}
                    />
                    {!selectedRecordData ? (
                        <SelectInputWithSearch
                            name="cloudEmployeeId"
                            options={generateEmployeesDropdown(data) || []}
                            placeholder="Select employee"
                            label="Employee Name"
                            isDisabled={values?.status && excludedStatuses.includes(values?.status)}
                            // handleChange={eid => {
                            //     const employeeData = generateEmployeesDropdown(data).find(
                            //         emp => emp.value === eid
                            //     );

                            // }}
                        />
                    ) : (
                        ''
                    )}
                    <TextInput
                        name="vehicleNumber"
                        type="text"
                        placeholder="Enter vehicle number"
                        label="Vehicle Number"
                        isRequired
                        allowAlphabetsAndNumbersOnly
                        maxLength={50}
                    />
                    <DatePickerInput
                        name="purchasedDate"
                        label="Purchased Date"
                        placeholder="Select purchased date"
                        classes="w-full"
                        needConfirm={false}
                        isRequired
                        handleChange={() => {
                            setFieldValue('dateOfRenewal', '');
                            setFieldValue('status', '');
                        }}
                    />
                    <SelectInput
                        name="assetType"
                        label="Asset Type"
                        placeholder="Select asset type"
                        options={assetTypes}
                    />
                    <DatePickerInput
                        name="dateOfRenewal"
                        label="Registration Renewal Date"
                        placeholder="Select registration renewal date"
                        classes="w-full"
                        isDisabled={!values.purchasedDate}
                        needConfirm={false}
                        minDate={dayjs(values.purchasedDate)}
                    />
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        isRequired
                        options={vehicleStatus(!!values?.cloudEmployeeId, values?.purchasedDate)}
                    />
                    <TextInput
                        name="amount"
                        type="text"
                        label="Amount"
                        placeholder="Enter amount"
                        isRequired
                        allowDecimalsOnly
                        maxLength={10}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default VehicleModal;
