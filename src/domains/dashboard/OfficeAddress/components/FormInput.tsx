import { Button, Flex, Form, Radio, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import { Formik } from 'formik';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import FileUploadInput from './FileUploadInput';
import useBasicInfoApi from '../../profile/hooks/useBasicInfoApi';
import useForm from '../hooks/useForm';
import { planSchema } from '../schema/index';

const FormInput = ({
    locationRequired = false,
    buttonState = null,
    setButtonState = null,
}: {
    locationRequired?: boolean;
    buttonState?: number | null;
    setButtonState?: null | any;
}) => {
    const { handleSubmission, isLoading } = useForm();
    const { workspaceId } = useAppSelector(state => state.reducer.plan);
    const dispatch = useAppDispatch();
    const { data } = useBasicInfoApi({});

    const handleButtonClick = () => {
        if (setButtonState !== null && buttonState !== null) setButtonState(buttonState + 1);
    };
    return (
        <Formik
            initialValues={{
                licenseType: 'existing',
                companyName: data?.name || '',
                expiryDate: '',
                tradeLicenseDoc: '',
                visaDoc: '',
            }}
            validationSchema={planSchema}
            onSubmit={values => {
                if (locationRequired && !workspaceId) {
                    dispatch(
                        showToast({
                            description: 'Please choose a workspace location',
                            variant: 'warning',
                        })
                    );
                    return;
                }
                handleSubmission(values);
            }}
        >
            {({ handleSubmit, handleChange, errors, touched }) => (
                <Form onFinish={handleSubmit} layout="vertical" className="xl:w-2/4">
                    <Form.Item
                        help={
                            errors.licenseType &&
                            touched.licenseType && (
                                <Typography.Text className="text-sm font-normal text-red-500 ">
                                    {errors.licenseType as string}
                                </Typography.Text>
                            )
                        }
                    >
                        <Radio.Group
                            defaultValue="existing"
                            name="licenseType"
                            onChange={handleChange}
                        >
                            <Radio value="existing">Existing License</Radio>
                            <Radio value="new">New License</Radio>
                        </Radio.Group>
                    </Form.Item>
                    <Flex vertical className="">
                        <Space direction="vertical" size={0}>
                            <Typography.Text>
                                <Typography.Text
                                    className="mr-1 text-center text-md"
                                    style={{ color: '#FF3A3A' }}
                                >
                                    *
                                </Typography.Text>
                                Company Name
                            </Typography.Text>
                        </Space>
                    </Flex>
                    <TextInput
                        name="companyName"
                        label=""
                        placeholder="Enter Company Name"
                        type="text"
                        maxLength={50}
                    />
                    <Flex vertical className="">
                        <Space direction="vertical" size={0}>
                            <Typography.Text>
                                <Typography.Text
                                    className="mr-1 text-center text-md"
                                    style={{ color: '#FF3A3A' }}
                                >
                                    *
                                </Typography.Text>
                                Expiry Date
                            </Typography.Text>
                        </Space>
                        <DatePickerInput
                            name="expiryDate"
                            label=""
                            placeholder="Enter Expiry Date"
                            classes="w-full"
                            minDate={dayjs(new Date())}
                        />
                    </Flex>
                    <Form.Item
                        className="mb-0"
                        label={
                            <Space direction="vertical" size={0}>
                                <Typography.Text>
                                    {' '}
                                    <Typography.Text
                                        className="mr-1 text-center text-md"
                                        style={{ color: '#FF3A3A' }}
                                    >
                                        *
                                    </Typography.Text>
                                    Owner Visa Copy
                                </Typography.Text>

                                <Typography.Text
                                    type="secondary"
                                    style={{ fontSize: '12px', marginLeft: '10px' }}
                                >
                                    (File Formats Supported: JPG, JPEG, PNG, and PDF. Max. size: 5
                                    MB)
                                </Typography.Text>
                            </Space>
                        }
                        name="visaDoc"
                    >
                        <FileUploadInput
                            label=""
                            name="visaDoc"
                            showFileName
                            format="visaDocFormat"
                            classes="min-w-full h-9"
                            allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                            // isRequired
                        />
                    </Form.Item>
                    <Form.Item
                        className="mb-0"
                        label={
                            <Space direction="vertical" size={0}>
                                <Typography.Text>
                                    {' '}
                                    <Typography.Text
                                        className="mr-1 text-center text-md"
                                        style={{ color: '#FF3A3A' }}
                                    >
                                        *
                                    </Typography.Text>
                                    Trade License
                                </Typography.Text>

                                <Typography.Text
                                    type="secondary"
                                    style={{ fontSize: '12px', marginLeft: '10px' }}
                                >
                                    (File Formats Supported: JPG, JPEG, PNG, and PDF. Max. size: 5
                                    MB)
                                </Typography.Text>
                            </Space>
                        }
                        name="tradeLicenseDoc"
                    >
                        <FileUploadInput
                            label=""
                            name="tradeLicenseDoc"
                            showFileName
                            format="tradeLicenseFormat"
                            classes="min-w-full h-9"
                            allowedFileTypes={['image/jpeg', 'image/png', 'application/pdf']}
                            // isRequired
                        />
                    </Form.Item>

                    <Button
                        danger
                        type="primary"
                        className="w-full mt-4 sm:w-2/4 "
                        htmlType="submit"
                        loading={isLoading}
                        onClick={() => handleButtonClick()}
                    >
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
};

export default FormInput;
