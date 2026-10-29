import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateVehicle } from '../../hooks/fleetHooks/useUpdateVehicleApi';
import { vehicleInfoSchema } from '../../schema';
import { amountRecurrings, assetTypes, vehicleStatus, vehicleTypes } from '../../utils/enumValues';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    vehicleData: any;
    initialValues: {
        purchasedDate: string;
        cloudEmployeeId: string;
        vehicleName: string;
        vehicleType: string;
        vehicleNumber: string;
        dateOfRenewal: string;
        assetType: string; // OWNED | RENT | LEASED
        amount: string;
        amountRecurring: string;
        vendor: string;
        batchNumber: string;
        modelYear: string;
        chassisNumber: string;
        engineTransmission: string;
        odoMeter: string;
    } | null;
};

const VehicleInformationModal = ({
    handleCancel,
    open,
    initialValues,
    setRefState,
    vehicleData,
}: Props) => {
    const { updateVehicleData, submitLoading } = useUpdateVehicle();
    return (
        <CustomModalWithForm
            modalTitle="Vehicle Information"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                await updateVehicleData(
                    { ...values, dateOfRenewal: values.dateOfRenewal || null },
                    vehicleData?.data?.id,
                    vehicleData?.data?.cloudEmployeeId
                );
                setRefState(new Date().valueOf());
                handleCancel();
            }}
            initialValues={{
                purchasedDate: vehicleData?.data?.purchasedDate ?? '',
                vehicleName: vehicleData?.data?.vehicleName ?? '',
                vehicleType: vehicleData?.data?.vehicleType ?? '',
                assetType: vehicleData?.data?.assetType ?? '',
                vehicleNumber: vehicleData?.data?.vehicleNumber ?? '',
                amount: vehicleData?.data?.amount ?? '',
                amountRecurring: vehicleData?.data?.amountRecurring ?? '',
                vendor: vehicleData?.data?.vendor ?? '',
                modelYear: vehicleData?.data?.modelYear ?? '',
                chassisNumber: vehicleData?.data?.chassisNumber ?? '',
                engineTransmission: vehicleData?.data?.engineTransmission ?? '',
                odoMeter: vehicleData?.data?.odoMeter ?? '',
                dateOfRenewal: vehicleData?.data?.dateOfRenewal ?? '',
                status: vehicleData?.data?.status ?? '',
            }}
            validationSchema={vehicleInfoSchema}
            reinitialise
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical" className="">
                    <TextInput
                        name="vehicleName"
                        type="text"
                        placeholder="Enter vehicle name"
                        label="Vehicle Name"
                        isRequired
                        isDisabled
                        allowAlphabetsSpaceAndNumbersOnly
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
                    <CustomSelectSearch
                        name="vehicleType"
                        placeholder="Select vehicle type"
                        label="Vehicle Type"
                        isRequired
                        options={vehicleTypes}
                    />
                    <TextInput
                        name="vehicleNumber"
                        type="text"
                        placeholder="Enter vehicle number"
                        label="Vehicle Number"
                        isRequired
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    />
                    <SelectInput
                        name="assetType"
                        label="Asset Type"
                        placeholder="Select asset type"
                        options={assetTypes}
                    />
                    <TextInput
                        name="vendor"
                        type="text"
                        placeholder="Enter vendor name"
                        label="Vendor Name"
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="amount"
                        type="text"
                        placeholder="Enter amount"
                        label="Amount"
                        isRequired
                        allowDecimalsOnly
                        maxLength={50}
                    />
                    <SelectInput
                        name="amountRecurring"
                        label="Amount Recurring"
                        placeholder="Select recurring type"
                        options={amountRecurrings}
                    />
                    <TextInput
                        name="modelYear"
                        type="text"
                        placeholder="Enter model year"
                        label="Model Year"
                        allowNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="chassisNumber"
                        type="text"
                        placeholder="Enter chassis number"
                        label="Chassis Number"
                        allowAlphabetsAndNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="engineTransmission"
                        type="text"
                        label="Engine Transmission"
                        placeholder="Enter Engine Transmission"
                        allowAlphabetsAndNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="odoMeter"
                        type="text"
                        placeholder="Enter odo meter"
                        label="ODO Meter"
                        allowNumbersOnly
                        maxLength={50}
                    />
                    <DatePickerInput
                        name="dateOfRenewal"
                        label="Registration Renewal Date"
                        placeholder="Select reg renewal date"
                        classes="w-full"
                        isDisabled={!values?.purchasedDate}
                        needConfirm={false}
                        minDate={dayjs(values?.purchasedDate)}
                    />
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        isRequired
                        options={vehicleStatus(!!values?.cloudEmployeeId, values?.purchasedDate)}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default VehicleInformationModal;
