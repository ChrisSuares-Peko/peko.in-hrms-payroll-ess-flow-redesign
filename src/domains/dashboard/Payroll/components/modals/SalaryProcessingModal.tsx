import { Flex, Form } from 'antd';

import DatePickerInput from '@components/atomic/inputs/DatePickerInput';
import SelectInput from '@components/atomic/inputs/SelectInput';
import SwitchInput from '@components/atomic/inputs/SwitchInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

type SalaryProcessingModalProps = {
    open: boolean;
    handleCancel: () => void;
};

const SalaryProcessingModal = ({ open, handleCancel }: SalaryProcessingModalProps) => (
    <CustomModalWithForm
        modalTitle="Employee Salary Processing"
        open={open}
        handleCancel={handleCancel}
        handleFormSubmit={() => {}}
        initialValues={{
            salaryMonth: '',
            companyName: '',
            incentives: '',
            overTimeAmount: '',
            reimbursementAmount: '',
            attendance: '',
            totalPay: '',
            transferMethod: '',
            emailToEmployees: '',
        }}
    >
        <Flex vertical className=" w-full">
            <Flex className=" text-gray-500 text-[.8rem] mb-4">
                This will automatically process the salaries of selected employees to their saved
                bank accounts.
            </Flex>
            <Form layout="vertical">
                {/* should be changes with month picker */}
                <DatePickerInput
                    name="salaryMonth"
                    label="Salary Month"
                    placeholder="Select Salary Month"
                    classes=" rounded-sm w-full"
                />
                <TextInput
                    name="companyName"
                    label="Bonus/Extra"
                    type="text"
                    placeholder="Enter Bonus/Extra"
                    classes=" rounded-sm "
                />
                <TextInput
                    name="incentives"
                    label="Incentives"
                    type="text"
                    placeholder="Enter Incentives"
                    classes=" rounded-sm "
                />
                <TextInput
                    name="overTimeAmount"
                    label="Over Time Amount"
                    type="text"
                    placeholder="Enter Over Time Amount"
                    classes=" rounded-sm "
                    allowNumbersOnly
                />
                <TextInput
                    name="reimbursementAmount"
                    label="Reimbursement  Amount"
                    type="text"
                    placeholder="Enter Reimbursement  Amount"
                    classes=" rounded-sm "
                />
                <SelectInput
                    name="attendance"
                    label="Attendance"
                    placeholder="Select Attendance"
                    classes=" rounded-sm "
                    options={['Option1', 'Option2', 'Option3']}
                    showToolTip
                    tooltipText="Select Attendance"
                />
                <TextInput
                    name="totalPay"
                    label="Total Pay"
                    type="text"
                    placeholder="Enter Total Pay"
                    classes=" rounded-sm "
                    allowNumbersOnly
                />
                <TextInput
                    name="transferMethod"
                    label="Transfer Method"
                    type="text"
                    placeholder="Enter Transfer Method"
                    classes=" rounded-sm "
                />
                <SwitchInput name="emailToEmployees" label="Email payroll to the employee" />
                {/* need to change to check box after updating checkbox in global components */}
            </Form>
        </Flex>
    </CustomModalWithForm>
);

export default SalaryProcessingModal;
