import { useRef } from 'react';

import { Button, Flex, Form, Modal, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { LABEL_COLOR, RED, VALUE_COLOR } from './constants';
import { editVaInitialValues, editVaSchema } from '../../schema/manageBanks/manageBanksSchema';

const { Text } = Typography;

type EditVaValues = typeof editVaInitialValues;

interface EditVaModalProps {
    open: boolean;
    onClose: () => void;
    initialValues?: EditVaValues;
    onSubmit: (values: EditVaValues) => Promise<void>;
    isLoading?: boolean;
}

const EditVirtualAccountModal = ({ open, onClose, initialValues, onSubmit, isLoading }: EditVaModalProps) => {
    const formikRef = useRef<FormikProps<EditVaValues>>(null);

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            centered
            width="clamp(400px, 48vw, 700px)"
            styles={{ content: { borderRadius: 16, padding: '28px 32px' } }}
            closeIcon={null}
            destroyOnClose
        >
            <Flex vertical gap={4} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 'clamp(16px, 1.2vw, 20px)', fontWeight: 700, color: VALUE_COLOR }}>
                    Edit Virtual Account
                </Text>
                <Text style={{ fontSize: 'clamp(12px, 0.85vw, 14px)', color: LABEL_COLOR }}>
                    Modify the Virtual account details for your salary rollout.
                </Text>
            </Flex>

            <Formik
                innerRef={formikRef}
                enableReinitialize
                initialValues={initialValues ?? editVaInitialValues}
                validationSchema={editVaSchema}
                onSubmit={onSubmit}
            >
                <Form layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <TextInput
                            name="name"
                            label="Name"
                            placeholder="Virtual account holder name"
                            type="text"
                            isRequired
                        />
                        <TextInput
                            name="emailAddress"
                            label="Email Address"
                            placeholder="Enter email address"
                            type="text"
                            isRequired
                        />
                        <TextInput
                            name="mobileNumber"
                            label="Mobile Number"
                            placeholder="Enter mobile number"
                            type="text"
                            isRequired
                            allowNumbersOnly
                            maxLength={10}
                        />
                        <TextInput
                            name="panNumber"
                            label="PAN Number"
                            placeholder="Enter PAN number (e.g. ABCDE1234F)"
                            type="text"
                            isRequired
                            convertToUppercase
                            allowAlphabetsAndNumbersOnly
                            maxLength={10}
                        />
                    </div>
                    <TextInput
                        name="address"
                        label="Address"
                        placeholder="Enter address"
                        type="text"
                        isRequired
                    />
                </Form>
            </Formik>

            <Flex justify="flex-end" gap={12} style={{ marginTop: 24 }}>
                <Button onClick={onClose} style={{ borderRadius: 8, height: 38, padding: '0 20px' }}>
                    Cancel
                </Button>
                <Button
                    loading={isLoading}
                    onClick={() => formikRef.current?.submitForm()}
                    style={{ borderRadius: 8, height: 38, padding: '0 20px', background: RED, borderColor: RED, color: '#fff' }}
                >
                    Update Virtual Account
                </Button>
            </Flex>
        </Modal>
    );
};

export default EditVirtualAccountModal;
