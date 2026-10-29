import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button, Flex, Image, Tabs, theme } from 'antd';
import type { TabsProps } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikProps } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import sendParcel from '@domains/dashboard/logistics/assets/images/sendParcel.png';
import {
    Header,
    ReceiverDetails,
    SenderDetails,
    ShipmentType,
} from '@domains/dashboard/logistics/components';
import { paths } from '@src/routes/paths';
import { showToast } from '@src/slices/apiSlice';

import { RecieverFormValues, SenderFormValues, typeFormValues } from '../types/address';

const LogisticsHome = () => {
    const {
        token: { colorPrimary },
    } = theme.useToken();
    const [isSenderFormSubmitted, setIsSenderFormSubmitted] = useState(false);
    const [isRecieverFormSubmitted, setIsRecieverFormSubmitted] = useState(false);
    const handleSenderFormSubmit = useCallback((value: boolean) => {
        setIsSenderFormSubmitted(value);
    }, []);

    const handleRecieverFormSubmit = useCallback((value: boolean) => {
        setIsRecieverFormSubmitted(value);
    }, []);

    const navigate = useNavigate();
    useEffect(() => {
        if (isSenderFormSubmitted && isRecieverFormSubmitted) {
            navigate(`${paths.logistics.details}`);
        }
    }, [isSenderFormSubmitted, isRecieverFormSubmitted, navigate]);

    const senderFormRef = useRef<FormikProps<SenderFormValues>>(null);
    const recieverFormRef = useRef<FormikProps<RecieverFormValues>>(null);
    const typeRef = useRef<FormikProps<typeFormValues>>(null);
    const dispatch = useDispatch();
    const [isSenderPinVerified, setIsSenderPinVerified] = useState(false);
    const [isReceiverPinVerified, setIsReceiverPinVerified] = useState(false);

    const items: TabsProps['items'] = useMemo(
        () => [
            {
                key: '1',
                label: 'Sender Details',
                children: (
                    <SenderDetails
                        onFormSubmit={handleSenderFormSubmit}
                        senderFormRef={senderFormRef}
                        handleSenderPinVerified={setIsSenderPinVerified}
                    />
                ),
            },
            {
                key: '2',
                label: ' Receiver Details',
                children: (
                    <ReceiverDetails
                        recieverFormRef={recieverFormRef}
                        onFormSubmit={handleRecieverFormSubmit}
                        handleReceiverPinVerified={setIsReceiverPinVerified}
                    />
                ),
            },
        ],
        [handleSenderFormSubmit, handleRecieverFormSubmit, senderFormRef, recieverFormRef]
    );

    const handleNext = useCallback(async () => {
        const senderFormValues = senderFormRef.current?.values;
        const receiverFormValues = recieverFormRef.current?.values;

        if (
            senderFormValues?.senderAddress !== '' &&
            senderFormValues?.senderAddress.replace(/\n|\s/g, '') ===
                receiverFormValues?.recieverAddress.replace(/\n|\s/g, '')
        ) {
            dispatch(
                showToast({
                    description: 'The sender and receiver addresses cannot be the same',
                    variant: 'error',
                })
            );
        } else if (
            senderFormValues?.senderEmail !== '' &&
            senderFormValues?.senderEmail === receiverFormValues?.recieverEmail
        ) {
            dispatch(
                showToast({
                    description: 'The sender and receiver email addresses cannot be the same',
                    variant: 'error',
                })
            );
        } else if (
            senderFormValues?.senderPhone !== '' &&
            senderFormValues?.senderPhone === receiverFormValues?.recieverPhone
        ) {
            dispatch(
                showToast({
                    description: 'The sender and receiver phone numbers cannot be the same',
                    variant: 'error',
                })
            );
        } else if (!isSenderPinVerified) {
            dispatch(
                showToast({
                    description: 'The sender pincode should be verified',
                    variant: 'error',
                })
            );
        } else if (!isReceiverPinVerified) {
            dispatch(
                showToast({
                    description: 'The receiver pincode should be verified',
                    variant: 'error',
                })
            );
        } else {
            senderFormRef.current?.handleSubmit();
            recieverFormRef.current?.handleSubmit();
            typeRef?.current?.handleSubmit();
        }
    }, [
        senderFormRef,
        recieverFormRef,
        typeRef,
        isSenderPinVerified,
        isReceiverPinVerified,
        dispatch,
    ]);

    return (
        <Content className="px-0 mb-8 ">
            <Header />
            <ShipmentType name="serviceType" />
            <Tabs className="mt-8 sm:hidden" defaultActiveKey="1" items={items} />
            <Flex justify="center" className="hidden mt-2 sm:flex" style={{ width: '100%' }}>
                <Flex align="center" vertical className="w-2/6">
                    <SenderDetails
                        onFormSubmit={handleSenderFormSubmit}
                        senderFormRef={senderFormRef}
                        handleSenderPinVerified={setIsSenderPinVerified}
                    />
                </Flex>
                <Flex align="center" className="w-1/6">
                    {' '}
                    <Image src={sendParcel} preview={false} />
                </Flex>
                <Flex align="center" vertical className="w-2/6">
                    <ReceiverDetails
                        recieverFormRef={recieverFormRef}
                        onFormSubmit={handleRecieverFormSubmit}
                        handleReceiverPinVerified={setIsReceiverPinVerified}
                    />
                </Flex>
            </Flex>

            <Flex justify="center" align="center">
                <Flex align="center" justify="space-between" className="w-full sm:w-10/12">
                    <Button
                        style={{ backgroundColor: colorPrimary, color: 'white' }}
                        // htmlType="submit"
                        onClick={handleNext}
                        type="primary"
                        className="w-32 sm:mx-5 md:mx-8 lg:mx-10"
                    >
                        Next
                    </Button>
                </Flex>
            </Flex>
        </Content>
    );
};

export default LogisticsHome;
