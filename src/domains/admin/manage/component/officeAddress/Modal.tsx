import { Flex, Form } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { amountBeforeCommission, formatNumberWithoutCommas } from '@utils/priceFormat';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useUpdatePlan from '../../hooks/officeAdress_plans/useUpdatePlan';
import { plansSchema } from '../../schema/plans';
import { PlanBody } from '../../types/plans';
import { availabilityStatuses, billingCycles } from '../../utils/plans';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: PlanBody;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const { isLoading, handlePlanCreation, updatePlanDetails } = useUpdatePlan();
    const available = data?.is_available === 1;

    return (
        <CustomModalWithForm
            modalTitle="Plan Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let result;
                if (values.id) {
                    const planAvailable = values.is_available === true ? 1 : 0;
                    result = await updatePlanDetails({ ...values, is_available: planAvailable });
                } else {
                    result = await handlePlanCreation(values);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            reinitialise
            validationSchema={plansSchema}
            initialValues={{
                id: data?.id || '',
                name: data?.name || '',
                price: data?.price
                    ? formatNumberWithoutCommas(
                          amountBeforeCommission(data.price, data.totalCommission)
                      )
                    : '0',
                description: data?.description || '',
                highlights: data?.highlights || '',
                billingCycle: data?.billingCycle || '',
                is_available: available || false,
                logo: data?.logo || '',
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
                            placeholder="Enter Plan Name"
                            isRequired
                            classes=" rounded-sm"
                            maxLength={30}
                        />
                        <TextInput
                            name="price"
                            label="Plan Price"
                            type="text"
                            placeholder="Enter Plan Price"
                            isRequired
                            classes="rounded-sm"
                            maxLength={15}
                            allowDecimalsOnly
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />

                        <InputTextArea
                            isRequired
                            name="description"
                            label="Description"
                            placeholder="Enter Description"
                        />
                        <InputTextArea
                            isRequired
                            name="highlights"
                            label="Highlights"
                            placeholder="Enter Highlights"
                        />
                        <SelectInput
                            isRequired
                            placeholder="Select Billing Cycle"
                            name="billingCycle"
                            label="Billing Cycle"
                            options={billingCycles}
                        />
                        <SelectInput
                            isRequired
                            name="is_available"
                            label="Availability Status"
                            placeholder="Select Status"
                            options={availabilityStatuses}
                        />
                        <CustomFileUploadInput
                            existingFileUrl={data?.logo}
                            showFileName
                            showNotification
                            label="Choose logo"
                            name="logo"
                            format="logoFormat"
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

export default CreateUpdateModal;
