import { useCallback, useEffect, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';
import TextInput from '@components/atomic/inputs/TextInput';
import { DropDown } from '@customtypes/general';

import AddCustomerModal from '../../components/createInvoice/AddCustomerModal';
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from '../../constants/createInvoice';
import { CreateInvoiceFormValues, CustomerOption } from '../../types/createInvoice';

interface BuyerDetailsFormProps {
    customers: CustomerOption[];
    isLoading: boolean;
    stateOptions: DropDown;
}

const BUYER_FIELDS = [
    'buyer.name',
    'buyer.email',
    'buyer.phoneNumber',
    'buyer.address',
    'buyer.city',
    'buyer.state',
    'buyer.gstNumber',
    'buyer.pincode',
    'buyer.country',
];

const BuyerDetailsForm = ({ customers, isLoading, stateOptions }: BuyerDetailsFormProps) => {
    const { values, setFieldValue, setFieldTouched } = useFormikContext<CreateInvoiceFormValues>();
    const isDomestic = values.invoice.type === 'DOMESTIC';
    const isCashSale = !!values.invoice.isCashSale;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Cash sale has no customer on record to save.
    useEffect(() => {
        if (isCashSale && values.buyer.saveCustomer) {
            setFieldValue('buyer.saveCustomer', false);
        }
    }, [isCashSale, values.buyer.saveCustomer, setFieldValue]);

    const customerOptions = customers.map(c => ({ value: String(c.id), label: c.name }));

    useEffect(() => {
        if (values.buyer.customerId && customers.length > 0) {
            const match = customers.find(c => String(c.id) === String(values.buyer.customerId));
            if (match) setFieldValue('_customerSearch', String(match.id));
        }
    }, [values.buyer.customerId, customers, setFieldValue]);

    const clearBuyerFields = useCallback(() => {
        setFieldValue('buyer.customerId', undefined);
        setFieldValue('buyer.name', '');
        setFieldValue('buyer.email', '');
        setFieldValue('buyer.phoneNumber', '');
        setFieldValue('buyer.address', '');
        setFieldValue('buyer.city', '');
        setFieldValue('buyer.state', '');
        setFieldValue('buyer.country', '');
        setFieldValue('buyer.gstNumber', '');
        setFieldValue('buyer.pincode', '');
        setFieldValue('invoice.currency', 'INR');
        BUYER_FIELDS.forEach(f => setFieldTouched(f, false));
    }, [setFieldValue, setFieldTouched]);

    const handleCustomerSelect = useCallback(
        (value: string) => {
            if (!value) {
                clearBuyerFields();
                return;
            }
            const c = customers.find(o => String(o.id) === value);
            if (!c) return;
            setFieldValue('buyer.saveCustomer', false);
            setFieldValue('buyer.customerId', String(c.id));
            setFieldValue('buyer.name', c.name || '');
            setFieldValue('buyer.email', c.email || '');
            setFieldValue('buyer.phoneNumber', c.phoneNumber || '');
            setFieldValue('buyer.address', c.primaryAddress || '');
            setFieldValue('buyer.city', c.primaryCity || '');
            setFieldValue('buyer.state', c.primaryState || '');
            setFieldValue('buyer.country', c.primaryCountry || '');
            setFieldValue('buyer.gstNumber', c.gstin || '');
            setFieldValue('buyer.pincode', c.primaryPincode || '');
            // Prefill the invoice's currency from the selected customer's saved currency;
            // the user can still change it afterwards.
            setFieldValue('invoice.currency', c.currency || 'INR');
            if (c.currency && c.currency !== 'INR' && !values.invoice.exchangeRate) {
                setFieldValue('invoice.exchangeRate', '1');
            }
            BUYER_FIELDS.forEach(f => setFieldTouched(f, false));
        },
        [setFieldValue, setFieldTouched, customers, clearBuyerFields, values.invoice.exchangeRate]
    );

    const handleCustomerAdded = (customer: {
        name: string;
        email: string;
        phoneNumber: string;
        gstin: string;
        primaryAddress: string;
        primaryCity: string;
        primaryState: string;
        primaryCountry: string;
        primaryPincode: string;
        currency: string;
    }) => {
        setFieldValue('buyer.customerId', undefined);
        setFieldValue('buyer.saveCustomer', false);
        setFieldValue('buyer.name', customer.name);
        setFieldValue('buyer.email', customer.email);
        setFieldValue('buyer.phoneNumber', customer.phoneNumber);
        setFieldValue('buyer.gstNumber', customer.gstin);
        setFieldValue('buyer.address', customer.primaryAddress);
        setFieldValue('buyer.city', customer.primaryCity);
        setFieldValue('buyer.state', customer.primaryState);
        setFieldValue('buyer.country', customer.primaryCountry || '');
        setFieldValue('buyer.pincode', customer.primaryPincode);
        setFieldValue('invoice.currency', customer.currency || 'INR');
        if (customer.currency && customer.currency !== 'INR' && !values.invoice.exchangeRate) {
            setFieldValue('invoice.exchangeRate', '1');
        }
        BUYER_FIELDS.forEach(f => setFieldTouched(f, false));
    };

    return (
        <>
            <Form layout="vertical" className="w-full [&_.ant-form-item]:mb-0">
                <Flex vertical gap={14} className="w-full">
                    <Typography.Text className="text-xl font-medium">Buyer Details</Typography.Text>

                    <Flex
                        gap={8}
                        align="flex-end"
                        className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full"
                    >
                        <Flex className="flex-1 min-w-0">
                            <SelectInputWithSearch
                                name="_customerSearch"
                                label="Select a saved customer"
                                placeholder="Select saved customer"
                                options={customerOptions}
                                handleChange={handleCustomerSelect}
                                isDisabled={isLoading}
                            />
                        </Flex>
                        <Button
                            icon={<PlusOutlined />}
                            danger
                            onClick={() => setIsAddModalOpen(true)}
                            className="shrink-0"
                        >
                            Add
                        </Button>
                    </Flex>
                    <SelectInputWithSearch
                        name="invoice.currency"
                        label="Currency"
                        placeholder="Select currency"
                        options={CURRENCY_OPTIONS}
                        isRequired
                    />
                    <TextInput
                        name="buyer.name"
                        label="Customer Name"
                        placeholder="Enter Customer Name"
                        type="text"
                        size="middle"
                        formItemClass="m-0"
                        isRequired={!isCashSale}
                        maxLength={50}
                    />
                    {isDomestic && !isCashSale && (
                        <TextInput
                            name="buyer.gstNumber"
                            label="GSTIN"
                            placeholder="Enter GSTIN"
                            type="text"
                            formItemClass="m-0"
                            convertToUppercase
                            maxLength={15}
                        />
                    )}
                    {!isCashSale && (
                        <TextInput
                            name="buyer.address"
                            label="Address"
                            placeholder="Enter Customer Address"
                            type="text"
                            formItemClass="m-0"
                            maxLength={100}
                            isRequired
                        />
                    )}

                    {!isCashSale && (
                        <TextInput
                            name="buyer.city"
                            label="City"
                            placeholder="Enter City"
                            type="text"
                            formItemClass="m-0"
                            maxLength={50}
                            allowAlphabetsOnly
                            isRequired
                        />
                    )}

                    {!isCashSale &&
                        (isDomestic ? (
                            <Flex className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full">
                                <SelectInputWithSearch
                                    name="buyer.state"
                                    label="State"
                                    placeholder="Select State"
                                    options={stateOptions}
                                    isRequired
                                />
                            </Flex>
                        ) : (
                            <TextInput
                                name="buyer.state"
                                label="State"
                                placeholder="Enter State"
                                type="text"
                                formItemClass="m-0"
                                maxLength={50}
                                isRequired
                            />
                        ))}

                    {isDomestic && !isCashSale && (
                        <TextInput
                            name="buyer.pincode"
                            label="Pincode"
                            placeholder="Enter Pincode"
                            type="text"
                            formItemClass="m-0"
                            allowNumbersOnly
                            maxLength={6}
                            isRequired
                        />
                    )}

                    {!isDomestic && !isCashSale && (
                        <Flex className="w-full [&_.ant-form-item]:mb-0 [&_.ant-form-item]:w-full">
                            <SelectInputWithSearch
                                name="buyer.country"
                                label="Country"
                                placeholder="Select Country"
                                options={COUNTRY_OPTIONS}
                                isRequired
                            />
                        </Flex>
                    )}

                    <TextInput
                        name="buyer.email"
                        label="Email"
                        placeholder="Enter Email"
                        type="email"
                        formItemClass="m-0"
                    />

                    <TextInput
                        name="buyer.phoneNumber"
                        label="Mobile Number"
                        placeholder="Enter Mobile Number"
                        type="text"
                        formItemClass="m-0"
                        allowNumbersOnly
                        maxLength={10}
                        isRequired={!isCashSale}
                    />

                    {!values.buyer.customerId && (
                        <Checkbox
                            checked={!!values.buyer.saveCustomer}
                            onChange={e => setFieldValue('buyer.saveCustomer', e.target.checked)}
                            disabled={isCashSale}
                        >
                            <Typography.Text className="text-sm text-[#475569]">
                                Save this customer
                            </Typography.Text>
                        </Checkbox>
                    )}
                </Flex>
            </Form>

            <AddCustomerModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                stateOptions={stateOptions}
                onSuccess={handleCustomerAdded}
            />
        </>
    );
};

export default BuyerDetailsForm;
