import React from 'react';

import { Button, Drawer, Flex } from 'antd';
import { Formik, FormikHelpers, FormikProps } from 'formik';

interface CustomModalWithFOrmProps {
    children: React.ReactNode | ((formikHelpers: FormikProps<any>) => React.ReactNode);
    open: boolean;
    handleCancel: () => void;
    initialValues: Object;
    modalTitle: string | React.ReactNode;
    validationSchema?: any;
    reinitialise?: boolean;
    handleFormSubmit: (values: any, formikHelpers: FormikHelpers<any>) => void | Promise<void>;
    formRefName?: React.MutableRefObject<FormikProps<any> | null>;
    isLoading?: boolean;
    hideFooter?: boolean;
}
const CustomModalWithForm = ({
    children,
    open,
    handleCancel,
    initialValues,
    modalTitle,
    handleFormSubmit,
    validationSchema,
    reinitialise = false,
    formRefName,
    isLoading = false,
    hideFooter = false,
}: CustomModalWithFOrmProps) => (
    <Formik
        initialValues={initialValues}
        onSubmit={handleFormSubmit}
        validationSchema={validationSchema}
        enableReinitialize={reinitialise}
        innerRef={formRefName}
    >
        {formikBag => {
            const onClickSubmit = (e: React.MouseEvent<HTMLElement>) => {
                e.preventDefault();
                formikBag.handleSubmit();
                // if (!isLoading) {
                //     setSubmitting(isLoading);
                // }
            };
            return (
                <Drawer
                    title={modalTitle}
                    open={open}
                    onClose={handleCancel}
                    closeIcon={null}
                    // destroyOnClose
                    width={470}
                    styles={{
                        body: { paddingInline: 20, paddingBlock: 16 },
                        header: { paddingInline: 20 },
                    }}
                    zIndex={20}
                    footer={[
                        !hideFooter && (
                            <Flex className="w-full " justify="flex-end" gap={10} key="">
                                <Button
                                    key="submit"
                                    type="primary"
                                    danger
                                    loading={isLoading || formikBag.isSubmitting}
                                    onClick={onClickSubmit}
                                    className="px-5"
                                >
                                    Submit
                                </Button>

                                <Button key="back" onClick={handleCancel} className="px-5">
                                    Cancel
                                </Button>
                            </Flex>
                        ),
                    ]}
                >
                    {typeof children === 'function' ? children(formikBag) : children}
                </Drawer>
            );
        }}
    </Formik>
);

export default CustomModalWithForm;
