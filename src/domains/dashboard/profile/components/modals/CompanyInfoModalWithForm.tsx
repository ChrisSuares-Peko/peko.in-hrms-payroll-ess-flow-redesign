import React from 'react';

import { Button, Drawer, Flex } from 'antd';
import { Formik, FormikHelpers, FormikProps } from 'formik';

import CompanyInfoForm from '../forms/CompanyInfoForm';

interface CustomModalWithFOrmProps {
    activities?: any[];
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
    maskClosable?: boolean;
    resetFormWhenClose?: boolean;
}
const CompanyInfoModalWithForm = ({
    activities,
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
    maskClosable = true,
    resetFormWhenClose = true,
}: CustomModalWithFOrmProps) => (
    <Formik
        initialValues={initialValues}
        onSubmit={handleFormSubmit}
        validationSchema={validationSchema}
        enableReinitialize={reinitialise}
        innerRef={formRefName}
    >
        {({ handleSubmit, values, isSubmitting, resetForm, setFieldValue }) => (
            <Drawer
                title={modalTitle}
                open={open}
                onClose={() => {
                    handleCancel();
                    if (resetFormWhenClose) {
                        resetForm();
                    }
                }}
                closeIcon={null}
                // destroyOnHidden
                width={470}
                styles={{
                    body: { paddingInline: 20, paddingBlock: 16 },
                    header: { paddingInline: 20 },
                }}
                zIndex={20}
                maskClosable={maskClosable}
                footer={[
                    !hideFooter && (
                        <Flex className="w-full " justify="flex-end" gap={10} key="">
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                loading={isLoading || isSubmitting}
                                onClick={() => handleSubmit()}
                                className="px-5"
                            >
                                Submit
                            </Button>

                            <Button
                                key="back"
                                onClick={() => {
                                    handleCancel();
                                    resetForm();
                                }}
                                className="px-5"
                            >
                                Cancel
                            </Button>
                        </Flex>
                    ),
                ]}
            >
                <CompanyInfoForm activities={activities!} open={open} />
            </Drawer>
        )}
    </Formik>
);

export default CompanyInfoModalWithForm;
