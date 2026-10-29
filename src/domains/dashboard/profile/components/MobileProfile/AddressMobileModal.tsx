import React from 'react';

import { Button, Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import AddressList from '../AddressList';

interface AddressMobileModalModalProps {
    open: boolean;
    handleCancel: () => void;
}

const AddressMobileModalModal = ({ open, handleCancel }: AddressMobileModalModalProps) => (
    <CustomModalWithForm
        hideFooter
        modalTitle=""
        open={open}
        isLoading={false}
        handleCancel={handleCancel}
        handleFormSubmit={handleCancel}
        initialValues={{}}
    >
        <Flex vertical gap={50} className="mt-6 w-full">
            <AddressList />
            <Flex justify="end">
                <Button type="primary" danger onClick={handleCancel} className="me-2 w-3/12">
                    Back
                </Button>
            </Flex>
        </Flex>
    </CustomModalWithForm>
);

export default AddressMobileModalModal;
