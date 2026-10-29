import { Card, Form, Typography } from 'antd';
import { useFormikContext } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import { CustomerPaysRow } from '@components/atomic/PriceAfterDiscount';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import {
    CUSTOMER_PAYS_INFO,
    PEKO_BEARS_DISCOUNT,
} from '@src/domains/admin/utils/commissionValidation';

import useCommissionModes from '../../hooks/useCommissionModes';
import { CommissionMode, CommissionType } from '../../types/services';
import { COMMISSION_TYPE_OPTIONS } from '../../utils/serviceDetailData';

export type CommissionBlockValues = {
    commissionMode: CommissionMode;
    commissionType: CommissionType;
    providerCommission: string;
    fixedCommissionPerTransaction: string;
    isCommissionInclGST: boolean;
};

// monthly/annually are only used when useSplitCommission is true.
export type CommissionFormValues = CommissionBlockValues & {
    price?: string;
    annualPrice?: string;
    discount?: string;
    annualDiscount?: string;
    useSplitCommission?: boolean;
    monthly?: CommissionBlockValues;
    annually?: CommissionBlockValues;
};

type ConfigureCommissionDrawerProps = {
    open: boolean;
    serviceKey: string;
    title: string;
    initialValues: CommissionFormValues;
    // Only services with a real "configure separately for monthly and annually" toggle pass this.
    supportsSplitCommission?: boolean;
    // Only the single-plan drawer passes this: the plan price is edited here or shown read-only.
    priceField?: 'editable' | 'readonly';
    priceLabel?: string;
    hasAnnualPrice?: boolean;
    hasDiscount?: boolean;
    onCancel: () => void;
    onSubmit: (values: CommissionFormValues) => void;
};

const commissionBlockSchema = Yup.object({
    commissionMode: Yup.string().required('Commission mode is required'),
    commissionType: Yup.string().required('Commission type is required'),
    providerCommission: Yup.number()
        .typeError('Enter a valid number')
        .min(0, 'Cannot be negative')
        .when('commissionType', {
            is: 'PERCENTAGE',
            then: schema => schema.max(100, 'Percentage cannot exceed 100'),
        })
        .required('Provider commission is required'),
    fixedCommissionPerTransaction: Yup.number()
        .typeError('Enter a valid number')
        .min(0, 'Cannot be negative')
        .nullable()
        .transform(value => (Number.isNaN(value) ? null : value)),
});

// Predicate (not a literal false) so an unset useSplitCommission still counts as "not split".
const isSplit = (useSplitCommission: unknown) => Boolean(useSplitCommission);
const isNotSplit = (useSplitCommission: unknown) => !useSplitCommission;

export const commissionSchema = Yup.object({
    useSplitCommission: Yup.boolean(),
    commissionMode: Yup.string().when('useSplitCommission', {
        is: isNotSplit,
        then: schema => schema.required('Commission mode is required'),
    }),
    commissionType: Yup.string().when('useSplitCommission', {
        is: isNotSplit,
        then: schema => schema.required('Commission type is required'),
    }),
    providerCommission: Yup.number()
        .typeError('Enter a valid number')
        .min(0, 'Cannot be negative')
        .when(['useSplitCommission', 'commissionType'], {
            is: (useSplitCommission: boolean, commissionType: string) =>
                isNotSplit(useSplitCommission) && commissionType === 'PERCENTAGE',
            then: schema => schema.max(100, 'Percentage cannot exceed 100'),
        })
        .when('useSplitCommission', {
            is: isNotSplit,
            then: schema => schema.required('Provider commission is required'),
        }),
    fixedCommissionPerTransaction: Yup.number()
        .typeError('Enter a valid number')
        .min(0, 'Cannot be negative')
        .nullable()
        .transform(value => (Number.isNaN(value) ? null : value)),
    monthly: Yup.object().when('useSplitCommission', {
        is: isSplit,
        then: () => commissionBlockSchema,
    }),
    annually: Yup.object().when('useSplitCommission', {
        is: isSplit,
        then: () => commissionBlockSchema,
    }),
});

