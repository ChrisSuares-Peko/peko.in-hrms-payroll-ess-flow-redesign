

import { Modal, Form, Button, Typography, Flex } from 'antd';
import { Formik } from 'formik';

import SelectInputWithSearch from '@components/atomic/inputs/SelectInputWithSearch';

import { useGetEmployee } from '../../hooks/dashboardHooks/useGetEmployeeApi';
import { selectEmployeeSchema } from '../../schema/bulkSchema';

type BulkUploadModalProps = {
    open: boolean;
    handleCancel: () => void;
    onEmployeeSelect: (employeeData: any) => void;
};

const SelectEmployeeModal = ({ open, handleCancel, onEmployeeSelect }: BulkUploadModalProps) => {
    const { generateEmployeesDropdown, employeesWithoutLastWorkingDay } = useGetEmployee();
    console.log("employeess",employeesWithoutLastWorkingDay);
    const [form] = Form.useForm();


    return (
        <Modal
            title={
                <Flex justify="space-between" align="center">
                    <Typography.Text className="text-sm">Offboard Employee</Typography.Text>
                </Flex>
            }
            open={open}
            onCancel={handleCancel}
            footer={null} // Remove the footer from here
        >
            <Formik
                initialValues={{
                    employee: null,
                }}
                onSubmit={values => {
                    const selectedEmployee = employeesWithoutLastWorkingDay.find(
                        emp => emp.id === values.employee
                    );

                    if (selectedEmployee) {
                        onEmployeeSelect(selectedEmployee);
                    }
                }}
                validationSchema={selectEmployeeSchema}
            >
                {({ values, handleChange, isSubmitting, setFieldValue, errors, handleSubmit }) => (
                    <Form form={form} layout="vertical">
                        {' '}
                        {/* Add onSubmit handler to the Form component */}
                        <Flex vertical className=" mt-5">
                            <SelectInputWithSearch
                                isRequired
                                label="Select Employee"
                                name="employee"
                                placeholder="Select Employee"
                                options={
                                    generateEmployeesDropdown(employeesWithoutLastWorkingDay) || []
                                }
                                
                            />
                        </Flex>
                        <Flex gap={10}>
                            <Button
                                key="submit"
                                type="primary"
                                danger
                                htmlType="submit" // Specify htmlType as "submit"
                                onClick={() => handleSubmit()}
                                style={{ marginTop: '1rem' }} // Add some margin to separate it from the input
                            >
                                Submit
                            </Button>
                            <Button onClick={() => handleCancel()} style={{ marginTop: '1rem' }}>
                                Cancel
                            </Button>
                        </Flex>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
};

export default SelectEmployeeModal;
