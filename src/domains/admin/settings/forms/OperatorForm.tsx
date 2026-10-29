import React from 'react';

import { Form, Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import CustomSelectSearch from '@components/atomic/inputs/CustomSelectSearch';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextAreaInput from '@components/atomic/inputs/TextAreaInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { commonSelectType } from '@customtypes/general';

import { ACCOUNTING_PORTAL_ONLY } from '../../utils/commissionValidation';
import OidcDisplay from '../component/serviceOperator/OidcDisplay';
import { serviceOperator } from '../types/serviceOperator';

interface OperatorFormProps {
    serviceCategories: commonSelectType[];
    commissionTypes: commonSelectType[];
    balanceMethods: { label: string; value: boolean }[];
    serviceTypes: commonSelectType[];
    vendors: commonSelectType[];
    dropdownsLoading: boolean;
    data?: serviceOperator;
}

interface OidcDetailsFormValues {
    active?: boolean;
    client_id?: string;
    client_secret?: string;
    client_name?: string;
    logo?: string;
    redirect_uris?: string;
}

interface OperatorFormValues {
    serviceProvider?: string;
    accessKey?: string;
    serviceCategory?: string;
    commissionType?: string;
    providerCommission?: string;
    vendorId?: string;
    balanceMethod?: boolean;
    serviceType?: string;
    isDynamicUnitPricing?: boolean;
    serviceImage?: string;
    oidcDetails?: OidcDetailsFormValues;
}

const OperatorForm: React.FC<OperatorFormProps> = ({
    serviceCategories,
    commissionTypes,
    balanceMethods,
    serviceTypes,
    vendors,
    dropdownsLoading,
    data,
}) => {
    const { values } = useFormikContext<OperatorFormValues>();
    return (
        <Flex vertical className="w-full">
            <Form layout="vertical">
                <TextInput
                    name="serviceProvider"
                    label="Service Provider Name"
                    type="text"
                    placeholder="Enter service provider name"
                    isRequired
                    classes=" rounded-sm"
                    maxLength={50}
                />
                <TextInput
                    name="accessKey"
                    label="Access Key"
                    type="text"
                    placeholder="Enter access key"
                    isRequired
                    classes="rounded-sm"
                    maxLength={35}
                />
                <CustomSelectSearch
                    name="serviceCategory"
                    label="Service Category"
                    options={serviceCategories}
                    placeholder="Select service category"
                    classes="rounded-sm"
                    isRequired
                />
                <CustomSelectSearch
                    isRequired
                    loading={dropdownsLoading}
                    name="vendorId"
                    label="Vendor"
                    placeholder="Select a vendor"
                    options={vendors}
                />

                <SelectInput
                    name="balanceMethod"
                    label="Balance Method"
                    placeholder="Select balance method"
                    options={balanceMethods}
                    classes="rounded-sm"
                    isRequired
                />
                <CustomSelectSearch
                    name="serviceType"
                    label="Service Type"
                    placeholder="Select service type"
                    isRequired
                    options={serviceTypes}
                    classes="rounded-sm"
                />
                <TextInput
                    name="paymentclientid"
                    label="Payment Client ID"
                    type="text"
                    placeholder="Enter payment client id"
                    classes="rounded-sm"
                />
                <TextInput
                    name="paymentclientsecret"
                    label="Payment Client Secret"
                    type="text"
                    placeholder="Enter payment client secret"
                    classes="rounded-sm"
                />
                <SwitchInput
                    name="isDynamicUnitPricing"
                    label="Dynamic unit pricing"
                    showToolTip
                    tooltipText="The dynamic unit price is used to calculate the unit price of subscription add-ons. If this is turned off, the add-on price is fixed. otherwise, it is calculated based on the remaining days of the subscription."
                />

                <CustomFileUploadInput
                    name="serviceImage"
                    label="Service Image"
                    classes="rounded-sm"
                    format="imageFormat"
                    showFileName
                    showNotification
                />
                <SwitchInput
                    name="oidcDetails.active"
                    label="Enable OIDC Integration"
                    showToolTip
                    tooltipText="Turn on if this operator should have OIDC configuration."
                />
                {values && values?.oidcDetails! && values?.oidcDetails?.active && (
                    <Flex vertical className="mt-4 p-3 border rounded-md">
                        <Typography.Title level={5} className="text-center">
                            OIDC Details
                        </Typography.Title>

                        <OidcDisplay data={data} />

                        <TextInput
                            name="oidcDetails.client_name"
                            label="Client Name"
                            placeholder="Enter OIDC client name"
                            type="text"
                            classes="rounded-sm"
                        />

                        <CustomFileUploadInput
                            name="oidcDetails.logo"
                            label="Client Logo"
                            classes="rounded-sm"
                            format="oidcDetails.logoFormat"
                            showFileName
                            existingFileUrl={data?.oauth_client?.logo_uri}
                            showNotification
                        />

                        <TextAreaInput
                            name="oidcDetails.redirect_uris"
                            label="Callback URIs"
                            placeholder="Enter one URI per line"
                            size="middle"
                            minRows={3}
                        />
                    </Flex>
                )}
                <SelectInput
                    name="commissionMode"
                    isRequired
                    options={[
                        { value: 'MARGIN', label: 'Margin' },
                        { value: 'AGENT_MARKUP', label: 'Agent Markup' },
                        { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
                    ]}
                    placeholder="Please select commission mode"
                    label="Commission Mode"
                    isDisabled
                    showToolTip
                    tooltipText={`Controls how commission is booked. Margin/Agent Markup post commission to the Commission account, with vendor payable booked separately. Principal Markup instead combines both into a single Sales line. Applies to this operator's own commission fields and every item-level (plan/add-on) commission under it — one mode per service operator. ${ACCOUNTING_PORTAL_ONLY}`}
                />
                <CustomSelectSearch
                    name="commissionType"
                    label="Commission Type"
                    placeholder="Select commission type"
                    classes="rounded-sm"
                    options={commissionTypes}
                    isRequired
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <TextInput
                    name="providerCommission"
                    label="Provider Commission"
                    placeholder="Enter provider commission"
                    type="text"
                    classes="rounded-sm"
                    isRequired
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <TextInput
                    name="fixedCommissionPerTransaction"
                    label="Fixed Commission Per Transaction"
                    placeholder="0"
                    type="text"
                    classes="rounded-sm"
                    allowDecimalsOnly
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <SwitchInput
                    name="isCommissionInclGST"
                    label="Commission Include GST"
                    isDisabled
                    showToolTip
                    tooltipText={`Enable if the provider commission amount already includes GST. ${ACCOUNTING_PORTAL_ONLY}`}
                />
                <SwitchInput
                    name="recordJournalEntry"
                    label="Record Journal Entry"
                    showToolTip
                    tooltipText="Enable to record journal entries for transactions on this service operator."
                />
            </Form>
        </Flex>
    );
};

export default OperatorForm;