const priceSchema = Yup.number()
    .typeError('Enter a valid number')
    .min(0, 'Cannot be negative')
    .required('Price is required');

const annualPriceSchema = Yup.number()
    .typeError('Enter a valid number')
    .min(0, 'Cannot be negative')
    .required('Annual price is required')
    .test(
        'annual-above-monthly',
        'Annual price must be greater than monthly price',
        function validateAnnualPrice(value) {
            const monthly = Number(this.parent.price);
            // Both are 0 until the prices are set.
            return Number(value) > monthly || (Number(value) === 0 && monthly === 0);
        }
    );

const money = (label: string) =>
    Yup.number()
        .typeError('Enter a valid number')
        .min(0, 'Cannot be negative')
        .required(`${label} is required`);

const discountSchema = (period: string, priceKey: string) =>
    money(`${period} discount`).test(
        'discount-within-price',
        `Discount cannot exceed the ${period} price`,
        function validateDiscount(value) {
            return Number(value) <= Number(this.parent[priceKey]);
        }
    );

const buildSchema = (
    priceField: 'editable' | 'readonly' | undefined,
    hasAnnualPrice?: boolean,
    hasDiscount?: boolean
) => {
    if (priceField !== 'editable') return commissionSchema;
    if (hasDiscount) {
        return commissionSchema.shape({
            price: money('Monthly price'),
            discount: discountSchema('monthly', 'price'),
            annualPrice: money('Annual price'),
            annualDiscount: discountSchema('annual', 'annualPrice'),
        });
    }
    return commissionSchema.shape({
        price: priceSchema,
        ...(hasAnnualPrice && { annualPrice: annualPriceSchema }),
    });
};

export type CommissionModeSelect = {
    modeOptions: { value: CommissionMode; label: string }[];
    modesLoading: boolean;
};

export const CommissionFields = ({
    namePrefix = '',
    modeOptions,
    modesLoading,
}: { namePrefix?: string } & CommissionModeSelect) => (
    <>
        <SelectInput
            name={`${namePrefix}commissionMode`}
            label="Commission Mode"
            placeholder="Select commission mode"
            options={modeOptions}
            isDisabled={modesLoading}
            loading={modesLoading}
            isRequired
            showToolTip
            tooltipText="Margin and Agent Markup post commission to the Commission account with vendor payable booked separately. Principal Markup books a single Sales line."
        />
        <SelectInput
            name={`${namePrefix}commissionType`}
            label="Commission Type"
            placeholder="Select commission type"
            options={COMMISSION_TYPE_OPTIONS}
            isRequired
        />
        <TextInput
            name={`${namePrefix}providerCommission`}
            label="Provider Commission"
            placeholder="0.00"
            type="text"
            allowDecimalsOnly
            isRequired
        />
        <TextInput
            name={`${namePrefix}fixedCommissionPerTransaction`}
            label="Fixed Commission Per Transaction"
            placeholder="0.00"
            type="text"
            allowDecimalsOnly
        />
        <SwitchInput
            name={`${namePrefix}isCommissionInclGST`}
            label="Commission Include GST"
            showToolTip
            tooltipText="Enable if the commission amount already includes GST."
        />
    </>
);

const CommissionDrawerFields = ({
    serviceKey,
    supportsSplitCommission,
}: {
    serviceKey: string;
    supportsSplitCommission?: boolean;
}) => {
    const { values } = useFormikContext<CommissionFormValues>();
    const { options: modeOptions, isLoading: modesLoading } = useCommissionModes(serviceKey);
    const modeSelect = { modeOptions, modesLoading };

    if (!supportsSplitCommission) return <CommissionFields {...modeSelect} />;

    return (
        <>
            <SwitchInput
                name="useSplitCommission"
                label="Configure commission separately for monthly and annually"
            />
            {values.useSplitCommission ? (
                <>
                    <Card className="mt-4 rounded-xl border border-borderCard shadow-none">
                        <Typography.Text strong className="block mb-2">
                            Monthly Commission
                        </Typography.Text>
                        <CommissionFields namePrefix="monthly." {...modeSelect} />
                    </Card>
                    <Card className="mt-4 rounded-xl border border-borderCard shadow-none">
                        <Typography.Text strong className="block mb-2">
                            Annually Commission
                        </Typography.Text>
                        <CommissionFields namePrefix="annually." {...modeSelect} />
                    </Card>
                </>
            ) : (
                <CommissionFields {...modeSelect} />
            )}
        </>
    );
};

