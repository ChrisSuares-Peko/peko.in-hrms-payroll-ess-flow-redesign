import { useState, useEffect } from 'react';

import { Flex, Form, Skeleton } from 'antd';

import FileUploadInput from '@components/atomic/inputs/FileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useCategories from '../../hooks/payroll/useCategories';
import payrollDocSchema from '../../schema/payrollDocSchema';
import { Document, refresh } from '../../types/payrollDocTypes';

type DocModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Document;
};

const Docmodal = ({ open, handleCancel, data, setRefresh }: DocModalProps & refresh) => {
    useEffect(() => {
        if (data?.categoryId) {
            setSelectedCategory(data.categoryId.toString());
        }
    }, [data]);

    const isEditMode = !!data;
    const { createDoc, updateDoc, categoryData, createLoading, updateLoading } = useCategories();
    const isFormReady = !isEditMode || (isEditMode && categoryData && data?.categoryId);
    console.log(isFormReady, 'issss frm ready');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const documentOptions =
        categoryData?.find(cat => cat.value === selectedCategory)?.documents || [];
    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            isLoading={data ? updateLoading : createLoading}
            modalTitle="Document Management"
            open={open}
            reinitialise
            validationSchema={payrollDocSchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                if (data) {
                    console.log(values, 'balueees');
                    const selectedDocument = documentOptions.find(
                        (doc: any) => doc.value === values.documentId
                    );
                    res = await updateDoc({
                        ...values,
                        documentName: selectedDocument?.label,
                        categoryName: categoryData?.find(
                            item => item.value === values.categoryId?.toString()
                        )?.label,
                    });
                } else {
                    res = await createDoc({
                        ...values,
                        categoryName: categoryData?.find(
                            item => item.value === values.categoryId?.toString()
                        )?.label,
                    });
                }
                if (res.status === true) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                    handleCancel();
                }
                if (res.status === false) {
                    dispatch(
                        showToast({
                            description: `${res.message}`,
                            variant: 'error',
                        })
                    );
                }
            }}
            initialValues={{
                id: data?.id.toString() || '',
                categoryId: data?.categoryId ? data.categoryId.toString() : '',
                documentId: data?.id?.toString() || '',
                documentBase64: data?.document || '',
            }}
        >
            {({ setFieldValue, values }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        {isFormReady ? (
                            <>
                                <SelectInput
                                    isRequired
                                    name="categoryId"
                                    options={categoryData}
                                    placeholder="Category"
                                    label="Select Category"
                                    handleChange={value => {
                                        setSelectedCategory(value); // update selected category
                                    }}
                                />
                                <SelectInput
                                    isRequired
                                    name="documentId"
                                    options={documentOptions}
                                    placeholder="Document"
                                    label="Select Document"
                                />
                            </>
                        ) : (
                            <Skeleton active paragraph={{ rows: 2 }} />
                        )}

                        <FileUploadInput
                            isRequired
                            allowedFileTypes={['application/pdf']}
                            label="Upload File"
                            name="documentBase64"
                            format="documentFormat"
                            showNotification
                            showFileName
                            subLabel="(Formats Supported: PDF. Max size: 5 MB)"
                            maxFileSize={5 * 1024}
                        />
                        {/* <Flex className="mt-4">
                            <Typography.Text
                                type="secondary"
                                className="sm:text-xs xs:text-[.6rem] -mt-5 leading-relaxed"
                            >
                                (Formats Supported: PDF. Max. size: 5 MB)
                            </Typography.Text>
                        </Flex> */}
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default Docmodal;
