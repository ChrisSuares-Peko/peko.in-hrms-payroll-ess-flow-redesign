import React, { useMemo } from 'react';

import { Button, Drawer, Flex } from 'antd';
import { Formik } from 'formik';

import AddCustomerForm from '../../forms/customer/AddCustomerForm';
import useCustomerActions from '../../hooks/customer/useCustomerActions';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { addCustomerSchema } from '../../schema/customer/addCustomerSchema';
import { CustomerRow } from '../../types/customer';
import LeftHeader from '../shared/LeftHeader';

interface AddCustomerDrawerProps {
    open: boolean;
    onClose: () => void;
    editingCustomer?: CustomerRow;
    onSuccess?: () => void;
}

const AddCustomerDrawer: React.FC<AddCustomerDrawerProps> = ({
    open,
    onClose,
    editingCustomer,
    onSuccess,
}) => {
    const { addCustomer, editCustomer, isLoading } = useCustomerActions(onSuccess);
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: addCustomerSchema,
    });
    const formKey = editingCustomer?.id ?? 'new-customer';
    const initialValues = useMemo(
        () => ({
            name: editingCustomer?.name ?? '',
            personOfContact: editingCustomer?.personOfContact ?? '',
            gstin: editingCustomer?.gstin ?? '',
            phoneNumber: editingCustomer?.phoneNumber ?? '',
            email: editingCustomer?.email ?? '',
            upiId: editingCustomer?.upiId ?? '',
            notes: editingCustomer?.notes ?? '',
            primaryAddress: editingCustomer?.primaryAddress ?? '',
            primaryCity: editingCustomer?.primaryCity ?? '',
            primaryState: editingCustomer?.primaryState ?? '',
            primaryPincode: editingCustomer?.primaryPincode ?? '',
            primaryCountry: editingCustomer?.primaryCountry ?? 'India',
            shippingSameAsPrimary: editingCustomer?.shippingSameAsPrimary ?? false,
            shippingAddress: editingCustomer?.shippingAddress ?? '',
            shippingCity: editingCustomer?.shippingCity ?? '',
            shippingState: editingCustomer?.shippingState ?? '',
            shippingPincode: editingCustomer?.shippingPincode ?? '',
            bankAccounts: editingCustomer?.bankDetails ?? [],
        }),
        [editingCustomer]
    );

    return (
        <Formik
            key={formKey}
            initialValues={initialValues}
            validationSchema={addCustomerSchema}
            onSubmit={async (values, { resetForm }) => {
                let isSuccess = false;

                if (editingCustomer) {
                    isSuccess = await editCustomer(editingCustomer.id, values);
                } else {
                    isSuccess = await addCustomer(values);
                }

                if (isSuccess) {
                    resetForm();
                    onClose();
                }
            }}
        >
            {({ handleSubmit, resetForm, setFieldTouched, values }) => {
                const handleClose = () => {
                    resetForm();
                    onClose();
                };

                const handleSave = () => {
                    handleFormSubmitWithAutoFocus(handleSubmit, setFieldTouched, values);
                };

                const drawerTitle = (
                    <LeftHeader
                        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                        description={
                            editingCustomer
                                ? 'Update the customer details below'
                                : 'Enter customer details to create a new customer profile'
                        }
                    />
                );

                const drawerFooter = (
                    <Flex justify="flex-end" gap={10}>
                        <Button onClick={handleClose} className="px-5">
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            danger
                            onClick={handleSave}
                            loading={isLoading}
                            className="px-5"
                        >
                            {editingCustomer ? 'Save Changes' : 'Save Customer'}
                        </Button>
                    </Flex>
                );

                return (
                    <Drawer
                        open={open}
                        onClose={handleClose}
                        title={drawerTitle}
                        closable={false}
                        width={480}
                        destroyOnHidden
                        footer={drawerFooter}
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

export default React.memo(AddCustomerDrawer);
