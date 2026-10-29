import React from 'react';

import { Button, Col, Flex, Row, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Formik } from 'formik';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

import UploadInvoiceInput from '../components/upload-invoice/UploadInvoiceInput';
import UploadWishList from '../components/upload-invoice/UploadWishList';
import AdditionalDetailsForm from '../forms/AdditionalDetailsForm';
import BillerDetailsForm from '../forms/BillerDetailsForm';
import CustomerDetailsForm from '../forms/CustomerDetailsForm';
import InvoiceDetailsForm from '../forms/InvoiceDetailsForm';
import useUploadInvoice from '../hooks/upload-invoice/useUploadInvoice';
import { invoiceDetailsSchema } from '../schema/index';
import scrollToError from '../utils/scrollToError';

const { Text } = Typography;

const UploadInvoice = () => {
    const { handleChange, viewPdf, isUploading, invoiceData, generateInvoice, isLoading } =
        useUploadInvoice();

    return (
        <Content>
            <Text className="text-xl font-medium">Upload Invoice</Text>
            <Formik
                initialValues={invoiceData}
                validationSchema={invoiceDetailsSchema}
                onSubmit={(values, { resetForm }) => {
                
                    generateInvoice(values, resetForm);
                }}
                enableReinitialize
            >
                {({ handleSubmit, values, setFieldValue, errors }) => (
                    <form onSubmit={handleSubmit}>
                        <Row gutter={30} className="mt-6 px-5">
                            <UploadInvoiceInput
                                handleChange={handleChange}
                                viewPdf={viewPdf}
                                isUploading={isUploading}
                            />
                            <Col md={14} style={{ padding: 0 }}>
                                <Row gutter={[60, 20]} className="md:pl-7">
                                    <Col xs={24} md={12}>
                                        <BillerDetailsForm />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <CustomerDetailsForm />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <InvoiceDetailsForm startdate={values.invoiceDate} />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <AdditionalDetailsForm />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                        <Row>
                            <Col span={24} className="mt-7">
                                <UploadWishList
                                    values={values.items}
                                    charge={values.shipping}
                                    amountPaid={values.amountPaid}
                                    setFieldValue={setFieldValue}
                                />
                            </Col>
                        </Row>
                        <Flex justify="end" className="md:max-w-10xl w-full">
                            <Button
                                type="primary"
                                htmlType="submit"
                                danger
                                className="mt-5 w-28"
                                loading={isLoading}
                                onClick={() => scrollToError(errors)}
                            >
                                Proceed
                            </Button>
                        </Flex>
                    </form>
                )}
            </Formik>
        </Content>
    );
};

export default UploadInvoice;
