import React, { useState } from 'react';

import { Flex, Form } from 'antd';
import { useDispatch } from 'react-redux';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { showToast } from '@src/slices/apiSlice';
import { amountBeforeCommission } from '@utils/priceFormat';

import AddDescriptionDetails from './AddDescriptionDetails';
import AddFeatureDetails from './AddFeatureDetails';
import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useCreateEmailDomainPlan from '../../hooks/emailDomainPlans/useCreateEmailDomainPlan';
import emailDomainPlansSchema from '../../schema/emailDomainPlansSchema';
import { descriptionDetails, featureDetails } from '../../types/emailDomainPlan';

interface modalProps {
    open: boolean;
    handleCancel: () => void;
    data?: any;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    mode: string;
}
const EmailDomainPlansModal = ({ handleCancel, open, data, setRefresh, mode }: modalProps) => {
    const { isLoading, createNewEmailDomainPlan, updateCurrentEmailDomainPlan, allProducts } =
        useCreateEmailDomainPlan();
    const [, setFile] = useState<any>('');
    const modalHeader = mode === 'edit' ? 'Edit Email/Domain Plan' : 'Add Email/Domain Plan';
    const dispatch = useDispatch();
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle={modalHeader}
            open={open}
            validationSchema={emailDomainPlansSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                const formattedValues = {
                    ...values,
                    features: values.features.map((feature: featureDetails) => ({
                        label: feature.label,
                        value: feature.value,
                    })),
                    descriptions: values.descriptions.map((description: descriptionDetails) => ({
                        label: description.label,
                        value: description.value,
                    })),
                };

                if (formattedValues.id) {
                    res = await updateCurrentEmailDomainPlan(formattedValues);
                } else {
                    res = await createNewEmailDomainPlan(formattedValues);
                }
                if (res.status === true) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                    handleCancel();
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                id: data?.id || '',
                name: data?.name || '',
                softwaresSubscriptionId: data?.softwaresSubscriptionId || '',
                monthlyPrice: data?.monthlyPrice
                    ? amountBeforeCommission(
                          data.monthlyPrice,
                          data.monthlyTotalCommission
                      ).toFixed(2)
                    : '0',
                yearlyPrice: data?.yearlyPrice
                    ? amountBeforeCommission(data.yearlyPrice, data.yearlyTotalCommission).toFixed(
                          2
                      )
                    : '0',
                features:
                    data?.features && data?.features.length > 0
                        ? data?.features
                        : [
                              {
                                  id: '',
                                  label: '',
                                  value: '',
                              },
                          ],
                descriptions:
                    data?.descriptions && data?.descriptions.length > 0
                        ? data?.descriptions
                        : [
                              {
                                  id: '',
                                  label: '',
                                  value: '',
                              },
                          ],
                image: data?.image_url || '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || 0,
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
            }}
        >
            {({ handleSubmit, values }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <TextInput
                            name="name"
                            label="Plan Name"
                            type="text"
                            placeholder="Enter Plan Name"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <SelectInput
                            isRequired
                            name="softwaresSubscriptionId"
                            options={allProducts}
                            placeholder="Please select a product"
                            label="Product"
                        />
                        <TextInput
                            name="monthlyPrice"
                            label="Monthly Price"
                            type="text"
                            placeholder="Enter Monthly Price"
                            isRequired
                            classes=" rounded-sm"
                            maxLength={15}
                            allowTwoDecimalsOnly
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <TextInput
                            name="yearlyPrice"
                            label="Yearly Price"
                            type="text"
                            placeholder="Enter Yearly Price"
                            isRequired
                            classes=" rounded-sm"
                            maxLength={15}
                            allowTwoDecimalsOnly
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        <AddFeatureDetails values={values.features} />
                        <AddDescriptionDetails values={values.descriptions} />
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
                        <CustomFileUploadInput
                            isRequired
                            name="image"
                            label="Image"
                            classes="rounded-sm"
                            format="imageFormat"
                            existingFileUrl={data?.image_url}
                            showFileName
                            showNotification
                            setFile={setFile}
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default EmailDomainPlansModal;
