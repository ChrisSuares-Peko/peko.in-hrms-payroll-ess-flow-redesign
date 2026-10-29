import React, { useEffect, useState } from 'react';

import { Flex, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useEsimPlanForm from '../../hooks/useEsimPlanForm';
import { Country, DropDown } from '../../types/eSIM';

type Props = {
    coverageData: DropDown | undefined;
    setSearchCountry: (val: string) => void;
    isEdit?: boolean;
    provider?: string;
};

const EsimPlanForm = ({ coverageData, setSearchCountry, isEdit = false, provider }: Props) => {
    const isTunzPlan = provider?.toLowerCase() === 'tunz';
    const lockCoreFields = isEdit && isTunzPlan;
    const [selectedCoverage, setSelectedCoverage] = useState<string | undefined>();
    const [, setFilteredCountryData] = useState<string | undefined>();
    const [, setAmount] = useState<number | undefined>();
    const [dataMBs, setDataMBs] = useState<number | undefined>();
    const [countryList, setCountryList] = useState<Country[] | undefined>(undefined);

    const [esimPrice, setEsimPrice] = useState<number | undefined>();
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const { fetchEsimPrice } = useEsimPlanForm();
    const { setFieldValue }: any = useFormikContext();

    useEffect(() => {
        if (dataMBs && esimPrice) {
            const expectedAmount = (dataMBs * esimPrice) / 1024;
            setAmount(expectedAmount);
            setValidationMessage(`Vendor price for this plan: ₹ ${expectedAmount.toFixed(2)}`);
        } else {
            setValidationMessage(null);
        }
    }, [esimPrice, dataMBs]);

    const fetchPrice = async (
        coverageId: any,
        countryIso2: string,
        indicator: string,
        label: string
    ) => {
        if (!coverageId) return;

        const response = await fetchEsimPrice(coverageId, countryIso2, indicator, label);
        if (response && response.pricePlan) {
            const price = Number(response.pricePlan);
            setEsimPrice(price);
        }
    };

    const mappedCountryOptions =
        countryList?.map((c: any) => ({
            label: c.name,
            value: c.iso2,
            indicator: c.indicator,
        })) || [];

    return (
        <Flex vertical className="w-full ">
            <Form layout="vertical">
                {isEdit && (
                    <TextInput
                        name="name"
                        label="Name"
                        type="text"
                        placeholder="Enter Plan Name"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={30}
                        isDisabled
                    />
                )}
                {isEdit ? (
                    <TextInput
                        name="coverage"
                        label="Network Coverage (Country & Operator)"
                        type="text"
                        classes="rounded-sm"
                        isDisabled
                    />
                ) : (
                    <SelectInput
                        isRequired
                        isDisabled={!coverageData}
                        loading={!coverageData}
                        name="coverage"
                        options={coverageData || []}
                        placeholder="Select Country and Network Operator"
                        label="Network Coverage (Country & Operator)"
                        allowClear
                        filterOption={false}
                        showSearch
                        onSearch={setSearchCountry}
                        handleChange={selectedValue => {
                            setSelectedCoverage(selectedValue);
                            setFieldValue('dataMBs', '');
                            setFieldValue('amount', '');
                            setFieldValue('country', undefined);
                            setValidationMessage(null);
                            if (!selectedValue) {
                                setSearchCountry('');
                                setFilteredCountryData('');
                                return;
                            }

                            // Find the full coverage object
                            const selectedProfile = coverageData?.find(
                                item => item.value === selectedValue
                            );

                            setCountryList(selectedProfile?.countries);
                            setFilteredCountryData(selectedProfile?.label?.split(',')[0] || '');
                        }}
                    />
                )}
                {isEdit ? (
                    <TextInput
                        name="country"
                        label="Country"
                        type="text"
                        classes="rounded-sm"
                        isDisabled
                    />
                ) : (
                    <SelectInput
                        isDisabled={!coverageData || !selectedCoverage}
                        loading={!coverageData}
                        isRequired
                        name="country"
                        placeholder="Select Country"
                        label="Country"
                        options={mappedCountryOptions}
                        handleChange={countryIso2 => {
                            const selectedCountry = countryList?.find(c => c.iso2 === countryIso2);
                            if (!selectedCountry || !selectedCoverage) return;

                            setFilteredCountryData(selectedCountry.name);

                            const selectedProfile = coverageData?.find(
                                item => item.value === selectedCoverage
                            );
                            if (!selectedProfile) return;

                            // Call price API only after country is selected
                            fetchPrice(
                                selectedProfile.value,
                                selectedCountry.iso2,
                                selectedCountry.indicator,
                                selectedProfile.provider
                            );
                        }}
                    />
                )}

                <TextInput
                    name="dataMBs"
                    label="Data Pack (MB's)"
                    type="text"
                    placeholder="Enter Plan Data Pack"
                    isRequired
                    classes="rounded-sm"
                    maxLength={6}
                    allowDecimalsOnly
                    isDisabled={lockCoreFields}
                    handleChange={e => {
                        const value = Number(e);
                        setDataMBs(value);
                    }}
                />

                <TextInput
                    name="periodDays"
                    label="Plan Validity (Days)"
                    type="text"
                    placeholder="Enter Plan validity"
                    classes="rounded-sm"
                    maxLength={10}
                    allowNumbersOnly
                    isRequired
                    isDisabled={lockCoreFields}
                />
                <TextInput
                    name="amount"
                    label="Plan Amount (₹)"
                    type="text"
                    isRequired
                    placeholder="Enter Plan Amount"
                    classes="rounded-sm"
                    maxLength={10}
                    allowTwoDecimalsOnly
                    isDisabled={lockCoreFields}
                />
                {validationMessage && <Typography color="danger">{validationMessage}</Typography>}
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
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <SelectInput
                    name="commissionType"
                    isRequired
                    options={[
                        { value: 'PERCENTAGE', label: 'Percentage' },
                        { value: 'FLAT', label: 'Flat' },
                    ]}
                    placeholder="Please select commission type"
                    label="Commission Type"
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <TextInput
                    name="commission"
                    label="Commission"
                    type="text"
                    placeholder="Please enter commission"
                    isRequired
                    classes="rounded-sm"
                    allowTwoDecimalsOnly
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <TextInput
                    name="fixedCommissionPerTransaction"
                    label="Fixed Commission Per Transaction"
                    type="text"
                    placeholder="Please enter fixed commission per transaction"
                    classes="rounded-sm"
                    allowTwoDecimalsOnly
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
                <SwitchInput
                    name="isCommissionInclGST"
                    label="Commission Includes VAT"
                    isDisabled
                    showToolTip
                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                />
            </Form>
        </Flex>
    );
};
export default EsimPlanForm;
