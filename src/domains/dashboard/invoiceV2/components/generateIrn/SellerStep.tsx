import { forwardRef, useImperativeHandle, useRef } from 'react';

import { Formik, FormikProps } from 'formik';

import { DropDown } from '@customtypes/general';

import SellerForm from '../../forms/generateIrn/SellerForm';
import { sellerSchema } from '../../schema/generateIrn/sellerSchema';
import { SellerFormValues, StepHandle } from '../../types/generateIrn';

interface Props {
    initialValues: SellerFormValues;
    stateOptions: DropDown;
    isLoadingStates: boolean;
    isSellerDefaultsLoading: boolean;
    onNext: (values: SellerFormValues) => void;
}

const SellerStep = forwardRef<StepHandle, Props>(
    ({ initialValues, stateOptions, isLoadingStates, isSellerDefaultsLoading, onNext }, ref) => {
        const formikRef = useRef<FormikProps<SellerFormValues>>(null);

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
                validationSchema={sellerSchema}
                onSubmit={onNext}
                enableReinitialize
            >
                <SellerForm
                    stateOptions={stateOptions}
                    isLoadingStates={isLoadingStates}
                    isSellerDefaultsLoading={isSellerDefaultsLoading}
                />
            </Formik>
        );
    }
);

export default SellerStep;
