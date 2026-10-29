import React from 'react';

import { Button, Card, Flex, Form, Modal, Typography } from 'antd';
import { Formik } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

import { addEmployeeSchema } from '../../schema';

const { Text } = Typography;

type Props = {
    open: boolean;
    prefill: { name: string; department: string };
    onClose: () => void;
    onSubmit: (fullName: string, department?: string) => Promise<void>;
};

const AddEmployeeModal: React.FC<Props> = ({ open, prefill, onClose, onSubmit }) => (
    <Modal
        title={<Text style={{ fontSize: 24, fontWeight: 500, lineHeight: 1.48, fontFamily: 'Roboto, sans-serif', color: '#000' }}>Add employee</Text>}
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={700}
        destroyOnHidden
        styles={{
            content: { borderRadius: 41, padding: '36px 38px' },
            header: { marginBottom: 22 },
        }}
    >
        <Formik
            initialValues={prefill}
            validationSchema={addEmployeeSchema}
            enableReinitialize
            onSubmit={async (vals, { resetForm }) => {
                await onSubmit(vals.name.trim(), vals.department?.trim() || undefined);
                resetForm();
            }}
        >
            {({ handleSubmit }) => (
                <Form layout="vertical" onFinish={handleSubmit}>
                    <Card
                        className="!rounded-[26px] !border-[#e5e7eb]"
                        style={{ boxShadow: '0px 1.236px 6.182px 0px rgba(122,122,122,0.06)' }}
                        styles={{ body: { padding: 33 } }}
                    >
                        <Flex vertical gap={24}>
                            <Flex vertical gap={16}>
                                <Text className="font-medium" style={{ color: '#505051' }}>
                                    Provide the details of the employee
                                </Text>
                                <TextInput name="name" label={<span style={{ fontSize: 14, fontWeight: 500, color: '#a9acb4', fontFamily: 'Roboto, sans-serif' }}>Name</span>} type="text" placeholder="Enter name" isRequired allowAlphabetsAndSpaceOnly formItemClass="!mb-0"/>
                                <TextInput name="department" label={<span style={{ fontSize: 14, fontWeight: 500, color: '#a9acb4', fontFamily: 'Roboto, sans-serif' }}>Department</span>} type="text" placeholder="Enter department" isRequired allowAlphabetsAndSpaceOnly formItemClass="!mb-0"/>
                            </Flex>
                            <Button type="primary" danger block htmlType="submit">Add</Button>
                        </Flex>
                    </Card>
                </Form>
            )}
        </Formik>
    </Modal>
);

export default AddEmployeeModal;