// Package plans: price and discount per period, with what the customer pays before commission.
const PackagePricingFields = () => {
    const { values } = useFormikContext<CommissionFormValues>();
    const discountTip = `Discount amount is always flat amount. ${PEKO_BEARS_DISCOUNT}`;

    return (
        <>
            <TextInput
                name="price"
                label="Monthly price (₹)"
                placeholder="0.00"
                type="text"
                allowTwoDecimalsOnly
                isRequired
                showToolTip
                tooltipText="Full price, before the discount."
            />
            <TextInput
                name="discount"
                label="Monthly discount (₹)"
                placeholder="0.00"
                type="text"
                allowTwoDecimalsOnly
                isRequired
                showToolTip
                tooltipText={discountTip}
            />
            <CustomerPaysRow
                label="Customer pays (monthly)"
                info={CUSTOMER_PAYS_INFO}
                price={values.price}
                discount={values.discount}
            />
            <TextInput
                name="annualPrice"
                label="Annual price (₹)"
                placeholder="0.00"
                type="text"
                allowTwoDecimalsOnly
                isRequired
                showToolTip
                tooltipText="Full price, before the discount."
            />
            <TextInput
                name="annualDiscount"
                label="Annual discount (₹)"
                placeholder="0.00"
                type="text"
                allowTwoDecimalsOnly
                isRequired
                showToolTip
                tooltipText={discountTip}
            />
            <CustomerPaysRow
                label="Customer pays (annually)"
                info={CUSTOMER_PAYS_INFO}
                price={values.annualPrice}
                discount={values.annualDiscount}
            />
        </>
    );
};

const ConfigureCommissionDrawer = ({
    open,
    serviceKey,
    title,
    initialValues,
    supportsSplitCommission,
    priceField,
    priceLabel = 'Price',
    hasAnnualPrice,
    hasDiscount,
    onCancel,
    onSubmit,
}: ConfigureCommissionDrawerProps) => (
    <CustomModalWithForm
        open={open}
        modalTitle={title}
        initialValues={initialValues}
        validationSchema={buildSchema(priceField, hasAnnualPrice, hasDiscount)}
        handleCancel={onCancel}
        handleFormSubmit={values => onSubmit(values as CommissionFormValues)}
        firstBtnTxt="Save"
        reinitialise
    >
        <Form layout="vertical">
            {priceField === 'editable' && hasDiscount && <PackagePricingFields />}
            {priceField && !hasDiscount && (
                <TextInput
                    name="price"
                    label={priceLabel}
                    placeholder="0.00"
                    type="text"
                    allowTwoDecimalsOnly
                    isRequired
                    isDisabled={priceField === 'readonly'}
                    showToolTip={priceField === 'readonly'}
                    tooltipText="Synced from the vendor, so it cannot be edited here."
                />
            )}
            {priceField && !hasDiscount && hasAnnualPrice && (
                <TextInput
                    name="annualPrice"
                    label="Annual Price"
                    placeholder="0.00"
                    type="text"
                    allowTwoDecimalsOnly
                    isRequired
                    isDisabled={priceField === 'readonly'}
                />
            )}
            <CommissionDrawerFields
                serviceKey={serviceKey}
                supportsSplitCommission={supportsSplitCommission}
            />
        </Form>
    </CustomModalWithForm>
);

export default ConfigureCommissionDrawer;
