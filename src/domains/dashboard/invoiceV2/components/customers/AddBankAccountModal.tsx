import React from 'react';

import { Button, Flex, Modal } from 'antd';
import { Formik } from 'formik';

import AddBankAccountForm from '../../forms/customer/AddBankAccountForm';
import useVerifyCustomerBank from '../../hooks/customer/useVerifyCustomerBank';
import { useFormAutoFocus } from '../../hooks/useFormAutoFocus';
import { addBankAccountSchema } from '../../schema/customer/addBankAccountSchema';
import { BankAccountFormValues } from '../../types/customer';
import LeftHeader from '../shared/LeftHeader';

interface AddBankAccountModalProps {
    open: boolean;
    onClose: () => void;
    onAdd: (values: BankAccountFormValues) => void;
    editingAccount?: BankAccountFormValues;
}

const EMPTY_VALUES: BankAccountFormValues = {
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    swiftCode: '',
};

const AddBankAccountModal: React.FC<AddBankAccountModalProps> = ({
    open,
    onClose,
    onAdd,
    editingAccount,
}) => {
    const { verifyBankAccount, isVerifying } = useVerifyCustomerBank();
    const { handleFormSubmitWithAutoFocus } = useFormAutoFocus({
        schema: addBankAccountSchema,
    });

    return (
        <Formik
            initialValues={editingAccount ?? EMPTY_VALUES}
            validationSchema={addBankAccountSchema}
            onSubmit={async (values, { resetForm }) => {
                const verifiedValues = await verifyBankAccount(values);
                if (!verifiedValues) return;

                onAdd(verifiedValues);
                resetForm();
                onClose();
            }}
            enableReinitialize
        >
            {({ handleSubmit, resetForm, setFieldTouched, values }) => {
                const handleClose = () => {
                    resetForm();
                    onClose();
                };

                const modalFooter = (
                    <Flex justify="flex-end" gap={10}>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button
                            type="primary"
                            danger
                            loading={isVerifying}
                            onClick={() =>
                                handleFormSubmitWithAutoFocus(
                                    handleSubmit,
                                    setFieldTouched,
                                    values
                                )
                            }
                        >
                            Verify & Add
                        </Button>
                    </Flex>
                );

                return (
                    <Modal
                        open={open}
                        onCancel={handleClose}
                        closable={false}
                        width={480}
                        destroyOnHidden
                        footer={modalFooter}
                        styles={{
                            content: { borderRadius: 20 },
                        }}
                    >
                        <Flex vertical gap={12}>
                            <LeftHeader
                                title={editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                                description={editingAccount ? 'Update your bank account details' : 'Enter your bank account details'}
                            />
                            <AddBankAccountForm />
                        </Flex>
                    </Modal>
                );
            }}
        </Formik>
    );
};

export default React.memo(AddBankAccountModal);
