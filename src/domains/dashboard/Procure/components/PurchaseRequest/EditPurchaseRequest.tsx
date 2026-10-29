import React, { useEffect, useState } from 'react';

import { Button, Card, Col, Flex, Form, Row, Spin, Typography } from 'antd';
import { Formik, setNestedObjectValues } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { buildPayload, defaultLineItem, emptyValues, type LineItem } from './edit/formConfig';
import RequesterDetailsCard from './edit/RequesterDetailsCard';
import SupportingDocumentsCard from './edit/SupportingDocumentsCard';
import WhatsNeededCard from './edit/WhatsNeededCard';
import PRTipsPanel from './PRTipsPanel';
import { usePurchaseRequestApi } from '../../hooks/usePurchaseRequestApi';
import { newPurchaseRequestSchema } from '../../schema';

const { Title, Text } = Typography;

const EditPurchaseRequest: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [formValues, setFormValues] = useState(emptyValues);
    const { isLoading, detail, update, employees } = usePurchaseRequestApi(id, undefined, true);

    const employeeOptions = (employees ?? []).map((emp: any) => ({
        value: emp.id ?? emp._id ?? '',
        label: emp.fullName ?? '',
        fullName: emp.fullName ?? '',
        department: emp.department?.departmentName ?? emp.department ?? '',
    }));

    useEffect(() => {
        if (!detail) return;
        const storedItems: LineItem[] = Array.isArray(detail.lineItems) && detail.lineItems.length
            ? detail.lineItems.map((i: any) => ({
                key: i.key ?? String(Date.now() + Math.random()),
                itemName: i.itemName ?? '',
                description: i.description ?? '',
                qty: i.qty ?? 1,
                unit: i.unit ?? 'Unit',
                estUnitCost: i.estUnitCost ?? '',
            }))
            : [defaultLineItem()];

        setFormValues({
            requestedBy: detail.requestedBy ?? '',
            department: detail.department ?? '',
            category: detail.category ?? '',
            neededBy: detail.neededBy ?? '',
            lineItems: storedItems,
            notes: detail.notes ?? '',
            newAttachments: [],
            deletedAttachmentFileNames: [],
        });
    }, [detail]);

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${id}`);

    const onSubmit = async (values: typeof emptyValues) => {
        if (!id) return;
        setIsSubmitting(true);
        const result = await update(id, buildPayload(values, 'Open') as any);
        setIsSubmitting(false);
        if (result) navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${id}`);
    };

    const onSaveAsDraft = async (values: typeof emptyValues) => {
        if (!id) return;
        setIsSavingDraft(true);
        const result = await update(id, buildPayload(values, 'Draft') as any);
        setIsSavingDraft(false);
        if (result) navigate(`${paths.dashboard.procure}/${paths.procure.purchaseRequests.index}/${id}`);
    };

    if (isLoading && !detail) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: 400 }}>
                <Spin size="large" />
            </Flex>
        );
    }

    return (
        <Row gutter={24} className="p-0">
            <Col xs={24} lg={15}>
                <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 } }}>
                    <Title level={4} className="text-center" style={{ marginBottom: 4 }}>
                        Edit Purchase Request {detail?.refNumber ?? ''}
                    </Title>
                    <Text className="text-[#000000] text-xs block mb-10 text-center">
                        Submit a request for goods or services
                    </Text>

                    <Formik
                        initialValues={formValues}
                        enableReinitialize
                        validationSchema={newPurchaseRequestSchema}
                        onSubmit={onSubmit}
                    >
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

                                    <SupportingDocumentsCard
                                        existingAttachments={detail?.attachments ?? []}
                                        values={values}
                                        setFieldValue={setFieldValue}
                                    />

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
                                        <Button onClick={handleCancel} disabled={isSubmitting || isSavingDraft} className="lg:flex-none flex-1 min-w-[80px]">
                                            Cancel
                                        </Button>
                                    </Flex>
                                </Form>
                            );
                        }}
                    </Formik>
                </Card>
            </Col>
            <Col xs={0} lg={9}>
                <PRTipsPanel />
            </Col>
        </Row>
    );
};

export default EditPurchaseRequest;
