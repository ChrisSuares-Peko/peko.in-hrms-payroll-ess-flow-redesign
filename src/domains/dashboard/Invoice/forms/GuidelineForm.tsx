import React from 'react';

import { Col, Row } from 'antd';
import { Formik } from 'formik';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import GuidelineDetails from './GuidelineDetails';
import useGuidelines from '../hooks/useGuidelines';
import { DaysSchema } from '../schema/index';
import { setpaymentLinkPayload } from '../slices/InvoicesSlices';
import { getpaymentlinkPayload } from '../types/paymentlinkType';

interface props {
    trackerData?: any;
    refetch?: any;
    isViewPage?: boolean;
}
const GuidelineForm = ({ trackerData, refetch, isViewPage }: props) => {
    const { Details, invoiceResponse, invoiceId } = useAppSelector(state => state.reducer.invoices);
    const { guidelineAdd, data, isLoading } = useGuidelines();
    const dispatch = useDispatch();
    let formPayload: getpaymentlinkPayload;

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
    const initialItems = [
        {
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
        },
    ];
    const validateTemplates = (values: any) => {
        const isInvalid = values.data.some((item: any) => {
            if (
                (item.email &&
                    (!item.templet.email ||
                        !item.templet.email.emailId ||
                        !item.templet.email.subject ||
                        !item.templet.email.body)) ||
                (item.sms && (!item.templet.sms.mobileNo || !item.templet.sms.body))
            ) {
                return true;
            }
            return false;
        });
        return isInvalid;
    };

    const isValidate = (values: any) => {
        const isvalid = values.data.some((item: any) => !item.sms && !item.email);
        return isvalid;
    };

    return (
        <Formik
            initialValues={{
                data: initialItems,
                invoiceId: Details?.id || invoiceId,
            }}
            onSubmit={async values => {
                const isValid = isValidate(values);
                if (isValid) {
                    dispatch(
                        showToast({
                            description: 'Please select the SMS or Email.',
                            variant: 'error',
                        })
                    );
                } else if (validateTemplates(values)) {
                    dispatch(
                        showToast({
                            description:
                                'Please fill in at least one template(SMS or Email) for each item',
                            variant: 'error',
                        })
                    );
                } else {
                    dispatch(setpaymentLinkPayload(formPayload));
                    await guidelineAdd({ ...values, ...formPayload }, isViewPage || false);
                    refetch();
                }
            }}
            validationSchema={DaysSchema}
        >
            {({ handleSubmit, values }) => (
                <form onSubmit={handleSubmit}>
                    <Row>
                        <Col span={24} className="mt-7">
                            <GuidelineDetails
                                isLoading={isLoading}
                                values={values.data}
                                data={data}
                                trackerData={trackerData}
                            />
                        </Col>
                    </Row>
                </form>
            )}
        </Formik>
    );
};

export default GuidelineForm;
