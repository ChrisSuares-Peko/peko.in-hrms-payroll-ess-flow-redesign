import { useFormikContext } from 'formik';
import * as Yup from 'yup';

import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { CtcDeductionComponent } from '../../utils/ctcCalculator/types';

interface CtcDeductionDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: (deduction: CtcDeductionComponent) => void;
    selectedDeduction?: CtcDeductionComponent | null;
}

const calculationTypeOptions = [
    { label: 'Fixed', value: 'FIXED' },
    { label: 'Percentage', value: 'PERCENTAGE' },
];

const deductionBasisOptions = [
    { label: '% of Basic Salary', value: 'BASIC_SALARY' },
    { label: '% of Gross Salary', value: 'GROSS_SALARY' },
];

const schema = Yup.object().shape({
    deductionName: Yup.string().required('Please enter the deduction name'),
    calculationType: Yup.string().required('Please select the calculation type'),
    salaryDeductionType: Yup.string().when('calculationType', {
        is: 'PERCENTAGE',
        then: s => s.required('Please select the calculation basis'),
        otherwise: s => s.notRequired(),
    }),
    amountPercentage: Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .typeError('Please enter a valid number')
        .required('Please enter a value')
        .moreThan(0, 'Must be greater than 0')
        .when('calculationType', {
            is: 'PERCENTAGE',
            then: s => s.max(100, 'Percentage cannot be more than 100'),
        }),
});

const CtcDeductionFormFields = () => {
    const { values } = useFormikContext<any>();
    return (
        <>
            <TextInput
                name="deductionName"
                type="text"
                placeholder="Enter deduction name"
                label="Deduction Name"
                isRequired
            />
            <SelectInput
                name="calculationType"
                options={calculationTypeOptions}
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
                        name="salaryDeductionType"
                        options={deductionBasisOptions}
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
        </>
    );
};

const CtcDeductionDrawer = ({ open, onClose, onSave, selectedDeduction }: CtcDeductionDrawerProps) => (
    <CustomModalWithForm
        modalTitle={selectedDeduction ? 'Edit Component' : 'Add New Component'}
        open={open}
        handleCancel={onClose}
        reinitialise
        initialValues={{
            deductionName: selectedDeduction?.deductionName || '',
            calculationType: selectedDeduction?.calculationType || '',
            salaryDeductionType: selectedDeduction?.salaryDeductionType || 'BASIC_SALARY',
            amountPercentage: selectedDeduction?.amountPercentage ?? '',
        }}
        validationSchema={schema}
        handleFormSubmit={values => {
            onSave({
                id: selectedDeduction?.id || `local-${Date.now()}-${values.deductionName}`,
                deductionName: values.deductionName,
                calculationType: values.calculationType,
                salaryDeductionType:
                    values.calculationType === 'PERCENTAGE' ? values.salaryDeductionType : undefined,
                amountPercentage: Number(values.amountPercentage),
                calculatedAmount: 0,
                isGlobal: selectedDeduction?.isGlobal,
            });
            onClose();
        }}
    >
        <CtcDeductionFormFields />
    </CustomModalWithForm>
);

export default CtcDeductionDrawer;
