import { Flex, Form, Skeleton, Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';
import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { submitSalaryCustomizations, useNewHireSalaryFields } from '../NewHire/NewHireSteps';

type Props = {
    open: boolean;
    onClose: () => void;
    email: string;
    onSuccess: () => void;
};

const NewHireCompensationEditModal = ({ open, onClose, email, onSuccess }: Props) => {
    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();
    const { salaryFields, originalFields, loading } = useNewHireSalaryFields(open ? email : '');

    const initialValues = Object.fromEntries(
        salaryFields.map(field => [field.id, String(field.calculatedAmount)])
    );

    const handleFormSubmit = async (values: Record<string, string>) => {
        const updatedFields = salaryFields.map(field => ({
            ...field,
            calculatedAmount: Number(values[field.id]) || 0,
        }));
        await submitSalaryCustomizations(updatedFields, originalFields, email, userId, userType);
        dispatch(
            showToast({ description: 'Compensation updated successfully.', variant: 'success' })
        );
        onSuccess();
        onClose();
    };

    return (
        <CustomModalWithForm
            modalTitle="Edit Compensation"
            open={open}
            handleCancel={onClose}
            initialValues={initialValues}
            handleFormSubmit={handleFormSubmit}
            reinitialise
            firstBtnTxt="Save"
        >
            {loading
                ? () => <Skeleton active paragraph={{ rows: 4 }} />
                : formikBag => {
                      const grossSalary = salaryFields.reduce(
                          (total, field) => total + (Number(formikBag.values[field.id]) || 0),
                          0
                      );
                      return (
                          <Form layout="vertical">
                              {salaryFields.map(field => (
                                  <TextInput
                                      key={field.id}
                                      name={field.id}
                                      label={field.componentName}
                                      type="text"
                                      placeholder={field.componentName}
                                      classes="rounded-sm"
                                      allowTwoDecimalsOnly
                                      maxLength={10}
                                  />
                              ))}
                              <Flex vertical gap={8} className="mt-2">
                                  <Flex
                                      justify="space-between"
                                      className="bg-bgGrayF8 px-4 py-3 rounded"
                                  >
                                      <Typography.Text className="font-semibold">
                                          Total Monthly Package
                                      </Typography.Text>
                                      <Typography.Text className="font-semibold">
                                          ₹ {grossSalary.toLocaleString()}
                                      </Typography.Text>
                                  </Flex>
                                  <Flex
                                      justify="space-between"
                                      className="bg-bgGrayF8 px-4 py-3 rounded"
                                  >
                                      <Typography.Text className="font-semibold">
                                          Salary Per Annum
                                      </Typography.Text>
                                      <Typography.Text className="font-semibold">
                                          ₹ {(grossSalary * 12).toLocaleString()}
                                      </Typography.Text>
                                  </Flex>
                              </Flex>
                          </Form>
                      );
                  }}
        </CustomModalWithForm>
    );
};

export default NewHireCompensationEditModal;
