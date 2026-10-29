import { Flex, Typography } from 'antd';
import { useFormikContext } from 'formik';
import * as Yup from 'yup';

import CheckboxInput from '@components/atomic/inputs/CheckboxInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { formatNumberWithLocalStringWithoutDecimalPoint, roundMoney } from '@utils/priceFormat';

import { CtcBreakdown, CtcEarningComponent } from '../../utils/ctcCalculator/types';

interface CtcEarningDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: (earning: CtcEarningComponent) => void;
    selectedEarning?: CtcEarningComponent | null;
    allowBalancing: boolean;
    breakdown: CtcBreakdown;
}

const baseCalculationTypeOptions = [
    { label: 'Fixed', value: 'FIXED' },
    { label: 'Percentage', value: 'PERCENTAGE' },
];

const calculationBasisOptions = [
    { label: '% of Basic Salary', value: 'BASIC_SALARY' },
    { label: '% of Gross Salary', value: 'GROSS_SALARY' },
    { label: '% of CTC', value: 'CTC' },
];

const percentageBaseFor = (breakdown: CtcBreakdown, basis?: string) => {
    if (basis === 'CTC') return breakdown.annualCTC / 12;
    return basis === 'GROSS_SALARY' ? breakdown.grossSalary : breakdown.basicSalary;
};

// Basic Salary can only be a percentage of Gross or CTC (not of itself, not of a specific
// component) — mirrors the same restriction on the HR Settings Salary Components form.
const basicSalaryBasisOptions = [
    { label: '% of Gross Salary', value: 'GROSS_SALARY' },
    { label: '% of CTC', value: 'CTC' },
];

const fmtWhole = (amount: number) =>
    formatNumberWithLocalStringWithoutDecimalPoint(roundMoney(amount));

// How much of Gross is still unclaimed by every OTHER earning — what the Balancing
// component (e.g. Other Allowance) would absorb if this component were removed entirely.
// Editing an existing component excludes its OWN current amount from "everything else",
// so re-entering the same value it already has never falsely reports as "doesn't fit".
const getAvailableAmount = (
    breakdown: CtcBreakdown,
    selectedEarning?: CtcEarningComponent | null
) => {
    const balancing = breakdown.earnings.find(e => e.calculationType === 'BALANCING');
    if (!balancing) return null;
    const existing =
        selectedEarning && selectedEarning.calculationType !== 'BALANCING'
            ? selectedEarning.calculatedAmount
            : 0;
    return balancing.calculatedAmount + existing;
};

const buildSchema = (breakdown: CtcBreakdown, selectedEarning?: CtcEarningComponent | null) =>
    Yup.object().shape({
        componentName: Yup.string().required('Please enter the component name'),
        calculationType: Yup.string().required('Please select the calculation type'),
        calculationBasis: Yup.string().when('calculationType', {
            is: 'PERCENTAGE',
            then: s => s.required('Please select the calculation basis'),
            otherwise: s => s.notRequired(),
        }),
        amountPercentage: Yup.number()
            .transform((value, originalValue) => (originalValue === '' ? undefined : value))
            .typeError('Please enter a valid number')
            .when('calculationType', {
                is: (value: string) => value === 'BALANCING',
                then: s => s.notRequired(),
                otherwise: s =>
                    s
                        .required('Please enter a value')
                        .moreThan(0, 'Must be greater than 0')
                        .when('calculationType', {
                            is: 'PERCENTAGE',
                            then: p => p.max(100, 'Percentage cannot be more than 100'),
                        })
                        .test('fits-available-ctc', function fitsAvailableCtc(value) {
                            if (value === undefined || value === null) return true;
                            // Over 100% is already reported by the max(100) rule above — skip here
                            // so Formik shows that clearer message instead of this one.
                            if (this.parent.calculationType === 'PERCENTAGE' && Number(value) > 100)
                                return true;
                            // Basic Salary changes the basis every %-of-Gross/%-of-Basic component
                            // resolves from, not just its own slice of the remainder — a
                            // fundamentally different check than "does this fit what's left",
                            // so it's excluded here (same as elsewhere in this file).
                            if (selectedEarning?.componentName === 'Basic Salary') return true;
                            const available = getAvailableAmount(breakdown, selectedEarning);
                            if (available === null) return true; // No Balancing component configured — nothing to protect.

                            const { calculationType, calculationBasis } = this.parent;
                            const enteredAmount =
                                calculationType === 'PERCENTAGE'
                                    ? (Number(value) / 100) *
                                      percentageBaseFor(breakdown, calculationBasis)
                                    : Number(value);

                            if (enteredAmount > available + 0.01) {
                                return this.createError({
                                    message: `This doesn't fit: after Basic, HRA and the other components, only ₹${fmtWhole(
                                        available
                                    )} / month of this CTC is left. Enter a smaller amount.`,
                                });
                            }
                            return true;
                        }),
            }),
    });

interface CtcEarningFormFieldsProps {
    typeOptions: { label: string; value: string }[];
    basisOptions: { label: string; value: string }[];
    isBasicSalary: boolean;
}

