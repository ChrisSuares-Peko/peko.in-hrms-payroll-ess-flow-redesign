import React, { useEffect, useRef, useState } from 'react';

import { Form, Typography, Flex } from 'antd';
import dayjs from 'dayjs';
import { FormikProps } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import useVehicleUsageHistoryCreate from '../../hooks/fleetHooks/useCreateVehicleUsageApi';
import { useGetVehicle } from '../../hooks/fleetHooks/useGetVehiclesApi';
import { useVehicleUsageDetails } from '../../hooks/fleetHooks/useGetVehicleUserDetailsApi';
import { LatestVehicleDetailsResponse } from '../../types/fleetManagement/index';
import { usageHistoryReturnStatus } from '../../utils/enumValues';

interface AssignVehicleModalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    fleetId?: number;
}

const AssignVehicleModal = ({
    open,
    handleCancel,
    reloadTable,
    fleetId,
}: AssignVehicleModalProps) => {
    const { data: employeeData, generateEmployeesDropdown } = useGetEmployee();
    const { vehicles, generateVehicleDropdown } = useGetVehicle();
    const { getUsageData } = useVehicleUsageDetails();
    const { handleVehicleUsageHistoryCreation, submitLoading } =
        useVehicleUsageHistoryCreate(handleCancel);

    const assignForm = useRef<FormikProps<any>>(null);

    const [vehicleUsageData, setVehicleUsageData] = useState<LatestVehicleDetailsResponse | null>(
        null
    );
    const [minAssignDate, setMinAssignDate] = useState(undefined);

    const handleGetVehicleUsageData = async (vehicleId: string) => {
        if (vehicles && vehicles?.length > 0) {
            assignForm.current?.setFieldValue('newAssignDate', '');
            const data = await getUsageData(vehicleId);
            const vehicleDetails = vehicles.find(veh => veh.id === vehicleId);
            setMinAssignDate(vehicleDetails?.purchasedDate);
            setVehicleUsageData(data);
        }
    };

    const handleFormSubmit = async (values: any) => {
        await handleVehicleUsageHistoryCreation(values, values.fleetId, vehicleUsageData?.id);
        handleCancel();
        if (reloadTable) reloadTable(p => !p);
    };

    useEffect(() => {
        if (fleetId) {
            const vehicleDetails = vehicles.find(veh => veh.id === fleetId);
            setMinAssignDate(vehicleDetails?.purchasedDate);
        }
    }, [fleetId, vehicles]);

    const validationSchema = Yup.object().shape({
        fleetId: Yup.string().required('Please select the vehicle'),
        newEmployeeId: Yup.string().required('Please select an employee'),
        newAssignDate: Yup.string().required('Please select the assign date'),
        existReturnDate: Yup.date().when('fleetId', {
            is: (value: string) => !!vehicleUsageData?.cloud_employee?.id,
            then: schema => schema.required('Please select return date'),
            otherwise: schema => schema,
        }),
        existReturnStatus: Yup.string().when('fleetId', {
            is: (value: string) => !!vehicleUsageData?.cloud_employee?.id,
            then: schema => schema.required('Please select return status'),
            otherwise: schema => schema,
        }),
        existRemarks: Yup.string().when('fleetId', {
            is: (value: string) => !!vehicleUsageData?.cloud_employee?.id,
            then: schema => schema.max(50, 'Remarks cannot be longer than 50 characters'),
            otherwise: schema => schema,
        }),
    });
    const initialValues = {
        existReturnDate: '',
        existReturnStatus: '',
        existRemarks: '',
        fleetId: '',
        newEmployeeId: '',
        newAssignDate: '',
    };
    return (
        <CustomModalWithForm
            modalTitle="Assign Vehicle"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={handleFormSubmit}
            initialValues={initialValues}
            validationSchema={validationSchema}
            reinitialise
            isLoading={submitLoading}
            formRefName={assignForm}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <SelectInputWithSearch
                        name="fleetId"
                        options={generateVehicleDropdown(vehicles) || []}
                        placeholder="Select vehicle"
                        label="Vehicle"
                        isRequired
                        handleChange={async e => {
                            await handleGetVehicleUsageData(e);
                        }}
                    />
                    {vehicleUsageData && vehicleUsageData.cloud_employee?.id && (
                        <>
                            <Flex className="mb-3">
                                <Typography.Text className="text-[#008242]">
                                    {`This vehicle is now used by ${vehicleUsageData.cloud_employee?.employeeName} from ${vehicleUsageData.assignDate.split('T')[0]}`}
                                </Typography.Text>
                            </Flex>

                            <DatePickerInput
                                name="existReturnDate"
                                label="Returned Date"
                                placeholder="Select return date"
                                classes="w-full"
                                needConfirm={false}
                                isRequired
                                minDate={dayjs(vehicleUsageData.assignDate)}
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
                        <SelectInputWithSearch
                            name="newEmployeeId"
                            options={
                                generateEmployeesDropdown(
                                    employeeData,
                                    vehicleUsageData?.cloud_employee
                                ) || []
                            }
                            placeholder="Select employee"
                            label="Employee name"
                            isRequired
                        />
                        <DatePickerInput
                            name="newAssignDate"
                            label="Assign Date"
                            placeholder="Select assign date"
                            classes="w-full"
                            needConfirm={false}
                            isRequired
                            minDate={
                                // eslint-disable-next-line no-nested-ternary
                                vehicleUsageData?.assignDate
                                    ? dayjs(vehicleUsageData?.assignDate)
                                    : minAssignDate
                                      ? dayjs(minAssignDate)
                                      : undefined
                            }
                        />
                    </>
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default AssignVehicleModal;
