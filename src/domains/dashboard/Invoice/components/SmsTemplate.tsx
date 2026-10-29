/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';

import { Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { ErrorMessage, FormikValues, useFormikContext } from 'formik';

import { useAppSelector } from '@src/hooks/store';

import TextAreaInvoices from './TextAteaInvoice';

interface modalProps {
    index: number;
    handleCancel: () => void;
    templateData: any[];
}
const { Text } = Typography;

const SmsTemplate = ({ index, handleCancel, templateData }: modalProps) => {
    const { values, setFieldValue, setFieldError } = useFormikContext<FormikValues>();
    const { Details, trackerData } = useAppSelector(state => state.reducer.invoices);

    const [template, setTemplate] = useState<number>(1);

    const customerPhone =
        Details?.recipientDetails?.customerPhone || trackerData?.recipientDetails?.customerPhone;

    const replacePlaceholders = (
        templateString: string,
        recipientName: string,
        dueDate: string,
        amount: string,
        invoiceNo: any
    ) =>
        templateString
            .replace('[Customer Name]', recipientName)
            .replace('[Due Date]', dueDate)
            .replace('[Amount]', amount)
            .replace('[service/product]', 'invoice')
            .replace('[Invoice Number]', invoiceNo);

    const newTemplate = templateData
        .map(data => {
            if (data.type === 'sms') {
                // Safely access Details properties
                const customerName = Details?.recipientDetails?.customerName || '';
                const dueDate = Details?.invoiceDetails?.dueDate || '';
                const amountDue = Details?.paymentDetails?.amountDue || '';
                const invoiceNo = Details?.invoiceDetails?.invoiceNo || '';

                // Replace placeholders in the body
                data.body = replacePlaceholders(
                    data.body,
                    customerName,
                    dueDate,
                    amountDue,
                    invoiceNo
                );
            }
            return data;
        })
        .filter(data => data.type === 'sms');

    const handleTemplateSelect = (templateIndex: number, custom = false) => {
        setTemplate(templateIndex);
        setFieldValue(`data[${index}].templet.sms.index`, templateIndex);
        if (!custom) {
            // setFieldValue(
            //     `data[${index}].templet.sms.subject`,
            //     newTemplate[templateIndex].subject
            // );
            setFieldValue(`data[${index}].templet.sms.body`, newTemplate[templateIndex - 1]?.body);
        } else {
            // setFieldValue(`data[${index}].templet.sms.subject`, '');
            setFieldValue(`data[${index}].templet.sms.body`, '');
        }
    };
    useEffect(() => {
        if (!values) return;
        if (!values.data[index].templet.sms.mobileNo) {
            setFieldValue(`data[${index}].templet.sms.mobileNo`, customerPhone);
            setFieldValue(`data[${index}].templet.sms.body`, newTemplate[template - 1]?.body);
            setFieldValue(`data[${index}].templet.sms.index`, 0);
        } else {
            setTemplate(values.data[index].templet.sms.index);
        }
        // setFieldValue(`data[${index}].templet.sms.subject`, newTemplate[template - 1].subject);
    }, [values]);

    // eslint-disable-next-line consistent-return
    const handleSubmit = () => {
        // if (values.data[index].templet.email.subject === '') {
        //     setFieldError(`data[${index}].templet.email.subject`, 'Subject is required');
        // }
        if (values.data[index]?.templet?.sms?.body === '') {
            return setFieldError(`data[${index}].templet.sms.body`, 'SMS body is required');
        }
        if (values.data[index]?.templet?.sms?.body !== '') {
            setFieldValue(`data[${index}].templet.sms.index`, template);
            handleCancel();
        }

        //  handleCancel()
    };
    return (
        <Content>
            {/* <TextInput label="Subject" name={`data[${index}].templet.email.subject`} placeholder="Enter Subject" type="text" isDisabled={template!==4} /> */}
            {/* <TextInput label="Subject" name={`data[${index}].templet.email.emailId`} placeholder="Subject" type="text" classes='' /> */}
            <Flex vertical className="">
                <Text>Body</Text>
                <TextAreaInvoices
                    name={`data[${index}].templet.sms.body`}
                    placeholder="Enter sms body"
                    size="large"
                    isDisabled={template !== newTemplate.length + 1}
                    maxLength={200}
                />
                <ErrorMessage
                    name={`data[${index}].templet.sms.body`}
                    render={msg => (
                        <div className="mb-0 -mt-5 error-message" style={{ color: '#FF3A3A' }}>
                            {msg}
                        </div>
                    )}
                />
            </Flex>
            <Flex className="mt-5" gap={10}>
                {newTemplate.map(
                    (temp, idx: number) =>
                        idx < newTemplate.length && (
                            <Button
                                type="default"
                                style={{ borderColor: template === idx + 1 ? '#ff3a3a' : '' }}
                                onClick={() => handleTemplateSelect(idx + 1)}
                            >
                                Template {idx + 1}
                            </Button>
                        )
                )}

                <Button
                    type="default"
                    style={{ borderColor: template === 4 ? '#ff3a3a' : '' }}
                    onClick={() => handleTemplateSelect(newTemplate.length + 1, true)}
                >
                    Custom
                </Button>
            </Flex>
            <Flex className="mt-5" gap={10}>
                <Button danger type="primary" className="px-5 my-3" onClick={handleSubmit}>
                    Submit
                </Button>
                <Button onClick={handleCancel} type="default" className="px-5 my-3">
                    Cancel
                </Button>
            </Flex>
        </Content>
    );
};

export default SmsTemplate;
