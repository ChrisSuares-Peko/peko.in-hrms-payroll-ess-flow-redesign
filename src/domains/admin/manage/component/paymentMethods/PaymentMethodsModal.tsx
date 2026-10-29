import { ReactNode } from 'react';

import { Col, Divider, Flex, Form, Row, Skeleton, Typography } from 'antd';
import { useFormikContext } from 'formik';

import MultiSelectInput from '@components/atomic/inputs/MultiSelectInput';
import RadioGroupInput from '@components/atomic/inputs/RadioGroupInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { PaymentMethodLookups } from '../../hooks/paymentMethods/usePaymentMethodLookups';
// import GatewayProviderSelect from './GatewayProviderSelect';
import useSavePaymentMethod from '../../hooks/paymentMethods/useSavePaymentMethod';
import paymentMethodsSchema from '../../schema/paymentMethodsSchema';
import { PaymentMethod, PaymentMethodFormValues, SelectOption } from '../../types/paymentMethods';
import {
    PAYMENT_METHOD_LIMIT_FIELDS,
    PAYMENT_METHOD_OPTIONS,
    toLimitAmount,
} from '../../utils/paymentMethods';

const { Text } = Typography;

type FormSectionProps = {
    title: string;
    description: string;
    children: ReactNode;
};

const FormSection = ({ title, description, children }: FormSectionProps) => (
    <Flex vertical>
        <Flex vertical gap={2} className="mb-4">
            <Text className="text-sm font-semibold text-textHeadings">{title}</Text>
            <Text className="text-xs text-textBody">{description}</Text>
        </Flex>
        {children}
    </Flex>
);

type PaymentGatewaySelectProps = {
    options: SelectOption[];
    loading: boolean;
};

const PaymentGatewaySelect = ({ options, loading }: PaymentGatewaySelectProps) => {
    const { values } = useFormikContext<PaymentMethodFormValues>();
    if (values.paymentMethod !== 'PAYMENT_GATEWAY') return null;
    if (loading) return <Skeleton.Input active block className="mb-6" />;
    return (
        <SelectInput
            name="pgProvider"
            isRequired
            options={options}
            placeholder="Select a payment gateway"
            label="Payment gateway"
        />
    );
};

const toFormLimit = (value?: number | string | null) => {
    const amount = toLimitAmount(value);
    return amount ? String(amount) : '';
};

type PaymentMethodsModalProps = {
    record?: PaymentMethod;
    lookups: PaymentMethodLookups;
    onClose: () => void;
    onSaved: () => void;
};

const PaymentMethodsModal = ({ record, lookups, onClose, onSaved }: PaymentMethodsModalProps) => {
    const { createPaymentMethod, updatePaymentMethod, isSaving } = useSavePaymentMethod({
        onSaved,
    });
    const isEdit = !!record;

    const initialValues: PaymentMethodFormValues = {
        partnerId: record ? (record.partnerId ?? 'default') : '',
        paymentMethod: record?.paymentMethod ?? '',
        pgProvider: record?.pgProvider ?? '',
        services: record?.serviceList.map(String) ?? [],
        limitPerTransaction: toFormLimit(record?.limits?.limitPerTransaction),
        limitPerDay: toFormLimit(record?.limits?.limitPerDay),
        limitPerMonth: toFormLimit(record?.limits?.limitPerMonth),
    };

    return (
        <CustomModalWithForm
            open
            modalTitle={
                <Flex vertical gap={2}>
                    <Text className="text-base font-semibold text-textHeadings">
                        {isEdit ? 'Edit payment method' : 'Add payment method'}
                    </Text>
                    <Text className="text-xs font-normal text-textBody">
                        Choose the partner, how their customers pay and the services it covers.
                    </Text>
                </Flex>
            }
            validationSchema={paymentMethodsSchema}
            initialValues={initialValues}
            handleCancel={onClose}
            isLoading={isSaving}
            firstBtnTxt={isEdit ? 'Save changes' : 'Add payment method'}
            handleFormSubmit={(values: PaymentMethodFormValues) =>
                record ? updatePaymentMethod(record.id, values) : createPaymentMethod(values)
            }
        >
            <Form layout="vertical">
                <FormSection
                    title="Partner and method"
                    description="Default covers customers who are not linked to a partner."
                >
                    {lookups.partnersLoading ? (
                        <Skeleton.Input active block className="mb-6" />
                    ) : (
                        <SelectInput
                            name="partnerId"
                            isRequired
                            showSearch
                            optionFilterProp="children"
                            options={lookups.partnerOptions}
                            placeholder="Select a partner"
                            label="Partner"
                        />
                    )}
                    <RadioGroupInput
                        name="paymentMethod"
                        isRequired
                        label="Payment method"
                        options={PAYMENT_METHOD_OPTIONS}
                    />
                    <PaymentGatewaySelect
                        options={lookups.gatewayOptions}
                        loading={lookups.gatewayLoading}
                    />
                </FormSection>

                <Divider className="mb-6 mt-0" />

                <FormSection
                    title="Services"
                    description="Customers can use this payment method only for the services selected here."
                >
                    {lookups.servicesLoading ? (
                        <Skeleton.Input active block className="mb-6" />
                    ) : (
                        <MultiSelectInput
                            name="services"
                            options={lookups.serviceOptions}
                            label="Services"
                            placeholder="Select services"
                            isRequired
                            filterOption
                            showSelectAll
                        />
                    )}
                </FormSection>

                <Divider className="mb-6 mt-0" />

                <FormSection
                    title="Transaction limits"
                    description="Amounts in rupees. Leave a limit empty for no limit."
                >
                    <Row gutter={12}>
                        {PAYMENT_METHOD_LIMIT_FIELDS.map(field => (
                            <Col key={field.key} xs={24} sm={8}>
                                <TextInput
                                    name={field.key}
                                    type="text"
                                    label={field.shortLabel}
                                    placeholder="No limit"
                                    prefix="₹"
                                    maxLength={field.maxLength}
                                    allowNumbersOnly
                                    inputMode="numeric"
                                />
                            </Col>
                        ))}
                    </Row>
                </FormSection>
            </Form>
        </CustomModalWithForm>
    );
};

export default PaymentMethodsModal;
