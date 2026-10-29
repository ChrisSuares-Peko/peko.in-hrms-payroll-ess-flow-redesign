import React from 'react';

import { Button, Flex, Form, Modal } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import useReferralCode from '../hooks/useReferralCode';
import { ReferralCodeSchema } from '../schema/index';

interface ReferralModalProps {
    isOpen: boolean;
    handleCancel: () => void;
}
const ReferralCodeModal = ({ isOpen, handleCancel }: ReferralModalProps) => {
    const { handleSendReferralMail, isLoading } = useReferralCode({ handleCancel });
    return (
        <Formik
            enableReinitialize
            validationSchema={ReferralCodeSchema}
            initialValues={{
                email: '',
            }}
            onSubmit={async values => {
                handleSendReferralMail(values.email);
            }}
        >
            {({ handleSubmit }) => (
                <Modal
                    title="Invite by email"
                    open={isOpen}
                    onCancel={handleCancel}
                    closeIcon={null}
                    centered
                    style={{ padding: 10 }}
                    footer={[
                        <Flex className=" w-full" justify="flex-end" gap={10} key="">
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={isLoading}
                                onClick={() => handleSubmit()}
                                className=" rounded-sm"
                            >
                                Send
                            </Button>
                            <Button key="back" onClick={handleCancel} className=" rounded-sm ">
                                Cancel
                            </Button>
                        </Flex>,
                    ]}
                >
                    <Form
                        layout="vertical"
                        onFinish={handleSubmit}
                        autoComplete="off"
                        className="mt-3"
                    >
                        <TextInput
                            name="email"
                            label="Email ID"
                            placeholder="Enter email ID"
                            type="text"
                            isRequired
                            allowLowerCaseOnly
                        />
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default ReferralCodeModal;
