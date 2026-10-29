import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';

import { Flex, Typography, Image, Button, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';

import email from '@assets/svg/whatsapp.svg';
import { useAppSelector } from '@src/hooks/store';

import InvoiceCard from './InvoiceCard';
import { getInvoice } from '../api/index';
import { InvoiceResponse } from '../types/index';

const SendEmailModal = lazy(() => import('./SendEmailModal'));

const { Text } = Typography;

const InvoiceDetails = () => {
    const state = useLocation();
    const { id, role } = useAppSelector(rootState => rootState.reducer.auth);
    const [data, setData] = useState<
        | {
              id: number;
              recipientDetails: any;
              invoiceDetails: any;
              productDetails: any;
              paymentDetails: any;
              comments: string;
              termsConditions: string;
              updatedAt: string;
              createdAt: string;
              invoiceId: number;
          }
        | undefined
    >();
    const [dataSource, setDataSource] = useState<any[]>([]);
    const componentRef = React.useRef(null);
    const invoiceId = state;
    const [modalVisible, setModalVisible] = useState(false);

    // const { sendEmail, postEmailLink } = useInvoicesApi();
    const getInvoiceDetails = useCallback(async () => {
        const payload = {
            userId: id,
            userType: role,
            invoiceId: state.state,
        };
        const resp: InvoiceResponse | false = await getInvoice(payload);
        if (resp) {
            const parsedResp = {
                id: resp.id,
                recipientDetails: JSON.parse(resp.recipientDetails),
                invoiceDetails: JSON.parse(resp.invoiceDetails),
                productDetails: JSON.parse(resp.productDetails),
                paymentDetails: JSON.parse(resp.paymentDetails),
                comments: resp.comments,
                termsConditions: resp.termsConditions,
                updatedAt: resp.updatedAt,
                createdAt: resp.createdAt,
                invoiceId: resp.invoiceId,
            };
            setData(parsedResp);

            if (parsedResp.productDetails) {
                const arr = parsedResp?.productDetails?.map((product: any, index: number) => ({
                    key: index.toString(),
                    name: {
                        firstRow: product.item,
                        secondRow: '', // Add the appropriate value here if needed
                    },
                    quantity: product.quantity,
                    price: product.price,
                    amount: product.price * product.quantity,
                }));
                setDataSource([...arr]);
            }
        }
    }, [role, id, state]);

    useEffect(() => {
        if (state.state > 0) {
            getInvoiceDetails();
        }
    }, [getInvoiceDetails, invoiceId, state.state]);

    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        documentTitle: 'Invoice', // Optional: Specify the document title
    });

    const handlePrintClick = async () => {
        try {
            await handlePrint();
        } catch (error) {
            // console.error('Error occurred while printing:', error);
        }
    };

    return (
        <Flex vertical gap={20} justify="center" align="center" className="w-full">
            <InvoiceCard data={data} componentRef={componentRef} dataSource={dataSource} />
            <Flex justify="space-between" align="center" className="w-full px- md:px-36">
                <Flex vertical gap={8}>
                    <Text className="text-sm text-textGrey">Share invoice</Text>
                    <Flex gap={18}>
                        <Image
                            src={email}
                            height={50}
                            width={50}
                            preview={false}
                            onClick={() => setModalVisible(true)} // Open modal on click
                            className="cursor-pointer"
                        />
                    </Flex>
                </Flex>
                <Button type="primary" danger onClick={handlePrintClick}>
                    Save Pdf
                </Button>
            </Flex>
            <Suspense fallback={<Spin />}>
                <SendEmailModal
                    open={modalVisible}
                    handleCancel={() => setModalVisible(false)}
                    invoiceId={invoiceId.state}
                    invoiceOnly
                />
            </Suspense>
        </Flex>
    );
};

export default InvoiceDetails;
