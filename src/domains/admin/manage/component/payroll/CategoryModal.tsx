import { Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import useCategories from '../../hooks/payroll/useCategories';
import payrollCategorySchema from '../../schema/payrollCategorySchema';
import { Document, refresh } from '../../types/payrollDocTypes';

type Category = {
    id: number;
    categoryName: string;
};
type CategoryModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: Document;
    category?: Category | null;
};

const CategoryModal = ({
    open,
    handleCancel,
    data,
    setRefresh,
    category,
}: CategoryModalProps & refresh) => {
    console.log('data', data);
    console.log(category, 'categiryyy');
    const { createCatLoading, createCat, updateCat, updateCatLoading } = useCategories();

    const dispatch = useAppDispatch();
    return (
        <CustomModalWithForm
            isLoading={data ? updateCatLoading : createCatLoading}
            modalTitle="Category Management"
            open={open}
            reinitialise
            validationSchema={payrollCategorySchema}
            handleCancel={handleCancel}
            handleFormSubmit={async values => {
                let res: any;
                if (data) {
                    res = await updateCat({
                        docId: data.id,
                        id: category?.id,
                        ...values,
                    });
                } else {
                    res = await createCat({
                        ...values,
                    });
                }

                if (res && res.status === true) {
                    dispatch(
                        showToast({
                            description: `${res.message} `,
                            variant: 'success',
                        })
                    );
                    setRefresh(true);
                    handleCancel();
                }
            }}
            initialValues={{
                categoryName: category?.categoryName || '',
                documentName: data?.documentName || '',
            }}
        >
            {({ setFieldValue, values }) => (
                <Flex vertical className="w-full ">
                    <Form layout="vertical">
                        <TextInput
                            isRequired
                            name="categoryName"
                            type="text"
                            placeholder="Category"
                            label="Category Name"
                        />
                        <TextInput
                            isRequired
                            name="documentName"
                            type="text"
                            placeholder="Document Name"
                            label="Document Name"
                        />
                    </Form>
                </Flex>
            )}
        </CustomModalWithForm>
    );
};

export default CategoryModal;
