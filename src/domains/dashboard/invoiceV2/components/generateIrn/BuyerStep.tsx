import { forwardRef, useImperativeHandle, useRef } from 'react';

import { Formik, FormikProps } from 'formik';

import { DropDown } from '@customtypes/general';

import BuyerForm from '../../forms/generateIrn/BuyerForm';
import { buyerSchema } from '../../schema/generateIrn/buyerSchema';
import { CustomerOption } from '../../types/createInvoice';
import { BuyerFormValues, StepHandle } from '../../types/generateIrn';

interface Props {
    initialValues: BuyerFormValues;
    stateOptions: DropDown;
    isLoadingStates: boolean;
    customers: CustomerOption[];
    isLoadingCustomers: boolean;
    onNext: (values: BuyerFormValues) => void;
}

const BuyerStep = forwardRef<StepHandle, Props>(
    ({ initialValues, stateOptions, isLoadingStates, customers, isLoadingCustomers, onNext }, ref) => {
        const formikRef = useRef<FormikProps<BuyerFormValues>>(null);

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
                validationSchema={buyerSchema}
                onSubmit={onNext}
            >
                <BuyerForm
                    stateOptions={stateOptions}
                    isLoadingStates={isLoadingStates}
                    customers={customers}
                    isLoadingCustomers={isLoadingCustomers}
                />
            </Formik>
        );
    }
);

export default BuyerStep;
