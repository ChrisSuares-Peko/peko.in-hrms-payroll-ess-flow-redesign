import { useRef, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Select, Typography, Upload } from 'antd';
import { Field, FieldProps, FormikProps, getIn } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useUpdateTemplate from '../../hooks/useUpdateTemplates';
import template from '../../schema/template';
import { refresh } from '../../types/disabledTypes';
import { formInputs, Template } from '../../types/invoiceTemplates';
import { templateTypes } from '../../utils/templateTypes';

const { Text } = Typography;
const { Option } = Select;
const placeholders = [
    '[Customer Name]',
    '[Invoice Number]',
    '[Due Date]',
    '[Amount]',
    '[service/product]',
    '[Branding]',
];

type TemplateModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Template;
};

const TemplateModal = ({ open, handleCancel, data, setRefresh }: TemplateModalProps & refresh) => {
    const dispatch = useAppDispatch();
    const { updateCurrentTemplate, createNewTemplate, isLoading } = useUpdateTemplate();
    const [selectedPlaceholder, setSelectedPlaceholder] = useState('');
    const [selectedType, setSelectedType] = useState(data?.type || '');
    const [imageState, setImageState] = useState<{ imageBase: string; imageFormat: string } | null>(null);
    const formRef = useRef<FormikProps<formInputs>>(null);

    const insertPlaceholder = () => {
        if (selectedPlaceholder && formRef.current) {
            const bodyvalue = formRef.current?.values.body;
            formRef.current?.setFieldValue('body', `${bodyvalue}${selectedPlaceholder}`);
        }
    };

    return (
        <CustomModalWithForm
            formRefName={formRef}
            modalTitle="Invoice Template Management"
            open={open}
            isLoading={isLoading}
            validationSchema={template}
            handleCancel={() => {
                setImageState(null);
                handleCancel();
            }}
            handleFormSubmit={async values => {
                const payload: any = { ...values };
                if (imageState?.imageBase && imageState?.imageFormat) {
                    payload.image = imageState;
                }
                let res: boolean;
                if (data) {
                    res = await updateCurrentTemplate(payload);
                } else {
                    res = await createNewTemplate(payload);
                }
                if (res === true) {
                    setRefresh(true);
                    setImageState(null);
                    if (data)
                        dispatch(
                            showToast({
                                description: `Template updated successfully`,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: `Template added successfully`,
                                variant: 'success',
                            })
                        );
                    handleCancel();
                }
                if (res === false) {
                    dispatch(
                        showToast({
                            description: `Something went wrong, please try again later`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                id: data?.id || '',
                type: data?.type || '',
                subject: data?.subject || '',
                body: data?.body || '',
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <SelectInput
                        name="type"
                        label="Type"
                        placeholder="Select type"
                        isRequired
                        classes="rounded-sm"
                        options={templateTypes}
                        showSearch
                        handleChange={value => setSelectedType(value)}
                    />
                    <TextInput
                        name="subject"
                        label="Subject"
                        type="text"
                        placeholder="Enter subject"
                        isRequired
                        classes="rounded-sm"
                    />
                    <Field name="body">
                        {({ field, form: { touched, errors, setFieldValue } }: FieldProps) => (
                            <Form.Item
                                label="Body"
                                required
                                validateStatus={getIn(touched, 'body') && getIn(errors, 'body') ? 'error' : ''}
                                help={getIn(touched, 'body') && getIn(errors, 'body') ? (getIn(errors, 'body') as React.ReactNode) : undefined}
                            >
                                <Input.TextArea
                                    {...field}
                                    id="body"
                                    placeholder="Enter body"
                                    style={{ height: 240, resize: 'none', overflowY: 'auto' }}
                                    onChange={e => setFieldValue('body', e.target.value)}
                                />
                            </Form.Item>
                        )}
                    </Field>
                    {selectedType === 'invoiceTemplate' && (
                        <Form.Item label="Template Image">
                            <Upload
                                accept="image/jpeg,image/jpg,image/png"
                                maxCount={1}
                                showUploadList
                                beforeUpload={file => {
                                    const reader = new FileReader();
                                    reader.onload = e => {
                                        const result = e.target?.result as string;
                                        setImageState({
                                            imageBase: result.split(',')[1],
                                            imageFormat: file.type.split('/')[1],
                                        });
                                    };
                                    reader.readAsDataURL(file);
                                    return false;
                                }}
                                onRemove={() => setImageState(null)}
                            >
                                <Button size="small" icon={<UploadOutlined />}>
                                    Click to Upload
                                </Button>
                            </Upload>
                            {data?.imageUrl && !imageState && (
                                <img
                                    src={data.imageUrl}
                                    alt="Current template"
                                    className="mt-2 h-16 object-contain rounded border border-gray-100"
                                />
                            )}
                        </Form.Item>
                    )}
                    {selectedType !== 'invoiceTemplate' && (
                        <>
                            <Flex>
                                <Select
                                    showSearch
                                    onChange={value => setSelectedPlaceholder(value)}
                                    placeholder="Select placeholder"
                                    style={{ width: '200px' }}
                                >
                                    {placeholders.map(placeholder => (
                                        <Option key={placeholder} value={placeholder}>
                                            {placeholder}
                                        </Option>
                                    ))}
                                </Select>
                                <Button onClick={insertPlaceholder}>Insert</Button>
                            </Flex>
                            <Text type="secondary" style={{ marginTop: '8px' }}>
                                Select a placeholder and click Insert to add it to the Invoice body.
                            </Text>
                        </>
                    )}
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default TemplateModal;
