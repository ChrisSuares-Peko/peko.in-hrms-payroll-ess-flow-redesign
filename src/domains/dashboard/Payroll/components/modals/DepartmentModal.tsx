import { Flex, Form } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import { useCreateDepartmentApi } from '../../hooks/departmentHooks/useCreateDepartment';
import { useEditDepartmentApi } from '../../hooks/departmentHooks/useEditDepartment';
import { departmentSchema } from '../../schema/departmentSchema';
import { departmentTableData } from '../../types/departmentTypes/departmentTypes';

type DepartmentModalProps = {
    open: boolean;
    handleCancel: () => void;
    data?: departmentTableData | undefined;
    setRefresh?: React.Dispatch<React.SetStateAction<boolean>>;
};

const DepartmentModal = ({ open, handleCancel, data, setRefresh }: DepartmentModalProps) => {
    const { editDepartment, isLoading } = useEditDepartmentApi(handleCancel);
    const { createDepartment, isLoading: createLoading } = useCreateDepartmentApi(handleCancel);
    const handleFormSubmit = async (values: any) => {
        if (data) {
            await editDepartment(values, data.id);
        } else {
            await createDepartment(values);
        }

        if (setRefresh) setRefresh(p => !p);
    };
    return (
        <CustomModalWithForm
            modalTitle={data ? 'Edit Department' : 'Add New Department'}
            open={open}
            isLoading={data ? isLoading : createLoading}
            firstBtnTxt={data ? 'Update' : 'Add'}
            handleCancel={handleCancel}
            handleFormSubmit={v => handleFormSubmit(v)}
            initialValues={{
                departmentName: data?.name || '',
                departmentCode: data?.code || '',
            }}
            validationSchema={departmentSchema}
        >
            <Flex vertical className=" w-full">
                <Form layout="vertical">
                    <TextInput
                        name="departmentName"
                        label="Department Name"
                        type="text"
                        placeholder="Department Name"
                        isRequired
                        classes=" rounded-sm"
                        maxLength={50}
                        allowAlphabetsAndSpecialCharacters={['-', '_', '/']}
                    />
                    <TextInput
                        name="departmentCode"
                        label="Department ID"
                        type="text"
                        placeholder="Department ID"
                        classes="rounded-sm"
                        maxLength={10}
                        allowAlphabetsNumberAndSpecialCharacters={['-', '/', '.', '(', ')']}
                    />
                </Form>
            </Flex>
        </CustomModalWithForm>
    );
};

export default DepartmentModal;
