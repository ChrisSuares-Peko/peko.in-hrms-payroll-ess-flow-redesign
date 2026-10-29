import { useCallback, useEffect, useState } from 'react';

import { Button, Flex, Input, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { FormikValues, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';

interface modalProps {
    index: number;
    handleCancel: () => void;
    templateData: any[];
    onHandleTemplate: any;
}
const { Text } = Typography;

const EmailTemplate = ({ index, handleCancel, templateData, onHandleTemplate }: modalProps) => {
    const { values, setFieldValue } = useFormikContext<FormikValues>();

    const emailTemplates = templateData.filter(data => data.type === 'email');
    const [template, setTemplate] = useState<number>(1);
    const [currentTemplate, setCurrentTemplate] = useState<any>(
        emailTemplates && emailTemplates.length && emailTemplates[template]
    );
    const [emailError, setEmailError] = useState({
        subject: '',
        body: '',
    });

    const handleTemplateSelect = useCallback(
        (i: number) => {
            setTemplate(i);
            if (i <= emailTemplates.length) {
                setCurrentTemplate(emailTemplates[i - 1]);
            } else if (values.data[index].templet?.email?.index === emailTemplates.length + 1) {
                setCurrentTemplate({
                    body: values.data[index].templet?.email?.body || '',
                    subject: values.data[index].templet?.email?.body || '',
                });
            } else {
                setCurrentTemplate({
                    body: '',
                    subject: '',
                });
            }
        },
        [emailTemplates, index, values.data]
    );

    const onChangeValidation = useCallback((name: string, value: string) => {
        let message = '';
        if (value === '') {
            message =
                name === 'subject'
                    ? 'Please enter the email subject'
                    : 'Please enter the email body';
        } else {
            setEmailError(prev => ({
                ...prev,
                [name]: message,
            }));
        }
    }, []);

    const handleSubmit = useCallback(() => {
        let errorObj: any = {};
        if (currentTemplate.body === '') {
            errorObj = {
                body: 'Please enter the email body',
            };
        }
        if (currentTemplate.subject === '') {
            errorObj.subject = 'Please enter the email subject';
        }
        setEmailError(errorObj);

        if (currentTemplate.body && currentTemplate.subject) {
            setFieldValue(`data[${index}].templet.email.body`, currentTemplate?.body);
            setFieldValue(`data[${index}].templet.email.subject`, currentTemplate?.subject);
            setFieldValue(`data[${index}].templet.email.index`, template);

            if (values.data[index].sms) {
                onHandleTemplate();
            } else {
                handleCancel();
            }
        }
    }, [
        currentTemplate.body,
        currentTemplate.subject,
        handleCancel,
        index,
        onHandleTemplate,
        setFieldValue,
        template,
        values.data,
    ]);

    const [isTemplateUpdated, setIsTemplateUpdate] = useState<boolean>(false);
    useEffect(() => {
        if (values && values.data[index]?.templet?.email?.index && !isTemplateUpdated) {
            setTemplate(values.data[index].templet.email.index);
            if (values.data[index].templet.email.index > emailTemplates.length) {
                setCurrentTemplate({
                    body: values.data[index].templet.email.body,
                    subject: values.data[index].templet.email.subject,
                });
            }
            setIsTemplateUpdate(true);
        }
    }, [values, index, isTemplateUpdated, emailTemplates]);

    const handleChange = useCallback((e: any) => {
        setCurrentTemplate((prev: any) => ({
            ...prev,
            ...e,
        }));
    }, []);

    return (
        <Content>
            <Flex gap={5} vertical className="">
                <Text>Subject</Text>
                <TextInput
                    values={currentTemplate.subject}
                    maxLength={50}
                    name={`data[${index}].templet.email.subject`}
                    placeholder="Enter Subject"
                    type="text"
                    isDisabled={template !== emailTemplates.length + 1}
                    handleChange={e => {
                        onChangeValidation('subject', e);
                        handleChange({
                            subject: e,
                        });
                    }}
                />
                {emailError.subject && (
                    <Flex className="error-message -mt-5  mb-0" style={{ color: '#FF3A3A' }}>
                        {emailError.subject}
                    </Flex>
                )}
            </Flex>
            {/* <TextInput label="Subject" name={`data[${index}].templet.email.emailId`} placeholder="Subject" type="text" classes='' /> */}
            <Flex gap={5} vertical className="">
                <Text>Body</Text>
                <Input.TextArea
                    name={`data[${index}].templet.email.body`}
                    placeholder="Enter email body"
                    value={currentTemplate.body}
                    size="large"
                    disabled={template !== emailTemplates.length + 1}
                    style={{ height: 280, resize: 'none' }}
                    maxLength={200}
                    onChange={e => {
                        onChangeValidation('body', e.target.value);
                        handleChange({
                            body: e.target.value,
                        });
                    }}
                />
                {emailError.body && (
                    <Flex className="error-message mb-0" style={{ color: '#FF3A3A' }}>
                        {emailError.body}
                    </Flex>
                )}
            </Flex>
            <Flex className="mt-5" gap={10}>
                {emailTemplates.map(
                    (temp, i: number) =>
                        i < emailTemplates.length && (
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
                    style={{ borderColor: template === emailTemplates.length + 1 ? '#ff3a3a' : '' }}
                    onClick={() => handleTemplateSelect(emailTemplates.length + 1)}
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

export default EmailTemplate;
