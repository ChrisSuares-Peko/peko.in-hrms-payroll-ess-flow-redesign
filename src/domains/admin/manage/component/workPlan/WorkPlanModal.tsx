import { useState } from 'react';

import { Flex, Form, Skeleton } from 'antd';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';
import { amountBeforeCommission } from '@utils/priceFormat';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useUpdateWorkPlan from '../../hooks/work_plans/useUpdateWorkPlan';
import workPlanSchema from '../../schema/workPlanSchema';
import { WorkPlanData, refresh } from '../../types/workPlan';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: WorkPlanData;
};

const WorkPlanModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: DepartmentModalProps & refresh) => {
    const [searchText, setSearchText] = useState<string>('');
    const { createNewWorkPlan, updateCurrentWorkPlan, categoryData, isLoading } =
        useUpdateWorkPlan(searchText);
    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Work Plan Management"
            open={open}
            validationSchema={workPlanSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                if (data) {
                    res = await updateCurrentWorkPlan({
                        ...values,
                    });
                } else {
                    res = await createNewWorkPlan({
                        ...values,
                    });
                }

                if (res.status === true) {
                    setRefresh(true);
                    if (data)
                        dispatch(
                            showToast({
                                description: `Work plan updated successfully`,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: `Work plan added successfully`,
                                variant: 'success',
                            })
                        );
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
                description: data?.description || '',
                price: data?.price
                    ? amountBeforeCommission(data.price, data.totalCommission).toFixed(2)
                    : '0',
                billingCycle: data?.billingCycle || 'Monthly',
                features: data?.features || '',
                status: data?.status || true,
                popular: data?.popular || false,
                workId: data?.workId.toString() || '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || 0,
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
            }}
        >
            {() => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <TextInput
                            name="name"
                            label="Plan Name"
                            type="text"
                            placeholder="Please enter plan name"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="description"
                            label="Description"
                            type="text"
                            placeholder="Please enter description name"
                            isRequired
                            classes=" rounded-sm"
                        />
                        <TextInput
                            name="price"
                            label="Price"
                            type="text"
                            placeholder="Please enter price"
                            isRequired
                            classes=" rounded-sm"
                            allowTwoDecimalsOnly
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />

                        <SelectInput
                            name="billingCycle"
                            isRequired
                            options={[
                                {
                                    label: 'Monthly',
                                    value: 'Monthly',
                                },
                                {
                                    label: 'Yearly',
                                    value: 'Yearly',
                                },
                            ]}
                            placeholder="Please select a type of billing cycle"
                            label="Billing Cycle"
                            filterOption={false}
                        />
                        <InputTextArea
                            name="features"
                            label="Features"
                            placeholder="Enter features"
                            isRequired
                            maxLength={2000}
                            autoSize={{ minRows: 3 }}
                        />
                        {categoryData ? (
                            <SelectInput
                                filterOption={false}
                                allowClear
                                onSearch={setSearchText}
                                showSearch
                                isRequired
                                name="workId"
                                options={categoryData}
                                placeholder="Please select a Work"
                                label="Select Work"
                            />
                        ) : (
                            <Skeleton.Input active block />
                        )}

                        <SwitchInput name="popular" label="Popular" />
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
            )}
        </CustomModalWithForm>
    );
};

export default WorkPlanModal;
