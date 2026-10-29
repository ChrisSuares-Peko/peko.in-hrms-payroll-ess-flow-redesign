import React from 'react';

import { DeleteOutlined } from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { FieldArray } from 'formik';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import add from '@domains/dashboard/Invoice/assets/add.svg';
import AddGuideline from '@domains/dashboard/Invoice/components/AddGuideline';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import useGetPaymentlink from '../hooks/useGetPaymentlinkApi';
import { setpaymentLinkPayload } from '../slices/InvoicesSlices';
import { NotificationDetails, Row } from '../types/guidelineTypes';

type WishListProps = {
    values: NotificationDetails[];
    data: Row[];
    isLoading: boolean;
    trackerData?: any;
};
const { Text } = Typography;

const GuidelineDetails = ({ values, data, isLoading, trackerData }: WishListProps) => {
    const { Details, invoiceResponse, invoiceId } = useAppSelector(state => state.reducer.invoices);
    const { getPaymentLink, isLoading: pgLinkBtnLoading } = useGetPaymentlink();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    let formPayload: any;

    if (invoiceResponse && Object.keys(invoiceResponse).length > 0) {
        const formDetails = JSON.parse(invoiceResponse.recipientDetails);

        formPayload = {
            full_name: formDetails.customerName,
            email: formDetails.customerEmail,
            phone_number: formDetails.customerPhone,
            amount: invoiceResponse.amount,
            expires_at: 24,
            purpose_message: 'Invoice payment',
            notification: 'EML',
            invoiceId: invoiceResponse.id,
        };
    } else {

        formPayload = {
            full_name: trackerData.recipientDetails.customerName,
            email: trackerData.recipientDetails.customerEmail,
            phone_number: trackerData.recipientDetails.customerPhone,
            amount: trackerData.amount,
            expires_at: 24,
            purpose_message: 'Invoice payment',
            notification: 'EML',
        };
    }

    return (
        <Flex vertical>
            <Flex justify="space-between" align="center" className="w-full">
                <Text className="text-xl font-medium">Invoice Reminders</Text>
                <FieldArray name="data">
                    {({ push }) =>
                        values.length < 10 && (
                            <Flex className="cursor-pointer" gap={6}>
                                <ReactSVG className="mt-1" src={add} />
                                <Text
                                    className="font-medium text-bgOrange2"
                                    onClick={() =>
                                        push({
                                            days: '',
                                            sms: false,
                                            email: false,
                                            notification: false,
                                            actionDate: '',
                                            templet: {
                                                email: {
                                                    emailId: '',
                                                    subject: '',
                                                    body: '',
                                                    index: '',
                                                },
                                                sms: {
                                                    mobileNo: '',
                                                    body: '',
                                                    index: '',
                                                },
                                            },

                                            invoiceId: Details?.id || invoiceId,
                                        })
                                    }
                                >
                                    Add another condition
                                </Text>
                            </Flex>
                        )
                    }
                </FieldArray>
            </Flex>
            <Flex vertical className="w-full mt-5">
                <FieldArray name="data">
                    {({ push, remove }) => (
                        <>
                            {values.map((_, index) => (
                                <Flex key={index} align="center">
                                    <AddGuideline
                                        index={index}
                                        templateData={data}
                                        due={trackerData?.invoiceDetails?.dueDate}
                                    />
                                    <DeleteOutlined
                                        onClick={() => remove(index)}
                                        className="text-xl text-bgOrange2 pl-3"
                                        style={index === 0 ? { visibility: 'hidden' } : {}}
                                    />
                                </Flex>
                            ))}
                        </>
                    )}
                </FieldArray>
            </Flex>
            <Flex gap={14} className="mt-5">
                {Details?.paymentMode === 'payment link' ? (
                    <>
                        <Button htmlType="submit" type="primary" danger loading={isLoading}>
                            Generate Payment Link
                        </Button>
                        <Button
                            htmlType="button"
                            danger
                            loading={pgLinkBtnLoading}
                            onClick={() => {
                                dispatch(setpaymentLinkPayload(formPayload));
                                getPaymentLink(formPayload);
                            }}
                        >
                            Skip and Generate Link
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            htmlType="submit"
                            type="primary"
                            className="w-fit mt-8 px-10"
                            danger
                            loading={isLoading}
                        >
                            Submit
                        </Button>
                        <Button
                            htmlType="button"
                            danger
                            className="mt-8 "
                            loading={pgLinkBtnLoading}
                            onClick={() => {
                                navigate(`/${paths.invoice.index}/${paths.invoice.invoicehistory}`);
                            }}
                        >
                            Skip
                        </Button>
                    </>
                )}
            </Flex>
        </Flex>
    );
};

export default GuidelineDetails;
