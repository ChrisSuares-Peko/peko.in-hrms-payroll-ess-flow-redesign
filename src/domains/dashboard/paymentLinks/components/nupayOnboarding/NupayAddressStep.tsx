import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Select } from 'antd';

import { INDIAN_STATES } from '@utils/indianLocations';

import { NupayOnboardingFormState } from '../../types/activateCollectionsTypes';

interface Props {
    initialValues?: Partial<NupayOnboardingFormState>;
    onBack: () => void;
    onNext: (values: Partial<NupayOnboardingFormState>) => void;
}

const STATE_OPTIONS = INDIAN_STATES.map(s => ({ label: s.name, value: s.name }));

// Step 2 — Address Fields. Marked required per design (API treats them as optional for collection).
const NupayAddressStep = ({ initialValues, onBack, onNext }: Props) => {
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
            <Form.Item
                name="businessAddress"
                label="Business Address"
                rules={[{ required: true, message: 'Business address is required' }]}
            >
                <Input.TextArea
                    placeholder="Enter Business Address"
                    autoSize={{ minRows: 2, maxRows: 4 }}
                    className="!rounded-lg"
                />
            </Form.Item>

            <Flex gap={20} wrap="wrap">
                <Form.Item
                    name="city"
                    label="City"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'City is required' },
                        { pattern: /^[A-Za-z][A-Za-z .'-]{1,49}$/, message: 'Please enter a valid city' },
                    ]}
                >
                    <Input placeholder="Enter City" className="!h-11 !rounded-lg" />
                </Form.Item>
                <Form.Item
                    name="state"
                    label="State"
                    className="min-w-[260px] flex-1"
                    rules={[{ required: true, message: 'State is required' }]}
                >
                    <Select
                        showSearch
                        placeholder="Select State"
                        options={STATE_OPTIONS}
                        optionFilterProp="label"
                        className="!h-11"
                    />
                </Form.Item>
            </Flex>

            <Flex gap={20} wrap="wrap">
                <Form.Item
                    name="pincode"
                    label="Pincode"
                    className="min-w-[260px] flex-1"
                    rules={[
                        { required: true, message: 'Pincode is required' },
                        { pattern: /^[1-9]\d{5}$/, message: 'Please enter a valid 6-digit pincode' },
                    ]}
                >
                    <Input placeholder="Enter Pincode" maxLength={6} className="!h-11 !rounded-lg" />
                </Form.Item>
                <div className="min-w-[260px] flex-1" />
            </Flex>

            <Flex justify="end" gap={12} className="mt-2">
                <Button onClick={onBack} className="!h-10 !border-[#FF4D4F] !px-6 !text-[#FF4D4F]">
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

export default NupayAddressStep;
