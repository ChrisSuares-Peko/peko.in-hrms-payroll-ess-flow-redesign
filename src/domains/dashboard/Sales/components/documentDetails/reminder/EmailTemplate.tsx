import { useEffect, useState } from 'react';

import { Button, Flex, Input, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikValues, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { removeEmoji } from '@utils/regex';

interface Props {
    index: number;
    handleCancel: () => void;
    templateData: any[];
    onHandleTemplate: () => void;
    invoiceDetails: { invoiceNo?: string; dueDate?: string };
    paymentDetails: { amountDue?: string };
    recipientDetails: { customerName?: string; customerPhone?: string; customerEmail?: string };
}

const replacePlaceholders = (
    str: string,
    customerName: string,
    dueDate: string,
    amount: string,
    invoiceNo: string,
    branding: string
) =>
    str
        .replace('[Customer Name]', customerName || '')
        .replace('[Due Date]', dueDate || '')
        .replace('[Amount]', amount || '')
        .replace('[service/product]', 'invoice')
        .replace('[Invoice Number]', invoiceNo || '')
        .replace('[Branding]', branding || '');

const replaceSubject = (str: string, invoiceNo: string) =>
    str.replace('[Invoice Number]', invoiceNo || '');

const EmailTemplate = ({
    index,
    handleCancel,
    templateData,
    onHandleTemplate,
    invoiceDetails,
    paymentDetails,
    recipientDetails,
}: Props) => {
    const { values, setFieldValue } = useFormikContext<FormikValues>();

    const emailTemplates = templateData
        .map(data => {
            if (data.type === 'email') {
                const d = { ...data };
                d.body = replacePlaceholders(
                    d.body,
                    recipientDetails?.customerName || '',
                    invoiceDetails?.dueDate || '',
                    paymentDetails?.amountDue || '',
                    invoiceDetails?.invoiceNo || '',
                    'Peko'
                );
                d.subject = replaceSubject(d.subject, invoiceDetails?.invoiceNo || '');
                return d;
            }
            return data;
        })
        .filter((d: any) => d.type === 'email');

    const [template, setTemplate] = useState<number>(1);
    const [currentTemplate, setCurrentTemplate] = useState<any>(
        emailTemplates.length ? emailTemplates[0] : { subject: '', body: '' }
    );
    const [emailError, setEmailError] = useState({ subject: '', body: '' });
    const [isTemplateUpdated, setIsTemplateUpdated] = useState(false);

    useEffect(() => {
        if (values?.data[index]?.templet?.email?.index && !isTemplateUpdated) {
            const idx = values.data[index].templet.email.index;
            setTemplate(idx);
            if (idx > emailTemplates.length) {
                setCurrentTemplate({
                    body: values.data[index].templet.email.body,
                    subject: values.data[index].templet.email.subject,
                });
            } else if (emailTemplates[idx - 1]) {
                setCurrentTemplate(emailTemplates[idx - 1]);
            }
            setIsTemplateUpdated(true);
        }
    }, [values, index, isTemplateUpdated, emailTemplates]);

    const handleTemplateSelect = (i: number) => {
        setTemplate(i);
        if (i <= emailTemplates.length) {
            setCurrentTemplate(emailTemplates[i - 1]);
        } else {
            setCurrentTemplate({ body: '', subject: '' });
        }
    };

    const handleSubmit = () => {
        const errors: any = {};
        if (!currentTemplate?.body) errors.body = 'Please enter the email body';
        if (!currentTemplate?.subject) errors.subject = 'Please enter the email subject';
        setEmailError(errors);

        if (!errors.body && !errors.subject) {
            setFieldValue(`data[${index}].templet.email.body`, currentTemplate.body);
            setFieldValue(`data[${index}].templet.email.subject`, currentTemplate.subject);
            setFieldValue(`data[${index}].templet.email.index`, template);
            setFieldValue(
                `data[${index}].templet.email.emailId`,
                recipientDetails?.customerEmail ?? ''
            );

            if (values.data[index].sms) {
                onHandleTemplate();
            } else {
                handleCancel();
            }
        }
    };

    return (
        <Content>
            <Flex gap={5} vertical>
                <Typography.Text>Subject</Typography.Text>
                <TextInput
                    values={currentTemplate?.subject}
                    maxLength={50}
                    name={`data[${index}].templet.email.subject`}
                    placeholder="Enter Subject"
                    type="text"
                    isDisabled={template !== emailTemplates.length + 1}
                    handleChange={e => {
                        const v = e.replace(removeEmoji, '');
                        if (!v)
                            setEmailError(prev => ({
                                ...prev,
                                subject: 'Please enter the email subject',
                            }));
                        else setEmailError(prev => ({ ...prev, subject: '' }));
                        setCurrentTemplate((prev: any) => ({ ...prev, subject: v }));
                    }}
                />
                {emailError.subject && (
                    <span style={{ color: '#FF3A3A', fontSize: 12 }}>{emailError.subject}</span>
                )}
            </Flex>
            <Flex gap={5} vertical className="mt-3">
                <Typography.Text>Body</Typography.Text>
                <Input.TextArea
                    placeholder="Enter email body"
                    value={currentTemplate?.body}
                    size="large"
                    disabled={template !== emailTemplates.length + 1}
                    style={{ height: 280, resize: 'none' }}
                    maxLength={200}
                    onChange={e => {
                        const v = e.target.value.replace(removeEmoji, '');
                        if (!v)
                            setEmailError(prev => ({
                                ...prev,
                                body: 'Please enter the email body',
                            }));
                        else setEmailError(prev => ({ ...prev, body: '' }));
                        setCurrentTemplate((prev: any) => ({ ...prev, body: v }));
                    }}
                />
                {emailError.body && (
                    <span style={{ color: '#FF3A3A', fontSize: 12 }}>{emailError.body}</span>
                )}
            </Flex>
            <Flex className="mt-4" gap={10} wrap="wrap">
                {emailTemplates.map((_t: any, i: number) => (
                    <Button
                        key={i}
                        type="default"
                        style={{ borderColor: template === i + 1 ? '#ff3a3a' : '' }}
                        onClick={() => handleTemplateSelect(i + 1)}
                    >
                        Template {i + 1}
                    </Button>
                ))}
                <Button
                    type="default"
                    style={{ borderColor: template === emailTemplates.length + 1 ? '#ff3a3a' : '' }}
                    onClick={() => handleTemplateSelect(emailTemplates.length + 1)}
                >
                    Custom
                </Button>
            </Flex>
            <Flex className="mt-4" gap={10}>
                <Button danger type="primary" onClick={handleSubmit}>
                    Submit
                </Button>
                <Button onClick={handleCancel}>Cancel</Button>
            </Flex>
        </Content>
    );
};

export default EmailTemplate;
