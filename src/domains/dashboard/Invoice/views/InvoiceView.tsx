import React, { useEffect, useState } from 'react';

import { Button, Card, Col, Flex, Row, Skeleton } from 'antd';
import Input from 'antd/es/input/Input';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import BillerDetailsFormCreate from '../components/Create/BillerDetailsFormCreate';
import CustomerDetailsFormCreate from '../components/Create/CustomerDetailsFormCreate';
import InvoiceDetailsFormCreate from '../components/Create/InvoiceDetailsFormCreate';
import WishListCreate from '../components/Create/WishListCreate';
import customClass from '../components/InvoiceView.module.css';
import UploadImage from '../components/UploadImage';
import GetUserDetails from '../hooks/useGetUserDetailsApi';
import useInvoicesApi from '../hooks/useInvoicesApi';
import { invoiceDetailsSchema } from '../schema/index';
import {
    setComments,
    setInvoiceDetails,
    setPaymentDetails,
    setPaymentMode,
    setProductDetails,
    setRecipientDetails,
    setTermsConditions,
} from '../slices/InvoicesSlices';
import scrollToError from '../utils/scrollToError';

const InvoiceView: React.FC = () => {
    const { user } = useAppSelector(state => state.reducer.user);
    const { userData, loader } = GetUserDetails();

    const { recipientDetails, invoiceDetails } = useAppSelector(state => state.reducer.invoices);
    const invoicesState = useAppSelector(state => state.reducer.invoices);
    const [invoiceTitle, setInvoiceTitle] = useState<string>('Invoice');
    const { handleInvoice, isLoading } = useInvoicesApi();
    const dispatch = useDispatch();
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

    const initialValues = {
        billerName: userData?.userName,
        billerEmail: userData?.userEmail,
        billerCompanyAddress:
            userData?.addressLine1 && userData?.addressLine2
                ? `${userData.addressLine1}, ${userData.addressLine2}`
                : userData?.addressLine1 || userData?.addressLine2 || '',
        billerPhone: user?.mobileNo || userData?.mobileNo,
        billerGST: '',
        billerTRNNumber: '',
        customerTRNNumber: '',
        customerName: selectedCustomer?.label || recipientDetails.customerName,
        customerEmail: selectedCustomer?.email || recipientDetails.customerEmail,
        customerAddress: selectedCustomer?.address || recipientDetails.customerAddress,
        customerPhone: selectedCustomer?.mobileNo || recipientDetails.customerPhone,
        invoiceNo: invoiceDetails.invoiceNo,
        invoiceDate: invoiceDetails?.invoiceDate,
        dueDate: invoiceDetails?.dueDate,
        items: invoicesState.productDetails,
        paymentDetails: invoicesState.paymentDetails,
        comments: invoicesState.comments,
        termsConditions: invoicesState.termsConditions,
        shipping: '',
        invoiceDetails: {
            logo: user?.logo,
        },
        amountPaid: '',
        name: '',
        paymentMode: '',
        saveCustomerDetails: false,
    };
    const [invoiceData, setInvoiceData] = useState(initialValues);
    useEffect(() => {
        if (selectedCustomer) {
            setSelectedCustomer(selectedCustomer);
        }
    }, [selectedCustomer]);

    useEffect(() => {
        if (invoicesState) {
            const {
                billerName,
                billerEmail,
                billerCompanyAddress,
                billerPhone,
                billerGST,
                billerTRNNumber,
                customerName,
                customerEmail,
                customerAddress,
                customerPhone,
                customerTRNNumber,
            } = invoicesState.recipientDetails;
            const { invoiceNo, invoiceDate, dueDate, invoiceName } = invoicesState.invoiceDetails;
            const { paymentMode, productDetails, comments, termsConditions } = invoicesState;
            const { shipping, amountPaid } = invoicesState.paymentDetails;
            setInvoiceData(prevData => ({
                ...prevData,
                billerName: billerName || prevData.billerName,
                billerEmail: billerEmail || prevData.billerEmail,
                billerCompanyAddress: billerCompanyAddress || prevData.billerCompanyAddress,
                billerPhone: billerPhone || prevData.billerPhone,
                billerGST: billerGST || prevData.billerGST,
                billerTRNNumber: billerTRNNumber || prevData.billerTRNNumber,
                customerTRNNumber: customerTRNNumber || prevData.customerTRNNumber,
                customerName: customerName || prevData.customerName,
                customerEmail: customerEmail || prevData.customerEmail,
                customerAddress: customerAddress || prevData.customerAddress,
                customerPhone: customerPhone || prevData.customerPhone,
                invoiceNo: invoiceNo || prevData.invoiceNo,
                invoiceDate: invoiceDate || prevData.invoiceDate,
                dueDate: dueDate || prevData.dueDate,
                paymentMode: paymentMode || prevData.paymentMode,
                items: productDetails || prevData.items,
                comments: comments || prevData.comments,
                termsConditions: termsConditions || prevData.termsConditions,
                shipping: shipping || prevData.shipping,
                amountPaid: amountPaid || prevData.amountPaid,
            }));
            setInvoiceTitle(prevData => invoiceName || prevData);
        }
    }, [invoicesState]);

    useEffect(() => {
        if (userData) {
            setInvoiceData(prevData => ({
                ...prevData,
                billerName: prevData.billerName || userData?.userName,
                billerEmail: prevData.billerEmail || userData?.userEmail,
                billerCompanyAddress:
                    prevData.billerCompanyAddress ||
                    (userData?.addressLine1 && userData?.addressLine2
                        ? `${userData.addressLine1}, ${userData.addressLine2}`
                        : userData?.addressLine1 || userData?.addressLine2 || ''),
                billerPhone: prevData.billerPhone || user?.mobileNo || userData?.mobileNo,
            }));
        }
    }, [userData, user?.mobileNo]);

    return loader ? (
        <Skeleton />
    ) : (
        <Flex vertical gap={15} className={`w-full ${customClass.createInvoice}`}>
            {/* <Flex justify="space-between" align="center">
                <Flex vertical gap={5}>
                    <Text className="text-lg font-medium sm:text-xl">
                        Create Invoice
                    </Text>
                </Flex>
            </Flex> */}

            <Formik
                initialValues={invoiceData}
                validationSchema={invoiceDetailsSchema}
                onSubmit={(values, { resetForm }) => {
                    const subTotal = values.items
                        .reduce(
                            (acc, item) =>
                                acc +
                                (parseFloat(item.price.toString()) *
                                    parseFloat(item.quantity.toString()) || 0),
                            0
                        )
                        .toFixed(2);
                    const gst = values.items
                        .reduce(
                            (acc, item) =>
                                acc +
                                ((parseFloat(item.gst) *
                                    (parseFloat(item.price.toString()) *
                                        parseFloat(item.quantity.toString()) || 0)) /
                                    100 || 0),
                            0
                        )
                        .toFixed(2);
                    const discount = values.items
                        .reduce(
                            (acc, item) =>
                                acc +
                                ((parseFloat(item.discount) *
                                    (parseFloat(item.price.toString()) *
                                        parseFloat(item.quantity.toString()) || 0)) /
                                    100 || 0),
                            0
                        )
                        .toFixed(2);
                    const { shipping } = values;
                    const { amountPaid } = values;
                    const total = values.items
                        .reduce(
                            (acc, item) => acc + (parseFloat(item.amount) || 0),
                            0 + Number(values.shipping || 0)
                        )
                        .toFixed(2);

                    const amountDue = values.items
                        .reduce(
                            (acc, item) => acc + (parseFloat(item.amount) || 0),
                            0 + Number(values.shipping || 0) - Number(values.amountPaid || 0)
                        )
                        .toFixed(2);

                    const payload: any = {
                        id: 0,
                        invoiceId: 0,
                        updatedAt: '',
                        createdAt: '',
                        comments: values.comments,
                        termsConditions: values.termsConditions,
                        paymentMode: values.paymentMode,
                        paymentDetails: {
                            subTotal,
                            gst,
                            discount,
                            shipping,
                            total,
                            amountDue,
                            amountPaid,
                        },
                        productDetails: values.items,
                        invoiceDetails: {
                            invoiceNo: values.invoiceNo,
                            dueDate: values.dueDate,
                            invoiceDate: values.invoiceDate,
                            logo: user?.logo,
                            invoiceName: invoiceTitle,
                        },
                        recipientDetails: {
                            billerName: values.billerName,
                            billerEmail: values.billerEmail,
                            billerCompanyAddress: values.billerCompanyAddress,
                            billerPhone: values.billerPhone,
                            billerGST: values.billerGST,
                            billerTRNNumber: values.billerTRNNumber,
                            customerName: values.customerName,
                            customerAddress: values.customerAddress,
                            customerEmail: values.customerEmail,
                            customerPhone: values.customerPhone,
                            customerTRNNumber: values.customerTRNNumber,
                            logo: undefined,
                        },
                        saveCustomer: values.saveCustomerDetails,
                    };

                    if (invoicesState.recipientDetails.logo?.imageBase) {
                      
                        //  payload.invoiceDetails.logo = {
                        //     imageBase: invoicesState.recipientDetails.logo.imageBase.split(',')[1],
                        //     imageFormat:
                        //         invoicesState.recipientDetails.logo.imageFormat.split('/')[1],
                        // };
                        payload.invoiceDetails.logo = invoicesState.recipientDetails.logo;
                    }

                    if (!payload.invoiceDetails.logo) {
                        dispatch(
                            showToast({
                                description: 'Please upload your logo',
                                variant: 'error',
                            })
                        );
                        return;
                    }

                    if (
                        invoicesState?.collectorKyb?.kybStatus !== 'APPROVED' &&
                        values.paymentMode === 'payment link'
                    ) {
                        dispatch(
                            showToast({
                                description:
                                    'Please complete your KYB to use the Payment Link method or choose a different payment method.',
                                variant: 'error',
                            })
                        );
                        return;
                    }

                    dispatch(
                        setRecipientDetails({
                            ...payload.recipientDetails,
                            logo: invoicesState.recipientDetails.logo,
                        })
                    );
                 
                    dispatch(setInvoiceDetails(payload.invoiceDetails));
                    dispatch(setPaymentMode(payload.paymentMode));
                    dispatch(setProductDetails(payload.productDetails));
                    dispatch(setComments(payload.comments));
                    dispatch(setTermsConditions(payload.termsConditions));
                    dispatch(setPaymentDetails(payload.paymentDetails));

                    handleInvoice({ ...payload, resetForm });
                }}
            >
                {({ handleSubmit, values, setFieldValue, errors }) => (
                    <form onSubmit={handleSubmit}>
                        <Flex
                            vertical
                            className="items-center justify-center w-full md:bg-gray-100 rounded-3xl md:p-5 2xl:py-10 2xl:px-28"
                        >
                            <Card
                                size="small"
                                className="w-full border-0 sm:py-4 sm:px-6 md:border-1 rounded-3xl md:shadow-2xl"
                                style={{ borderRadius: '50px' }}
                            >
                                <Flex className="flex flex-row justify-between">
                                    <Flex vertical className="w-min" align="center">
                                        <UploadImage />
                                    </Flex>

                                    <Flex className="flex items-center">
                                        <Flex className="min-w-24 sm:min-w-40">
                                            <Input
                                                value={invoiceTitle}
                                                variant="borderless"
                                                placeholder="Enter Invoice Title"
                                                defaultValue="INVOICE"
                                                className="xs:text-lg sm:text-2xl  md:text-5xl font-bold text-[#333333] text-end object-contain "
                                                size="large"
                                                onChange={e => setInvoiceTitle(e.target.value)}
                                                minLength={5}
                                                maxLength={20}
                                            />
                                        </Flex>
                                    </Flex>
                                </Flex>

                                <Row>
                                    <Col
                                        xs={24}
                                        xl={8}
                                        className="flex self-start justify-between gap-3 mt-5 align-top md:pr-4"
                                    >
                                        <BillerDetailsFormCreate />
                                    </Col>
                                    <Col
                                        xs={24}
                                        xl={8}
                                        className="flex self-start justify-between gap-3 mt-5 align-top md:pr-4"
                                    >
                                        <CustomerDetailsFormCreate
                                            onCustomerSelect={(customer: any) => {
                                                // Update form values when a customer is selected
                                                setFieldValue(
                                                    'customerName',
                                                    customer?.label || ''
                                                );
                                                setFieldValue(
                                                    'customerEmail',
                                                    customer?.email || ''
                                                );
                                                setFieldValue(
                                                    'customerAddress',
                                                    customer?.address || ''
                                                );
                                                setFieldValue(
                                                    'customerPhone',
                                                    customer?.mobileNo || ''
                                                );
                                                setFieldValue(
                                                    'customerTRNNumber',
                                                    customer?.trnNo || ''
                                                );
                                            }}
                                        />
                                    </Col>
                                    <Col
                                        xs={24}
                                        xl={8}
                                        className="flex self-start justify-between gap-3 mt-5 align-top md:pr-4"
                                    >
                                        <InvoiceDetailsFormCreate
                                            startdate={values.invoiceDate ?? ''}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mt-4 xl:mt-0">
                                    <Col span={24}>
                                        <WishListCreate
                                            values={values.items}
                                            charge={values.shipping}
                                            amountPaid={values.amountPaid}
                                            setFieldValue={setFieldValue}
                                        />
                                    </Col>
                                </Row>

                                {/* end of update */}
                                <Row className="flex justify-end">
                                    <Col sm={24} xl={8} className="md:max-w-5xl">
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            danger
                                            size="large"
                                            className="w-full px-8 mt-5 rounded-xl"
                                            loading={isLoading}
                                            onClick={() => scrollToError(errors)}
                                        >
                                            Generate
                                        </Button>
                                    </Col>
                                </Row>
                            </Card>
                        </Flex>
                    </form>
                )}
            </Formik>
        </Flex>
    );
};

export default InvoiceView;
