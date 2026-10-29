import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Select } from 'antd';

import { emailRegex } from '@utils/regex';

import { NupayOnboardingFormState } from '../../types/activateCollectionsTypes';
import { ENTITY_TYPE_OPTIONS } from '../../utils/data';

interface Props {
    initialValues?: Partial<NupayOnboardingFormState>;
    onCancel: () => void;
    onNext: (values: Partial<NupayOnboardingFormState>) => void;
}

// Step 1 — Basic Information. product_type is intentionally absent (backend-set).
const NupayBasicInfoStep = ({ initialValues, onCancel, onNext }: Props) => {
    const [form] = Form.useForm();

    return (
        <Form
            form={form}
            layout="vertical"
            requiredMark
            initialValues={initialValues}
            onFinish={values => onNext(values)}
            className="mt-2"
        >
            <Flex gap={20} wrap="wrap">
                <Form.Item
                    name="merchantName"
                    label="Merchant Name"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'Merchant name is required' },
                        { whitespace: true, message: 'Merchant name cannot be blank' },
                        {
                            pattern: /^(?=.*[A-Za-z])[A-Za-z0-9&.,'() /-]{2,100}$/,
                            message: 'Please enter a valid merchant name',
                        },
                    ]}
                >
                    <Input placeholder="Enter Merchant Name" className="!h-11 !rounded-lg" />
                </Form.Item>
                <Form.Item
                    name="contactNumber"
                    label="Contact Number"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'Contact number is required' },
                        {
                            pattern: /^[6-9]\d{9}$/,
                            message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9',
                        },
                    ]}
                >
                    <Input placeholder="Enter Contact Number" maxLength={10} className="!h-11 !rounded-lg" />
                </Form.Item>
            </Flex>

            <Flex gap={20} wrap="wrap">
                <Form.Item
                    name="officialEmail"
                    label="Official Email"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'Official email is required' },
                        { pattern: emailRegex, message: 'Please enter a valid email' },
                    ]}
                >
                    <Input placeholder="Enter Official Email" className="!h-11 !rounded-lg" />
                </Form.Item>
                <Form.Item
                    name="websiteUrl"
                    label="Website URL"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'Website URL is required' },
                        {
                            pattern: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i,
                            message: 'Please enter a valid website URL',
                        },
                    ]}
                >
                    <Input placeholder="Enter Website URL" className="!h-11 !rounded-lg" />
                </Form.Item>
            </Flex>

            <Flex gap={20} wrap="wrap">
                <Form.Item
                    name="entityType"
                    label="Entity Type"
                    className="min-w-[260px] flex-1"
                    rules={[{ required: true, message: 'Select an entity type' }]}
                >
                    <Select
                        placeholder="Select Entity Type"
                        options={ENTITY_TYPE_OPTIONS}
                        className="!h-11"
                    />
                </Form.Item>
                <div className="min-w-[260px] flex-1" />
            </Flex>

            <Flex justify="end" gap={12} className="mt-2">
                <Button onClick={onCancel} className="!h-10 !border-[#FF4D4F] !px-6 !text-[#FF4D4F]">
                    Back
                </Button>
                <Button
                    type="primary"
                    htmlType="submit"
                    className="!h-10 !border-0 !bg-[#FF4D4F] !px-6 font-semibold"
                >
                    Continue <ArrowRightOutlined />
                </Button>
            </Flex>
        </Form>
    );
};

export default NupayBasicInfoStep;
