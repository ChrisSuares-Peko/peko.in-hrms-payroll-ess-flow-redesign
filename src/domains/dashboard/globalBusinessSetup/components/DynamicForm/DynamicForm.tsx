import { useEffect, useMemo, useRef, useState } from 'react';

import { Form as AntdForm } from 'antd';
import { Formik, FormikProps } from 'formik';

import FormContent from './FormContent';
import { applyDefaultOverrides, DefaultValueOverrides } from './utils/applyDefaultOverrides';
import { IForm } from '../../types/forms';
import { PricingV2Draft } from '../../types/pricingV2';
import { generateInitialValues } from '../../utils/generateDefaultValues';
import { generateValidationSchema } from '../../utils/generateYupSchema';
import { BoundTarget } from '../../utils/pricingV2/bindings';
import QuoteBindingSync from '../QuoteBindingSync';

type DynamicFormProps = {
    formSchema: IForm;
    onSubmit: (value: any, status: 'draft' | 'saved', silent?: boolean) => Promise<boolean>;
    draftLoading: boolean;
    finalSubmitLoading: boolean;
    initialPageId?: string;
    initialSectionId?: string;
    values: any;
    isEdit?: boolean;
    // Pricing V2: seed form values from the quote (at mount) and keep the quote
    // in sync as the user edits bound fields. Empty/absent for V1 pricing.
    defaultValueOverrides?: DefaultValueOverrides;
    bindingNormalized?: PricingV2Draft;
    bindingTargets?: BoundTarget[];
};

export default function DynamicForm({
    formSchema,
    values,
    onSubmit,
    draftLoading,
    finalSubmitLoading,
    initialPageId,
    initialSectionId,
    isEdit,
    defaultValueOverrides,
    bindingNormalized,
    bindingTargets,
}: DynamicFormProps) {
    const initialValues = useMemo(
        () =>
            applyDefaultOverrides(
                generateInitialValues(formSchema, values),
                formSchema,
                defaultValueOverrides
            ),
        [formSchema, values, defaultValueOverrides]
    );

    const validationSchema = useMemo(() => generateValidationSchema(formSchema), [formSchema]);

    const formikRef = useRef<FormikProps<typeof initialValues>>(null);
    const { pages } = formSchema;

    const getInitialPageIndex = () => {
        if (initialPageId) {
            const index = pages.findIndex(p => p._id === initialPageId);
            return index >= 0 ? index : 0;
        }
        return 0;
    };

    const [currentPageIndex, setCurrentPageIndex] = useState(getInitialPageIndex);

    useEffect(() => {
        if (initialPageId) {
            const index = pages.findIndex(p => p._id === initialPageId);
            if (index >= 0) {
                setCurrentPageIndex(index);
            }
        }
    }, [initialPageId, pages]);

    const currentPage = pages[currentPageIndex];
    const isLastPage = currentPageIndex === pages.length - 1;

    return (
        <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            enableReinitialize
            onSubmit={async (vals: any) => {
                await onSubmit(vals, 'saved'); // FINAL submit only
            }}
            innerRef={formikRef}
        >
            {({ handleSubmit }) => (
                <AntdForm layout="vertical" onFinish={handleSubmit}>
                    {/* <Typography.Title level={4}>{formSchema.title}</Typography.Title>
                    <Typography.Text>{formSchema.description}</Typography.Text> */}

                    {/* Pricing V2: mirror bound form values back into the live quote. */}
                    {bindingTargets && bindingTargets.length > 0 && (
                        <QuoteBindingSync
                            form={formSchema}
                            normalized={bindingNormalized}
                            targets={bindingTargets}
                        />
                    )}

                    {/* FORM BODY */}
                    <FormContent
                        form={formSchema}
                        isEdit={isEdit}
                        currentPage={currentPage._id}
                        initialSectionId={initialSectionId}
                        setCurrentPage={(pageId: string) => {
                            const targetIndex = pages.findIndex(p => p._id === pageId);
                            if (targetIndex <= currentPageIndex) {
                                setCurrentPageIndex(targetIndex);
                            }
                        }}
                        currentPageIndex={currentPageIndex}
                        setCurrentPageIndex={setCurrentPageIndex}
                        isLastPage={isLastPage}
                        onSubmit={onSubmit}
                        finalSubmitLoading={finalSubmitLoading}
                        draftLoading={draftLoading}
                    />
                </AntdForm>
            )}
        </Formik>
    );
}
