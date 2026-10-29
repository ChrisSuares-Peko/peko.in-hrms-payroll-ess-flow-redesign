import { Flex, Form } from 'antd';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { amountBeforeCommission } from '@utils/priceFormat';

import { ACCOUNTING_PORTAL_ONLY } from '../../../utils/commissionValidation';
import useUpdateBusinessRegistrationCatalog from '../../hooks/useUpdateBusinessRegistrationCatalog';
import { catalogSchema } from '../../schema/businessRegistrationCatalog';
import { CatalogRow } from '../../types/businessRegistrationCatalog';

type CatalogModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: CatalogRow;
    handleRefresh: () => void;
};

// Admin edits amount + display order here; active/inactive is toggled directly
// from the Status column tick in the table. Vendor fields stay read-only.
const CatalogModal = ({ open, handleCancel, data, handleRefresh }: CatalogModalProps) => {
    const { isLoading, updateCatalogDetails } = useUpdateBusinessRegistrationCatalog();

    return (
        <CustomModalWithForm
            modalTitle={`Edit — ${data?.serviceName ?? 'Catalog Item'}`}
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const result = await updateCatalogDetails({
                    id: data!.id,
                    amount: values.amount === '' ? null : values.amount,
                    sortOrder: values.sortOrder,
                    commissionMode: values.commissionMode,
                    commissionType: values.commissionType,
                    commission: values.commission,
                    fixedCommissionPerTransaction: values.fixedCommissionPerTransaction,
                    isCommissionInclGST: values.isCommissionInclGST,
                });
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            validationSchema={catalogSchema}
            initialValues={{
                amount:
                    data?.amount != null && data.amount !== ''
                        ? amountBeforeCommission(data.amount, data.totalCommission).toFixed(2)
                        : '',
                sortOrder: data?.sortOrder ?? 0,
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || 0,
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || 0,
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
            }}
        >
            <Flex vertical className="w-full">
                <Form layout="vertical">
                    <TextInput
                        name="amount"
                        label="Custom Amount (₹) — leave blank to show the market price"
                        type="text"
                        placeholder="Enter custom amount"
                        classes="rounded-sm"
                        maxLength={15}
                        allowDecimalsOnly
                        isDisabled
                    />
                    <TextInput
                        name="sortOrder"
                        label="Display Order"
                        type="text"
                        placeholder="Enter order (lower shows first)"
                        isRequired
                        classes="rounded-sm"
                        maxLength={4}
                        allowNumbersOnly
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
        </CustomModalWithForm>
    );
};

export default CatalogModal;
