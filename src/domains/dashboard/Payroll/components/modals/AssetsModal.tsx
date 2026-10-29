import React from 'react';

import { Form } from 'antd';
import dayjs from 'dayjs';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import useAssetCreate from '../../hooks/docAndAssetsHooks/useAddAssetApi';
import useAssetUpdate from '../../hooks/docAndAssetsHooks/useUpdateAssetApi';
import { assetSchema } from '../../schema/docAndAssets';
import { assetTable } from '../../types/docAndAssetsTypes';

interface assetsModalProps {
    open: boolean;
    handleCancel: () => void;
    setRefresh: (value: any) => void;
    selectedRowData: assetTable | null;
    EmpName?: string;
    employeeIdFromProfile?: string;
    hideEmployeeDropdown?: boolean;
    employeeData?: any;
}

const AssetsModal = ({
    open,
    handleCancel,
    setRefresh,
    selectedRowData,
    EmpName,
    employeeIdFromProfile,
    hideEmployeeDropdown,
    employeeData,
}: assetsModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();
    const { handleAssetCreation ,isAdding} = useAssetCreate(handleCancel);
    const { handleAssetUpdate, isLoading } = useAssetUpdate(handleCancel);

    const handleFormSubmit = async (values: any) => {
        if (selectedRowData) {
            await handleAssetUpdate(selectedRowData?.id, employeeIdFromProfile, values);
        } else {
            if (hideEmployeeDropdown && employeeData.id) {
                values.employee = employeeData.id;
            }
            await handleAssetCreation(values);
        }
        handleCancel();

        setRefresh((p: any) => !p);
    };
    const statusType = [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Available', value: 'AVAILABLE' },
        { label: 'In use', value: 'IN USE' },
    ];
    return (
        <CustomModalWithForm
            modalTitle={selectedRowData ? 'Edit Asset' : 'Add Asset'}
            open={open}
            isLoading={selectedRowData ? isLoading : isAdding}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                assetType: selectedRowData?.assetType || '',
                assetName: selectedRowData?.assetName || '',
                assetId: selectedRowData?.assetId || '',
                purchasedDate: selectedRowData?.purchasedDate || '',
                employee: hideEmployeeDropdown ? employeeData.id : selectedRowData?.employee || '',
                status: selectedRowData?.status || '',
                batchNo: selectedRowData?.batchNo || '',
            }}
            validationSchema={assetSchema}
            reinitialise
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="assetType"
                        type="text"
                        placeholder="Enter asset type"
                        label="Asset Type"
                        isRequired
                        maxLength={30}
                    />
                    <TextInput
                        name="assetName"
                        type="text"
                        placeholder="Enter asset name"
                        label="Asset Name"
                        isRequired
                        maxLength={50}
                        allowAlphabetsAndSpaceOnly
                    />
                    <TextInput
                        name="assetId"
                        type="text"
                        placeholder="Enter asset ID"
                        label="Asset ID"
                        isRequired
                        maxLength={20}
                    />

                    <DatePickerInput
                        name="purchasedDate"
                        label="Purchased Date"
                        placeholder="Select purchased date"
                        classes="w-full"
                        needConfirm={false}
                        maxDate={dayjs()}
                        isRequired
                    />

                    {!hideEmployeeDropdown && (
                        <SelectInputWithSearch
                            name="employee"
                            options={generateEmployeesDropdown(data) || []}
                            placeholder="Employee"
                            label="Employee"
                            isRequired
                        />
                    )}
                    <SelectInput
                        name="status"
                        options={statusType || []}
                        placeholder="Select Status"
                        label="Status"
                        isRequired
                    />
                    <TextInput
                        name="batchNo"
                        type="text"
                        placeholder='Enter Batch No.'
                        label="Batch No"
                        isRequired
                        maxLength={6}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default AssetsModal;
