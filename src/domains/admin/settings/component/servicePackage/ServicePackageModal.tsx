import { Flex, Form } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import InputTextArea from '@components/atomic/inputs/InputTextArea';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { CustomerPaysRow } from '@components/atomic/PriceAfterDiscount';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import usePartnersForCorporate from '@src/domains/admin/users/hooks/usePartnersForCorporate';
import { packageAccessKeys } from '@utils/packageAccessKeys';
import { amountBeforeCommission, formatNumberWithoutCommas } from '@utils/priceFormat';

import {
    ACCOUNTING_PORTAL_ONLY,
    CUSTOMER_PAYS_INFO,
    PEKO_BEARS_DISCOUNT,
} from '../../../utils/commissionValidation';
import useServicePackageUpdate from '../../hooks/useServicePackageUpdate';
import { servicePackageSchema } from '../../schema/servicePackage';
import { Packages } from '../../types/servicePackage';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Packages;
    handleRefresh: () => void;
};

const CreateUpdateModal = ({ open, handleCancel, data, handleRefresh }: DepartmentModalProps) => {
    const { isLoading, handlePackageCreation, updatePackageDetails } = useServicePackageUpdate();
    const { categoryDatas } = usePartnersForCorporate('');
    return (
        <CustomModalWithForm
            modalTitle="Package Management"
            open={open}
            isLoading={isLoading}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                const { isPerPeriodCommission, planCommissions, ...rest } = values;
                const payload = {
                    ...rest,
                    planCommissions: isPerPeriodCommission ? planCommissions : null,
                };
                let result;
                if (payload.id) {
                    result = await updatePackageDetails(payload);
                } else {
                    result = await handlePackageCreation(payload);
                }
                if (result) {
                    handleCancel();
                    handleRefresh();
                }
            }}
            initialValues={{
                id: data?.id || '',
                packageName: data?.packageName || '',
                packagePrices: {
                    monthly: data?.packagePrices?.monthly
                        ? formatNumberWithoutCommas(
                              amountBeforeCommission(
                                  data.packagePrices.monthly,
                                  data.packagePrices.monthlyTotalCommission
                              )
                          )
                        : '0',
                    annually: data?.packagePrices?.annually
                        ? formatNumberWithoutCommas(
                              amountBeforeCommission(
                                  data.packagePrices.annually,
                                  data.packagePrices.annuallyTotalCommission
                              )
                          )
                        : '0',
                },
                discount: {
                    monthly: formatNumberWithoutCommas(data?.discount?.monthly) || 0,
                    annually: formatNumberWithoutCommas(data?.discount?.annually) || 0,
                },
                description: data?.description || '',
                serviceList: data?.serviceList || '',
                packageType: data?.packageType || '',
                accessCode: data?.accessCode || '',
                partnerId: data?.partnerId || '',
                externalId: data?.externalId || '',
                packageLogo: data?.packageLogo || null,
                priorityLevel: data?.priorityLevel?.toString() || '',
                commissionMode: data?.commissionMode || 'MARGIN',
                commissionType: data?.commissionType || 'PERCENTAGE',
                commission: data?.commission || '0',
                fixedCommissionPerTransaction: data?.fixedCommissionPerTransaction || '0',
                isCommissionInclGST:
                    data?.isCommissionInclGST != null ? Boolean(data.isCommissionInclGST) : true,
                isPerPeriodCommission: !!data?.planCommissions,
                planCommissions: {
                    monthly: {
                        commissionMode: data?.planCommissions?.monthly?.commissionMode || 'MARGIN',
                        commissionType:
                            data?.planCommissions?.monthly?.commissionType || 'PERCENTAGE',
                        commission: data?.planCommissions?.monthly?.commission || '0',
                        fixedCommissionPerTransaction:
                            data?.planCommissions?.monthly?.fixedCommissionPerTransaction || '0',
                        isCommissionInclGST:
                            data?.planCommissions?.monthly?.isCommissionInclGST != null
                                ? Boolean(data.planCommissions.monthly.isCommissionInclGST)
                                : true,
                    },
                    annually: {
                        commissionMode: data?.planCommissions?.annually?.commissionMode || 'MARGIN',
                        commissionType:
                            data?.planCommissions?.annually?.commissionType || 'PERCENTAGE',
                        commission: data?.planCommissions?.annually?.commission || '0',
                        fixedCommissionPerTransaction:
                            data?.planCommissions?.annually?.fixedCommissionPerTransaction || '0',
                        isCommissionInclGST:
                            data?.planCommissions?.annually?.isCommissionInclGST != null
                                ? Boolean(data.planCommissions.annually.isCommissionInclGST)
                                : true,
                    },
                },
            }}
            validationSchema={servicePackageSchema}
        >
            {({ values, setFieldValue }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <SelectInput
                            label="Select Partner"
                            name="partnerId"
                            placeholder="Select partner"
                            options={
                                categoryDatas
                                    ? categoryDatas.map(item => ({
                                          value: item.id.toString(),
                                          label: item.name,
                                      }))
                                    : []
                            }
                            tooltipText="Please select this option if you are adding a package for a partner. If not, you can leave this field empty."
                            showToolTip
                        />
                        <TextInput
                            name="packageName"
                            label="Package Name"
                            type="text"
                            placeholder="Enter package name"
                            isRequired
                            classes=" rounded-sm"
                            maxLength={30}
                        />
                        <TextInput
                            name="packagePrices.monthly"
                            label="Package Price (monthly)"
                            type="text"
                            placeholder="Enter monthly price"
                            isRequired
                            classes="rounded-sm"
                            maxLength={15}
                            allowDecimalsOnly
                            isDisabled
                            showToolTip
                            tooltipText={`Full price, before the discount. ${ACCOUNTING_PORTAL_ONLY}`}
                        />
                        <TextInput
                            name="discount.monthly"
                            label="Discount (monthly)"
                            type="text"
                            placeholder="Enter monthly discount "
                            classes="rounded-sm"
                            maxLength={15}
                            allowDecimalsOnly
                            isDisabled
                            tooltipText={`Discount amount is always flat amount. ${PEKO_BEARS_DISCOUNT}. ${ACCOUNTING_PORTAL_ONLY}`}
                            showToolTip
                        />
                        <CustomerPaysRow
                            label="Customer pays (monthly)"
                            info={CUSTOMER_PAYS_INFO}
                            price={values.packagePrices?.monthly}
                            discount={values.discount?.monthly}
                        />
                        <TextInput
                            name="packagePrices.annually"
                            label="Package Price (annually)"
                            type="text"
                            placeholder="Enter annual price"
                            isRequired
                            classes="rounded-sm"
                            maxLength={15}
                            allowDecimalsOnly
                            isDisabled
                            showToolTip
                            tooltipText={`Full price, before the discount. ${ACCOUNTING_PORTAL_ONLY}`}
                        />
                        <TextInput
                            name="discount.annually"
                            label="Discount(annually)"
                            type="text"
                            placeholder="Enter annual discount"
                            classes="rounded-sm"
                            maxLength={15}
                            allowDecimalsOnly
                            isDisabled
                            tooltipText={`Discount amount is always flat amount. ${PEKO_BEARS_DISCOUNT}. ${ACCOUNTING_PORTAL_ONLY}`}
                            showToolTip
                        />
                        <CustomerPaysRow
                            label="Customer pays (annually)"
                            info={CUSTOMER_PAYS_INFO}
                            price={values.packagePrices?.annually}
                            discount={values.discount?.annually}
                        />
                        <SelectInput
                            label="Package Type"
                            isRequired
                            name="packageType"
                            placeholder="Select package type"
                            options={[
                                {
                                    value: 'INDIVIDUAL',
                                    label: 'Individual',
                                },
                                {
                                    value: 'GROUP',
                                    label: 'Group',
                                },
                            ]}
                            handleChange={e => setFieldValue('accessCode', '')}
                        />
                        {values.packageType === 'INDIVIDUAL' && (
                            <SelectInput
                                label="Access Code"
                                isRequired
                                name="accessCode"
                                placeholder="Select package type"
                                options={Object.entries(packageAccessKeys).map(
                                    ([label, value]) => ({
                                        label,
                                        value,
                                    })
                                )}
                            />
                        )}

                        <TextInput
                            name="priorityLevel"
                            label="Priority Level"
                            type="text"
                            placeholder="Enter priority level"
                            classes="rounded-sm"
                            maxLength={2}
                            allowNumbersOnly
                            showToolTip
                            isRequired
                            tooltipText="Lower values indicate lower priorities"
                        />

                        {values.packageType === 'GROUP' && (
                            <InputTextArea
                                name="serviceList"
                                label="Service List"
                                placeholder="Enter services"
                                autoSize={{ minRows: 4 }}
                                isRequired
                            />
                        )}
                        <TextInput
                            name="externalId"
                            label="External ID"
                            type="text"
                            placeholder="Enter external ID"
                            classes="rounded-sm"
                            maxLength={30}
                        />
                        <InputTextArea
                            name="description"
                            label="Description"
                            placeholder="Enter description"
                            autoSize={{ minRows: 4 }}
                        />
                        <CustomFileUploadInput
                            name="packageLogo"
                            label="Package Logo"
                            classes="rounded-sm"
                            format="imageFormat"
                            showFileName
                            showNotification
                            existingFileUrl={data?.packageLogo}
                        />
                        <SwitchInput
                            name="isPerPeriodCommission"
                            label="Configure commission separately for monthly and annually"
                            isDisabled
                            showToolTip
                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                        />
                        {!values.isPerPeriodCommission ? (
                            <>
                                <SelectInput
                                    name="commissionMode"
                                    label="Commission Mode"
                                    isRequired
                                    options={[
                                        { value: 'MARGIN', label: 'Margin' },
                                        { value: 'AGENT_MARKUP', label: 'Agent Markup' },
                                        { value: 'PRINCIPAL_MARKUP', label: 'Principal Markup' },
                                    ]}
                                    placeholder="Please select commission mode"
                                    isDisabled
                                    showToolTip
                                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                                />
                                <SelectInput
                                    name="commissionType"
                                    label="Commission Type"
                                    isRequired
                                    options={[
                                        { value: 'PERCENTAGE', label: 'Percentage' },
                                        { value: 'FLAT', label: 'Flat' },
                                    ]}
                                    placeholder="Select commission type"
                                    isDisabled
                                    showToolTip
                                    tooltipText={ACCOUNTING_PORTAL_ONLY}
                                />
                                <TextInput
                                    name="commission"
                                    label="Commission"
                                    type="text"
                                    placeholder="Enter commission"
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
                                    placeholder="Enter fixed commission per transaction"
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
                            </>
                        ) : (
                            <>
                                {(['monthly', 'annually'] as const).map(period => (
                                    <Flex
                                        vertical
                                        key={period}
                                        className="mb-4 border border-solid border-gray-200 rounded-sm p-3"
                                    >
                                        <div className="font-semibold mb-2 capitalize">
                                            {period} Commission
                                        </div>
                                        <SelectInput
                                            name={`planCommissions.${period}.commissionMode`}
                                            label="Commission Mode"
                                            isRequired
                                            options={[
                                                { value: 'MARGIN', label: 'Margin' },
                                                { value: 'AGENT_MARKUP', label: 'Agent Markup' },
                                                {
                                                    value: 'PRINCIPAL_MARKUP',
                                                    label: 'Principal Markup',
                                                },
                                            ]}
                                            placeholder="Please select commission mode"
                                            isDisabled
                                            showToolTip
                                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                                        />
                                        <SelectInput
                                            name={`planCommissions.${period}.commissionType`}
                                            label="Commission Type"
                                            isRequired
                                            options={[
                                                { value: 'PERCENTAGE', label: 'Percentage' },
                                                { value: 'FLAT', label: 'Flat' },
                                            ]}
                                            placeholder="Select commission type"
                                            isDisabled
                                            showToolTip
                                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                                        />
                                        <TextInput
                                            name={`planCommissions.${period}.commission`}
                                            label="Commission"
                                            type="text"
                                            placeholder="Enter commission"
                                            isRequired
                                            classes="rounded-sm"
                                            allowTwoDecimalsOnly
                                            isDisabled
                                            showToolTip
                                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                                        />
                                        <TextInput
                                            name={`planCommissions.${period}.fixedCommissionPerTransaction`}
                                            label="Fixed Commission Per Transaction"
                                            type="text"
                                            placeholder="Enter fixed commission per transaction"
                                            classes="rounded-sm"
                                            allowTwoDecimalsOnly
                                            isDisabled
                                            showToolTip
                                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                                        />
                                        <SwitchInput
                                            name={`planCommissions.${period}.isCommissionInclGST`}
                                            label="Commission Includes VAT"
                                            isDisabled
                                            showToolTip
                                            tooltipText={ACCOUNTING_PORTAL_ONLY}
                                        />
                                    </Flex>
                                ))}
                            </>
                        )}
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default CreateUpdateModal;
