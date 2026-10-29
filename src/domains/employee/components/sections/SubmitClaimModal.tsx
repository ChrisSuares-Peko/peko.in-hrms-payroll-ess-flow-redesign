import React, { useState } from 'react';

import {
    CarOutlined,
    CloseOutlined,
    CoffeeOutlined,
    HomeOutlined,
    InboxOutlined,
    ShoppingCartOutlined,
    TagOutlined,
} from '@ant-design/icons';
import { Button, Form, InputNumber, Modal, Typography, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import dayjs from 'dayjs';
import { Formik } from 'formik';
import * as Yup from 'yup';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { RequestReimbursementBody } from '../../api/reimbursements';
import { noSurroundingSpaces } from '../../schema';

const { Text } = Typography;

const MAX_MB = 5;

interface SubmitClaimModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (body: RequestReimbursementBody) => Promise<boolean>;
}

type ClaimCategory = 'Meals' | 'Transport' | 'Accommodation' | 'Supplies' | 'Others';

interface ClaimFormValues {
    category: ClaimCategory | '';
    amount: number | null;
    expenseDate: string;
    description: string;
}

const categories: { key: ClaimCategory; icon: React.ReactNode }[] = [
    { key: 'Meals', icon: <CoffeeOutlined /> },
    { key: 'Transport', icon: <CarOutlined /> },
    { key: 'Accommodation', icon: <HomeOutlined /> },
    { key: 'Supplies', icon: <ShoppingCartOutlined /> },
    { key: 'Others', icon: <TagOutlined /> },
];

const validationSchema = Yup.object({
    category: Yup.string().required('Please select a category'),
    amount: Yup.number()
        .typeError('Please enter a valid amount')
        .positive('Amount must be greater than 0')
        .required('Reimbursement amount must be greater than 0'),
    expenseDate: Yup.string().required('Please select the date'),
    description: noSurroundingSpaces('Description')
        .test('min-length', 'Description must be at least 3 characters', v => !v || v.length >= 3)
        .max(300, 'Description must be at most 300 characters'),
});

// Reads the receipt as base64 client-side, same as IN's OnboardingUpload —
// sent as {base64, format} so the backend's existing reimbursementFilesUpload
// middleware uploads it to real storage (matching how HR-created reimbursements
// already get a real URL, instead of persisting the raw base64 on the record).
const SubmitClaimModal: React.FC<SubmitClaimModalProps> = ({ open, onClose, onSubmit }) => {
    const dispatch = useAppDispatch();
    const [receiptDoc, setReceiptDoc] = useState<{ base64: string; format: string } | null>(null);
    const [receiptName, setReceiptName] = useState('');

    const initialValues: ClaimFormValues = {
        category: '',
        amount: null,
        expenseDate: dayjs().format('YYYY-MM-DD'),
        description: '',
    };

    const beforeUpload = (file: RcFile) => {
        if (file.size > 5.1 * 1024 * 1024) {
            dispatch(
                showToast({
                    description: `File must be smaller than ${MAX_MB}MB.`,
                    variant: 'error',
                })
            );
            return Upload.LIST_IGNORE;
        }
        setReceiptName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setReceiptDoc({
                    base64: reader.result.split(',')[1],
                    format: file.type.split('/')[1],
                });
            }
        };
        reader.readAsDataURL(file);
        return false;
    };

    const handleSubmit = async (
        values: ClaimFormValues,
        { resetForm }: { resetForm: () => void }
    ) => {
        const details = [values.category, values.description].filter(Boolean).join(' — ');
        const ok = await onSubmit({
            amount: values.amount as number,
            expenseDate: values.expenseDate,
            expenseDetails: details || undefined,
            supportingDocs: receiptDoc || undefined,
        });
        if (ok) {
            resetForm();
            setReceiptDoc(null);
            setReceiptName('');
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
            centered
            styles={{ content: { padding: 24, borderRadius: 24, overflow: 'hidden' } }}
        >
            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
            >
                {({
                    values,
                    errors,
                    touched,
                    setFieldValue,
                    setFieldTouched,
                    isSubmitting,
                    handleSubmit: formikSubmit,
                }) => (
                    <Form
                        onFinish={formikSubmit}
                        layout="vertical"
                        className="flex flex-col gap-4 [&_.ant-form-item]:!mb-0"
                    >
                        <div className="flex flex-col gap-1">
                            <Text className="text-valueText font-bold text-lg">
                                Submit New Claim
                            </Text>
                            <Text className="text-titleText text-sm">
                                Submit your claim securely in just a few steps.
                            </Text>
                        </div>

                        <Form.Item
                            label="Category"
                            required
                            validateStatus={touched.category && errors.category ? 'error' : ''}
                            help={touched.category && errors.category ? errors.category : undefined}
                        >
                            <div className="flex flex-wrap gap-2">
                                {categories.map(({ key, icon }) => {
                                    const selected = values.category === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setFieldValue('category', key)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer"
                                            style={{
                                                borderColor: selected ? '#FF3A3A' : '#d9d9d9',
                                                color: selected ? '#FF3A3A' : '#8B8B8B',
                                                backgroundColor: selected ? '#FFF5F5' : '#fff',
                                            }}
                                        >
                                            {icon}
                                            {key}
                                        </button>
                                    );
                                })}
                            </div>
                        </Form.Item>

                        <Form.Item
                            label="Amount"
                            required
                            validateStatus={touched.amount && errors.amount ? 'error' : ''}
                            help={touched.amount && errors.amount ? errors.amount : undefined}
                        >
                            <InputNumber
                                placeholder="0.00"
                                prefix={
                                    <Text className="text-titleText text-sm font-medium pr-1">
                                        ₹
                                    </Text>
                                }
                                min={0}
                                precision={2}
                                style={{ width: '100%' }}
                                size="large"
                                value={values.amount}
                                status={touched.amount && errors.amount ? 'error' : ''}
                                onChange={val => {
                                    setFieldValue('amount', val);
                                    setFieldTouched('amount', true);
                                }}
                            />
                        </Form.Item>

                        <DatePickerInput
                            name="expenseDate"
                            label="Date"
                            placeholder="Select Date"
                            isRequired
                            maxDate={dayjs()}
                            size="large"
                            classes="w-full"
                        />

                        <TextAreaInput
                            name="description"
                            label="Description"
                            placeholder="Briefly describe the reason for your expense"
                            maxLength={300}
                        />

                        <Form.Item label="Receipt">
                            <Upload.Dragger
                                accept=".png,.jpg,.jpeg,.pdf"
                                maxCount={1}
                                showUploadList={false}
                                beforeUpload={beforeUpload}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined style={{ color: '#FF3A3A' }} />
                                </p>
                                <p className="ant-upload-text text-sm">
                                    {receiptName || 'Click or drag file to this area to upload'}
                                </p>
                                <p className="ant-upload-hint text-xs">
                                    PDF, JPEG, JPG, PNG — max {MAX_MB}MB
                                </p>
                            </Upload.Dragger>
                        </Form.Item>

                        <div className="flex gap-3">
                            <Button
                                onClick={onClose}
                                className="flex-1 h-11 rounded-lg font-medium"
                                icon={<CloseOutlined />}
                            >
                                Cancel
                            </Button>
                            <Button
                                danger
                                htmlType="submit"
                                loading={isSubmitting}
                                className="flex-1 h-11 rounded-lg font-medium text-brandColor border-brandColor"
                            >
                                Submit Claim
                            </Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default SubmitClaimModal;