const CtcEarningFormFields = ({
    typeOptions,
    basisOptions,
    isBasicSalary,
}: CtcEarningFormFieldsProps) => {
    const { values, setFieldValue } = useFormikContext<any>();
    return (
        <>
            <TextInput
                name="componentName"
                type="text"
                placeholder="Enter component name"
                label="Component Name"
                isRequired
                isDisabled={isBasicSalary}
            />
            <SelectInput
                name="calculationType"
                options={typeOptions}
                placeholder="Select calculation type"
                label="Calculation Type"
                isRequired
            />
            {values.calculationType === 'PERCENTAGE' && (
                <>
                    <TextInput
                        name="amountPercentage"
                        type="text"
                        placeholder="Enter percentage"
                        label="Percentage"
                        allowTwoDecimalsOnly
                        isRequired
                        maxLength={7}
                    />
                    <SelectInput
                        name="calculationBasis"
                        options={basisOptions}
                        placeholder="Select calculation basis"
                        label="Calculation Basis"
                        isRequired
                    />
                </>
            )}
            {values.calculationType === 'FIXED' && (
                <TextInput
                    name="amountPercentage"
                    type="text"
                    placeholder="Enter amount"
                    label="Amount"
                    allowTwoDecimalsOnly
                    isRequired
                    maxLength={7}
                />
            )}
            {!isBasicSalary && values.calculationType !== 'BALANCING' && (
                <Flex vertical className="mt-2">
                    <CheckboxInput
                        name="isPartOfGross"
                        checked={values.isPartOfGross !== false}
                        onChange={(e: any) => setFieldValue('isPartOfGross', e.target.checked)}
                    >
                        <Typography.Text className="text-sm">Part of Gross Salary</Typography.Text>
                    </CheckboxInput>
                    <Typography.Text type="secondary" className="text-xs">
                        Untick for a company-paid benefit that counts toward CTC but isn&apos;t part
                        of monthly Gross pay — it won&apos;t be included in ESI wages, monthly TDS,
                        or the monthly payout.
                    </Typography.Text>
                </Flex>
            )}
        </>
    );
};

// Only 'BASIC_SALARY'/'GROSS_SALARY'/'CTC' are valid selections in this drawer — a stored
// component may carry the schema's 'COMPONENT' default (set even on FIXED components)
// or an id-based basis from HR Settings, neither of which is a real option here.
const asValidBasis = (basis?: string) =>
    basis === 'BASIC_SALARY' || basis === 'GROSS_SALARY' || basis === 'CTC' ? basis : undefined;

const CtcEarningDrawer = ({
    open,
    onClose,
    onSave,
    selectedEarning,
    allowBalancing,
    breakdown,
}: CtcEarningDrawerProps) => {
    const isBasicSalary = selectedEarning?.componentName === 'Basic Salary';

    const typeOptions =
        !isBasicSalary && allowBalancing
            ? [...baseCalculationTypeOptions, { label: 'Balancing', value: 'BALANCING' }]
            : baseCalculationTypeOptions;
    const basisOptions = isBasicSalary ? basicSalaryBasisOptions : calculationBasisOptions;
    const basicSalaryBasis = selectedEarning?.calculationBasis === 'CTC' ? 'CTC' : 'GROSS_SALARY';

    return (
        <CustomModalWithForm
            modalTitle={selectedEarning ? 'Edit Component' : 'Add New Component'}
            open={open}
            handleCancel={onClose}
            reinitialise
            initialValues={{
                componentName: selectedEarning?.componentName || '',
                calculationType: selectedEarning?.calculationType || '',
                calculationBasis: isBasicSalary
                    ? basicSalaryBasis
                    : asValidBasis(selectedEarning?.calculationBasis) || 'BASIC_SALARY',
                amountPercentage: selectedEarning?.amountPercentage ?? '',
                isPartOfGross: selectedEarning?.isPartOfGross ?? true,
            }}
            validationSchema={buildSchema(breakdown, selectedEarning)}
            handleFormSubmit={values => {
                onSave({
                    id: selectedEarning?.id || `local-${Date.now()}-${values.componentName}`,
                    componentName: values.componentName,
                    calculationType: values.calculationType,
                    calculationBasis:
                        values.calculationType === 'PERCENTAGE'
                            ? values.calculationBasis
                            : undefined,
                    amountPercentage:
                        values.calculationType === 'BALANCING'
                            ? undefined
                            : Number(values.amountPercentage),
                    calculatedAmount: 0,
                    isGlobal: selectedEarning?.isGlobal,
                    // Basic Salary and the Balancing component (the checkbox is hidden for
                    // both) must always count toward Gross — only a regular earning can be
                    // marked a company-paid benefit that sits outside it.
                    isPartOfGross: values.isPartOfGross !== false,
                });
                onClose();
            }}
        >
            <CtcEarningFormFields
                typeOptions={typeOptions}
                basisOptions={basisOptions}
                isBasicSalary={isBasicSalary}
            />
        </CustomModalWithForm>
    );
};

export default CtcEarningDrawer;
