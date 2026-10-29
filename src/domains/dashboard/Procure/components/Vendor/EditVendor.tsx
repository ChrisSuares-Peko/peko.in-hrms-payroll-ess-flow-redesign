import React from 'react';

import { Button, Card, Col, Flex, Form, Row, Spin, Typography } from 'antd';
import { Formik, setNestedObjectValues } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import BankingInformation from './BankingInformation';
import BusinessInformation from './BusinessInformation';
import VendorSidebar from './VendorSidebar';
import { useVendor } from '../../hooks/useVendor';
import { addVendorSchema } from '../../schema';

const { Title, Text } = Typography;

const EditVendor: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const handleCancel = () =>
        navigate(`${paths.dashboard.procure}/${paths.procure.vendor.index}`);

    const { detail, isLoading, update, isSubmitting } = useVendor(id);

    const onSubmit = async (values: typeof initialValues) => {
        if (!id) return;
        const success = await update(id, values);
        if (success) handleCancel();
    };

    if (isLoading || !detail) {
        return (
            <Flex justify="center" align="center" style={{ minHeight: 300 }}>
                <Spin size="large" />
            </Flex>
        );
    }

    const initialValues = {
        businessName:  detail.businessName ?? '',
        gstin:         detail.gstin ?? '',
        contactPerson: detail.contactPerson ?? '',
        email:         detail.email ?? '',
        phone:         detail.phone ?? '',
        tags:          detail.tags ?? [] as string[],
        paymentTerms:  detail.paymentTerms ?? '',
        status:        detail.status ?? 'Active',
        bankName:      detail.bankName ?? '',
        accountNumber: detail.accountNumber ?? '',
        ifscCode:      detail.ifscCode ?? '',
    };

    return (
        <Row gutter={[{ xs: 0, sm: 24 }, 16]} className="p-0">
            <Col xs={24} lg={16}>
                <Card className="rounded-3xl w-full !border-gray-100" styles={{ body: { padding: 32 } }}>
                    <Title level={4} className="text-center" style={{ marginBottom: 4 }}>Edit Vendor</Title>
                    <Flex justify="center" style={{ marginBottom: 20 }}>
                        <Text className="text-[#000000] text-xs">
                            Update vendor details in your directory.
                        </Text>
                    </Flex>

                    <Formik
                        initialValues={initialValues}
                        validationSchema={addVendorSchema}
                        onSubmit={onSubmit}
                        enableReinitialize
                    >
                        {({ handleSubmit, validateForm, setTouched }) => (
                            <Form layout="vertical" onFinish={async () => {
                                const errors = await validateForm();
                                if (Object.keys(errors).length > 0) {
                                    setTouched(setNestedObjectValues(errors, true));
                                    requestAnimationFrame(() => {
                                        const firstError = document.querySelector('.ant-form-item-has-error, [data-form-error="true"]');
                                        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    });
                                    return;
                                }
                                handleSubmit();
                            }}>
                                <BusinessInformation />
                                <BankingInformation />

                                <Flex gap={12} wrap="wrap">
                                    <Button type="primary" danger htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                                        Save
                                    </Button>
                                    <Button
                                        danger
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                        style={{ borderColor: '#ff4f4f', color: '#ff4f4f', background: '#fff' }}
                                    >Cancel</Button>
                                </Flex>
                            </Form>
                        )}
                    </Formik>
                </Card>
            </Col>

            <VendorSidebar />
        </Row>
    );
};

export default EditVendor;
