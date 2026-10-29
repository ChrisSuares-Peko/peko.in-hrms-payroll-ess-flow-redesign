import { useState } from 'react';

import { Form, Modal, Row, Col, Select, Input, Spin } from 'antd';
import { Formik, FormikHelpers, useFormikContext } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { saveAddressApi, updateAddressApi } from '../../api/address';
import { useAddressCountries } from '../../hooks/home/useAddressCountries';
import { usePinLookup } from '../../hooks/home/usePinLookup';
import { buildAddressSchema } from '../../schema';
import { AddressFieldValue } from '../../types/address';

interface Props {
    isReceiver: boolean;
    isInternationalReceiver: boolean;
    onClose: () => void;
    onSaved?: () => void;
    editAddressData?: AddressFieldValue;
}

interface FormValues {
    name: string;
    phone: string;
    email: string;
    pinCode: string;
    addressLine1: string;
    addressLine2: string;
    state: string;
    city: string;
}

interface CountryOption {
    label: string;
    value: string;
}

// Inner component so we can access Formik context for PIN lookup
const PinCodeField = ({
    isInternationalReceiver,
    selectedCountry,
}: {
    isInternationalReceiver: boolean;
    selectedCountry: CountryOption | undefined;
}) => {
    const { setFieldValue, setFieldTouched } = useFormikContext<FormValues>();
    const { isLookingUp, handlePinLookup } = usePinLookup();

    return (
        <TextInput
            name="pinCode"
            label="PIN Code"
            placeholder="Enter PIN Code"
            type="text"
            isRequired
            maxLength={isInternationalReceiver ? 20 : 6}
            allowNumbersOnly={!isInternationalReceiver}
            suffix={isLookingUp ? <Spin size="small" /> : null}
            handleChange={val => {
                setFieldTouched('pinCode', true, false);
                if (isInternationalReceiver) {
                    if (selectedCountry) handlePinLookup(val, setFieldValue, selectedCountry.value);
                } else {
                    handlePinLookup(val, setFieldValue);
                }
            }}
        />
    );
};

const AddressFormContent = ({ isReceiver, isInternationalReceiver, onClose, onSaved, editAddressData }: Props) => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const { countryOptions, isLoadingCountries } = useAddressCountries(isInternationalReceiver);
    const [selectedCountry, setSelectedCountry] = useState<CountryOption | undefined>(
        editAddressData && isInternationalReceiver
            ? { label: editAddressData.country || '', value: editAddressData.countryCode || '' }
            : undefined
    );

    const isEditing = !!editAddressData?.id;

    const handleSubmit = async (values: FormValues, { resetForm }: FormikHelpers<FormValues>) => {
        const finalCountryCode = isInternationalReceiver ? (selectedCountry?.value || '') : 'IN';
        const finalCountryName = isInternationalReceiver ? (selectedCountry?.label || '') : 'India';

        if (isEditing) {
            const response = await updateAddressApi({
                userId: id,
                userType: role,
                addressId: editAddressData!.id!,
                name: values.name,
                email: values.email,
                phoneNumber: values.phone,
                addressLine1: values.addressLine1,
                addressLine2: values.addressLine2 || '',
                state: values.state,
                city: values.city,
                country: finalCountryName,
                countryCode: finalCountryCode,
                zipCode: values.pinCode,
            });
            if (response !== false) {
                dispatch(showToast({ description: 'Address updated successfully', variant: 'success' }));
                resetForm();
                onSaved?.();
                onClose();
            } else {
                dispatch(showToast({ description: 'Failed to update address', variant: 'error' }));
            }
            return;
        }

        const response = await saveAddressApi({
            userId: id,
            userType: role,
            name: values.name,
            email: values.email,
            phoneNumber: values.phone,
            addressLine1: values.addressLine1,
            addressLine2: values.addressLine2 || '',
            state: values.state,
            city: values.city,
            country: finalCountryName,
            countryCode: finalCountryCode,
            zipCode: values.pinCode,
            isReceiver: isReceiver ? 1 : 0,
            default: 0,
        });

        if (response) {
            dispatch(showToast({ description: 'Address added successfully', variant: 'success' }));
            resetForm();
            onSaved?.();
            onClose();
        } else {
            dispatch(showToast({ description: 'Failed to save address', variant: 'error' }));
        }
    };

    return (
        <Formik
            initialValues={{
                name: editAddressData?.name ?? '',
                phone: editAddressData?.phoneNumber ?? '',
                email: editAddressData?.email ?? '',
                pinCode: editAddressData?.zipCode ?? '',
                addressLine1: editAddressData?.address1 ?? '',
                addressLine2: editAddressData?.address2 ?? '',
                state: editAddressData?.state ?? '',
                city: editAddressData?.city ?? '',
            }}
            validationSchema={buildAddressSchema(isInternationalReceiver)}
            onSubmit={handleSubmit}
        >
            {({ handleSubmit: formSubmit, isSubmitting }) => (
                <Modal
                    title={isEditing ? 'Edit Address' : 'Add New Address'}
                    open
                    onCancel={onClose}
                    onOk={() => formSubmit()}
                    okText={isEditing ? 'Save Changes' : 'Add Address'}
                    cancelText="Cancel"
                    okButtonProps={{ danger: true, loading: isSubmitting }}
                    width={500}
                    styles={{ content: { borderRadius: '16px' } }}
                >
                    <Form layout="vertical" className="mt-4">
                        <TextInput
                            name="name"
                            label="Full Name"
                            placeholder="Enter Full Name"
                            type="text"
                            isRequired
                            maxLength={50}
                        />

                        <TextInput
                            name="phone"
                            label="Mobile Number"
                            placeholder="Enter Mobile Number"
                            type="text"
                            isRequired 
                            allowNumbersOnly
                            maxLength={isInternationalReceiver ? 15 : 10}
                        />

                        <TextInput
                            name="email"
                            label="Email"
                            placeholder="Enter Email ID"
                            type="email"
                            isRequired
                            allowEmailsOnly
                        />

                        <Form.Item label={<span><span className="text-red-500">*</span>Country </span>}>
                            {isInternationalReceiver ? (
                                <Select
                                    showSearch
                                    labelInValue
                                    optionFilterProp="label"
                                    loading={isLoadingCountries}
                                    placeholder="Select Country"
                                    value={selectedCountry}
                                    options={countryOptions}
                                    onChange={(opt: CountryOption) => setSelectedCountry(opt)}
                                />
                            ) : (
                                <Input value="India" disabled />
                            )}
                        </Form.Item>

                        <PinCodeField
                            isInternationalReceiver={isInternationalReceiver}
                            selectedCountry={selectedCountry}
                        />

                        <TextInput
                            name="addressLine1"
                            label="Address Line 1"
                            placeholder="Enter Address"
                            type="text"
                            isRequired
                            maxLength={100}
                        />

                        <TextInput
                            name="addressLine2"
                            label="Address Line 2"
                            placeholder="Enter Address"
                            type="text"
                            maxLength={100}
                        />

                        <Row gutter={16}>
                            <Col span={12}>
                                <TextInput
                                    name="state"
                                    label="State"
                                    placeholder="Enter State"
                                    isRequired
                                    isDisabled
                                    type="text"
                                />
                            </Col>
                            <Col span={12}>
                                <TextInput
                                    name="city"
                                    label="City"
                                    placeholder="Enter City"
                                    isDisabled
                                    type="text"
                                    isRequired
                                />
                            </Col>
                        </Row>
                    </Form>
                </Modal>
            )}
        </Formik>
    );
};

export default AddressFormContent;
