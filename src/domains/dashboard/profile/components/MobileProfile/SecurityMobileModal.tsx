import React from 'react';

import { Button, Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import SecurityInfo from '../SecurityInfo';

interface SecurityMobileModalProps {
    open: boolean;
    handleCancel: () => void;
}

const SecurityMobileModal = ({ open, handleCancel }: SecurityMobileModalProps) => (
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
            <SecurityInfo />
            <Flex justify="end">
                <Button
                    type="primary"
                    danger
                    onClick={handleCancel}
                    className="rounded-sm me-1 w-3/12"
                >
                    Back
                </Button>
            </Flex>
        </Flex>
    </CustomModalWithForm>
);

export default SecurityMobileModal;
