import React from 'react';

import { Form } from 'antd';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import useAssetCreate from '../../hooks/assetHooks/useCreateAssetApi';
import { useGetEmployee } from '../../hooks/employeeHooks/useGetEmployeeApi';
import { assetSchema } from '../../schema';
import { assetCategories, assetStatus, assetTypes, assetWarranties } from '../../utils/enumValues';

interface AssetModalProps {
    open: boolean;
    handleCancel: () => void;
    reloadTable?: React.Dispatch<React.SetStateAction<boolean>>;
    selectedRecordData?: any | null;
    reloadInfo?: React.Dispatch<React.SetStateAction<boolean>>;
}

const AssetModal = ({
    open,
    handleCancel,
    reloadTable,
    selectedRecordData,
    reloadInfo,
}: AssetModalProps) => {
    const { data, generateEmployeesDropdown } = useGetEmployee();

    const { handleAssetCreation, submitLoading } = useAssetCreate(handleCancel);
    const handleFormSubmit = async (values: any) => {
        await handleAssetCreation({ ...values, purchasedDate: values.purchasedDate || null }).then(
            res => {
                if (res) {
                    handleCancel();
                }
            }
        );

        if (reloadTable) reloadTable(p => !p);
        if (reloadInfo) reloadInfo(p => !p);
    };

    const excludedStatuses = ['Disposed', 'Damaged', 'Unavailable'];

    return (
        <CustomModalWithForm
            modalTitle={selectedRecordData ? 'Edit Asset' : 'Add Asset'}
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                assetName: selectedRecordData?.assetName ?? '',
                assetCategory: selectedRecordData?.assetCategory ?? '',
                usedBy: selectedRecordData?.usedBy,
                serialNumber: selectedRecordData?.serialNumber ?? '',
                purchasedDate: selectedRecordData?.purchasedDate,
                assetType: selectedRecordData?.assetType,
                warranty: selectedRecordData?.warranty,
                amount: selectedRecordData?.amount,
                status: selectedRecordData?.status ?? '',
            }}
            validationSchema={assetSchema}
            reinitialise
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical">
                    <TextInput
                        name="assetName"
                        type="text"
                        placeholder="Enter asset name"
                        label="Asset Name"
                        isRequired
                        allowAlphabetsSpaceAndNumbersOnly
                        maxLength={50}
                    />
                    <CustomSelectSearch
                        name="assetCategory"
                        placeholder="Select asset category"
                        label="Asset Category"
                        isRequired
                        options={assetCategories}
                    />
                    {!selectedRecordData ? (
                        <SelectInputWithSearch
                            name="cloudEmployeeId"
                            options={generateEmployeesDropdown(data) || []}
                            placeholder="Select employee"
                            label="Employee name"
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
                        name="serialNumber"
                        type="text"
                        placeholder="Enter serial number"
                        label="Serial Number"
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
                        handleChange={() => {
                            setFieldValue('status', '');
                        }}
                    />
                    <SelectInput
                        name="assetType"
                        label="Asset Type"
                        placeholder="Select asset type"
                        options={assetTypes}
                    />
                    <SelectInput
                        name="warranty"
                        label="Warranty (in years)"
                        placeholder="Select warranty"
                        options={assetWarranties}
                    />
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        isRequired
                        options={assetStatus(!!values?.cloudEmployeeId, values?.purchasedDate)}
                    />
                    <TextInput
                        name="amount"
                        type="text"
                        label="Amount"
                        placeholder="Enter amount"
                        allowDecimalsOnly
                        maxLength={6}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};
export default AssetModal;
