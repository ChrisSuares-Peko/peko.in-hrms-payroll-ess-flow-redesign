/* eslint-disable no-plusplus */
import React, { useState } from 'react';

import { FileImageOutlined } from '@ant-design/icons';
import { Flex, Form, Typography, Upload } from 'antd';
import dayjs from 'dayjs';
import { Field } from 'formik';
import { useDispatch } from 'react-redux';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { setUserInfo } from '@src/slices/userSlice';

import AadhaarConsentModal from './AadhaarConsentModal';
import SuccessModal from './SuccessModal';
import { AdharOcr } from '../api';
import VerificationInput from './VerificationInput';
import useAadhaarVerification from '../hooks/useAadhaarVerification';
import useVerifyApi from '../hooks/useVerify';
import { generateYupSchema } from '../schema';
import { verificationConfigNew } from '../utils/data';

// Each verification service's MoEngage checkout event carries at most one identifying property —
// never the sensitive ID number itself (PAN, GSTIN, CIN, DIN, account number). Where the only
// identifying value available is that raw ID, the property is left out entirely and the checkout
// event fires with no extra data. `prefix` drives the checkout event name (`${prefix}_checkout`)
// — the verify/result events reuse the service's accessKey as-is (`accessKeys` / `${accessKeys}_result`).
const VERIFICATION_TRACKING: Record<
    string,
    { prefix: string; property?: string; getIdentifier?: (data: any, values: any) => any }
> = {
    pan_verify: { prefix: 'pan', property: 'name', getIdentifier: (_data, values) => values?.name },
    aadhar_verify: { prefix: 'aadhar', property: 'name', getIdentifier: (_data, values) => values?.name },
    bank_account_verify: {
        prefix: 'bank_account',
        property: 'account_holder_name',
        getIdentifier: data => verificationConfigNew.bank_account_verify?.getData?.(data, undefined)?.accountHolderName,
    },
    // No non-sensitive identifying field is available (the GSTIN itself isn't sent) — event
    // fires with no extra property.
    gst_return_check: { prefix: 'gst_return' },
    gstin_verify: {
        prefix: 'gstin',
        property: 'company_name',
        getIdentifier: data => {
            const resultData = verificationConfigNew.gstin_verify?.getData?.(data, undefined);
            return resultData?.lgnm || resultData?.tradeNam;
        },
    },
    // The PAN searched isn't sent — event fires with no extra property.
    gstin_pan: { prefix: 'gstin_pan' },
    gst_business_verify: {
        prefix: 'gst_business',
        property: 'company_name',
        getIdentifier: data => verificationConfigNew.gst_business_verify?.getData?.(data, undefined)?.lgnm,
    },
    // corporate_verify's response doesn't surface a company name (its result fields aren't
    // mapped in verificationConfigNew), and the CIN itself isn't sent — event fires with no
    // extra property.
    corporate_verify: { prefix: 'corporate' },
    director_verify_cin: { prefix: 'director_cin' },
    director_verify_din: { prefix: 'director_din' },
};

const trackVerificationCheckoutAndResult = (accessKeys: string, data: any, values: any) => {
    if (typeof Moengage?.track_event !== 'function') return;

    const tracking = VERIFICATION_TRACKING[accessKeys];
    const status = verificationConfigNew[accessKeys]?.getValidityStatus?.(data, undefined);

    Moengage.track_event(
        `${tracking?.prefix ?? accessKeys}_checkout`,
        tracking?.property ? { [tracking.property]: tracking.getIdentifier?.(data, values) } : undefined
    );
    Moengage.track_event(`${accessKeys}_result`, {
        status,
    });
};

interface AddressModalProps {
    open: boolean;
    handleCancel: () => void;
    inputComponents: any;
    title: string;
    accessKeys: string;
    serviceName: string;
}

