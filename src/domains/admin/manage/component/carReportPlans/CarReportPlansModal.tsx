import React, { useState } from 'react';

import { Flex, Form } from 'antd';
import { useDispatch } from 'react-redux';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { amountBeforeCommission } from '@utils/priceFormat';

import {
    ACCOUNTING_PORTAL_ONLY,
    withCommissionLimitTest,
} from '../../../utils/commissionValidation';
import { createCarReportPlan, updateCarReportPlan } from '../../api/carReportPlans';
import { CarReportPlan, REPORT_TYPE_OPTIONS } from '../../types/carReportPlan';

interface ModalProps {
    open: boolean;
    handleCancel: () => void;
    data?: CarReportPlan;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
}

const schema = Yup.object({
    reportType: Yup.string().required('Report type is required'),
    packageId: Yup.string().when('reportType', {
        is: 'inspection',
        then: rule => rule.required('Package id is required for inspection plans'),
        otherwise: rule => rule.notRequired(),
    }),
    displayName: Yup.string().required('Display name is required'),
    price: Yup.number()
        .typeError('Price must be a number')
        .positive('Price must be positive')
        .required('Price is required'),
    commissionMode: Yup.string()
        .oneOf(['MARGIN', 'AGENT_MARKUP', 'PRINCIPAL_MARKUP'], 'Invalid Commission Mode')
        .required('Commission Mode is required'),
    commissionType: Yup.string().oneOf(['PERCENTAGE', 'FLAT']).optional(),
    commission: withCommissionLimitTest(Yup.number().min(0).optional(), ['price']),
    fixedCommissionPerTransaction: Yup.number().min(0).optional(),
    isCommissionInclGST: Yup.boolean().optional(),
});

// Create / edit one Car Report plan. reportType + packageId are the product's identity —
// existing orders reference them — so they are fixed after creation.
const CarReportPlansModal = ({ handleCancel, open, data, setRefresh }: ModalProps) => {
    const dispatch = useDispatch();
    const { role, id: userId } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const isEdit = !!data?.id;

    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle={isEdit ? 'Edit Car Report Plan' : 'Add Car Report Plan'}
            open={open}
            validationSchema={schema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                setIsLoading(true);
                const payload = {
                    userId,
                    userType: role,
                    reportType: values.reportType,
                    packageId: values.packageId || null,
                    displayName: values.displayName,
                    price: Number(values.price),
                    vendorProductCode:
                        values.reportType === 'inspection'
                            ? values.vendorProductCode || null
                            : null,
                    sortOrder: Number(values.sortOrder) || 0,
                    commissionMode: values.commissionMode,
                    commissionType: values.commissionType,
                    commission: Number(values.commission) || 0,
                    fixedCommissionPerTransaction:
                        Number(values.fixedCommissionPerTransaction) || 0,
                    isCommissionInclGST: Boolean(values.isCommissionInclGST),
                };
                const res = isEdit
                    ? await updateCarReportPlan({ ...payload, id: data?.id })
                    : await createCarReportPlan(payload);
                setIsLoading(false);

                if (res && res.status === true) {
                    dispatch(showToast({ description: res.message, variant: 'success' }));
                    setRefresh(true);
                    handleCancel();
                } else if (res && res.status === false) {
                    dispatch(showToast({ description: res.message, variant: 'error' }));
                }
            }}
            initialValues={{
                reportType: data?.reportType || '',
                packageId: data?.packageId || '',
                displayName: data?.displayName || '',
                price:
                    data?.price != null
                        ? amountBeforeCommission(data.price, data.totalCommission)
                        : 0,
                vendorProductCode: data?.vendorProductCode || '',
                sortOrder: data?.sortOrder ?? 0,
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: Number(data?.commission ?? 0),
                fixedCommissionPerTransaction: Number(data?.fixedCommissionPerTransaction ?? 0),
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
            }}
        >
            {({ values }) => (
                <Flex vertical className="w-full">
                    <Form layout="vertical">
                        {!isEdit && (
                            <SelectInput
                                isRequired
                                name="reportType"
                                options={REPORT_TYPE_OPTIONS}
                                placeholder="Select report type"
                                label="Report Type"
                            />
                        )}
                        {!isEdit && values.reportType === 'inspection' && (
                            <TextInput
                                name="packageId"
                                label="Package ID"
                                type="text"
                                placeholder="e.g. basic, premium"
                                isRequired
                                classes="rounded-sm"
                            />
                        )}
                        <TextInput
                            name="displayName"
                            label="Display Name"
                            type="text"
                            placeholder="e.g. Basic Inspection"
                            isRequired
                            classes="rounded-sm"
                        />
                        <TextInput
                            name="price"
                            label="Price (₹)"
                            type="number"
                            placeholder="e.g. 599"
                            isRequired
                            classes="rounded-sm"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        {/* Only inspection books by Droom SKU — valuation/history have none. */}
                        {values.reportType === 'inspection' && (
                            <TextInput
                                name="vendorProductCode"
                                label="Droom Product Code"
                                type="text"
                                placeholder="e.g. self_inspection_tkm_insurance_ai"
                                classes="rounded-sm"
                            />
                        )}
                        <TextInput
                            name="sortOrder"
                            label="Sort Order"
                            type="number"
                            placeholder="e.g. 1"
                            classes="rounded-sm"
                        />
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
                            label="Commission Includes GST"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default CarReportPlansModal;
