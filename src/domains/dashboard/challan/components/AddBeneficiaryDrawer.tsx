import { useEffect, useState } from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Drawer, Flex, Form, Input, Typography } from 'antd';

import ConfirmationModal from '@components/molecular/modals/ConfirmationModal';

import { ChallanBeneficiary } from '../types/index';

const { Text, Title } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    editValue?: ChallanBeneficiary | null;
    onSubmit: (beneficiary: Omit<ChallanBeneficiary, 'id'>) => void;
    onDelete?: (id: string) => void | Promise<void>;
}

const AddBeneficiaryDrawer = ({ open, onClose, editValue, onSubmit, onDelete }: Props) => {
    const [form] = Form.useForm();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isEdit = !!editValue;

    // Prefill on edit; clear on add. Runs whenever the drawer opens or the target changes.
    useEffect(() => {
        if (!open) return;
        if (editValue) {
            form.setFieldsValue({
                nickname: editValue.nickname,
                vehicleNumber: editValue.vehicleNumber,
            });
        } else {
            form.resetFields();
        }
    }, [open, editValue, form]);

    const handleFinish = (values: { nickname: string; vehicleNumber: string }) => {
        onSubmit({
            nickname: values.nickname,
            vehicleNumber: values.vehicleNumber.toUpperCase().trim(),
        });
        form.resetFields();
    };

    // Same confirmation modal the other utility services use for beneficiary delete.
    const handleDelete = async () => {
        if (!editValue || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(editValue.id);
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
        }
    };

    return (
        <>
            <Drawer
                open={open}
                onClose={onClose}
                width={460}
                title={
                    <Flex justify="space-between" align="start">
                        <Flex vertical>
                            <Title level={5} className="!mb-0">
                                {isEdit ? 'Edit' : 'Add'} Beneficiary Details
                            </Title>
                            <Text className="text-sm font-normal text-[#486284]">
                                This will help you to process the payment quickly
                            </Text>
                        </Flex>
                        {isEdit && onDelete && (
                            <DeleteOutlined
                                className="cursor-pointer text-lg text-[#FF4F4F]"
                                onClick={() => setIsConfirmOpen(true)}
                            />
                        )}
                    </Flex>
                }
                footer={
                    <Flex gap={12} justify="end">
                        <Button type="primary" onClick={() => form.submit()}>
                            {isEdit ? 'Update' : 'Submit'}
                        </Button>
                        <Button onClick={onClose}>Cancel</Button>
                    </Flex>
                }
            >
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Form.Item
                        label="Nickname"
                        name="nickname"
                        rules={[{ required: true, message: 'Please enter a nickname' }]}
                    >
                        <Input placeholder="Enter Nickname" maxLength={40} />
                    </Form.Item>
                    <Form.Item
                        label="Vehicle Registration Number"
                        name="vehicleNumber"
                        rules={[
                            { required: true, message: 'Please enter the vehicle number' },
                            { pattern: /^[A-Za-z0-9]{4,15}$/, message: 'Enter a valid vehicle number' },
                        ]}
                    >
                        <Input placeholder="Enter vehicle registered number" maxLength={15} />
                    </Form.Item>
                </Form>
            </Drawer>
            <ConfirmationModal
                isOpen={isConfirmOpen}
                handleCancel={() => setIsConfirmOpen(false)}
                title="Are you sure you want to delete this beneficiary ?"
                handleSubmit={handleDelete}
                isLoading={isDeleting}
            />
        </>
    );
};

export default AddBeneficiaryDrawer;
