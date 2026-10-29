import React, { RefObject, useEffect, useMemo, useState } from 'react';

import { Button, Flex, Form, Select, Typography } from 'antd';
import { Formik, FormikProps } from 'formik';

// import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppSelector } from '@src/hooks/store';

import { useFetchAddressApi } from '../hooks/useAddressApi';
import { useBasicDetails } from '../hooks/useBasicDetails';
import { useCheckPinCodeAvailibilityApi } from '../hooks/useCheckPinCodeApi';
import { useLogisticsStateListingApi } from '../hooks/useLogisticsStateListingApi';
import { recieverSchema } from '../schema/index';
// import { resetLogisticsDataState, setIsComingFromDetails } from '../slice/logisticsSlice';
import { AddressField, RecieverFormValues } from '../types/address';
import { formalTextFormatter } from '../utils/helperFunctions';

interface Props {
    recieverFormRef: RefObject<FormikProps<RecieverFormValues>>;
    onFormSubmit: (result: boolean) => void;
    handleReceiverPinVerified: (value: boolean) => void;
}

const ReceiverDetails: React.FC<Props> = ({
    recieverFormRef,
    onFormSubmit,
    handleReceiverPinVerified,
}: Props) => {
    const { handleFormRecieverSubmit } = useBasicDetails();

    const { addressOptions, isLoading } = useFetchAddressApi(true);
    const [recieverSelAddress, setRecieverSelAddress] = useState<AddressField>();
    const { destinationAddress, shipmentDetails } = useAppSelector(
        state => state.reducer.logistics
    );
    const [stateSearch, setStateSearch] = useState<string>('');
    const { stateList, isLoading: stateListIsLoading } = useLogisticsStateListingApi(stateSearch);
    const [isPinCodeServicable, setIsPinCodeServicable] = useState<boolean>(true);
    const [isCheckPinLoading, setIsCheckPinLoading] = useState<boolean>(false);
    const { handleCheckPincode } = useCheckPinCodeAvailibilityApi();

    const handleStateSearch = (searchValue: string) => {
        setStateSearch(searchValue);
    };

    const handleAddressChange = (value: string) => {
        setRecieverSelAddress(JSON.parse(value));
        handleReceiverPinVerified(false);
    };
    const handleCheckPinCodeFn = (setFieldValue?: any) => {
        if (recieverFormRef.current?.values.recieverZipCode) {
            setIsCheckPinLoading(true);
            handleCheckPincode(recieverFormRef.current?.values.recieverZipCode)
                .then(result => {
                    if (result.success) {
                        if (recieverFormRef.current && recieverFormRef.current?.values) {
                            if (setFieldValue) {
                                setFieldValue('recieverCity', formalTextFormatter(result?.data));
                            } else {
                                recieverFormRef.current.values.recieverCity = formalTextFormatter(
                                    result?.data
                                );
                            }
                        }
                        setIsPinCodeServicable(true);
                        handleReceiverPinVerified(true);
                    } else {
                        setIsPinCodeServicable(false);
                        setFieldValue('recieverCity', '');
                    }
                    setIsCheckPinLoading(false);
                })
                .catch((err: any) => {
                    setIsPinCodeServicable(false);
                    setIsCheckPinLoading(false);
                });
        }
    };
    useEffect(() => {
        handleCheckPinCodeFn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shipmentDetails]);

    const initialValues = useMemo(
        () => ({
            recieverName: recieverSelAddress?.name ?? destinationAddress.Line1,
            recieverCountry: destinationAddress.CountryCode ?? 'IN',
            recieverCity: formalTextFormatter(destinationAddress?.City) ?? '',
            recieverAddress: recieverSelAddress?.address ?? destinationAddress.Line2,
            recieverPhone: recieverSelAddress?.phoneNumber
                ? recieverSelAddress.phoneNumber.slice(-10)
                : destinationAddress.Line3,
            recieverEmail: recieverSelAddress?.email ?? destinationAddress.Description,
            recieverZipCode: recieverSelAddress?.zipCode ?? destinationAddress.PostCode ?? '',
            recieverSaveAddress: false,
            recieverRemark: destinationAddress.Remark ?? '',
            recieverState: recieverSelAddress?.state ?? destinationAddress.State ?? '',
        }),
        [recieverSelAddress, destinationAddress]
    );
    return (
        <Flex gap={2} vertical className="w-full sm:w-10/12 xl:w-10/12">
            <Flex className="hidden mb-6 text-lg font-medium sm:flex">Receiver Details</Flex>

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
                innerRef={recieverFormRef}
                validationSchema={recieverSchema()}
                onSubmit={values => {
                    values.recieverCity = values.recieverCity.toLocaleUpperCase();
                    if (isPinCodeServicable) {
                        handleFormRecieverSubmit(values)
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
                            name="recieverName"
                            placeholder="Enter Name"
                            type="text"
                            isRequired
                            allowAlphabetsAndSpaceOnly
                            maxLength={60}
                        />

                        <TextInput
                            label="Building Name/Number and Street name"
                            name="recieverAddress"
                            placeholder="Enter Address"
                            type="text"
                            isRequired
                        />

                        <TextInput
                            label="PIN Code"
                            name="recieverZipCode"
                            placeholder="Enter PIN Code"
                            type="text"
                            maxLength={10}
                            minLength={5}
                            allowNumbersOnly
                            // handleChange={handleRecieverPincode}
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
                            name="recieverCity"
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
                            name="recieverPhone"
                            placeholder="Enter Mobile Number"
                            maxLength={10}
                            type="text"
                            isRequired
                            allowNumbersOnly
                        />

                        <TextInput
                            label="Email ID"
                            name="recieverEmail"
                            placeholder="Enter Email ID"
                            type="email"
                            isRequired
                            maxLength={50}
                        />

                        <InputTextArea
                            label="Additional Remarks"
                            name="recieverRemark"
                            placeholder="Enter Additional Remarks"
                            size="middle"
                            autoSize
                        />

                        <CheckboxInput name="recieverSaveAddress"> Save this address</CheckboxInput>
                    </Form>
                )}
            </Formik>
        </Flex>
    );
};

export default React.memo(ReceiverDetails);
