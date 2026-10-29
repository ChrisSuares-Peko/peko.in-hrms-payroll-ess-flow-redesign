import { forwardRef, useImperativeHandle, useRef } from 'react';

import { Formik, FormikProps } from 'formik';

import TransactionForm from '../../forms/generateIrn/TransactionForm';
import { transactionSchema } from '../../schema/generateIrn/transactionSchema';
import { StepHandle, TransactionFormValues } from '../../types/generateIrn';

interface Props {
    initialValues: TransactionFormValues;
    prefixMap: Record<string, string>;
    nextNumber: string;
    isNextNumberLoading?: boolean;
    isSettingsLoading?: boolean;
    onNext: (values: TransactionFormValues) => void;
}

const TransactionStep = forwardRef<StepHandle, Props>(
    (
        { initialValues, prefixMap, nextNumber, isNextNumberLoading, isSettingsLoading, onNext },
        ref
    ) => {
        const formikRef = useRef<FormikProps<TransactionFormValues>>(null);

        useImperativeHandle(ref, () => ({
            submit: async () => {
                await formikRef.current?.submitForm();
            },
            getValues: () => formikRef.current?.values,
        }));

        return (
            <Formik
                innerRef={formikRef}
                initialValues={initialValues}
                validationSchema={transactionSchema}
                onSubmit={onNext}
            >
                <TransactionForm
                    prefixMap={prefixMap}
                    nextNumber={nextNumber}
                    isNextNumberLoading={isNextNumberLoading}
                    isSettingsLoading={isSettingsLoading}
                />
            </Formik>
        );
    }
);

export default TransactionStep;
