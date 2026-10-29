import React, { useState, RefObject, useEffect, useMemo, useCallback } from 'react';

import { Button, Flex, Form, Select, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { useFetchAddressApi } from '../hooks/useAddressApi';
import { useBasicDetails } from '../hooks/useBasicDetails';
import { useCheckPinCodeAvailibilityApi } from '../hooks/useCheckPinCodeApi';
import { useLogisticsStateListingApi } from '../hooks/useLogisticsStateListingApi';
import { senderSchema } from '../schema/index';
import { AddressField, SenderFormValues } from '../types/address';
import { formalTextFormatter } from '../utils/helperFunctions';

interface Props {
    senderFormRef: RefObject<FormikProps<SenderFormValues>>;
    onFormSubmit: (result: boolean) => void;
    handleSenderPinVerified: (value: boolean) => void;
}

const SenderDetails: React.FC<Props> = ({
    senderFormRef,
    onFormSubmit,
    handleSenderPinVerified,
}: Props) => {
    const { originAddress, shipmentDetails } = useAppSelector(state => state.reducer.logistics);
    const { handleFormSenderSubmit } = useBasicDetails();
    const { addressOptions, isLoading } = useFetchAddressApi(false);
    const [senderSelAddress, setSenderSelAddress] = useState<AddressField>();
    const [stateSearch, setStateSearch] = useState<string>('');
    const [isPinCodeServicable, setIsPinCodeServicable] = useState<boolean>(true);
    const [isCheckPinLoading, setIsCheckPinLoading] = useState<boolean>(false);
    const { stateList, isLoading: stateListIsLoading } = useLogisticsStateListingApi(stateSearch);
    const { handleCheckPincode } = useCheckPinCodeAvailibilityApi();

    const handleStateSearch = (searchValue: string) => {
        setStateSearch(searchValue);
    };

    const handleAddressChange = (value: string) => {
        setSenderSelAddress(JSON.parse(value));
        handleSenderPinVerified(false);
    };

    const handleCheckPinCodeFn = useCallback(
        (setFieldValue?: any) => {
            if (senderFormRef.current?.values.senderZipCode) {
                setIsCheckPinLoading(true);
                handleCheckPincode(senderFormRef.current?.values.senderZipCode)
                    .then(result => {
                        if (result.success) {
                            if (senderFormRef.current && senderFormRef.current?.values) {
                                if (setFieldValue) {
                                    setFieldValue('senderCity', formalTextFormatter(result?.data));
                                } else {
                                    senderFormRef.current.values.senderCity = formalTextFormatter(
                                        result?.data
                                    );
                                }
                            }
                            setIsPinCodeServicable(true);
                            handleSenderPinVerified(true);
                        } else {
                            setIsPinCodeServicable(false);
                            setFieldValue('senderCity', '');
                        }
                        setIsCheckPinLoading(false);
                    })
                    .catch((err: any) => {
                        setIsPinCodeServicable(false);
                        setIsCheckPinLoading(false);
                    });
            }
        },
        [senderFormRef, handleSenderPinVerified, handleCheckPincode]
    );

    useEffect(() => {
        handleCheckPinCodeFn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentDetails]);

    const initialValues = useMemo(
        () => ({
            senderName: senderSelAddress?.name ?? originAddress.Line1,
            senderCountry: 'IN',
            senderAddress: senderSelAddress?.address ?? originAddress.Line2,
            senderZipCode: senderSelAddress?.zipCode ?? originAddress.PostCode ?? '',
            senderCity: formalTextFormatter(originAddress.City) ?? '',
            senderState: senderSelAddress?.state ?? originAddress.State ?? '',
            senderPhone: senderSelAddress?.phoneNumber ?? originAddress.Line3,
            senderEmail: senderSelAddress?.email ?? originAddress.Description,
            senderRemark: senderSelAddress?.remark ?? originAddress.Remark ?? '',
            saveSenderAddress: false,
        }),
        [senderSelAddress, originAddress]
    );

    const validationSchema = useMemo(() => senderSchema, []);

    return (
        <Flex gap={2} vertical className="w-full sm:w-10/12 xl:w-10/12">
            <Flex className="hidden mb-6 text-lg font-medium sm:flex">Sender Details</Flex>
            <Typography.Text className="pb-2">Saved Address</Typography.Text>

            <Select
                loading={isLoading}
                allowClear
                placeholder="Select Address"
                optionFilterProp="children"
                onChange={handleAddressChange}
                options={addressOptions}
                className="mb-2"
            />
            <Formik
                enableReinitialize
                initialValues={initialValues}
                innerRef={senderFormRef}
                validationSchema={validationSchema}
                onSubmit={values => {
                    values.senderCity = values.senderCity.toLocaleUpperCase();
                    if (isPinCodeServicable) {
                        handleFormSenderSubmit(values)
                            .then(() => {
                                onFormSubmit(true);
                            })
                            .catch(error => {
                                onFormSubmit(false);
                            });
                    }
                }}
            >
                {({ handleSubmit, setFieldValue }) => (
                    <Form layout="vertical" onFinish={handleSubmit} autoComplete="off">
                        <TextInput
                            label="Name"
                            name="senderName"
                            placeholder="Enter Name"
                            type="text"
                            isRequired
                            allowAlphabetsAndSpaceOnly
                            maxLength={60}
                        />

                        <TextInput
                            label="Building Name/Number and Street name"
                            name="senderAddress"
                            placeholder="Enter Address"
                            type="text"
                            isRequired
                        />

                        <TextInput
                            label="PIN Code"
                            name="senderZipCode"
                            placeholder="Enter PIN Code"
                            type="text"
                            maxLength={10}
                            minLength={5}
                            allowNumbersOnly
                            // handleChange={handleSenderPincode}
                            suffix={
                                <Button
                                    className="text-sm text-red-600 cursor-pointer"
                                    onClick={() => handleCheckPinCodeFn(setFieldValue)}
                                >
                                    {isCheckPinLoading ? 'Checking..' : 'Check Pincode'}
                                </Button>
                            }
                            isRequired
                        />
                        {!isPinCodeServicable && (
                            <p className="mb-3 text-sm text-red-400">
                                This pincode is not servicable
                            </p>
                        )}

                        <TextInput
                            label="City"
                            name="senderCity"
                            placeholder="Your city"
                            type="text"
                            isRequired
                            isDisabled
                            maxLength={60}
                        />

                        <CustomSelectSearch
                            loading={stateListIsLoading}
                            name="senderState"
                            label="State"
                            placeholder="Select a State"
                            options={stateList}
                            onSearch={handleStateSearch}
                        />

                        <TextInput
                            label="Mobile Number"
                            name="senderPhone"
                            placeholder="Enter Mobile Number"
                            maxLength={10}
                            type="text"
                            isRequired
                            allowNumbersOnly
                        />

                        <TextInput
                            label="Email ID"
                            name="senderEmail"
                            placeholder="Enter Email ID"
                            type="email"
                            isRequired
                            maxLength={50}
                        />

                        <InputTextArea
                            label="Additional Remarks"
                            name="senderRemark"
                            placeholder="Enter Additional Remarks"
                            size="middle"
                            autoSize
                        />

                        <CheckboxInput name="saveSenderAddress"> Save this address</CheckboxInput>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default React.memo(SenderDetails);
