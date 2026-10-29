import React from 'react';

import { Button, Flex } from 'antd';

import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import ReferralCode from '../ReferralCode';

interface ReferralMobileModalProps {
    open: boolean;
    handleCancel: () => void;
}

const ReferralMobileModal = ({ open, handleCancel }: ReferralMobileModalProps) => (
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
            <ReferralCode />
            <Flex justify="end">
                <Button type="primary" danger onClick={handleCancel} className=" me-1 w-3/12">
                    Back
                </Button>
            </Flex>
        </Flex>
    </CustomModalWithForm>
);

export default ReferralMobileModal;
