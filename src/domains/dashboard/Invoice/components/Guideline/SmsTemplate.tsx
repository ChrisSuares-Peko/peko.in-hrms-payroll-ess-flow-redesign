import { useEffect, useState } from 'react';

import { Button, Flex, Input, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikValues, useFormikContext } from 'formik';

interface modalProps {
    index: number;
    handleCancel: () => void;
    templateData: any[];
}

const { Text } = Typography;

const SmsTemplate = ({ index, handleCancel, templateData }: modalProps) => {
    const { values, setFieldValue, setFieldError } = useFormikContext<FormikValues>();

    const smsTemplates = templateData.filter(data => data.type === 'sms');
    const [template, setTemplate] = useState<number>(1);
    const [currentTemplate, setCurrentTemplate] = useState<any>(
        smsTemplates && smsTemplates.length && smsTemplates[template]
    );

    const [smsError, setSMSError] = useState({
        body: '',
    });

    function handleTemplateSelect(i: number) {
        setTemplate(i);
        if (i <= smsTemplates.length) setCurrentTemplate(smsTemplates[i - 1]);
        else if (values.data[index].templet?.sms?.index === smsTemplates.length + 1) {
            setCurrentTemplate({
                body: values.data[index].templet?.sms?.body || '',
            });
        } else {
            setCurrentTemplate({
                body: '',
            });
        }
    }

    const onChangeValidation = (value: string) => {
        if (value === '') {
            setSMSError({
                body: 'SMS body is required',
            });
        } else {
            setSMSError(prev => ({
                body: '',
            }));
        }
    };

    const handleSubmit = () => {
        if (currentTemplate.body === '') {
            setFieldError(`data[${index}].templet.sms.body`, 'SMS body is required');
            setSMSError({
                body: 'SMS body is required',
            });
        }
        if (currentTemplate.body) {
            setFieldValue(`data[${index}].templet.sms.body`, currentTemplate?.body);
            setFieldValue(`data[${index}].templet.sms.index`, template);
            handleCancel();
        }
    };

    const handleChange = (e: any) => {
        setCurrentTemplate((prev: any) => ({
            ...prev,
            ...e,
        }));
    };

    const [isTemplateUpdated, setIsTemplateUpdate] = useState<boolean>(false);
    useEffect(() => {
        if (values && values.data[index]?.templet?.sms?.index && !isTemplateUpdated) {
            setTemplate(values.data[index].templet.sms.index);
            if (values.data[index].templet.sms.index > smsTemplates.length) {
                setCurrentTemplate({
                    body: values.data[index].templet.sms.body,
                });
            }
            setIsTemplateUpdate(true);
        }
    }, [index, values, isTemplateUpdated, smsTemplates]);

    return (
        <Content>
            {/* <TextInput label="Subject" name={`data[${index}].templet.email.emailId`} placeholder="Subject" type="text" classes='' /> */}
            <Flex gap={5} vertical className="">
                <Text>Body</Text>
                <Input.TextArea
                    name={`data[${index}].templet.sms.body`}
                    placeholder="Enter sms body"
                    size="large"
                    value={currentTemplate.body}
                    disabled={template !== smsTemplates.length + 1}
                    style={{ height: 280, resize: 'none' }}
                    maxLength={200}
                    onChange={e => {
                        onChangeValidation(e.target.value);
                        handleChange({
                            body: e.target.value,
                        });
                    }}
                />
                {smsError?.body && (
                    <Flex className="mb-0 error-message" style={{ color: '#FF3A3A' }}>
                        {smsError?.body}
                    </Flex>
                )}
            </Flex>
            <Flex className="mt-5" gap={10}>
                {smsTemplates.map(
                    (temp, i: number) =>
                        i < smsTemplates.length && (
                            <Button
                                key={i}
                                type="default"
                                style={{ borderColor: template === i + 1 ? '#ff3a3a' : '' }}
                                onClick={() => handleTemplateSelect(i + 1)}
                            >
                                Template {i + 1}
                            </Button>
                        )
                )}

                <Button
                    type="default"
                    style={{ borderColor: template === smsTemplates.length + 1 ? '#ff3a3a' : '' }}
                    onClick={() => handleTemplateSelect(smsTemplates.length + 1)}
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
