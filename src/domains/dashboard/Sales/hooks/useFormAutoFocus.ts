import { useCallback, useRef } from 'react';

import * as Yup from 'yup';

interface UseFormAutoFocusOptions {
    schema: Yup.ObjectSchema<any>;
}

/**
 * Custom hook to handle auto-focus on first error field in Formik forms
 * Automatically extracts required fields from the Yup schema
 * @param options - Configuration object with Yup schema
 * @returns Function to handle form submission with auto-focus on error
 */
export const useFormAutoFocus = (options: UseFormAutoFocusOptions) => {
    const { schema } = options;
    const formikRef = useRef<any>(null);

    const setFormikRef = (ref: any) => {
        formikRef.current = ref;
    };

    const handleFormSubmitWithAutoFocus = useCallback(
        (
            handleSubmit: () => void,
            setFieldTouched: (field: string, isTouched: boolean) => void,
            values: any
        ) => {
            try {
                // Validate form
                schema.validateSync(values, { abortEarly: false });
                // If validation passes, submit
                handleSubmit();
            } catch (error: any) {
                // Find first field with error and focus it
                const errorFields = error.inner || [];

                // Mark every invalid field as touched to show errors
                errorFields.forEach(({ path }: { path: string }) => {
                    if (path) setFieldTouched(path, true);
                });
                if (errorFields.length > 0) {
                    const firstErrorField = errorFields[0]?.path;
                    if (firstErrorField) {
                        // Focus the field after a small delay to ensure render is complete
                        setTimeout(() => {
                            // Try different selectors to find the input
                            let input = document.querySelector(
                                `input[name="${firstErrorField}"], textarea[name="${firstErrorField}"]`
                            ) as HTMLInputElement;

                            // If not found, look up Ant Design Select by id (set to field name)
                            if (!input) {
                                const selectEl = document.getElementById(firstErrorField);
                                if (selectEl) {
                                    input =
                                        (selectEl.tagName === 'INPUT'
                                            ? (selectEl as HTMLInputElement)
                                            : (selectEl.querySelector(
                                                  'input'
                                              ) as HTMLInputElement)) ?? null;
                                }
                            }

                            if (input) {
                                input.focus();
                                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                        }, 100);
                    }
                }
            }
        },
        [schema]
    );

    return {
        setFormikRef,
        handleFormSubmitWithAutoFocus,
        formikRef,
    };
};
