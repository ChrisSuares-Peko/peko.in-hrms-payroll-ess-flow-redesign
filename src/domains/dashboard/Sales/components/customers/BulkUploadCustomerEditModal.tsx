import React, { useMemo } from 'react';

import { Button, Drawer, Flex } from 'antd';
import { Formik } from 'formik';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';

import AddCustomerForm from '../../forms/customer/AddCustomerForm';
import { useBulkCustomerValidateApi } from '../../hooks/customer/useBulkCustomerValidateApi';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { addCustomerSchema } from '../../schema/customer/addCustomerSchema';
import { updateBulkCustomerRow } from '../../slices/bulkCustomerSlice';
import { BulkCustomerRow } from '../../types/customer';
import LeftHeader from '../shared/LeftHeader';

type BulkUploadCustomerEditModalProps = {
    open: boolean;
    handleCancel: () => void;
    customerData: BulkCustomerRow | undefined;
    customerIndex: number | undefined;
};

// Reuses the exact same AddCustomerForm/addCustomerSchema as the real Add Customer drawer
// (see AddCustomerDrawer) so a reviewed bulk row is edited with identical design — the only
// difference is onSubmit updates the pending row in Redux + re-runs bulkValidate instead of
// calling the create/update API.
const BulkUploadCustomerEditModal: React.FC<BulkUploadCustomerEditModalProps> = ({
    open,
    handleCancel,
    customerData,
    customerIndex,
}) => {
    const dispatch = useAppDispatch();
    const { bulkValidate, isLoading } = useBulkCustomerValidateApi();
    const allCustomers = useAppSelector(state => state.reducer.salesBulkCustomer);
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({ schema: addCustomerSchema });

    const initialValues = useMemo(
        () => ({
            name: customerData?.name ?? '',
            personOfContact: customerData?.personOfContact ?? '',
            gstin: customerData?.gstin ?? '',
            phoneNumber: customerData?.phoneNumber ?? '',
            email: customerData?.email ?? '',
            upiId: customerData?.upiId ?? '',
            notes: customerData?.notes ?? '',
            primaryAddress: customerData?.primaryAddress ?? '',
            primaryCity: customerData?.primaryCity ?? '',
            primaryState: customerData?.primaryState ?? '',
            primaryPincode: customerData?.primaryPincode ?? '',
            primaryCountry: customerData?.primaryCountry ?? 'India',
            shippingSameAsPrimary: false,
            shippingAddress: customerData?.shippingAddress ?? '',
            shippingCity: customerData?.shippingCity ?? '',
            shippingState: customerData?.shippingState ?? '',
            shippingPincode: customerData?.shippingPincode ?? '',
            bankAccounts: customerData?.bankDetails ?? [],
        }),
        [customerData]
    );

    return (
        <Formik
            key={customerIndex}
            initialValues={initialValues}
            validationSchema={addCustomerSchema}
            enableReinitialize
            onSubmit={async values => {
                if (customerIndex === undefined) return;

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { shippingSameAsPrimary, bankAccounts, ...rest } = values;
                const updatedRow: BulkCustomerRow = {
                    ...rest,
                    bankDetails: bankAccounts,
                    validated: true,
                    errors: [],
                };
                dispatch(updateBulkCustomerRow({ index: customerIndex, data: updatedRow }));

                const allCustomersData = [...allCustomers];
                allCustomersData.splice(customerIndex, 1, updatedRow);

                await bulkValidate(allCustomersData);
                handleCancel();
            }}
        >
            {({ handleSubmit, setFieldTouched, values }) => {
                const handleSave = () => {
                    handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values);
                };

                return (
                    <Drawer
                        open={open}
                        onClose={handleCancel}
                        title={
                            <LeftHeader
                                title="Edit Customer"
                                description="Update the reviewed customer details below"
                            />
                        }
                        closable={false}
                        width={480}
                        destroyOnHidden
                        footer={
                            <Flex justify="flex-end" gap={10}>
                                <Button onClick={handleCancel} className="px-5">
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    onClick={handleSave}
                                    loading={isLoading}
                                    className="px-5"
                                >
                                    Save
                                </Button>
                            </Flex>
                        }
                        styles={{
                            header: { borderBottom: '1px solid #F1F1F1', padding: '10px 16px' },
                            body: { padding: '10px 16px 12px' },
                        }}
                    >
                        <AddCustomerForm />
                    </Drawer>
                );
            }}
        </Formik>
    );
};

export default BulkUploadCustomerEditModal;
