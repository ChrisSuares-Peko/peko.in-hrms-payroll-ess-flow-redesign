import React, { useEffect } from 'react';

import { Button, Col, Form, Row, Tooltip } from 'antd';
import { Formik } from 'formik';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import SearchSelectInput from '@src/domains/dashboard/billPayments/components/CustomSelectSearch';
import { useAppSelector } from '@src/hooks/store';
import { accessKeys } from '@utils/accessKeys';

import useFetchBillApi from '../../hooks/useFetchBillApi';
import useServiceProviderApi from '../../hooks/useServiceProviderApi';
import { generateDynamicSchema } from '../../schema/index';
import { CustomerParam, OptionsType } from '../../types/index';
import { isMobileLikeParam } from '../../utils/data';
import BbpsPlanDrawer from '../BbpsPlanDrawer';

interface DetailPageFormProps {
    serviceCategory: string;
    accessKeyName: string;
}

const DetailPageForm: React.FC<DetailPageFormProps> = ({ serviceCategory, accessKeyName }) => {
    const [selectedBillerData, setSelectedBillerData] = React.useState<CustomerParam[]>([]);
    const [selectedBillerId, setSelectedBillerId] = React.useState<string>('');
    const [selectedServiceProvider, setSelectedServiceProvider] = React.useState<OptionsType>();
    const {
        serviceProviderData,
        isLoading,
        isLoadingMore,
        hasMore,
        loadMoreServiceProviders,
        handleServiceProviderSearch,
        resetSearchIfDirty,
    } = useServiceProviderApi(serviceCategory);
    const { bills } = useAppSelector(state => state.reducer.billPayments);

    const { user } = useAppSelector(state => state.reducer.user);
    const mobileNo = user?.mobileNo || '';

    // LPG gating: any customer-param that holds a mobile/contact number must be the Peko account
    // holder's registered mobile — pre-filled and non-editable. The rule applies per-field, so other
    // params (e.g. BPCL Commercial's Product Qty, SV Number) remain editable.
    const isLpg = accessKeyName === accessKeys.lpg;
    const isMobileValid = !isLpg || /^[0-9]{10}$/.test(mobileNo);

    const { handlePayment, handlePlanSelect, isLoading: loading, billerPlans, isPlanDrawerOpen, setIsPlanDrawerOpen } = useFetchBillApi();
    const formatLabel = (text: string) =>
        text
            .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
            .replace(/^./, (str: string) => str.toUpperCase()) // Capitalize first letter
            .replace(/\b(id)\b/i, 'ID'); // Make 'id' into 'ID'
    const handleChange = (value: string) => {
        const selectedOption =
            serviceProviderData && serviceProviderData.find(opt => opt.value === value);

        setSelectedServiceProvider(selectedOption);
        setSelectedBillerData(selectedOption?.customerParams || []);
        setSelectedBillerId(selectedOption?.value || '');
    };
    const fetchRequirement =
        selectedServiceProvider?.billerFetchRequiremet ||
        selectedServiceProvider?.billerFetchRequirement ||
        '';
    const normalizedFetchRequirement = fetchRequirement.replace(/[\s-]+/g, '_').toUpperCase();
    const normalizedBillValidationSupport = (
        selectedServiceProvider?.billerSupportBillValidation || ''
    )
        .replace(/[\s-]+/g, '_')
        .toUpperCase();
    const isQuickPayFlow =
        normalizedFetchRequirement === 'NOT_SUPPORTED' &&
        normalizedBillValidationSupport === 'NOT_SUPPORTED';
    const isFetchMandatory = normalizedFetchRequirement === 'MANDATORY';
    let submitButtonLabel = isFetchMandatory ? 'View Bill' : 'Continue';
    if (accessKeyName === 'bbps_utility_cable') submitButtonLabel = 'Proceed to Recharge';
    const initialValues: { [key: string]: string } = {};
    if (bills && Object.keys(bills).length > 0) {
        Object.assign(initialValues, bills);
        initialValues.serviceProvider = selectedBillerId;
    } else {
        initialValues.serviceProvider = selectedBillerId;
        initialValues.amount = '';

        if (selectedBillerData && selectedBillerData.length > 0) {
            selectedBillerData.forEach(input => {
                initialValues[input.paramName] = '';
            });
        }
    }
    // For LPG, force the locked mobile-like param to the current user's mobile — overrides both
    // the empty default above AND any stale value carried over from a previous payment via `bills`.
    if (isLpg && selectedBillerData && selectedBillerData.length > 0) {
        selectedBillerData.forEach(input => {
            if (isMobileLikeParam(input.paramName)) {
                initialValues[input.paramName] = mobileNo;
            }
        });
    }
    useEffect(() => {
        if (bills && Object.keys(bills).length > 0 && serviceProviderData?.length) {
            const matched = serviceProviderData.find(opt => opt.value === bills.serviceProvider);
            if (matched) {
                setSelectedServiceProvider(matched);
                setSelectedBillerId(matched.value);
                setSelectedBillerData(matched.customerParams || []);
            }
        }
    }, [bills, serviceProviderData]);
    const validationSchema = React.useMemo(() => {
        const schema = generateDynamicSchema(selectedBillerData);
        if (!isQuickPayFlow) return schema;

        return schema.shape({
            amount: Yup.string()
                .required('Please enter amount')
                .matches(/^\d+(\.\d{1,2})?$/, 'Please enter valid amount')
                .test('is-positive', 'Amount must be greater than 0', value => Number(value) > 0),
        });
    }, [isQuickPayFlow, selectedBillerData]);
    return (
        <>
        <BbpsPlanDrawer
            open={isPlanDrawerOpen}
            plans={billerPlans}
            onClose={() => setIsPlanDrawerOpen(false)}
            onSelectPlan={handlePlanSelect}
        />
        <Formik
            key={selectedBillerId}
            initialValues={initialValues}
            onSubmit={async values => {
                const allOptional = selectedBillerData.every(p => p.isOptional !== 'false');
                if (allOptional) {
                    const hasValue = selectedBillerData.some(p => values[p.paramName]?.toString().trim());
                    if (!hasValue) return;
                }
                await handlePayment(
                    values,
                    accessKeyName,
                    selectedServiceProvider?.label,
                    mobileNo,
                    selectedServiceProvider
                );
            }}
            validationSchema={validationSchema}
            enableReinitialize
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form layout="vertical" onFinish={handleSubmit} className="w-full">
                    <Row gutter={30} className="flex-col sm:flex-row ">
                        <Col xs={24} sm={12}>
                            <SearchSelectInput
                                name="serviceProvider"
                                label="Select Service Provider"
                                options={serviceProviderData || []}
                                placeholder="Select Service Provider"
                                handleChange={handleChange}
                                isLoading={isLoading || isLoadingMore}
                                filterOption={false}
                                onSearch={handleServiceProviderSearch}
                                onDropdownVisibleChange={open => {
                                    if (open) resetSearchIfDirty();
                                }}
                                onPopupScroll={event => {
                                    const target = event.target as HTMLDivElement;
                                    const reachedBottom =
                                        target.scrollTop + target.clientHeight >=
                                        target.scrollHeight - 20;
                                    if (reachedBottom && hasMore) {
                                        loadMoreServiceProviders();
                                    }
                                }}
                            />
                        </Col>
                        {selectedBillerData.map((input, i) => {
                            const fullLabel = formatLabel(input.paramName);
                            const label = (
                                <Tooltip title={fullLabel}>
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
                                        {fullLabel}
                                    </span>
                                </Tooltip>
                            );
                            // For LPG: pin any mobile-like param to the Peko user's registered mobile.
                            const shouldLockToUserMobile = isLpg && isMobileLikeParam(input.paramName);
                            return (
                            <Col xs={24} sm={12} key={i}>
                                {input.values !== null ? (
                                    <TextInput
                                        label={label}
                                        name={input.paramName}
                                        placeholder={`Enter ${fullLabel}`}
                                        type="text"
                                        isRequired={input.isOptional === 'false'}
                                        maxLength={Number(input.maxLength) > 0 ? Number(input.maxLength) : 50}
                                        allowNumbersOnly={input.dataType === 'NUMERIC'}
                                        allowAlphabetsAndNumbersOnly={
                                            input.dataType === 'ALPHANUMERIC'
                                        }
                                        isDisabled={shouldLockToUserMobile}
                                        values={shouldLockToUserMobile ? mobileNo : undefined}
                                        showToolTip={shouldLockToUserMobile}
                                        tooltipText={shouldLockToUserMobile ? 'Only your registered mobile number can be used here.' : undefined}
                                    />
                                ) : (
                                    <TextInput
                                        label={label}
                                        name={input.paramName}
                                        placeholder={`Select ${fullLabel}`}
                                        isRequired={input.isOptional === 'false'}
                                        type="text"
                                    />
                                )}
                            </Col>
                            );
                        })}
                        {isQuickPayFlow && (
                            <Col xs={24} sm={12}>
                                <TextInput
                                    label="Amount"
                                    name="amount"
                                    placeholder="Enter amount"
                                    type="text"
                                    isRequired
                                    allowNumbersOnly
                                />
                            </Col>
                        )}
                    </Row>

                    <Tooltip
                        title={
                            isLpg && !isMobileValid
                                ? 'Update your registered mobile number in your profile to continue.'
                                : ''
                        }
                    >
                        <Button
                            htmlType="submit"
                            type="primary"
                            danger
                            className="px-10 mt-4"
                            loading={loading}
                            disabled={!isMobileValid}
                        >
                            {submitButtonLabel}
                        </Button>
                    </Tooltip>
                </Form>
            )}
        </Formik>
        </>
    );
};

export default DetailPageForm;