const PanVerifyModal = ({
    open,
    handleCancel,
    inputComponents,
    title,
    accessKeys,
    serviceName,
}: AddressModalProps) => {
    const { verifyBank, isLoading } = useVerifyApi(accessKeys);
    const { generateLink, isGeneratingLink } = useAadhaarVerification();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const { user } = useAppSelector(state => state.reducer.user);
    const [formValues, setFormValues] = useState<any>();
    const [resp, setResp] = useState<any>(null);
    const [isAadhaarConsentOpen, setIsAadhaarConsentOpen] = useState(false);
    const [aadhaarLink, setAadhaarLink] = useState<string | null>(null);
    const [aadhaarReferenceNumber, setAadhaarReferenceNumber] = useState<string | null>(null);
    const [aadhaarTransactionId, setAadhaarTransactionId] = useState<string | null>(null);
    const dispatch = useDispatch();

    const generateInitialValues = (inputs: any) => {
        const initialValues: any = {};
        inputs.forEach((input: any) => {
            initialValues[input.name] = '';
        });
        return initialValues;
    };

    const initialValues = generateInitialValues(inputComponents);
    const minAgeDate = dayjs().subtract(18, 'years');
    const cancelModal = () => {
        setIsOpen(false);
        handleCancel();
    };
    const handleImageUpload = async (file: any) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            // Assuming you have an API function like verifyAdhar that can handle the FormData
            const response = await AdharOcr({
                userId: id,
                userType: role,
                image: formData, // Sending the image as FormData
            });
            dispatch(setUserInfo({ user: { ...user!, balance: response.corporateFinalBalance } }));
            return response;
        } catch (error) {
            console.error('Error uploading image:', error);
            return false;
        }
    };
    const getYearOptions = (start = 2010, end = 2024) => {
        const options = [];
        for (let y = end; y >= start; y--) {
            options.push({ label: `${y}`, value: y });
        }
        return options;
    };

    return (
        <>
            <CustomModalWithForm
                modalTitle={title}
                open={open}
                handleCancel={handleCancel}
                firstBtnTxt="Verify"
                isLoading={isLoading || isGeneratingLink}
                reinitialise
                handleFormSubmit={async value => {
                    const values = { ...value, title };
                    setFormValues(value);
                    if (accessKeys === 'aadhar_verify') {
                        setFormValues(value);
                        const linkData = await generateLink({
                            name: value.name,
                            email: value.email,
                            mobile: value.mobile,
                        });
                        if (linkData && linkData.link) {
                            setAadhaarLink(linkData.link);
                            setAadhaarReferenceNumber(linkData.reference_number);
                            setAadhaarTransactionId(linkData.transaction_id);
                            setIsAadhaarConsentOpen(true);
                        } else {
                            dispatch(
                                showToast({
                                    description:
                                        'Unable to start Aadhaar verification. Please try again.',
                                    variant: 'error',
                                })
                            );
                        }

                        return;
                    }
                    if (accessKeys === 'aadhar_ocr_verify') {
                        setFormValues(value);
                        const file = value.image;

                        if (file) {
                            const res = await handleImageUpload(file);
                            if (res) {
                                setResp({ ...res, accessKey: accessKeys, serviceName });
                                setIsOpen(true);
                            }
                        }
                        return;
                    }

                    const data = await verifyBank(values);

                    if (Object.keys(data).length > 0) {
                        setResp({ ...data, accessKey: accessKeys, serviceName });
                        trackVerificationCheckoutAndResult(accessKeys, data, values);
                        setIsOpen(true);
                    }
                }}
                initialValues={initialValues}
                validationSchema={generateYupSchema(inputComponents)}
                validateOnChange
            >
                <Flex vertical className="w-full mt-2">
                    <Form layout="vertical">
                        {inputComponents.map((input: any) => {
                            if (input.type === 'input') {
                                return (
                                    <VerificationInput
                                        key={input.name}
                                        name={input.name}
                                        label={input.label}
                                        type={input.type}
                                        placeholder={input.placeholder}
                                        classes="rounded-md h-9"
                                        maxLength={input.max}
                                        minLength={input.min}
                                        allowAlphabetsAndSpaceOnly={
                                            input.allowAlphabetsAndSpaceOnly
                                        }
                                        allowAlphabetsAndNumbersOnly={
                                            input.allowAlphabetsAndNumbersOnly
                                        }
                                        isRequired={input.required}
                                        allowNumbersOnly={input.allowNumbersOnly}
                                        allowUpperCaseOnly={input.allowUpperCaseOnly}
                                    />
                                );
                            }

                            if (input.type === 'date') {
                                return (
                                    <DatePickerInput
                                        key={input.name}
                                        name={input.name}
                                        label={input.label}
                                        placeholder={input.placeholder}
                                        classes="rounded-md w-full"
                                        isRequired={input.required}
                                        // maxDate={dayjs()}
                                        maxDate={minAgeDate}
                                        needConfirm={false}
                                        inputReadOnly
                                        format="DD/MM/YYYY"
                                    />
                                );
                            }
                            if (input.type === 'select') {
                                return (
                                    <SelectInput
                                        key={input.name}
                                        name={input.name}
                                        label={input.label}
                                        placeholder={input.placeholder}
                                        classes="rounded-md w-full"
                                        isRequired={input.required}
                                        showSearch
                                        filterOption={(inputValue, option) =>
                                            (option?.children as unknown as string)
                                                ?.toString()
                                                .toLowerCase()
                                                .includes(inputValue.toLowerCase())
                                        }
                                        options={input.options || []}
                                    />
                                );
                            }

                            if (input.type === 'dropdown') {
                                return (
                                    <Field name={input.name} key={input.name}>
                                        {({ form, meta }: any) => {
                                            const startYear = form.values[`${input.name}_start`];
                                            const currentYear = new Date().getFullYear();
                                            const allYears = getYearOptions(
                                                currentYear - 15,
                                                currentYear - 1
                                            );
                                            const endYear = startYear ? startYear + 1 : '';

                                            return (
                                                <Form.Item
                                                    label={input.label}
                                                    required={input.required}
                                                    className="w-full"
                                                >
                                                    <Flex vertical>
                                                        <Flex gap={10}>
                                                            <SelectInput
                                                                name={`${input.name}_start`}
                                                                placeholder="Start Year"
                                                                options={allYears}
                                                                handleChange={(value: any) => {
                                                                    const nextYear = value + 1;
                                                                    form.setFieldValue(
                                                                        `${input.name}_start`,
                                                                        value
                                                                    );
                                                                    form.setFieldValue(
                                                                        `${input.name}_end`,
                                                                        nextYear
                                                                    );
                                                                    form.setFieldValue(
                                                                        input.name,
                                                                        `${value}-${String(nextYear).slice(2)}`
                                                                    );
                                                                }}
                                                                classes="w-full"
                                                                isRequired={input.required}
                                                            />
                                                            <SelectInput
                                                                name={`${input.name}_end`}
                                                                placeholder="End Year"
                                                                options={
                                                                    startYear
                                                                        ? [
                                                                              {
                                                                                  label: `${endYear}`,
                                                                                  value: endYear,
                                                                              },
                                                                          ]
                                                                        : []
                                                                }
                                                                // isDisabled
                                                                classes="w-full"
                                                                isRequired={input.required}
                                                            />
                                                        </Flex>

                                                        {meta.touched && meta.error && (
                                                            <Typography.Text
                                                                type="danger"
                                                                className="block -mt-5"
                                                            >
                                                                {meta.error}
                                                            </Typography.Text>
                                                        )}
                                                    </Flex>
                                                </Form.Item>
                                            );
                                        }}
                                    </Field>
                                );
                            }

                            if (input.type === 'fileUpload') {
                                return (
                                    <Form.Item
                                        key={input.name}
                                        label={input.label}
                                        className="w-full"
                                        required
                                    >
                                        <Field name={input.name} className="w-full">
                                            {({ field, form, meta }: any) => (
                                                <Upload
                                                    listType="picture"
                                                    beforeUpload={file => {
                                                        const isValidFormat = [
                                                            'image/jpeg',
                                                            'image/png',
                                                        ].includes(file.type);
                                                        const isValidSize =
                                                            file.size / 1024 / 1024 <= 5; // 5 MB size limit

                                                        if (!isValidFormat) {
                                                            dispatch(
                                                                showToast({
                                                                    description: `Please upload JPG, JPEG, or PNG file.`,
                                                                    variant: 'error',
                                                                })
                                                            );
                                                            form.setFieldValue(input.name, '');
                                                            return false; // Reject the file
                                                        }

                                                        if (!isValidSize) {
                                                            dispatch(
                                                                showToast({
                                                                    description: `File size must be smaller than 5 MB`,
                                                                    variant: 'error',
                                                                })
                                                            );
                                                            form.setFieldValue(input.name, '');
                                                            return false; // Reject the file
                                                        }
                                                        form.setFieldValue(input.name, file); // Save file to Formik
                                                        return false; // Prevent auto-upload
                                                    }}
                                                    maxCount={1}
                                                    fileList={
                                                        field.value
                                                            ? [
                                                                  {
                                                                      uid: '-1',
                                                                      name: field.value.name,
                                                                      status: 'done',
                                                                  },
                                                              ]
                                                            : []
                                                    }
                                                    onRemove={() =>
                                                        form.setFieldValue(input.name, '')
                                                    }
                                                    accept=".jpg,.jpeg,.png"
                                                >
                                                    <div className="w-full p-4 text-center border border-dashed rounded-md cursor-pointer">
                                                        <FileImageOutlined className="text-2xl text-gray-500" />
                                                        <Typography.Text className="block mt-2 text-gray-500">
                                                            Click or drag file to this area to
                                                            upload
                                                        </Typography.Text>
                                                    </div>
                                                    {meta.touched && meta.error && (
                                                        <Typography.Text
                                                            type="danger"
                                                            className="block mt-1"
                                                        >
                                                            {meta.error}
                                                        </Typography.Text>
                                                    )}
                                                </Upload>
                                            )}
                                        </Field>

                                        <Typography.Text
                                            type="secondary"
                                            className="xxl:text-[0.7rem] md:text-[0.5rem] xl:text-[0.67rem] mt-2 "
                                        >
                                            (File Formats Supported: JPG, JPEG, and PNG. Max. size:
                                            5 MB)
                                        </Typography.Text>
                                    </Form.Item>
                                );
                            }

                            return null;
                        })}
                    </Form>
                </Flex>

                {isOpen && (
                    <SuccessModal
                        isOpen={isOpen}
                        handleCancel={cancelModal}
                        data={resp}
                        formValues={formValues}
                    />
                )}
            </CustomModalWithForm>

            <AadhaarConsentModal
                isOpen={isAadhaarConsentOpen}
                link={aadhaarLink}
                referenceNumber={aadhaarReferenceNumber}
                transactionId={aadhaarTransactionId}
                handleCancel={() => setIsAadhaarConsentOpen(false)}
                onVerified={data => {
                    setIsAadhaarConsentOpen(false);
                    setResp({ ...data, accessKey: accessKeys, serviceName });
                    trackVerificationCheckoutAndResult(accessKeys, data, formValues);
                    setIsOpen(true);
                }}
            />
        </>
    );
};

export default PanVerifyModal;
