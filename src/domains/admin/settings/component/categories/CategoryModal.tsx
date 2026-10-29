import { useState } from 'react';

import { Flex, Form, Skeleton } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useUpdateCategory from '../../hooks/useUpdateCategory';
import categorySchema from '../../schema/categorySchema';
import { CategoryData, refresh } from '../../types/category';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: CategoryData;
};

const CategoryModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
}: DepartmentModalProps & refresh) => {
    const [, setFile] = useState<any>('');
    const [searchText, setSearchText] = useState<string>('');
    const { isLoading, createNewCategory, updateCurrentCategory, categoryData } =
        useUpdateCategory(searchText);
    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            isLoading={isLoading}
            modalTitle="Category Management"
            open={open}
            validationSchema={categorySchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                if (data) {
                    res = await updateCurrentCategory({
                        ...values,
                    });
                } else {
                    res = await createNewCategory({
                        ...values,
                    });
                }

                if (res.status === true) {
                    setRefresh(true);
                    if (data)
                        dispatch(
                            showToast({
                                description: `Category updated successfully`,
                                variant: 'success',
                            })
                        );
                    else
                        dispatch(
                            showToast({
                                description: `Category added successfully`,
                                variant: 'success',
                            })
                        );
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
                id: data?.id || '',
                categoryName: data?.categoryName || '',
                categoryStatus: data?.categoryStatus || true,
                vendorId: data?.vendorId.toString() || '',
                categoryImage: data?.categoryImage || '',
                categoryImageFormat: null,
            }}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <TextInput
                        name="categoryName"
                        label="Category Name"
                        type="text"
                        placeholder="Please enter the category name "
                        isRequired
                        classes=" rounded-sm"
                    />
                    {categoryData ? (
                        <SelectInput
                            filterOption={false}
                            allowClear
                            onSearch={setSearchText}
                            showSearch
                            isRequired
                            name="vendorId"
                            options={categoryData}
                            placeholder="Please select a Vendor"
                            label="Select Vendor"
                        />
                    ) : (
                        <Skeleton.Input active block />
                    )}
                    <CustomFileUploadInput
                        existingFileUrl={data?.categoryImage}
                        label="Upload Image"
                        name="categoryImage"
                        setFile={setFile}
                        format="categoryImageFormat"
                        showNotification
                        showFileName
                        isRequired
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default CategoryModal;
