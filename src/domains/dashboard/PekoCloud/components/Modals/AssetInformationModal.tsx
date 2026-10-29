import React from 'react';

import { Form } from 'antd';

import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useUpdateAsset } from '../../hooks/assetHooks/useUpdateAssetApi';
import { assetInfoSchema } from '../../schema';
import {
    amountRecurrings,
    assetCategories,
    assetStatus,
    assetTypes,
    assetWarranties,
} from '../../utils/enumValues';

type Props = {
    open: boolean;
    handleCancel: () => void;
    setRefState: (num: number) => void;
    assetData: any;
    initialValues: {
        id: string;
        assetName: string;
        assetCategory: string;
        purchasedDate: string;
        assetType: string;
        serialNumber: string;
        vendor: string;
        amount: string;
        amountRecurring: string;
        warranty: string;
        batchNumber: string;
    } | null;
};

const AssetInformationModal = ({
    handleCancel,
    open,
    initialValues,
    setRefState,
    assetData,
}: Props) => {
    const { updateAssetData, submitLoading } = useUpdateAsset(handleCancel);

    return (
        <CustomModalWithForm
            modalTitle="Asset Information"
            open={open}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                await updateAssetData(
                    { ...values, purchasedDate: values.purchasedDate || null },
                    assetData?.data?.id,
                    assetData?.data?.cloudEmployeeId
                );
                setRefState(new Date().valueOf());
                handleCancel();
            }}
            initialValues={{
                assetName: assetData?.data?.assetName ?? '',
                assetCategory: assetData?.data?.assetCategory ?? '',
                purchasedDate: assetData?.data?.purchasedDate,
                assetType: assetData?.data?.assetType ?? '',
                serialNumber: assetData?.data?.serialNumber ?? '',
                vendor: assetData?.data?.vendor ?? '',
                amount: assetData?.data?.amount ?? '',
                amountRecurring: assetData?.data?.amountRecurring ?? '',
                warranty: assetData?.data?.warranty ?? '',
                batchNumber: assetData?.data?.batchNumber ?? '',
                status: assetData?.data?.status ?? '',
            }}
            validationSchema={assetInfoSchema}
            reinitialise
            isLoading={submitLoading}
        >
            {({ values, setFieldValue }) => (
                <Form layout="vertical" className="">
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
                    <TextInput
                        name="serialNumber"
                        type="text"
                        placeholder="Enter serial number"
                        label="Serial Number"
                        isRequired
                        allowAlphabetsAndNumbersOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="vendor"
                        type="text"
                        placeholder="Enter vendor"
                        label="Vendor"
                        allowAlphabetsAndSpaceOnly
                        maxLength={50}
                    />
                    <TextInput
                        name="amount"
                        type="text"
                        label="Amount"
                        placeholder="Enter amount"
                        allowDecimalsOnly
                        maxLength={6}
                    />
                    <SelectInput
                        name="amountRecurring"
                        label="Amount Recurring"
                        placeholder="Select recurring"
                        options={amountRecurrings}
                    />
                    <SelectInput
                        name="warranty"
                        label="Warranty (in years)"
                        placeholder="Select warranty"
                        options={assetWarranties}
                    />
                    <TextInput
                        name="batchNumber"
                        type="text"
                        placeholder="Enter batch number"
                        label="Batch Number"
                        allowAlphabetsAndNumbersOnly
                        maxLength={50}
                    />
                    <SelectInput
                        name="status"
                        label="Status"
                        placeholder="Select status"
                        isRequired
                        options={assetStatus(!!values?.cloudEmployeeId, values?.purchasedDate)}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default AssetInformationModal;
