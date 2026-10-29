import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Col, DatePicker, Flex, Form, Input, Row, Select, Typography } from 'antd';
import type { Rule } from 'antd/es/form';
import dayjs from 'dayjs';

import { emailRegex } from '@utils/regex';

import { MiqField, MIQ_SECTIONS } from './miqFields';

interface Props {
    initialValues?: Record<string, any>;
    onBack: () => void;
    onNext: (values: Record<string, any>) => void;
}

const buildRules = (field: MiqField): Rule[] => {
    const rules: Rule[] = [];
    if (field.required) rules.push({ required: true, message: `${field.label} is required` });
    if (field.email) rules.push({ pattern: emailRegex, message: 'Please enter a valid email' });
    if (field.pattern) rules.push({ pattern: field.pattern, message: field.patternMessage });
    return rules;
};

const renderControl = (field: MiqField) => {
    if (field.type === 'textarea') {
        return (
            <Input.TextArea
                placeholder={`Enter ${field.label}`}
                autoSize={{ minRows: 2, maxRows: 4 }}
                className="!rounded-lg"
            />
        );
    }
    if (field.type === 'date') {
        return (
            <DatePicker
                format="DD/MM/YYYY"
                placeholder="Select date"
                className="!h-11 !w-full !rounded-lg"
                disabledDate={current => current && current > dayjs().endOf('day')}
            />
        );
    }
    if (field.type === 'select') {
        return (
            <Select
                showSearch
                placeholder={`Select ${field.label}`}
                optionFilterProp="label"
                options={field.options?.map(o => ({ label: o, value: o }))}
                className="!h-11 !w-full"
            />
        );
    }
    return <Input placeholder={`Enter ${field.label}`} className="!h-11 !rounded-lg" />;
};

// Step 2 — Business Details. Data-driven from the MIQ column spec; values feed the MIQ Excel.
const NupayBusinessDetailsStep = ({ initialValues, onBack, onNext }: Props) => {
    const [form] = Form.useForm();

    return (
        <Form form={form} layout="vertical" requiredMark initialValues={initialValues} onFinish={onNext} className="mt-2">
            <Flex vertical gap={18}>
                {MIQ_SECTIONS.map(section => (
                    <Flex vertical gap={4} key={section.title}>
                        <Typography.Text className="text-[13px] font-semibold text-[#1F2A44]">
                            {section.title}
                        </Typography.Text>
                        <Row gutter={[20, 0]}>
                            {section.fields.map(field => (
                                <Col xs={24} lg={12} key={field.name}>
                                    <Form.Item
                                        name={field.name}
                                        label={
                                            <span className="text-[13px] font-medium text-[#344054]">
                                                {field.label}
                                                {field.hint && (
                                                    <span className="ml-1 text-[11px] text-[#98A2B3]">({field.hint})</span>
                                                )}
                                            </span>
                                        }
                                        rules={buildRules(field)}
                                        normalize={field.uppercase ? (value: string) => value?.toUpperCase() : undefined}
                                    >
                                        {renderControl(field)}
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </Flex>
                ))}
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

export default NupayBusinessDetailsStep;
