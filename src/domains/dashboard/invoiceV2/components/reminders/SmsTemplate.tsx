import { useEffect, useState } from 'react';

import { Button, Flex, Input, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikValues, useFormikContext } from 'formik';

import { removeEmoji } from '@utils/regex';

interface Props {
    index: number;
    handleCancel: () => void;
    templateData: any[];
    invoiceDetails: { invoiceNo?: string; dueDate?: string };
    paymentDetails: { amountDue?: string };
    recipientDetails: { customerName?: string; customerPhone?: string; customerEmail?: string };
}

const replacePlaceholders = (
    str: string,
    customerName: string,
    dueDate: string,
    amount: string,
    invoiceNo: string
) =>
    str
        .replace('[Customer Name]', customerName || '')
        .replace('[Due Date]', dueDate || '')
        .replace('[Amount]', amount || '')
        .replace('[service/product]', 'invoice')
        .replace('[Invoice Number]', invoiceNo || '');

const SmsTemplate = ({
    index,
    handleCancel,
    templateData,
    invoiceDetails,
    paymentDetails,
    recipientDetails,
}: Props) => {
    const { values, setFieldValue, setFieldError } = useFormikContext<FormikValues>();

    const smsTemplates = templateData
        .map(data => {
            if (data.type === 'sms') {
                const d = { ...data };
                d.body = replacePlaceholders(
                    d.body,
                    recipientDetails?.customerName || '',
                    invoiceDetails?.dueDate || '',
                    paymentDetails?.amountDue || '',
                    invoiceDetails?.invoiceNo || ''
                );
                return d;
            }
            return data;
        })
        .filter((d: any) => d.type === 'sms');

    const [template, setTemplate] = useState<number>(1);
    const [currentTemplate, setCurrentTemplate] = useState<any>(
        smsTemplates.length ? smsTemplates[0] : { body: '' }
    );
    const [smsError, setSmsError] = useState({ body: '' });
    const [isTemplateUpdated, setIsTemplateUpdated] = useState(false);

    useEffect(() => {
        if (values?.data[index]?.templet?.sms?.index && !isTemplateUpdated) {
            const idx = values.data[index].templet.sms.index;
            setTemplate(idx);
            if (idx > smsTemplates.length) {
                setCurrentTemplate({ body: values.data[index].templet.sms.body || '' });
            } else if (smsTemplates[idx - 1]) {
                setCurrentTemplate(smsTemplates[idx - 1]);
            }
            setIsTemplateUpdated(true);
        }
    }, [values, index, isTemplateUpdated, smsTemplates]);

    const handleTemplateSelect = (i: number) => {
        setTemplate(i);
        if (i <= smsTemplates.length) setCurrentTemplate(smsTemplates[i - 1]);
        else setCurrentTemplate({ body: '' });
    };

    const handleSubmit = () => {
        if (!currentTemplate?.body) {
            setSmsError({ body: 'Please enter the SMS body' });
            setFieldError(`data[${index}].templet.sms.body`, 'Please enter the SMS body');
            return;
        }
        setFieldValue(`data[${index}].templet.sms.body`, currentTemplate.body);
        setFieldValue(`data[${index}].templet.sms.index`, template);
        setFieldValue(`data[${index}].templet.sms.mobileNo`, recipientDetails?.customerPhone ?? '');
        handleCancel();
    };

    return (
        <Content>
            <Flex gap={5} vertical>
                <Typography.Text>Body</Typography.Text>
                <Input.TextArea
                    placeholder="Enter SMS body"
                    size="large"
                    value={currentTemplate?.body}
                    disabled={template !== smsTemplates.length + 1}
                    style={{ height: 280, resize: 'none' }}
                    maxLength={200}
                    onChange={e => {
                        const v = e.target.value.replace(removeEmoji, '');
                        if (!v) setSmsError({ body: 'Please enter the SMS body' });
                        else setSmsError({ body: '' });
                        setCurrentTemplate((prev: any) => ({ ...prev, body: v }));
                    }}
                />
                {smsError.body && (
                    <span style={{ color: '#FF3A3A', fontSize: 12 }}>{smsError.body}</span>
                )}
            </Flex>
            <Flex className="mt-4" gap={10} wrap="wrap">
                {smsTemplates.map((_t: any, i: number) => (
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
                    style={{ borderColor: template === smsTemplates.length + 1 ? '#ff3a3a' : '' }}
                    onClick={() => handleTemplateSelect(smsTemplates.length + 1)}
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

export default SmsTemplate;
