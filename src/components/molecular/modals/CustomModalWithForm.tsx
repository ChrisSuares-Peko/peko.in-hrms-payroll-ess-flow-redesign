import React, { useId, useRef } from 'react';

import { Button, Drawer, Flex } from 'antd';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { createPortal } from 'react-dom';

import useHideWidgetOnDrawer from '../freshChat/hooks/useHideWidgetOnDrawer';

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
    overlayLoading?: boolean;
    loader?: React.ReactNode;
    firstBtnTxt?: string;
    secondBtnTxt?: string;
    resetFormWhenClose?: boolean;
    maskClosable?: boolean;
    isDisabled?: boolean;
    hideFooter?: boolean;
    width?: number;
    validateOnChange?: boolean;
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
    overlayLoading = false,
    loader,
    hideFooter = false,
    isDisabled = false,
    firstBtnTxt = 'Submit',
    secondBtnTxt = 'Cancel',
    resetFormWhenClose = true,
    width = 470,
    maskClosable = true,
    validateOnChange = false,
}: CustomModalWithFOrmProps) => {
    const rawId = useId();
    const uniqueWrapperClass = loader ? `cmwf-${rawId.replace(/:/g, '')}` : undefined;
    const wrapperElRef = useRef<HTMLElement | null>(null);

    useHideWidgetOnDrawer(open);
    return (
        <Formik
            initialValues={initialValues}
            onSubmit={handleFormSubmit}
            validationSchema={validationSchema}
            enableReinitialize={reinitialise}
            innerRef={formRefName}
            validateOnChange={validateOnChange}
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
                    <>
                        {(isLoading || overlayLoading) &&
                            loader &&
                            wrapperElRef.current &&
                            createPortal(
                                <div
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 100,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'rgba(0,0,0,0.55)',
                                    }}
                                >
                                    {loader}
                                </div>,
                                wrapperElRef.current
                            )}
                        <Drawer
                            title={modalTitle}
                            open={open}
                            onClose={() => {
                                handleCancel();
                                if (resetFormWhenClose) {
                                    formikBag.resetForm();
                                }
                            }}
                            closeIcon={null}
                            // destroyOnClose
                            width={width}
                            {...(uniqueWrapperClass
                                ? { classNames: { wrapper: uniqueWrapperClass } }
                                : {})}
                            styles={{
                                body: { paddingInline: 20, paddingBlock: 16, position: 'relative' },
                                header: { paddingInline: 20 },
                                ...(uniqueWrapperClass
                                    ? { wrapper: { overflow: 'hidden' } }
                                    : {}),
                            }}
                            {...(uniqueWrapperClass
                                ? {
                                      afterOpenChange: (isOpen: boolean) => {
                                          if (isOpen && !wrapperElRef.current) {
                                              wrapperElRef.current = document.querySelector(
                                                  `.${uniqueWrapperClass}`
                                              );
                                          }
                                      },
                                  }
                                : {})}
                            zIndex={20}
                            maskClosable={maskClosable}
                            footer={[
                                !hideFooter && (
                                    <Flex className="w-full " justify="flex-end" gap={10} key="">
                                        <Button
                                            key="submit"
                                            type="primary"
                                            danger
                                            loading={isLoading ?? formikBag.isSubmitting}
                                            disabled={isDisabled}
                                            onClick={onClickSubmit}
                                            className="px-5"
                                        >
                                            {firstBtnTxt}
                                        </Button>

                                        <Button
                                            key="back"
                                            onClick={() => {
                                                handleCancel();
                                                if (resetFormWhenClose) {
                                                    formikBag.resetForm();
                                                }
                                            }}
                                            className="px-5"
                                        >
                                            {secondBtnTxt}
                                        </Button>
                                    </Flex>
                                ),
                            ]}
                        >
                            {typeof children === 'function' ? children(formikBag) : children}
                        </Drawer>
                    </>
                );
            }}
        </Formik>
    );
};

export default CustomModalWithForm;
