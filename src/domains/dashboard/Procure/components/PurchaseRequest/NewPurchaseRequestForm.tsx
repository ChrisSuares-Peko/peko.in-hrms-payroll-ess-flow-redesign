import React from 'react';

import { Button, Card, Flex, Form, Typography } from 'antd';
import { Formik, setNestedObjectValues } from 'formik';

import AutoSaveDraft from './edit/AutoSaveDraft';
import { defaultLineItem } from './edit/formConfig';
import NewAttachmentsCard from './edit/NewAttachmentsCard';
import RequesterDetailsCard from './edit/RequesterDetailsCard';
import WhatsNeededCard from './edit/WhatsNeededCard';
import { newPurchaseRequestSchema } from '../../schema';

const { Title, Text } = Typography;

export interface LineItem {
    key: string;
    itemName: string;
    qty: number | string;
    unit: string;
    estUnitCost: number | string;
}

export const initialValues = {
    requestedBy: '',
    department: '',
    category: '',
    neededBy: '',
    lineItems: [defaultLineItem()] as LineItem[],
    notes: '',
    attachments: [] as { fileName: string; fileBase64: string; fileFormat: string }[],
};

type Props = {
    employees: any[];
    isSubmitting: boolean;
    isSavingDraft: boolean;
    formInitialValues?: typeof initialValues;
    onSubmit: (values: typeof initialValues) => Promise<void>;
    onSaveAsDraft: (values: typeof initialValues) => Promise<void>;
    onCancel: () => void;
};

const NewPurchaseRequestForm: React.FC<Props> = ({
    employees, isSubmitting, isSavingDraft, formInitialValues,
    onSubmit, onSaveAsDraft, onCancel,
}) => {
    const employeeOptions = employees.map((emp: any) => ({
        value: emp.fullName ?? '',
        label: emp.fullName ?? '',
        fullName: emp.fullName ?? '',
        department: emp.department?.departmentName ?? emp.department ?? '',
    }));

    return (
        <Card bordered={false} className="rounded-3xl w-full" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 32 } }}>
            <Title level={4} className="text-center" style={{ marginBottom: 4 }}>New Purchase Request</Title>
            <Text className="text-[#000000] text-xs block mb-10 text-center">
                Submit a request for goods or services
            </Text>

            <Formik initialValues={formInitialValues ?? initialValues} validationSchema={newPurchaseRequestSchema} onSubmit={onSubmit}>
                {({ handleSubmit, setFieldValue, setFieldTouched, values, validateForm, setTouched }) => {
                    const scrollToFirstError = () => requestAnimationFrame(() => {
                        const el = document.querySelector('.ant-form-item-has-error, [data-form-error="true"]');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    });

                    const handleValidatedSubmit = async (cb: () => void) => {
                        const errors = await validateForm();
                        if (Object.keys(errors).length > 0) {
                            setTouched(setNestedObjectValues(errors, true));
                            scrollToFirstError();
                            return;
                        }
                        cb();
                    };

                    return (
                        <Form layout="vertical" onFinish={() => handleValidatedSubmit(handleSubmit)}>
                            <AutoSaveDraft />

                            <RequesterDetailsCard
                                setFieldValue={setFieldValue}
                                setFieldTouched={setFieldTouched}
                                employeeOptions={employeeOptions}
                            />

                            <WhatsNeededCard
                                values={values}
                                setFieldValue={setFieldValue}
                                onAddLineItem={() => setFieldValue('lineItems', [...values.lineItems, defaultLineItem()])}
                                onRemoveLineItem={(key) => setFieldValue('lineItems', values.lineItems.filter(i => i.key !== key))}
                            />

                            <NewAttachmentsCard values={values} setFieldValue={setFieldValue} />

                            <Flex gap={12} wrap="wrap">
                                <Button type="primary" danger htmlType="submit" loading={isSubmitting} disabled={isSavingDraft} className="lg:flex-none flex-1 min-w-[120px]">
                                    Submit Request
                                </Button>
                                <Button
                                    danger
                                    onClick={() => handleValidatedSubmit(() => onSaveAsDraft(values))}
                                    loading={isSavingDraft}
                                    disabled={isSubmitting}
                                    style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                    className="lg:flex-none flex-1 min-w-[120px]"
                                >
                                    Save as Draft
                                </Button>
                                <Button onClick={onCancel} disabled={isSubmitting || isSavingDraft} className="lg:flex-none flex-1 min-w-[80px]">
                                    Cancel
                                </Button>
                            </Flex>
                        </Form>
                    );
                }}
            </Formik>
        </Card>
    );
};

export default NewPurchaseRequestForm;
